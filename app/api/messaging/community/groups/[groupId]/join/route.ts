
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../../../../lib/db';

// POST /api/messaging/community/groups/[groupId]/join - Join group
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = params;

    // Get group details
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { leftAt: null },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.communityMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    });

    if (existingMember && !existingMember.leftAt) {
      return NextResponse.json(
        { error: 'Already a member of this group' },
        { status: 409 }
      );
    }

    // Check member limit
    if (group.memberLimit && group.members.length >= group.memberLimit) {
      return NextResponse.json(
        { error: 'Group has reached its member limit' },
        { status: 400 }
      );
    }

    // Join or rejoin group
    if (existingMember) {
      // Rejoin
      await prisma.communityMember.update({
        where: { id: existingMember.id },
        data: {
          leftAt: null,
          joinedAt: new Date(),
          isActive: true,
        },
      });
    } else {
      // New member
      await prisma.communityMember.create({
        data: {
          groupId,
          userId: session.user.id,
          role: 'member',
        },
      });
    }

    // Add to group chat if exists
    try {
      const groupChat = await prisma.chat.findFirst({
        where: {
          groupId,
          isActive: true,
        },
      });

      if (groupChat) {
        const { messagingInfrastructureService } = await import('../../../../../../../lib/services/messaging-infrastructure-service');
        
        await messagingInfrastructureService.addParticipants(
          groupChat.id,
          [session.user.id],
          group.adminId
        );
      }
    } catch (chatError) {
      console.error('Error adding to group chat:', chatError);
      // Continue without chat addition
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the group',
    });
  } catch (error: any) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/messaging/community/groups/[groupId]/join - Leave group
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

    // Get membership
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
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 400 }
      );
    }

    // Prevent admin from leaving their own group
    if (membership.group.adminId === session.user.id) {
      return NextResponse.json(
        { error: 'Group admin cannot leave. Transfer admin rights or delete the group.' },
        { status: 400 }
      );
    }

    // Leave group
    await prisma.communityMember.update({
      where: { id: membership.id },
      data: {
        leftAt: new Date(),
        isActive: false,
      },
    });

    // Leave group chat
    try {
      const groupChat = await prisma.chat.findFirst({
        where: {
          groupId,
          isActive: true,
        },
      });

      if (groupChat) {
        const { messagingInfrastructureService } = await import('../../../../../../../lib/services/messaging-infrastructure-service');
        
        await messagingInfrastructureService.leaveChat(groupChat.id, session.user.id);
      }
    } catch (chatError) {
      console.error('Error leaving group chat:', chatError);
      // Continue without chat removal
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left the group',
    });
  } catch (error: any) {
    console.error('Error leaving group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
