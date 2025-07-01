
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EnhancedAlertStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = params.id;

    // Get alert with full details
    const alert = await prisma.enhancedAlert.findUnique({
      where: { id: alertId },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
          }
        },
        camera: {
          select: {
            id: true,
            name: true,
            position: true,
            ipAddress: true,
          }
        },
        zone: {
          select: {
            id: true,
            name: true,
            type: true,
            coordinates: true,
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
          },
          orderBy: {
            acknowledgedAt: 'desc'
          }
        },
        notifications: {
          include: {
            recipient: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          },
          orderBy: {
            scheduledAt: 'desc'
          }
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
          }
        }
      }
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Role-based access control
    if (session.user.role === "VENUE_ADMIN") {
      const venue = await prisma.venue.findFirst({
        where: { 
          adminId: session.user.id,
          id: alert.venueId 
        }
      });
      
      if (!venue) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "PARENT") {
      if (!alert.childId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      
      const child = await prisma.child.findFirst({
        where: { 
          id: alert.childId,
          parentId: session.user.id 
        }
      });
      
      if (!child) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error fetching alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = params.id;
    const data = await request.json();

    // Get existing alert
    const existingAlert = await prisma.enhancedAlert.findUnique({
      where: { id: alertId },
      include: {
        venue: {
          select: {
            adminId: true
          }
        }
      }
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Role-based access control
    if (session.user.role === "VENUE_ADMIN") {
      if (existingAlert.venue.adminId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "PARENT") {
      return NextResponse.json({ error: "Parents cannot modify alerts" }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    const timelineEntries: any[] = [];

    if (data.status !== undefined && data.status !== existingAlert.status) {
      updateData.status = data.status;
      
      if (data.status === EnhancedAlertStatus.RESOLVED) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = session.user.id;
        updateData.resolution = data.resolution;
        
        if (existingAlert.createdAt) {
          updateData.responseTime = Math.floor((new Date().getTime() - existingAlert.createdAt.getTime()) / 1000);
        }
      }
      
      timelineEntries.push({
        eventType: 'STATUS_CHANGED',
        description: `Status changed from ${existingAlert.status} to ${data.status}`,
        performedBy: session.user.id,
        metadata: {
          previousStatus: existingAlert.status,
          newStatus: data.status,
          changedBy: session.user.name
        }
      });
    }

    if (data.escalationLevel !== undefined && data.escalationLevel !== existingAlert.escalationLevel) {
      updateData.escalationLevel = data.escalationLevel;
      updateData.escalatedAt = new Date();
      
      timelineEntries.push({
        eventType: 'ESCALATED',
        description: `Alert escalated to level ${data.escalationLevel}`,
        performedBy: session.user.id,
        metadata: {
          previousLevel: existingAlert.escalationLevel,
          newLevel: data.escalationLevel,
          escalatedBy: session.user.name
        }
      });
    }

    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.severity !== undefined) updateData.severity = data.severity;

    // Update alert
    const updatedAlert = await prisma.enhancedAlert.update({
      where: { id: alertId },
      data: updateData,
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

    // Create timeline entries
    for (const entry of timelineEntries) {
      await prisma.alertTimelineEntry.create({
        data: {
          alertId: alertId,
          ...entry
        }
      });
    }

    // TODO: Trigger notifications and WebSocket events for status changes

    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
