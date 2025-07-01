
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rekognitionService, s3Service, validateAWSConfig } from "@/lib/aws";

export const dynamic = "force-dynamic";

/**
 * POST /api/faces/recognize
 * Recognize faces in an image against all children's collections
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
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
    const venueId = formData.get('venueId') as string;
    const childId = formData.get('childId') as string; // Optional - search specific child only

    if (!file) {
      return NextResponse.json({ 
        error: "Image file is required" 
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

    // Upload source image for reference
    const uploadResult = await s3Service.uploadImage(file, 'recognition-source', file.name);
    if (!uploadResult.success) {
      return NextResponse.json({ 
        error: uploadResult.error || "Failed to upload source image" 
      }, { status: 500 });
    }

    // Get face collections to search against
    let collections: any[];
    if (childId) {
      // Search specific child only
      if (session.user.role === "PARENT") {
        collections = await prisma.faceCollection.findMany({
          where: {
            childId,
            child: { parentId: session.user.id },
            status: 'ACTIVE',
          },
          include: {
            child: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                recognitionThreshold: true,
              },
            },
          },
        });
      } else {
        collections = await prisma.faceCollection.findMany({
          where: {
            childId,
            status: 'ACTIVE',
          },
          include: {
            child: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                recognitionThreshold: true,
              },
            },
          },
        });
      }
    } else {
      // Search all available collections
      if (session.user.role === "PARENT") {
        collections = await prisma.faceCollection.findMany({
          where: {
            child: { parentId: session.user.id },
            status: 'ACTIVE',
          },
          include: {
            child: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                recognitionThreshold: true,
              },
            },
          },
        });
      } else {
        collections = await prisma.faceCollection.findMany({
          where: { status: 'ACTIVE' },
          include: {
            child: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                recognitionThreshold: true,
              },
            },
          },
        });
      }
    }

    if (collections.length === 0) {
      return NextResponse.json({ 
        success: true,
        matches: [],
        unmatched: [],
        message: "No active face collections found for recognition" 
      });
    }

    // Search each collection for matches
    const allMatches: any[] = [];
    const recognitionEvents: any[] = [];

    for (const collection of collections) {
      try {
        const searchResult = await rekognitionService.searchFaces(
          collection.awsCollectionId,
          imageBuffer,
          5 // Max 5 matches per collection
        );

        if (searchResult.success && searchResult.matches.length > 0) {
          // Filter matches by child's recognition threshold
          const validMatches = searchResult.matches.filter(
            match => match.Similarity >= (collection.child.recognitionThreshold * 100)
          );

          for (const match of validMatches) {
            // Get face record details
            const faceRecord = await prisma.faceRecord.findUnique({
              where: { awsFaceId: match.Face.FaceId },
              include: {
                collection: {
                  include: {
                    child: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            });

            if (faceRecord) {
              allMatches.push({
                childId: collection.child.id,
                childName: `${collection.child.firstName} ${collection.child.lastName}`,
                faceId: match.Face.FaceId,
                similarity: match.Similarity,
                confidence: match.Face.Confidence,
                boundingBox: match.Face.BoundingBox,
                registeredImage: faceRecord.imageUrl,
                registeredAt: faceRecord.createdAt,
              });

              // Create recognition event
              recognitionEvents.push({
                eventType: 'FACE_MATCHED',
                confidence: match.Similarity,
                matchedFaceId: match.Face.FaceId,
                sourceImageUrl: uploadResult.imageUrl!,
                sourceImageKey: uploadResult.imageKey!,
                boundingBox: JSON.parse(JSON.stringify(match.Face.BoundingBox)),
                recognitionData: JSON.parse(JSON.stringify({ 
                  awsResponse: match,
                  threshold: collection.child.recognitionThreshold 
                })),
                childId: collection.child.id,
                venueId: venueId || null,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error searching collection ${collection.awsCollectionId}:`, error);
        // Continue with other collections
      }
    }

    // Detect all faces for unmatched faces
    const detectionResult = await rekognitionService.detectFaces(imageBuffer);
    
    // Save recognition events to database
    if (recognitionEvents.length > 0) {
      await prisma.faceRecognitionEvent.createMany({
        data: recognitionEvents,
      });
    }

    // Create event for unmatched faces if no matches found
    if (allMatches.length === 0 && detectionResult.success && detectionResult.faces.length > 0) {
      const unmatchedEvents = detectionResult.faces.map(face => ({
        eventType: 'FACE_UNMATCHED' as const,
        confidence: face.Confidence,
        sourceImageUrl: uploadResult.imageUrl!,
        sourceImageKey: uploadResult.imageKey!,
        boundingBox: JSON.parse(JSON.stringify(face.BoundingBox)),
        recognitionData: JSON.parse(JSON.stringify({ detectedFace: face })),
        childId: childId || collections[0]?.child.id, // Use first collection's child or specified child
        venueId: venueId || null,
      }));

      await prisma.faceRecognitionEvent.createMany({
        data: unmatchedEvents,
      });
    }

    // Sort matches by similarity (highest first)
    allMatches.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      success: true,
      matches: allMatches,
      unmatched: detectionResult.faces || [],
      summary: {
        totalMatches: allMatches.length,
        bestMatch: allMatches[0] || null,
        collectionsSearched: collections.length,
        facesDetected: detectionResult.faceCount || 0,
      },
      sourceImage: {
        url: uploadResult.imageUrl,
        key: uploadResult.imageKey,
      },
    });
  } catch (error) {
    console.error("Error recognizing faces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/faces/recognize
 * Get recent face recognition events
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const venueId = searchParams.get('venueId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const eventType = searchParams.get('eventType');

    // Build where clause based on user role and filters
    let whereClause: any = {};

    if (session.user.role === "PARENT") {
      whereClause.child = { parentId: session.user.id };
    }

    if (childId) {
      whereClause.childId = childId;
    }

    if (venueId) {
      whereClause.venueId = venueId;
    }

    if (eventType) {
      whereClause.eventType = eventType;
    }

    const recognitionEvents = await prisma.faceRecognitionEvent.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      events: recognitionEvents,
      count: recognitionEvents.length,
    });
  } catch (error) {
    console.error("Error fetching recognition events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
