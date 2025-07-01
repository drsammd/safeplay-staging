
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = params.id;
    const body = await request.json();
    const { resolution } = body;

    // Verify the alert exists and user has permission to resolve it
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        venue: true,
        child: true
      }
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Check permissions
    if (session.user.role === "VENUE_ADMIN") {
      const venue = await prisma.venue.findFirst({
        where: { adminId: session.user.id }
      });
      
      if (!venue || venue.id !== alert.venueId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "PARENT") {
      if (!alert.child || alert.child.parentId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
        resolution: resolution || "Alert resolved",
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: "Alert resolved successfully",
      alert: updatedAlert
    });
  } catch (error) {
    console.error("Error resolving alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
