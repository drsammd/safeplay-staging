
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../../lib/db';
import { CommunityGroupType } from '@prisma/client';

// GET /api/messaging/community/groups - Get community groups
export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const type = searchParams.get('type') as CommunityGroupType | null;
    const myGroups = searchParams.get('myGroups') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      isPublic: true,
    };

    if (venueId) {
      where.venueId = venueId;
    }

    if (type) {
      where.type = type;
    }

    if (myGroups) {
      where.members = {
        some: {
          userId: session.user.id,
          leftAt: null,
        },
      };
    }

    const groups = await prisma.communityGroup.findMany({
      where,
      include: {
        admin: {
          select: { id: true, name: true },
        },
        venue: {
          select: { id: true, name: true },
        },
        members: {
          where: { leftAt: null },
          select: { id: true, userId: true, role: true },
        },
        _count: {
          select: {
            members: {
              where: { leftAt: null },
            },
            events: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const formattedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type,
      admin: group.admin,
      venue: group.venue,
      memberLimit: group.memberLimit,
      location: group.location,
      interests: group.interests,
      ageRange: group.ageRange,
      requirements: group.requirements,
      createdAt: group.createdAt,
      memberCount: group._count.members,
      eventCount: group._count.events,
      isMember: group.members.some(member => member.userId === session.user.id),
      userRole: group.members.find(member => member.userId === session.user.id)?.role || null,
    }));

    return NextResponse.json({
      success: true,
      groups: formattedGroups,
    });
  } catch (error: any) {
    console.error('Error getting community groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messaging/community/groups - Create community group
export async function POST(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      isPublic = true,
      venueId,
      memberLimit,
      location,
      interests = [],
      ageRange,
      requirements,
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    if (!Object.values(CommunityGroupType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid group type' },
        { status: 400 }
      );
    }

    // Verify venue access if venueId provided
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

    // Create group
    const group = await prisma.communityGroup.create({
      data: {
        name,
        description,
        type,
        isPublic,
        venueId,
        adminId: session.user.id,
        memberLimit,
        location,
        interests,
        ageRange,
        requirements,
      },
      include: {
        admin: {
          select: { id: true, name: true },
        },
        venue: {
          select: { id: true, name: true },
        },
      },
    });

    // Add creator as first member with admin role
    await prisma.communityMember.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        role: 'admin',
      },
    });

    // Create group chat
    try {
      const { messagingInfrastructureService } = await import('../../../../../lib/services/messaging-infrastructure-service');
      
      await messagingInfrastructureService.createChat({
        type: 'COMMUNITY',
        title: `${group.name} Discussion`,
        description: `Community chat for ${group.name}`,
        groupId: group.id,
        participantIds: [session.user.id],
        creatorId: session.user.id,
      });
    } catch (chatError) {
      console.error('Error creating group chat:', chatError);
      // Continue without chat creation
    }

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        type: group.type,
        admin: group.admin,
        venue: group.venue,
        createdAt: group.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating community group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
