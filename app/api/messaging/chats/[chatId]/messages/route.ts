
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { messagingInfrastructureService } from '../../../../../../lib/services/messaging-infrastructure-service';
import { MessageType } from '@prisma/client';

// POST /api/messaging/chats/[chatId]/messages - Send message
export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = params;
    const body = await request.json();
    const { content, messageType, mediaUrl, mediaType, replyToId, metadata } = body;

    if (!messageType || !Object.values(MessageType).includes(messageType)) {
      return NextResponse.json(
        { error: 'Valid message type is required' },
        { status: 400 }
      );
    }

    const result = await messagingInfrastructureService.sendMessage({
      chatId,
      senderId: session.user.id,
      content,
      messageType: messageType as MessageType,
      mediaUrl,
      mediaType,
      replyToId,
      metadata,
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
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
