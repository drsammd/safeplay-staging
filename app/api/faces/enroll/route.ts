
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { enhancedRekognitionService } from '@/lib/aws/rekognition-service';

export const dynamic = 'force-dynamic';

// POST /api/faces/enroll - Enroll child's face for recognition
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const childId = formData.get('childId') as string;
    const imageFile = formData.get('image') as File;

    if (!childId || !imageFile) {
      return NextResponse.json({ 
        error: 'Child ID and image file are required' 
      }, { status: 400 });
    }

    // Get child and verify access
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        parent: true,
        venue: true
      }
    });

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Verify user has access to this child
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        managedVenues: true
      }
    });

    const hasAccess = child.parentId === session.user.id || 
                     user?.managedVenues?.some(venue => venue.id === child.currentVenueId) ||
                     user?.role === 'SUPER_ADMIN';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if venue has face collection
    const venue = child.venue;
    if (!venue?.faceCollectionId) {
      return NextResponse.json({
        success: false,
        error: 'Face collection not configured for this venue',
        needsCollection: true
      }, { status: 400 });
    }

    try {
      // Convert image to buffer
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

      // Validate image quality first
      const faceDetectionResult = await enhancedRekognitionService.detectFaces(`data:image/jpeg;base64,${imageBuffer.toString('base64')}`);
      
      if (!faceDetectionResult.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to detect face in image',
          details: faceDetectionResult.error
        }, { status: 400 });
      }

      if (!faceDetectionResult.faces || faceDetectionResult.faces.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No face detected in the image. Please provide a clear photo showing the child\'s face.'
        }, { status: 400 });
      }

      if (faceDetectionResult.faces.length > 1) {
        return NextResponse.json({
          success: false,
          error: 'Multiple faces detected. Please provide a photo with only the child\'s face.'
        }, { status: 400 });
      }

      // Check face quality
      const face = faceDetectionResult.faces[0];
      const confidence = face.Confidence || 0;
      const quality = face.Quality || {};
      
      if (confidence < 90) {
        return NextResponse.json({
          success: false,
          error: 'Face detection confidence too low. Please provide a clearer photo.',
          quality: { confidence, brightness: quality.Brightness, sharpness: quality.Sharpness }
        }, { status: 400 });
      }

      // Create external image ID
      const timestamp = Date.now();
      const externalImageId = `child-${childId}-${timestamp}`;

      // Index face in AWS Rekognition collection
      const indexResult = await enhancedRekognitionService.indexFace(
        `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
        venue.faceCollectionId,
        externalImageId
      );

      if (!indexResult.success) {
        return NextResponse.json({
          success: false,
          error: indexResult.error || 'Failed to register face',
          awsError: true
        }, { status: 500 });
      }

      // Update child with biometric data
      await prisma.child.update({
        where: { id: childId },
        data: {
          biometricId: indexResult.faceId,
          faceRecognitionEnabled: true,
          biometricData: {
            externalImageId,
            faceId: indexResult.faceId,
            confidence: indexResult.confidence,
            collectionId: venue.faceCollectionId,
            enrolledAt: new Date().toISOString(),
            quality: {
              confidence: face.Confidence,
              brightness: quality.Brightness,
              sharpness: quality.Sharpness
            }
          }
        }
      });

      // Create face recognition event
      await prisma.faceRecognitionEvent.create({
        data: {
          childId,
          venueId: venue.id,
          sourceImageUrl: `enrollment://${externalImageId}`,
          sourceImageKey: externalImageId,
          confidence: indexResult.confidence || 0,
          eventType: 'FACE_ENROLLED',
          recognitionData: {
            faceId: indexResult.faceId,
            externalImageId,
            enrollmentQuality: quality
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Face enrolled successfully',
        faceId: indexResult.faceId,
        confidence: indexResult.confidence,
        quality: {
          confidence: face.Confidence,
          brightness: quality.Brightness,
          sharpness: quality.Sharpness
        }
      });

    } catch (error) {
      console.error('Face enrollment error:', error);
      
      if (error.name === 'AccessDeniedException') {
        return NextResponse.json({
          success: false,
          error: 'AWS permissions not configured. Please check setup guide.',
          awsPermissionsNeeded: true
        }, { status: 503 });
      }

      return NextResponse.json({
        success: false,
        error: 'Face enrollment failed',
        details: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in faces/enroll POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to enroll face'
    }, { status: 500 });
  }
}

// DELETE /api/faces/enroll - Remove child's face registration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: 'Child ID required' }, { status: 400 });
    }

    // Get child and verify access
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        parent: true,
        venue: true
      }
    });

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Verify access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        managedVenues: true
      }
    });

    const hasAccess = child.parentId === session.user.id || 
                     user?.managedVenues?.some(venue => venue.id === child.currentVenueId) ||
                     user?.role === 'SUPER_ADMIN';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!child.biometricId || !child.venue?.faceCollectionId) {
      return NextResponse.json({
        success: false,
        error: 'No face registration found for this child'
      }, { status: 404 });
    }

    try {
      // Delete face from AWS Rekognition
      const deleteResult = await enhancedRekognitionService.deleteFace(
        child.venue.faceCollectionId,
        child.biometricId
      );

      if (!deleteResult.success) {
        console.warn('AWS face deletion failed:', deleteResult.error);
      }

      // Update child (remove biometric data)
      await prisma.child.update({
        where: { id: childId },
        data: {
          biometricId: null,
          faceRecognitionEnabled: false,
          biometricData: null
        }
      });

      // Create face recognition event
      await prisma.faceRecognitionEvent.create({
        data: {
          childId,
          venueId: child.venue.id,
          sourceImageUrl: `unenrollment://${child.biometricId}`,
          sourceImageKey: child.biometricId,
          confidence: 100,
          eventType: 'FACE_UNENROLLED',
          recognitionData: {
            faceId: child.biometricId,
            unenrolledAt: new Date().toISOString()
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Face registration removed successfully'
      });

    } catch (error) {
      console.error('Face unenrollment error:', error);
      
      // Still update database even if AWS deletion fails
      await prisma.child.update({
        where: { id: childId },
        data: {
          biometricId: null,
          faceRecognitionEnabled: false,
          biometricData: null
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Face registration removed (AWS cleanup may have failed)',
        warning: 'Manual AWS cleanup may be required'
      });
    }

  } catch (error) {
    console.error('Error in faces/enroll DELETE:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove face registration'
    }, { status: 500 });
  }
}
