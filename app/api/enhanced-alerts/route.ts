
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
    if (venueId && session.user.role === "COMPANY_ADMIN") where.venueId = venueId;
    if (childId && (session.user.role === "COMPANY_ADMIN" || session.user.role === "VENUE_ADMIN")) {
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
        camera: {
          select: {
            id: true,
            name: true,
            position: true,
          }
        },
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
            performer: {
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
        priority: data.priority || AlertPriority.NORMAL,
        status: EnhancedAlertStatus.ACTIVE,
        venueId: data.venueId,
        childId: data.childId,
        cameraId: data.cameraId,
        floorPlanZoneId: data.floorPlanZoneId,
        triggerData: data.triggerData,
        location: data.location,
        imageUrls: data.imageUrls || [],
        videoUrls: data.videoUrls || [],
        lastSeenLocation: data.lastSeenLocation,
        lastSeenTime: data.lastSeenTime ? new Date(data.lastSeenTime) : null,
        autoResolveAt: data.autoResolveAt ? new Date(data.autoResolveAt) : null,
        metadata: data.metadata,
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
        camera: {
          select: {
            id: true,
            name: true,
            position: true,
          }
        },
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
        eventType: 'CREATED',
        description: `Alert created: ${alert.title}`,
        performedBy: session.user.id,
        metadata: {
          createdBy: session.user.name,
          userRole: session.user.role
        }
      }
    });

    // TODO: Trigger notifications and WebSocket events
    
    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error("Error creating enhanced alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
