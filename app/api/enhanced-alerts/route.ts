
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EnhancedAlertType, AlertSeverity, AlertPriority, EnhancedAlertStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as EnhancedAlertStatus | null;
    const severity = searchParams.get('severity') as AlertSeverity | null;
    const type = searchParams.get('type') as EnhancedAlertType | null;
    const venueId = searchParams.get('venueId');
    const childId = searchParams.get('childId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let where: any = {};

    // Role-based access control
    if (session.user.role === "VENUE_ADMIN") {
      const venue = await prisma.venue.findFirst({
        where: { adminId: session.user.id },
        select: { id: true }
      });
      
      if (venue) {
        where.venueId = venue.id;
      } else {
        return NextResponse.json({ alerts: [], total: 0 });
      }
    } else if (session.user.role === "PARENT") {
      const userChildren = await prisma.child.findMany({
        where: { parentId: session.user.id },
        select: { id: true }
      });
      
      where.childId = {
        in: userChildren.map(child => child.id)
      };
    }

    // Apply filters
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (type) where.type = type;
    if (venueId && session.user.role === "SUPER_ADMIN") where.venueId = venueId;
    if (childId && (session.user.role === "SUPER_ADMIN" || session.user.role === "VENUE_ADMIN")) {
      where.childId = childId;
    }

    // Get total count
    const total = await prisma.enhancedAlert.count({ where });

    // Get alerts with relations
    const alerts = await prisma.enhancedAlert.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
          }
        },
        // camera relation removed as it doesn't exist on EnhancedAlert model
        zone: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        acknowledgments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              }
            }
          }
        },
        notifications: {
          where: {
            recipientId: session.user.id
          },
          orderBy: {
            scheduledAt: 'desc'
          },
          take: 1
        },
        timeline: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 5
        }
      },
      orderBy: [
        { priority: 'desc' },
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    return NextResponse.json({
      alerts,
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error("Error fetching enhanced alerts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.type || !data.title || !data.description || !data.venueId) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, description, venueId" },
        { status: 400 }
      );
    }

    // Role-based access control
    if (session.user.role === "VENUE_ADMIN") {
      const venue = await prisma.venue.findFirst({
        where: { 
          adminId: session.user.id,
          id: data.venueId 
        }
      });
      
      if (!venue) {
        return NextResponse.json({ error: "Unauthorized to create alerts for this venue" }, { status: 403 });
      }
    } else if (session.user.role === "PARENT") {
      return NextResponse.json({ error: "Parents cannot create alerts directly" }, { status: 403 });
    }

    // Create the alert
    const alert = await prisma.enhancedAlert.create({
      data: {
        type: data.type,
        subType: data.subType,
        title: data.title,
        description: data.description,
        severity: data.severity || AlertSeverity.MEDIUM,
        priority: data.priority || AlertPriority.MEDIUM,
        status: EnhancedAlertStatus.ACTIVE,
        venueId: data.venueId,
        childId: data.childId,
        sourceId: data.cameraId,
        floorPlanZoneId: data.floorPlanZoneId,
        triggerData: data.triggerData,
        location: data.location,
        imageUrls: data.imageUrls || [],
        videoUrls: data.videoUrls || [],
        lastSeenLocation: data.lastSeenLocation,
        lastSeenTime: data.lastSeenTime ? new Date(data.lastSeenTime) : null,
        autoResolveAt: data.autoResolveAt ? new Date(data.autoResolveAt) : null,
        
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
          }
        },
        // camera relation removed as it doesn't exist on EnhancedAlert model
        zone: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      }
    });

    // Create timeline entry
    await prisma.alertTimelineEntry.create({
      data: {
        alertId: alert.id,
        entryType: 'CREATED',
        title: 'Alert Created',
        eventType: 'CREATED',
        description: `Alert created: ${alert.title}`,
        userId: session.user.id,
        performedBy: session.user.id,
        metadata: {
          createdBy: session.user.name,
          userRole: session.user.role
        }
      }
    });

    // Trigger notifications and WebSocket events
    try {
      await triggerAlertNotifications(alert);
      await broadcastAlertWebSocketEvent(alert);
    } catch (notificationError) {
      console.warn(`⚠️ Notification/WebSocket trigger failed for alert ${alert.id}:`, notificationError);
      // Don't fail the API call if notifications fail
    }
    
    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error("Error creating enhanced alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to trigger alert notifications
async function triggerAlertNotifications(alert: any) {
  try {
    // Determine who should be notified based on alert type and severity
    const notificationTargets = [];

    // Always notify venue admin
    if (alert.venue?.adminId) {
      notificationTargets.push({
        userId: alert.venue.adminId,
        notificationType: 'VENUE_ALERT',
        priority: alert.severity === 'HIGH' ? 'HIGH' : 'MEDIUM'
      });
    }

    // Notify parent if child is involved
    if (alert.child?.parentId) {
      notificationTargets.push({
        userId: alert.child.parentId,
        notificationType: 'CHILD_ALERT',
        priority: alert.severity === 'HIGH' ? 'HIGH' : 'MEDIUM'
      });
    }

    // Notify emergency contacts for high-severity alerts
    if (alert.severity === 'HIGH' && alert.child?.id) {
      const emergencyContacts = await prisma.emergencyContact.findMany({
        where: { childId: alert.child.id },
        select: { userId: true }
      });

      for (const contact of emergencyContacts) {
        if (contact.userId) {
          notificationTargets.push({
            userId: contact.userId,
            notificationType: 'EMERGENCY_ALERT',
            priority: 'HIGH'
          });
        }
      }
    }

    // Create notifications for all targets
    for (const target of notificationTargets) {
      await prisma.mobileNotification.create({
        data: {
          userId: target.userId,
          title: `${alert.severity} Alert: ${alert.title}`,
          message: alert.description,
          type: target.notificationType,
          priority: target.priority,
          relatedEntityId: alert.id,
          relatedEntityType: 'ENHANCED_ALERT',
          scheduledAt: new Date(),
          childId: alert.child?.id,
          metadata: {
            alertType: alert.type,
            alertSeverity: alert.severity,
            venueId: alert.venueId,
            sourceId: alert.sourceId
          }
        }
      });
    }

    console.log(`✅ Triggered ${notificationTargets.length} notifications for alert ${alert.id}`);
  } catch (error) {
    console.error('❌ Error triggering alert notifications:', error);
    throw error;
  }
}

// Helper function to broadcast alert WebSocket events
async function broadcastAlertWebSocketEvent(alert: any) {
  try {
    // Prepare WebSocket event data
    const eventData = {
      type: 'ENHANCED_ALERT',
      action: 'CREATED',
      alertId: alert.id,
      severity: alert.severity,
      priority: alert.priority,
      title: alert.title,
      description: alert.description,
      venueId: alert.venueId,
      childId: alert.child?.id,
      timestamp: new Date().toISOString(),
      data: {
        alert: {
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          priority: alert.priority,
          title: alert.title,
          description: alert.description,
          status: alert.status,
          child: alert.child ? {
            id: alert.child.id,
            firstName: alert.child.firstName,
            lastName: alert.child.lastName,
            profilePhoto: alert.child.profilePhoto
          } : null,
          venue: alert.venue ? {
            id: alert.venue.id,
            name: alert.venue.name
          } : null,
          // camera relation removed as it doesn't exist on EnhancedAlert model
          sourceId: alert.sourceId, // Camera reference by ID only
          location: alert.location,
          imageUrls: alert.imageUrls || [],
          videoUrls: alert.videoUrls || []
        }
      }
    };

    // In a real implementation, you would broadcast this through your WebSocket service
    // For now, we'll log it and store it for later processing
    console.log('🔗 WebSocket event prepared for alert:', {
      alertId: alert.id,
      severity: alert.severity,
      type: alert.type,
      eventType: eventData.type
    });

    // Store WebSocket event in database for processing by WebSocket service
    await prisma.webSocketEvent.create({
      data: {
        eventType: eventData.type,
        eventAction: eventData.action,
        targetUserId: alert.child?.parentId || alert.venue?.adminId,
        eventData: eventData,
        venueId: alert.venueId
      }
    });

    console.log('✅ WebSocket event queued for broadcasting');
  } catch (error) {
    console.error('❌ Error broadcasting WebSocket event:', error);
    throw error;
  }
}
