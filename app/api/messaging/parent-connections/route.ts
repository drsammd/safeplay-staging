
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../lib/db';
import { ConnectionStatus } from '@prisma/client';

// GET /api/messaging/parent-connections - Get parent connections
export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ConnectionStatus | null;

    const where: any = {
      OR: [
        { requesterId: session.user.id },
        { receiverId: session.user.id },
      ],
    };

    if (status) {
      where.status = status;
    }

    const connections = await prisma.parentConnection.findMany({
      where,
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        receiver: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    const formattedConnections = connections.map(connection => {
      const isRequester = connection.requesterId === session.user.id;
      const otherParent = isRequester ? (connection as any).receiver : (connection as any).requester;

      return {
        id: connection.id,
        otherParent,
        status: connection.status,
        isRequester,
        requestedAt: connection.requestedAt,
        respondedAt: connection.respondedAt,
        message: connection.message,
        connectionType: connection.connectionType,
        compatibilityScore: 0,
        recentActivities: [],
      };
    });

    return NextResponse.json({
      success: true,
      connections: formattedConnections,
    });
  } catch (error: any) {
    console.error('Error getting parent connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messaging/parent-connections - Request parent connection
export async function POST(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, message } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: 'receiverId is required' },
        { status: 400 }
      );
    }

    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot connect to yourself' },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const existingConnection = await prisma.parentConnection.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, receiverId },
          { requesterId: receiverId, receiverId: session.user.id },
        ],
      },
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: 'Connection already exists or is pending' },
        { status: 409 }
      );
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    // Calculate compatibility score if possible
    let compatibilityScore: number | undefined;
    try {
      // Get children for both parents to calculate compatibility
      const [requesterChildren, receiverChildren] = await Promise.all([
        prisma.child.findMany({ where: { parentId: session.user.id } }),
        prisma.child.findMany({ where: { parentId: receiverId } }),
      ]);

      if (requesterChildren.length > 0 && receiverChildren.length > 0) {
        // Use first child from each family for compatibility calculation
        // In a real implementation, you might want to calculate for all combinations
        const { friendshipDetectionService } = await import('../../../../lib/services/friendship-detection-service');
        const compatibility = await friendshipDetectionService.calculateFamilyCompatibility(
          requesterChildren[0].id,
          receiverChildren[0].id
        );
        compatibilityScore = compatibility.overall;
      }
    } catch (compatibilityError) {
      console.error('Error calculating compatibility:', compatibilityError);
      // Continue without compatibility score
    }

    // Create connection request
    const connection = await prisma.parentConnection.create({
      data: {
        requesterId: session.user.id,
        receiverId,
        status: ConnectionStatus.PENDING,
        message,
        connectionType: 'FRIEND',
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        receiver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Send notification to receiver
    await prisma.communicationNotification.create({
      data: {
        userId: receiverId,
        type: 'COMMUNITY_INVITE',
        title: 'New Parent Connection Request',
        message: `${connection.requester.name} wants to connect with you on SafePlay.`,
        data: {
          connectionId: connection.id,
          requesterId: session.user.id,
          requesterName: connection.requester.name,
          message: connection.message,
        },
        priority: 'NORMAL',
      },
    });

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        receiver: connection.receiver,
        status: connection.status,
        requestedAt: connection.requestedAt,
        compatibilityScore: connection.compatibilityScore,
      },
    });
  } catch (error: any) {
    console.error('Error creating parent connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
