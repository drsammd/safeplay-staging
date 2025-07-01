
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/zones/[zoneId]/notifications - Get zone notifications
export async function GET(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { zoneId } = params;
    const { searchParams } = new URL(request.url);
    const includeDeliveryLogs = searchParams.get('includeDeliveryLogs') === 'true';
    const status = searchParams.get('status'); // 'active' | 'inactive' | 'scheduled'
    const notificationType = searchParams.get('type');

    // Verify zone exists and user has access
    const zone = await prisma.floorPlanZone.findUnique({
      where: { id: zoneId },
      include: {
        floorPlan: {
          include: { venue: true }
        }
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    // Build filter conditions
    const whereClause: any = { zoneId };

    if (status === 'active') {
      whereClause.isActive = true;
      whereClause.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ];
    } else if (status === 'inactive') {
      whereClause.OR = [
        { isActive: false },
        { expiresAt: { lt: new Date() } }
      ];
    } else if (status === 'scheduled') {
      whereClause.isScheduled = true;
      whereClause.scheduledAt = { gt: new Date() };
    }

    if (notificationType) {
      whereClause.notificationType = notificationType;
    }

    // Get notifications
    const notifications = await prisma.zoneNotification.findMany({
      where: whereClause,
      include: {
        deliveryLogs: includeDeliveryLogs ? {
          orderBy: { id: 'desc' },
          take: 10 // Last 10 delivery attempts
        } : false
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Get notification statistics
    const stats = await prisma.zoneNotification.aggregate({
      where: { zoneId },
      _count: true,
      _sum: {
        deliveryCount: true,
        successfulDeliveries: true,
        failedDeliveries: true
      }
    });

    // Calculate delivery success rate
    const totalDeliveries = stats._sum.deliveryCount || 0;
    const successfulDeliveries = stats._sum.successfulDeliveries || 0;
    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    return NextResponse.json({
      notifications,
      statistics: {
        total: stats._count,
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries: stats._sum.failedDeliveries || 0,
        successRate: Math.round(successRate * 10) / 10
      },
      zoneInfo: {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        venueId: zone.floorPlan.venueId
      }
    });

  } catch (error) {
    console.error('Error fetching zone notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zone notifications' },
      { status: 500 }
    );
  }
}

// POST /api/zones/[zoneId]/notifications - Create zone notification
export async function POST(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { zoneId } = params;
    const body = await request.json();

    // Verify zone exists and user has access
    const zone = await prisma.floorPlanZone.findUnique({
      where: { id: zoneId },
      include: {
        floorPlan: {
          include: { venue: true }
        }
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    const {
      notificationType,
      title,
      message,
      priority,
      targetAudience,
      deliveryChannels,
      isScheduled,
      scheduledAt,
      isRecurring,
      recurrencePattern,
      expiresAt,
      conditions,
      customData,
      sendImmediately
    } = body;

    // Validate required fields
    if (!notificationType || !title || !message || !targetAudience || !deliveryChannels) {
      return NextResponse.json({
        error: 'Missing required fields: notificationType, title, message, targetAudience, deliveryChannels'
      }, { status: 400 });
    }

    // Create notification with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the notification
      const notification = await tx.zoneNotification.create({
        data: {
          zoneId,
          notificationType,
          title,
          message,
          priority: priority || 'NORMAL',
          targetAudience,
          deliveryChannels,
          isScheduled: isScheduled || false,
          scheduledAt: isScheduled ? (scheduledAt ? new Date(scheduledAt) : new Date()) : null,
          isRecurring: isRecurring || false,
          recurrencePattern,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          conditions,
          customData,
          metadata: {
            createdBy: session.user.id,
            createdAt: new Date().toISOString()
          }
        }
      });

      // If sending immediately or not scheduled, process delivery
      if (sendImmediately || (!isScheduled && !scheduledAt)) {
        await processNotificationDelivery(tx, notification, zone);
      }

      return notification;
    });

    return NextResponse.json({
      notification: result,
      message: 'Zone notification created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating zone notification:', error);
    return NextResponse.json(
      { error: 'Failed to create zone notification' },
      { status: 500 }
    );
  }
}

// PUT /api/zones/[zoneId]/notifications/[notificationId] - Update notification
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const notificationId = pathParts[pathParts.length - 1];
    const zoneId = pathParts[pathParts.length - 3];

    const body = await request.json();

    // Verify notification exists and user has access
    const notification = await prisma.zoneNotification.findUnique({
      where: { id: notificationId },
      include: {
        zone: {
          include: {
            floorPlan: {
              include: { venue: true }
            }
          }
        }
      }
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && notification.zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    // Update notification
    const updatedNotification = await prisma.zoneNotification.update({
      where: { id: notificationId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.message && { message: body.message }),
        ...(body.priority && { priority: body.priority }),
        ...(body.targetAudience && { targetAudience: body.targetAudience }),
        ...(body.deliveryChannels && { deliveryChannels: body.deliveryChannels }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.scheduledAt && { scheduledAt: new Date(body.scheduledAt) }),
        ...(body.expiresAt && { expiresAt: new Date(body.expiresAt) }),
        ...(body.conditions && { conditions: body.conditions }),
        ...(body.customData ? { customData: body.customData } : {}),
        metadata: {
          ...(notification?.metadata && typeof notification.metadata === 'object' ? notification.metadata : {}),
          lastModifiedBy: session.user.id,
          lastModifiedAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      notification: updatedNotification,
      message: 'Notification updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// Helper function to process notification delivery
async function processNotificationDelivery(tx: any, notification: any, zone: any) {
  // Get recipients based on target audience
  const recipients = await getNotificationRecipients(tx, notification.targetAudience, zone);

  // Create delivery logs for each recipient and channel
  for (const recipient of recipients) {
    for (const channel of notification.deliveryChannels) {
      await tx.notificationDeliveryLog.create({
        data: {
          notificationId: notification.id,
          recipientId: recipient.id,
          recipientType: recipient.type,
          channel,
          status: 'PENDING'
        }
      });
    }
  }

  // Update notification delivery count
  await tx.zoneNotification.update({
    where: { id: notification.id },
    data: {
      deliveryCount: recipients.length * notification.deliveryChannels.length,
      lastDelivered: new Date()
    }
  });

  // TODO: Trigger actual delivery to external services (email, SMS, push notifications)
  // This would typically be done via a background job queue
}

async function getNotificationRecipients(tx: any, targetAudience: string[], zone: any) {
  const recipients = [];

  for (const audience of targetAudience) {
    switch (audience) {
      case 'ALL_USERS':
        // Get all venue users
        const allUsers = await tx.user.findMany({
          where: {
            OR: [
              { managedVenues: { some: { id: zone.floorPlan.venueId } } },
              { children: { some: { currentVenueId: zone.floorPlan.venueId } } }
            ]
          }
        });
        recipients.push(...allUsers.map((u: any) => ({ id: u.id, type: 'USER' })));
        break;

      case 'PARENTS_ONLY':
        // Get parents with children in the venue
        const parents = await tx.user.findMany({
          where: {
            role: 'PARENT',
            children: { some: { currentVenueId: zone.floorPlan.venueId } }
          }
        });
        recipients.push(...parents.map((p: any) => ({ id: p.id, type: 'PARENT' })));
        break;

      case 'STAFF_ONLY':
        // Get venue staff
        const staff = await tx.user.findMany({
          where: {
            role: { in: ['VENUE_ADMIN', 'COMPANY_ADMIN'] },
            managedVenues: { some: { id: zone.floorPlan.venueId } }
          }
        });
        recipients.push(...staff.map((s: any) => ({ id: s.id, type: 'STAFF' })));
        break;

      case 'CHILDREN_IN_ZONE':
        // Get children currently in the zone
        const childrenInZone = await tx.child.findMany({
          where: {
            childSightings: {
              some: {
                floorPlanZoneId: zone.id,
                timestamp: {
                  gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                }
              }
            }
          }
        });
        recipients.push(...childrenInZone.map((c: any) => ({ id: c.id, type: 'CHILD' })));
        break;

      case 'PARENTS_OF_CHILDREN_IN_ZONE':
        // Get parents of children currently in the zone
        const parentsOfChildrenInZone = await tx.user.findMany({
          where: {
            role: 'PARENT',
            children: {
              some: {
                childSightings: {
                  some: {
                    floorPlanZoneId: zone.id,
                    timestamp: {
                      gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                    }
                  }
                }
              }
            }
          }
        });
        recipients.push(...parentsOfChildrenInZone.map((p: any) => ({ id: p.id, type: 'PARENT' })));
        break;

      // Add more audience types as needed
      default:
        console.warn(`Unknown target audience: ${audience}`);
    }
  }

  // Remove duplicates
  const uniqueRecipients = recipients.filter((recipient, index, self) =>
    index === self.findIndex(r => r.id === recipient.id && r.type === recipient.type)
  );

  return uniqueRecipients;
}
