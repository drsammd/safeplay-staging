
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../../lib/db';
import { FriendshipStatus } from '@prisma/client';

// PUT /api/messaging/friendships/[friendshipId] - Update friendship status
export async function PUT(
  request: NextRequest,
  { params }: { params: { friendshipId: string } }
) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendshipId } = params;
    const body = await request.json();
    const { status, notes } = body;

    if (!status || !Object.values(FriendshipStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }

    // Get friendship and verify access
    const friendship = await prisma.childFriendship.findUnique({
      where: { id: friendshipId },
      include: {
        child1: { include: { parent: true } },
        child2: { include: { parent: true } },
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    // Verify user is parent of one of the children
    const hasAccess = friendship.child1?.parentId === session.user.id || 
                      friendship.child2?.parentId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update friendship
    const updatedFriendship = await prisma.childFriendship.update({
      where: { id: friendshipId },
      data: {
        status: status as FriendshipStatus,
        notes,
        approvedAt: status === FriendshipStatus.ACTIVE ? new Date() : undefined,
      },
      include: {
        child1: true,
        child2: true,
      },
    });

    return NextResponse.json({
      success: true,
      friendship: {
        id: updatedFriendship.id,
        status: updatedFriendship.status,
        approvedAt: updatedFriendship.approvedAt,
        notes: updatedFriendship.notes,
      },
    });
  } catch (error: any) {
    console.error('Error updating friendship:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/messaging/friendships/[friendshipId] - Get friendship details
export async function GET(
  request: NextRequest,
  { params }: { params: { friendshipId: string } }
) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendshipId } = params;

    const friendship = await prisma.childFriendship.findUnique({
      where: { id: friendshipId },
      include: {
        child1: {
          include: { 
            parent: { select: { id: true, name: true } } 
          },
        },
        child2: {
          include: { 
            parent: { select: { id: true, name: true } } 
          },
        },
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    // Verify user is parent of one of the children
    const hasAccess = friendship.child1?.parentId === session.user.id || 
                      friendship.child2?.parentId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const formattedFriendship = {
      id: friendship.id,
      children: [
        {
          id: friendship.child1?.id,
          name: `${friendship.child1?.firstName} ${friendship.child1?.lastName}`,
          parent: friendship.child1?.parent,
        },
        {
          id: friendship.child2?.id,
          name: `${friendship.child2?.firstName} ${friendship.child2?.lastName}`,
          parent: friendship.child2?.parent,
        },
      ],
      status: friendship.status,
      initiatedBy: friendship.initiatedBy,
      approvedBy: friendship.approvedBy,
      createdAt: friendship.createdAt,
      approvedAt: friendship.approvedAt,
      notes: friendship.notes,
    };

    return NextResponse.json({
      success: true,
      friendship: formattedFriendship,
    });
  } catch (error: any) {
    console.error('Error getting friendship details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
