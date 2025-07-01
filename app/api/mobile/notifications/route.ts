
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Get mobile notifications for parent
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const notificationType = searchParams.get('type');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId: session.user.id
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    if (notificationType) {
      whereClause.notificationType = notificationType;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    // Filter out expired notifications
    whereClause.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ];

    const [notifications, total, unreadCount] = await Promise.all([
      db.mobileNotification.findMany({
        where: whereClause,
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      db.mobileNotification.count({ where: whereClause }),
      db.mobileNotification.count({ 
        where: { 
          userId: session.user.id, 
          isRead: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        } 
      })
    ]);

    const hasMore = skip + notifications.length < total;

    return NextResponse.json({ 
      notifications,
      total,
      unreadCount,
      hasMore,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching mobile notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new mobile notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      childId,
      alertId,
      notificationType,
      title,
      message,
      data,
      priority = 'NORMAL',
      isActionRequired = false,
      deepLinkUrl,
      imageUrl,
      expiresAt
    } = body;

    if (!notificationType || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If childId provided, verify parent owns this child
    if (childId) {
      const child = await db.child.findFirst({
        where: {
          id: childId,
          parentId: session.user.id
        }
      });

      if (!child) {
        return NextResponse.json({ error: 'Child not found' }, { status: 404 });
      }
    }

    const notification = await db.mobileNotification.create({
      data: {
        userId: session.user.id,
        childId,
        alertId,
        notificationType,
        title,
        message,
        data,
        priority,
        isActionRequired,
        deepLinkUrl,
        imageUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        deliveryStatus: 'DELIVERED' // Mark as delivered since it's created via API
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        }
      }
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error creating mobile notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Mark notifications as read/acted upon
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, action, actionData } = body; // action: 'read', 'action_taken', 'mark_all_read'

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    let whereClause: any = {
      userId: session.user.id
    };

    if (action === 'mark_all_read') {
      whereClause.isRead = false;
    } else if (notificationIds && Array.isArray(notificationIds)) {
      whereClause.id = { in: notificationIds };
    } else {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const updateData: any = {};
    const timestamp = new Date();

    switch (action) {
      case 'read':
      case 'mark_all_read':
        updateData.isRead = true;
        updateData.readAt = timestamp;
        break;
      case 'action_taken':
        updateData.actionTaken = actionData || 'completed';
        updateData.actionTakenAt = timestamp;
        updateData.isRead = true;
        updateData.readAt = timestamp;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await db.mobileNotification.updateMany({
      where: whereClause,
      data: updateData
    });

    return NextResponse.json({ 
      message: `${action} completed`,
      updatedCount: result.count 
    });
  } catch (error) {
    console.error('Error updating mobile notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
