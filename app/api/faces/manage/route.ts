
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAWSAvailable, isDevelopmentMode } from "@/lib/aws/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/faces/manage
 * Get face management data for a child
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 });
    }

    // Verify child access permission
    if (session.user.role === "PARENT") {
      const child = await prisma.child.findFirst({
        where: {
          id: childId,
          parentId: session.user.id,
        },
      });

      if (!child) {
        return NextResponse.json({ error: "Child not found or access denied" }, { status: 404 });
      }
    }

    // Check if AWS is available
    if (!isAWSAvailable() && !isDevelopmentMode()) {
      return NextResponse.json({ 
        error: "AWS configuration incomplete. Face recognition features are not available." 
      }, { status: 503 });
    }

    // Get comprehensive face data
    const faceCollection = await prisma.faceCollection.findUnique({
      where: { childId },
      include: {
        faceRecords: {
          orderBy: { createdAt: 'desc' },
        },
        child: {
          select: {
            firstName: true,
            lastName: true,
            faceRecognitionEnabled: true,
            faceRecognitionConsent: true,
            recognitionThreshold: true,
          },
        },
      },
    });

    if (!faceCollection) {
      return NextResponse.json({ 
        collection: null,
        message: "No face collection found for this child" 
      });
    }

    // Get recent recognition events
    const recentEvents = await prisma.faceRecognitionEvent.findMany({
      where: { childId },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
          },
        },
        memory: {
          select: {
            id: true,
            fileName: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Mock AWS collection info in development mode
    const awsCollectionInfo = isDevelopmentMode() ? {
      faceCount: faceCollection.faceRecords.length,
      faceModelVersion: "6.0",
      status: "ACTIVE"
    } : null;

    // Calculate statistics
    const stats = {
      totalFaces: faceCollection.faceRecords.length,
      activeFaces: faceCollection.faceRecords.filter(record => record.status === 'ACTIVE').length,
      totalRecognitionEvents: await prisma.faceRecognitionEvent.count({
        where: { childId },
      }),
      recentMatches: await prisma.faceRecognitionEvent.count({
        where: { 
          childId,
          eventType: 'FACE_MATCHED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      averageConfidence: faceCollection.faceRecords.length > 0
        ? faceCollection.faceRecords.reduce((sum, record) => 
            sum + (record.confidence || 0), 0
          ) / faceCollection.faceRecords.length
        : 0,
    };

    return NextResponse.json({
      collection: {
        ...faceCollection,
        awsInfo: awsCollectionInfo,
      },
      recentEvents,
      stats,
    });
  } catch (error) {
    console.error("Error fetching face management data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/faces/manage
 * Delete a specific face record
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const faceRecordId = searchParams.get('faceRecordId');

    if (!faceRecordId) {
      return NextResponse.json({ error: "Face record ID is required" }, { status: 400 });
    }

    // Get face record with ownership verification
    const faceRecord = await prisma.faceRecord.findFirst({
      where: {
        id: faceRecordId,
        collection: {
          child: {
            parentId: session.user.id,
          },
        },
      },
      include: {
        collection: true,
      },
    });

    if (!faceRecord) {
      return NextResponse.json({ error: "Face record not found or access denied" }, { status: 404 });
    }

    // In development mode, skip AWS operations
    if (isAWSAvailable() && !isDevelopmentMode()) {
      try {
        // Import AWS services only when needed
        const { enhancedRekognitionService, s3Service } = await import("@/lib/aws");
        
        // Remove face from AWS Rekognition collection
        const removeResult = await enhancedRekognitionService.deleteFace(
          faceRecord.collection.awsCollectionId,
          faceRecord.awsFaceId
        );

        if (!removeResult) {
          console.warn("Failed to remove face from AWS, continuing with database deletion");
        }

        // Delete image from S3
        await s3Service.deleteImage(faceRecord.imageKey);
      } catch (awsError) {
        console.warn("AWS operation failed, continuing with database deletion:", awsError);
      }
    }

    // Delete face record from database
    await prisma.faceRecord.delete({
      where: { id: faceRecordId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting face record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/faces/manage
 * Update face record or child's face recognition settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { childId, faceRecordId, updates } = body;

    if (faceRecordId) {
      // Update specific face record
      const faceRecord = await prisma.faceRecord.findFirst({
        where: {
          id: faceRecordId,
          collection: {
            child: {
              parentId: session.user.id,
            },
          },
        },
      });

      if (!faceRecord) {
        return NextResponse.json({ error: "Face record not found or access denied" }, { status: 404 });
      }

      const updatedRecord = await prisma.faceRecord.update({
        where: { id: faceRecordId },
        data: {
          status: updates.status,
          registrationNotes: updates.registrationNotes,
        },
      });

      return NextResponse.json({ success: true, faceRecord: updatedRecord });
    } else if (childId) {
      // Update child's face recognition settings
      const child = await prisma.child.findFirst({
        where: {
          id: childId,
          parentId: session.user.id,
        },
      });

      if (!child) {
        return NextResponse.json({ error: "Child not found" }, { status: 404 });
      }

      const updatedChild = await prisma.child.update({
        where: { id: childId },
        data: {
          faceRecognitionEnabled: updates.faceRecognitionEnabled,
          faceRecognitionConsent: updates.faceRecognitionConsent,
          recognitionThreshold: updates.recognitionThreshold,
        },
      });

      return NextResponse.json({ success: true, child: updatedChild });
    } else {
      return NextResponse.json({ 
        error: "Either faceRecordId or childId is required" 
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating face data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
