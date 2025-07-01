
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Get check-in/out history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const venueId = searchParams.get('venueId');
    const days = parseInt(searchParams.get('days') || '30'); // Default last 30 days
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get parent's children
    const children = await db.child.findMany({
      where: { parentId: session.user.id },
      select: { id: true }
    });

    const childIds = children.map((child: any) => child.id);

    if (childIds.length === 0) {
      return NextResponse.json({ events: [] });
    }

    const whereClause: any = {
      parentId: session.user.id,
      childId: childId ? childId : { in: childIds }
    };

    if (venueId) {
      whereClause.venueId = venueId;
    }

    // Get events from the last X days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    whereClause.timestamp = {
      gte: daysAgo
    };

    const events = await db.checkInOutEvent.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    // Get current status for each child
    const currentStatus = await Promise.all(
      childIds.map(async (childId: string) => {
        const lastEvent = await db.checkInOutEvent.findFirst({
          where: { childId },
          orderBy: { timestamp: 'desc' },
          include: {
            child: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                status: true
              }
            },
            venue: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        return {
          childId,
          isCheckedIn: lastEvent?.eventType === 'CHECK_IN',
          currentVenue: lastEvent?.eventType === 'CHECK_IN' ? lastEvent.venue : null,
          lastEvent: lastEvent
        };
      })
    );

    return NextResponse.json({ 
      events,
      currentStatus,
      summary: {
        totalEvents: events.length,
        checkedInChildren: currentStatus.filter((s: any) => s.isCheckedIn).length,
        timeRange: `${days} days`
      }
    });
  } catch (error) {
    console.error('Error fetching check-in/out events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create check-in/out event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      childId, 
      venueId, 
      eventType, 
      method = 'PARENT_APP',
      qrCode,
      pickupPersonName,
      pickupPersonId,
      pickupRelation,
      location,
      notes
    } = body;

    if (!childId || !venueId || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify parent owns this child
    const child = await db.child.findFirst({
      where: {
        id: childId,
        parentId: session.user.id
      }
    });

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Get venue information
    const venue = await db.venue.findUnique({
      where: { id: venueId }
    });

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Calculate duration if checking out
    let duration = null;
    if (eventType === 'CHECK_OUT') {
      const lastCheckIn = await db.checkInOutEvent.findFirst({
        where: {
          childId,
          venueId,
          eventType: 'CHECK_IN'
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      if (lastCheckIn) {
        const checkInTime = lastCheckIn.timestamp;
        const now = new Date();
        duration = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60)); // minutes
      }
    }

    // Create check-in/out event
    const event = await db.checkInOutEvent.create({
      data: {
        childId,
        venueId,
        parentId: session.user.id,
        eventType,
        method,
        qrCode,
        pickupPersonName,
        pickupPersonId,
        pickupRelation,
        location,
        duration,
        notes,
        isAuthorized: true,
        metadata: {
          recordedBy: 'parent_app',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });

    // Update child status
    await db.child.update({
      where: { id: childId },
      data: {
        status: eventType === 'CHECK_IN' ? 'CHECKED_IN' : 'CHECKED_OUT',
        currentVenueId: eventType === 'CHECK_IN' ? venueId : null
      }
    });

    // Update location history
    if (eventType === 'CHECK_IN') {
      // Set previous locations as not current
      await db.childLocationHistory.updateMany({
        where: {
          childId,
          isCurrentLocation: true
        },
        data: {
          isCurrentLocation: false,
          exitTime: new Date()
        }
      });

      // Create new current location
      await db.childLocationHistory.create({
        data: {
          childId,
          venueId,
          detectionType: 'MANUAL_CHECK_IN',
          isCurrentLocation: true,
          confidence: 1.0,
          entryTime: new Date(),
          metadata: {
            checkInEventId: event.id,
            method
          }
        }
      });
    } else if (eventType === 'CHECK_OUT') {
      // Update current location to not current
      await db.childLocationHistory.updateMany({
        where: {
          childId,
          venueId,
          isCurrentLocation: true
        },
        data: {
          isCurrentLocation: false,
          exitTime: new Date(),
          duration: duration ? duration * 60 : undefined // convert to seconds
        }
      });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error creating check-in/out event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
