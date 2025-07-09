
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '../../../../../lib/db';
import { ParentConnection, ConnectionStatus, ChatType } from '@prisma/client';

type ParentConnectionStatus = ConnectionStatus;

// PUT /api/messaging/parent-connections/[connectionId] - Respond to connection request
export async function PUT(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId } = params;
    const body = await request.json();
    const { status, notes } = body;

    if (!status || !Object.values(ConnectionStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }

    // Get connection and verify access
    const connection = await prisma.parentConnection.findUnique({
      where: { id: connectionId },
      include: {
        requester: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Only receiver can respond to pending requests
    if (connection.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      return NextResponse.json(
        { error: 'Connection request is no longer pending' },
        { status: 400 }
      );
    }

    // Update connection
    const updatedConnection = await prisma.parentConnection.update({
      where: { id: connectionId },
      data: {
        status: status as any,
        respondedAt: new Date(),
      },
    });

    // Send notification to requester
    const notificationMessage = status === ConnectionStatus.ACCEPTED
      ? `${connection.receiver.name} accepted your connection request!`
      : `${connection.receiver.name} declined your connection request.`;

    await prisma.communicationNotification.create({
      data: {
        userId: connection.requesterId,
        type: 'COMMUNITY_INVITE',
        title: 'Connection Request Response',
        message: notificationMessage,
        data: {
          connectionId: connection.id,
          responderId: session.user.id,
          responderName: connection.receiver.name,
          status,
        },
        priority: 'NORMAL',
      },
    });

    // If accepted, create a direct chat for communication
    if (status === ConnectionStatus.ACCEPTED) {
      try {
        const { messagingInfrastructureService } = await import('../../../../../lib/services/messaging-infrastructure-service');
        
        await messagingInfrastructureService.createChat({
          type: ChatType.DIRECT,
          title: `${connection.requester.name} & ${connection.receiver.name}`,
          participantIds: [connection.requesterId, connection.receiverId],
          creatorId: session.user.id,
        });
      } catch (chatError) {
        console.error('Error creating connection chat:', chatError);
        // Continue without chat creation
      }
    }

    return NextResponse.json({
      success: true,
      connection: {
        id: updatedConnection.id,
        status: updatedConnection.status,
        respondedAt: updatedConnection.respondedAt,

      },
    });
  } catch (error: any) {
    console.error('Error responding to connection request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/messaging/parent-connections/[connectionId] - Remove/block connection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'remove' or 'block'

    // Get connection and verify access
    const connection = await prisma.parentConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Verify user is part of the connection
    const hasAccess = connection.requesterId === session.user.id || 
                      connection.receiverId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (action === 'block') {
      // Block the connection
      await prisma.parentConnection.update({
        where: { id: connectionId },
        data: {
          status: ConnectionStatus.BLOCKED,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Connection blocked successfully',
      });
    } else {
      // Remove the connection entirely
      await prisma.parentConnection.delete({
        where: { id: connectionId },
      });

      return NextResponse.json({
        success: true,
        message: 'Connection removed successfully',
      });
    }
  } catch (error: any) {
    console.error('Error removing/blocking connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
