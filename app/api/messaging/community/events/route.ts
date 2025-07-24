
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../../lib/db';

// GET /api/messaging/community/events - Get community events
export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const venueId = searchParams.get('venueId');
    const upcoming = searchParams.get('upcoming') === 'true';
    const myEvents = searchParams.get('myEvents') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (groupId) {
      where.groupId = groupId;
    }

    if (venueId) {
      where.venueId = venueId;
    }

    if (upcoming) {
      where.startTime = { gte: new Date() };
    }

    if (myEvents) {
      where.OR = [
        { organizerId: session.user.id },
        {
          participants: {
            some: {
              userId: session.user.id,
              status: { in: ['REGISTERED', 'CONFIRMED', 'ATTENDED'] },
            },
          },
        },
      ];
    }

    const events = await prisma.communityEvent.findMany({
      where,
      include: {
        group: {
          select: { id: true, name: true, groupType: true },
        },
        venue: {
          select: { id: true, name: true },
        },
        organizer: {
          select: { id: true, name: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            participants: {
              where: {
                status: { in: ['REGISTERED', 'CONFIRMED'] },
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: limit,
    });

    const formattedEvents = events.map(event => {
      const userParticipation = event.participants.find(p => p.userId === session.user.id);
      
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        maxParticipants: event.maxParticipants,
        currentParticipants: event._count?.participants || event.currentParticipants,
        cost: event.cost,
        isPublic: event.isPublic,
        requiresRSVP: event.requiresRSVP,
        group: event.group,
        venue: event.venue,
        organizer: event.organizer,
        isParticipating: !!userParticipation,
        participationStatus: userParticipation?.status || null,
        createdAt: event.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      events: formattedEvents,
    });
  } catch (error: any) {
    console.error('Error getting community events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messaging/community/events - Create community event
export async function POST(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      groupId,
      title,
      description,
      eventType,
      location,
      venueId,
      startTime,
      endTime,
      maxParticipants,
      ageRange,
      cost,
      isPublic = false,
      requiresApproval = false,
    } = body;

    if (!groupId || !title || !eventType || !location || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user is member of the group
    const membership = await prisma.communityMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
      include: {
        group: true,
      },
    });

    if (!membership || membership.leftAt) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    // Verify venue access if provided
    if (venueId) {
      const venue = await prisma.venue.findFirst({
        where: {
          id: venueId,
          OR: [
            { adminId: session.user.id },
            { children: { some: { parentId: session.user.id } } }
          ]
        }
      });

      if (!venue) {
        return NextResponse.json({ error: 'Access denied to venue' }, { status: 403 });
      }
    }

    // Create event
    const event = await prisma.communityEvent.create({
      data: {
        groupId,
        title,
        description,
        eventType,
        location,
        venueId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxParticipants,
        ageRange,
        cost,
        isPublic,
        requiresApproval,
        organizerId: session.user.id,
      },
      include: {
        group: {
          select: { id: true, name: true },
        },
        venue: {
          select: { id: true, name: true },
        },
        organizer: {
          select: { id: true, name: true },
        },
      },
    });

    // Auto-register organizer
    await prisma.eventParticipant.create({
      data: {
        eventId: event.id,
        userId: session.user.id,
        status: 'CONFIRMED',
      },
    });

    // Notify group members
    try {
      const groupMembers = await prisma.communityMember.findMany({
        where: {
          groupId,
          userId: { not: session.user.id },
          leftAt: null,
        },
      });

      await Promise.all(
        groupMembers.map(member =>
          prisma.communicationNotification.create({
            data: {
              userId: member.userId,
              notificationType: 'COMMUNITY_INVITE',
              title: 'New Community Event',
              message: `${event.organizer.name} created a new event: ${event.title}`,
              data: {
                eventId: event.id,
                groupId: event.groupId,
                organizerId: session.user.id,
              },
              priority: 'NORMAL',
            },
          })
        )
      );
    } catch (notificationError) {
      console.error('Error sending event notifications:', notificationError);
      // Continue without notifications
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        startTime: event.startTime,
        endTime: event.endTime,
        group: event.group,
        venue: event.venue,
        organizer: event.organizer,
        createdAt: event.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating community event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
