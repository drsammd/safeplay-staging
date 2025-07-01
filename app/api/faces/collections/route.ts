
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rekognitionService, validateAWSConfig } from "@/lib/aws";

export const dynamic = "force-dynamic";

/**
 * GET /api/faces/collections
 * Get face collection for a child
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

    // Get face collection from database
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
          },
        },
      },
    });

    if (!faceCollection) {
      return NextResponse.json({ 
        exists: false,
        message: "No face collection found for this child" 
      });
    }

    // Get AWS collection info
    const awsCollectionInfo = await rekognitionService.getCollectionInfo(
      faceCollection.awsCollectionId
    );

    return NextResponse.json({
      exists: true,
      collection: {
        ...faceCollection,
        awsInfo: awsCollectionInfo,
      },
    });
  } catch (error) {
    console.error("Error fetching face collection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/faces/collections
 * Create a new face collection for a child
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate AWS configuration
    const awsValidation = validateAWSConfig();
    if (!awsValidation.valid) {
      return NextResponse.json({ 
        error: "AWS configuration incomplete",
        details: awsValidation.errors 
      }, { status: 500 });
    }

    const body = await request.json();
    const { childId, consent } = body;

    if (!childId || !consent) {
      return NextResponse.json({ 
        error: "Child ID and parental consent are required" 
      }, { status: 400 });
    }

    // Verify child ownership
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: session.user.id,
      },
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Check if collection already exists
    const existingCollection = await prisma.faceCollection.findUnique({
      where: { childId },
    });

    if (existingCollection) {
      return NextResponse.json({ 
        error: "Face collection already exists for this child" 
      }, { status: 409 });
    }

    // Create AWS Rekognition collection
    const collectionResult = await rekognitionService.createCollection(childId);
    
    if (!collectionResult.success) {
      return NextResponse.json({ 
        error: collectionResult.error || "Failed to create face collection" 
      }, { status: 500 });
    }

    // Create database record
    const faceCollection = await prisma.faceCollection.create({
      data: {
        awsCollectionId: collectionResult.collectionId!,
        collectionName: `${child.firstName} ${child.lastName} - Face Collection`,
        status: 'ACTIVE',
        childId,
      },
      include: {
        child: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update child's face recognition settings
    await prisma.child.update({
      where: { id: childId },
      data: {
        faceRecognitionEnabled: true,
        faceRecognitionConsent: consent,
      },
    });

    return NextResponse.json({
      success: true,
      collection: faceCollection,
    });
  } catch (error) {
    console.error("Error creating face collection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/faces/collections
 * Delete face collection for a child
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 });
    }

    // Verify child ownership
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: session.user.id,
      },
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Get face collection
    const faceCollection = await prisma.faceCollection.findUnique({
      where: { childId },
    });

    if (!faceCollection) {
      return NextResponse.json({ error: "Face collection not found" }, { status: 404 });
    }

    // Delete AWS collection
    await rekognitionService.deleteCollection(faceCollection.awsCollectionId);

    // Delete database records (cascade will handle face records)
    await prisma.faceCollection.delete({
      where: { childId },
    });

    // Update child settings
    await prisma.child.update({
      where: { id: childId },
      data: {
        faceRecognitionEnabled: false,
        faceRecognitionConsent: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting face collection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
