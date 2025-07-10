
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/check-in-out/status - Get current check-in status for children
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const childId = searchParams.get('childId');

    const where: any = {};

    if (session.user.role === 'PARENT') {
      where.parentId = session.user.id;
    } else if (session.user.role === 'VENUE_ADMIN' && venueId) {
      where.currentVenueId = venueId;
    }

    if (childId) where.id = childId;

    const children = await prisma.child.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        currentVenueId: true,
        profilePhoto: true,
        currentVenue: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        checkInOutEvents: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 5,
          select: {
            id: true,
            eventType: true,
            timestamp: true,
            venue: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const statusSummary = {
      total: children.length,
      active: children.filter(child => child.status === 'ACTIVE').length,
      inactive: children.filter(child => child.status === 'INACTIVE').length,
      suspended: children.filter(child => child.status === 'SUSPENDED').length,
      // Check-in/out status would need to be determined from most recent CheckInOutEvent
      checkedIn: 0, // TODO: Calculate from CheckInOutEvents
      checkedOut: 0, // TODO: Calculate from CheckInOutEvents
    };

    return NextResponse.json({
      children,
      summary: statusSummary,
    });
  } catch (error) {
    console.error('Error fetching check-in status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-in status' },
      { status: 500 }
    );
  }
}
