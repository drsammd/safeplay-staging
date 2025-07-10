
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Get child location data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const venueId = searchParams.get('venueId');
    const currentOnly = searchParams.get('currentOnly') === 'true';
    const hours = parseInt(searchParams.get('hours') || '24'); // Default last 24 hours

    // Get parent's children
    const children = await db.child.findMany({
      where: { parentId: session.user.id },
      select: { id: true }
    });

    const childIds = children.map(child => child.id);

    if (childIds.length === 0) {
      return NextResponse.json({ locations: [], currentLocations: [] });
    }

    // Build where clause
    const whereClause: any = {
      childId: childId ? childId : { in: childIds }
    };

    if (venueId) {
      whereClause.venueId = venueId;
    }

    if (currentOnly) {
      // whereClause.isCurrentLocation = true; // Field doesn't exist in ChildLocationHistory model
    } else {
      // Get locations from the last X hours
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - hours);
      whereClause.timestamp = {
        gte: hoursAgo
      };
    }

    const locations = await db.childLocationHistory.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            status: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
        // camera: {
        //   select: {
        //     id: true,
        //     name: true,
        //     position: true
        //   }
        // },
        // zone: {
        //   select: {
        //     id: true,
        //     name: true,
        //     type: true,
        //     color: true
        //   }
        // }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Also get current locations separately for quick access
    const currentLocations = await db.childLocationHistory.findMany({
      where: {
        childId: childId ? childId : { in: childIds }
        // isCurrentLocation: true // Field doesn't exist in ChildLocationHistory model
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            status: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
        // camera: {
        //   select: {
        //     id: true,
        //     name: true,
        //     position: true
        //   }
        // },
        // zone: {
        //   select: {
        //     id: true,
        //     name: true,
        //     type: true,
        //     color: true
        //   }
        // }
      }
    });

    return NextResponse.json({ 
      locations,
      currentLocations,
      summary: {
        totalLocations: locations.length,
        activeChildren: currentLocations.length,
        timeRange: currentOnly ? 'current' : `${hours} hours`
      }
    });
  } catch (error) {
    console.error('Error fetching location data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Record a manual location update (for check-in/out via app)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { childId, venueId, position, detectionType, zoneId, accuracy } = body;

    if (!childId || !venueId) {
      return NextResponse.json({ error: 'Child ID and Venue ID are required' }, { status: 400 });
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

    // Set previous current location to false for this child
    // Note: isCurrentLocation field doesn't exist in ChildLocationHistory model
    // await db.childLocationHistory.updateMany({
    //   where: {
    //     childId,
    //     isCurrentLocation: true
    //   },
    //   data: {
    //     isCurrentLocation: false,
    //     exitTime: new Date()
    //   }
    // });

    // Create new location record
    const location = await db.childLocationHistory.create({
      data: {
        childId,
        venueId,
        position,
        detectionType: detectionType || 'MANUAL_CHECK_IN',
        zoneId,
        accuracy: accuracy || 1.0,
        // isCurrentLocation: true, // Field doesn't exist in ChildLocationHistory model
        confidence: 1.0,
        entryTime: new Date(),
        metadata: {
          recordedBy: 'parent_app',
          parentId: session.user.id
        }
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true
          }
        },
        zone: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    return NextResponse.json({ location });
  } catch (error) {
    console.error('Error recording location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
