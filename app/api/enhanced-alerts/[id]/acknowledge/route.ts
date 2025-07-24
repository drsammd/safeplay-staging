
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EnhancedAlertStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
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
    if (session.user.role === "PARENT") {
      // Parents can only acknowledge alerts for their children
      if (!existingAlert.childId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      
      const child = await prisma.child.findFirst({
        where: { 
          id: existingAlert.childId,
          parentId: session.user.id 
        }
      });
      
      if (!child) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "VENUE_ADMIN") {
      if (existingAlert.venue.adminId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Check if user has already acknowledged this alert
    const existingAcknowledgment = await prisma.alertAcknowledgment.findUnique({
      where: {
        alertId_userId: {
          alertId: alertId,
          userId: session.user.id
        }
      }
    });

    if (existingAcknowledgment) {
      return NextResponse.json({ error: "Alert already acknowledged by this user" }, { status: 400 });
    }

    // Create acknowledgment
    const acknowledgment = await prisma.alertAcknowledgment.create({
      data: {
        alertId: alertId,
        userId: session.user.id,
        response: data.response,
        metadata: {
          acknowledgedBy: session.user.name,
          userRole: session.user.role,
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      }
    });

    // Update alert status if it's still ACTIVE
    let updatedAlert = existingAlert;
    if (existingAlert.status === EnhancedAlertStatus.ACTIVE) {
      updatedAlert = await prisma.enhancedAlert.update({
        where: { id: alertId },
        data: {
          status: EnhancedAlertStatus.ACKNOWLEDGED
        },
        include: {
          venue: {
            select: {
              adminId: true
            }
          }
        }
      });
    }

    // Create timeline entry
    await prisma.alertTimelineEntry.create({
      data: {
        alertId: alertId,
        entryType: 'ACKNOWLEDGED',
        title: 'Alert Acknowledged',
        eventType: 'ACKNOWLEDGED',
        description: `Alert acknowledged by ${session.user.name}${data.response ? ': ' + data.response : ''}`,
        userId: session.user.id,
        performedBy: session.user.id,
        metadata: {
          acknowledgedBy: session.user.name,
          userRole: session.user.role,
          response: data.response
        }
      }
    });

    // TODO: Trigger notifications and WebSocket events

    return NextResponse.json({
      acknowledgment,
      alert: updatedAlert
    });
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
