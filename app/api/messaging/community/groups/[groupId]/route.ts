
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../../../lib/db';

// GET /api/messaging/community/groups/[groupId] - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = params;

    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
      include: {
        admin: {
          select: { id: true, name: true },
        },
        venue: {
          select: { id: true, name: true },
        },
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        events: {
          where: {
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: 'asc' },
          take: 5,
        },
        chats: {
          where: { isActive: true },
          select: { id: true, title: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is member for private groups
    const isMember = group.members.some(member => member.userId === session.user.id);
    if (!group.isPublic && !isMember) {
      return NextResponse.json({ error: 'Access denied to private group' }, { status: 403 });
    }

    const userMembership = group.members.find(member => member.userId === session.user.id);

    const formattedGroup = {
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type,
      isPublic: group.isPublic,
      admin: group.admin,
      venue: group.venue,
      memberLimit: group.memberLimit,
      location: group.location,
      interests: group.interests,
      ageRange: group.ageRange,
      requirements: group.requirements,
      createdAt: group.createdAt,
      members: group.members.map(member => ({
        id: member.id,
        user: member.user,
        role: member.role,
        joinedAt: member.joinedAt,
        contributionScore: member.contributionScore,
      })),
      upcomingEvents: group.events,
      chats: group.chats,
      isMember,
      userRole: userMembership?.role || null,
      memberCount: group.members.length,
    };

    return NextResponse.json({
      success: true,
      group: formattedGroup,
    });
  } catch (error: any) {
    console.error('Error getting group details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/messaging/community/groups/[groupId] - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = params;
    const body = await request.json();

    // Verify user is admin of the group
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: {
            userId: session.user.id,
            leftAt: null,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userMembership = group.members[0];
    if (!userMembership || (userMembership.role !== 'admin' && group.adminId !== session.user.id)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update group
    const updatedGroup = await prisma.communityGroup.update({
      where: { id: groupId },
      data: {
        name: body.name || group.name,
        description: body.description !== undefined ? body.description : group.description,
        isPublic: body.isPublic !== undefined ? body.isPublic : group.isPublic,
        memberLimit: body.memberLimit !== undefined ? body.memberLimit : group.memberLimit,
        location: body.location !== undefined ? body.location : group.location,
        interests: body.interests || group.interests,
        ageRange: body.ageRange !== undefined ? body.ageRange : group.ageRange,
        requirements: body.requirements !== undefined ? body.requirements : group.requirements,
      },
    });

    return NextResponse.json({
      success: true,
      group: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        description: updatedGroup.description,
        isPublic: updatedGroup.isPublic,
        updatedAt: updatedGroup.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/messaging/community/groups/[groupId] - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = params;

    // Verify user is admin of the group
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Only group admin can delete the group' }, { status: 403 });
    }

    // Delete group (this will cascade to related records)
    await prisma.communityGroup.delete({
      where: { id: groupId },
    });

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
