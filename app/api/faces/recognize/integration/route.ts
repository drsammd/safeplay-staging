
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AlertMonitoringService } from "@/lib/services/alert-monitoring-service";

export const dynamic = "force-dynamic";

/**
 * Integration endpoint for face recognition events
 * This endpoint is called when a face recognition event occurs
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only system/admin users can trigger this endpoint
    if (session.user.role === "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.recognitionEventId) {
      return NextResponse.json(
        { error: "Missing required field: recognitionEventId" },
        { status: 400 }
      );
    }

    // Get the recognition event
    const recognitionEvent = await prisma.faceRecognitionEvent.findUnique({
      where: { id: data.recognitionEventId },
      include: {
        child: {
          include: {
            parent: true
          }
        },
        venue: true
      }
    });

    if (!recognitionEvent) {
      return NextResponse.json({ error: "Recognition event not found" }, { status: 404 });
    }

    // Process the recognition event for alert monitoring
    await AlertMonitoringService.processFaceRecognitionEvent(recognitionEvent);

    return NextResponse.json({
      success: true,
      message: "Face recognition event processed for alert monitoring"
    });

  } catch (error) {
    console.error("Error processing face recognition integration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
