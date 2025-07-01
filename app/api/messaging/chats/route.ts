
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { messagingInfrastructureService } from '../../../../lib/services/messaging-infrastructure-service';
import { ChatType } from '@prisma/client';

// GET /api/messaging/chats - Get user's chats
export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await messagingInfrastructureService.getUserChats(session.user.id);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error getting user chats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messaging/chats - Create new chat
export async function POST(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, description, venueId, groupId, participantIds } = body;

    if (!type || !Object.values(ChatType).includes(type)) {
      return NextResponse.json(
        { error: 'Valid chat type is required' },
        { status: 400 }
      );
    }

    if (!participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json(
        { error: 'participantIds array is required' },
        { status: 400 }
      );
    }

    // Ensure creator is in participants list
    const allParticipants = [...new Set([session.user.id, ...participantIds])];

    const result = await messagingInfrastructureService.createChat({
      type: type as ChatType,
      title,
      description,
      venueId,
      groupId,
      participantIds: allParticipants,
      creatorId: session.user.id,
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
