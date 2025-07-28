
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { enhancedRekognitionService } from '@/lib/aws/rekognition-service';

export const dynamic = 'force-dynamic';

// POST /api/faces/test-recognition - Test face recognition for a child
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const venueId = formData.get('venueId') as string;
    const imageFile = formData.get('image') as File;

    if (!venueId || !imageFile) {
      return NextResponse.json({ 
        error: 'Venue ID and image file are required' 
      }, { status: 400 });
    }

    // Verify user has access to venue
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        managedVenues: true
      }
    });

    const hasAccess = user?.managedVenues?.some(venue => venue.id === venueId) ||
                     user?.role === 'SUPER_ADMIN';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Venue access required' }, { status: 403 });
    }

    // Get venue and check face collection
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        name: true,
        faceCollectionId: true,
        faceRecognitionEnabled: true
      }
    });

    if (!venue?.faceCollectionId) {
      return NextResponse.json({
        success: false,
        error: 'Face collection not configured for this venue'
      }, { status: 400 });
    }

    try {
      // Convert image to buffer and base64
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

      // First detect faces in the image
      const faceDetectionResult = await enhancedRekognitionService.detectFaces(imageBase64);
      
      if (!faceDetectionResult.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to detect faces in image',
          details: faceDetectionResult.error
        }, { status: 400 });
      }

      if (!faceDetectionResult.faces || faceDetectionResult.faces.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No faces detected in the image',
          detected: {
            faceCount: 0,
            faces: []
          }
        });
      }

      // Search for faces in the venue's collection
      const searchResult = await enhancedRekognitionService.searchFacesByImage(
        imageBase64,
        venue.faceCollectionId,
        70 // Lower threshold for testing
      );

      if (!searchResult.success) {
        return NextResponse.json({
          success: false,
          error: searchResult.error || 'Face recognition search failed',
          detected: {
            faceCount: faceDetectionResult.faces.length,
            faces: faceDetectionResult.faces.map(face => ({
              confidence: face.Confidence,
              boundingBox: face.BoundingBox,
              quality: face.Quality
            }))
          }
        }, { status: 500 });
      }

      // Get child information for matches
      const recognizedChildren = [];
      if (searchResult.detections && searchResult.detections.length > 0) {
        for (const detection of searchResult.detections) {
          if (detection.childId) {
            const child = await prisma.child.findUnique({
              where: { id: detection.childId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                biometricData: true
              }
            });

            if (child) {
              recognizedChildren.push({
                childId: child.id,
                childName: `${child.firstName} ${child.lastName}`,
                confidence: detection.confidence,
                boundingBox: detection.boundingBox
              });
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        detected: {
          faceCount: faceDetectionResult.faces.length,
          faces: faceDetectionResult.faces.map(face => ({
            confidence: face.Confidence || 0,
            boundingBox: face.BoundingBox || {},
            quality: {
              brightness: face.Quality?.Brightness || 0,
              sharpness: face.Quality?.Sharpness || 0
            },
            emotions: face.Emotions || [],
            ageRange: face.AgeRange || {}
          }))
        },
        recognized: {
          matchCount: recognizedChildren.length,
          matches: recognizedChildren
        },
        venue: {
          id: venue.id,
          name: venue.name,
          collectionId: venue.faceCollectionId
        },
        testResults: {
          imageQuality: faceDetectionResult.faces.length > 0 ? 
            (faceDetectionResult.faces[0].Quality?.Brightness || 0 + faceDetectionResult.faces[0].Quality?.Sharpness || 0) / 2 : 0,
          recognitionReady: recognizedChildren.length > 0
        }
      });

    } catch (error) {
      console.error('Face recognition test error:', error);
      
      if (error.name === 'AccessDeniedException') {
        return NextResponse.json({
          success: false,
          error: 'AWS permissions not configured. Please check setup guide.',
          awsPermissionsNeeded: true
        }, { status: 503 });
      }

      return NextResponse.json({
        success: false,
        error: 'Face recognition test failed',
        details: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in faces/test-recognition POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test face recognition'
    }, { status: 500 });
  }
}
