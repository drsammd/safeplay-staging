
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../lib/db';
import { CommunicationNotificationType } from '@prisma/client';

// GET /api/messaging/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type') as CommunicationNotificationType | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      userId: session.user.id,
    };

    if (unreadOnly) {
      where.read = false;
    }

    if (type) {
      where.type = type;
    }

    // Add expiration filter
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gte: new Date() } },
    ];

    const skip = (page - 1) * limit;

    const [total, notifications] = await Promise.all([
      prisma.communicationNotification.count({ where }),
      prisma.communicationNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      priority: notification.priority,
      groupId: notification.groupId,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      expiresAt: notification.expiresAt,
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Error getting notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/messaging/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead = false } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.communicationNotification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.communicationNotification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `${notificationIds.length} notifications marked as read`,
      });
    } else {
      return NextResponse.json(
        { error: 'Either notificationIds array or markAllAsRead flag required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/messaging/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationIds = searchParams.get('ids')?.split(',') || [];
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (deleteAll) {
      // Delete all read notifications older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await prisma.communicationNotification.deleteMany({
        where: {
          userId: session.user.id,
          read: true,
          createdAt: { lte: thirtyDaysAgo },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Old read notifications deleted',
      });
    } else if (notificationIds.length > 0) {
      // Delete specific notifications
      await prisma.communicationNotification.deleteMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${notificationIds.length} notifications deleted`,
      });
    } else {
      return NextResponse.json(
        { error: 'Either notification IDs or deleteAll flag required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
