
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get venue for venue admin
    let whereClause: any = {};
    if (session.user.role === 'VENUE_ADMIN') {
      const venue = await prisma.venue.findFirst({
        where: { adminId: session.user.id },
        select: { id: true }
      });

      if (!venue) {
        return NextResponse.json({ error: 'No venue found' }, { status: 404 });
      }

      whereClause.floorPlan = {
        venueId: venue.id
      };
    }

    const zones = await prisma.floorPlanZone.findMany({
      where: whereClause,
      include: {
        cameras: true,
        floorPlan: {
          select: {
            id: true,
            name: true,
            venue: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ zones });
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      name,
      description,
      zoneType,
      maxCapacity,
      safetyLevel,
      monitoringEnabled,
      venueId
    } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Zone name is required' }, { status: 400 });
    }

    // Validate venue access for venue admin
    let targetVenueId = venueId;
    if (session.user.role === 'VENUE_ADMIN') {
      const venue = await prisma.venue.findFirst({
        where: { adminId: session.user.id },
        select: { id: true }
      });

      if (!venue) {
        return NextResponse.json({ error: 'No venue found' }, { status: 404 });
      }

      targetVenueId = venue.id;
    }

    if (!targetVenueId) {
      return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 });
    }

    // Find or create a default floor plan for the venue
    let floorPlan = await prisma.floorPlan.findFirst({
      where: { venueId: targetVenueId }
    });

    if (!floorPlan) {
      // Create a default floor plan if none exists
      floorPlan = await prisma.floorPlan.create({
        data: {
          name: 'Default Floor Plan',
          venueId: targetVenueId,
          description: 'Automatically created default floor plan for zone configuration',
          isActive: true
        }
      });
    }

    const zone = await prisma.floorPlanZone.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type: zoneType || 'PLAY_AREA',
        floorPlanId: floorPlan.id,
        coordinates: null, // Will be set later when configuring on floor plan
        color: '#3B82F6', // Default blue color
        metadata: {
          maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
          safetyLevel: safetyLevel || 'MEDIUM',
          monitoringEnabled: monitoringEnabled !== false,
          currentOccupancy: 0,
          createdBy: session.user.id,
          createdAt: new Date().toISOString()
        }
      },
      include: {
        cameras: true,
        floorPlan: {
          select: {
            id: true,
            name: true,
            venue: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(zone, { status: 201 });
  } catch (error) {
    console.error('Error creating zone:', error);
    return NextResponse.json(
      { error: 'Failed to create zone' },
      { status: 500 }
    );
  }
}
