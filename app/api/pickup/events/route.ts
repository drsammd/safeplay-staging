
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/pickup/events - Get pickup events history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const venueId = searchParams.get('venueId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (session.user.role === 'PARENT') {
      // Get children for this parent
      const children = await prisma.child.findMany({
        where: { parentId: session.user.id },
        select: { id: true },
      });
      where.childId = { in: children.map(child => child.id) };
    } else if (session.user.role === 'VENUE_ADMIN' && venueId) {
      where.venueId = venueId;
    }

    if (childId) where.childId = childId;

    const pickupEvents = await prisma.pickupEvent.findMany({
      where,
      include: {
        pickupAuthorization: {
          select: {
            id: true,
            authorizedPersonName: true,
            relationship: true,
            phoneNumber: true,
            emergencyContact: true,
          },
        },
        checkInOutEvent: {
          select: {
            id: true,
            eventType: true,
            timestamp: true,
          },
        },
        biometricVerifications: {
          select: {
            id: true,
            verificationResult: true,
            matchConfidence: true,
            verificationType: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get child and venue information for the events
    const eventsWithDetails = await Promise.all(
      pickupEvents.map(async (event) => {
        const child = await prisma.child.findUnique({
          where: { id: event.childId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          },
        });

        const venue = await prisma.venue.findUnique({
          where: { id: event.venueId },
          select: {
            id: true,
            name: true,
            address: true,
          },
        });

        return {
          ...event,
          child,
          venue,
        };
      })
    );

    return NextResponse.json({
      pickupEvents: eventsWithDetails,
      pagination: {
        limit,
        offset,
        total: await prisma.pickupEvent.count({ where }),
      },
    });
  } catch (error) {
    console.error('Error fetching pickup events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pickup events' },
      { status: 500 }
    );
  }
}
