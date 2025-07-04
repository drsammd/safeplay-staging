// @ts-nocheck

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enhancedRekognitionService, s3Service, validateAWSConfig } from "@/lib/aws";

export const dynamic = "force-dynamic";

/**
 * POST /api/faces/register
 * Register a face for a child
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

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const childId = formData.get('childId') as string;
    const notes = formData.get('notes') as string || '';

    if (!file || !childId) {
      return NextResponse.json({ 
        error: "Image file and child ID are required" 
      }, { status: 400 });
    }

    // Verify child ownership
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: session.user.id,
      },
      include: {
        faceCollection: true,
      },
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    if (!child.faceCollection) {
      return NextResponse.json({ 
        error: "No face collection found. Please create one first." 
      }, { status: 400 });
    }

    if (!child.faceRecognitionEnabled || !child.faceRecognitionConsent) {
      return NextResponse.json({ 
        error: "Face recognition not enabled for this child" 
      }, { status: 400 });
    }

    // Validate image
    const imageValidation = s3Service.validateImage(file);
    if (!imageValidation.valid) {
      return NextResponse.json({ 
        error: "Invalid image file",
        details: imageValidation.errors 
      }, { status: 400 });
    }

    // Convert file to buffer for processing
    const imageBuffer = Buffer.from(await file.arrayBuffer());

    // Validate face in image
    const faceValidation = await enhancedRekognitionService.detectFaces(imageBuffer);
    if (!faceValidation.success) {
      return NextResponse.json({ 
        error: "Face validation failed",
        details: faceValidation.error
      }, { status: 400 });
    }

    // Upload image to S3
    const uploadResult = await s3Service.uploadImage(file, childId, file.name);
    if (!uploadResult.success) {
      return NextResponse.json({ 
        error: uploadResult.error || "Failed to upload image" 
      }, { status: 500 });
    }

    // Register face with AWS Rekognition
    const registrationResult = await enhancedRekognitionService.indexFace(
      uploadResult.imageUrl!,
      child.faceCollection.awsCollectionId,
      `child-${childId}-${Date.now()}`
    );

    if (!registrationResult.success) {
      // Clean up uploaded image if face registration failed
      await s3Service.deleteImage(uploadResult.imageKey!);
      
      return NextResponse.json({ 
        error: registrationResult.error || "Face registration failed" 
      }, { status: 500 });
    }

    // Save face record to database
    const faceRecord = await prisma.faceRecord.create({
      data: {
        awsFaceId: registrationResult.faceId!,
        imageUrl: uploadResult.imageUrl!,
        imageKey: uploadResult.imageKey!,
        boundingBox: faceValidation.faces?.[0]?.BoundingBox ? JSON.parse(JSON.stringify(faceValidation.faces[0].BoundingBox)) : {},
        confidence: registrationResult.confidence || 0,
        landmarks: faceValidation.faces?.[0]?.Landmarks ? JSON.parse(JSON.stringify(faceValidation.faces[0].Landmarks)) : [],
        emotions: faceValidation.faces?.[0]?.Emotions ? JSON.parse(JSON.stringify(faceValidation.faces[0].Emotions)) : [],
        ageRange: faceValidation.faces?.[0]?.AgeRange ? JSON.parse(JSON.stringify(faceValidation.faces[0].AgeRange)) : {},
        quality: faceValidation.faces?.[0]?.Quality ? JSON.parse(JSON.stringify(faceValidation.faces[0].Quality)) : {},
        status: 'ACTIVE',
        registrationNotes: notes,
        collectionId: child.faceCollection.id,
      },
    });

    return NextResponse.json({
      success: true,
      faceRecord: {
        id: faceRecord.id,
        awsFaceId: faceRecord.awsFaceId,
        imageUrl: faceRecord.imageUrl,
        confidence: faceRecord.confidence,
        status: faceRecord.status,
        createdAt: faceRecord.createdAt,
      },
      validation: {
        warnings: faceValidation.warnings || [],
      },
    });
  } catch (error) {
    console.error("Error registering face:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/faces/register
 * Get registered faces for a child
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

    // Get face records
    const faceCollection = await prisma.faceCollection.findUnique({
      where: { childId },
      include: {
        faceRecords: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            awsFaceId: true,
            imageUrl: true,
            confidence: true,
            status: true,
            registrationNotes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!faceCollection) {
      return NextResponse.json({ 
        faceRecords: [],
        message: "No face collection found" 
      });
    }

    return NextResponse.json({
      faceRecords: faceCollection.faceRecords,
      collectionStatus: faceCollection.status,
    });
  } catch (error) {
    console.error("Error fetching face records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
