
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/biometric/enroll - Enroll biometric data for a person
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      personId,
      personType,
      biometricImages, // Array of images for enrollment
      verificationType = 'FACE_RECOGNITION',
    } = body;

    // Validate required fields
    if (!personId || !personType || !biometricImages || !Array.isArray(biometricImages)) {
      return NextResponse.json(
        { error: 'Missing required fields: personId, personType, biometricImages' },
        { status: 400 }
      );
    }

    // Verify permissions
    if (session.user.role === 'PARENT') {
      if (personType === 'CHILD') {
        const child = await prisma.child.findFirst({
          where: { id: personId, parentId: session.user.id },
        });
        if (!child) {
          return NextResponse.json(
            { error: 'Child not found or access denied' },
            { status: 403 }
          );
        }
      } else if (personId !== session.user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // For demo purposes, simulate biometric enrollment
    // In production, this would integrate with AWS Rekognition for face enrollment
    const simulateEnrollment = () => {
      const enrollmentResults = biometricImages.map((image: string, index: number) => ({
        imageIndex: index,
        quality: Math.random() * 0.3 + 0.7, // 70-100% quality
        success: Math.random() > 0.1, // 90% success rate
        faceId: `face_${crypto.randomUUID()}`,
        boundingBox: {
          Width: 0.4 + Math.random() * 0.2,
          Height: 0.5 + Math.random() * 0.2,
          Left: 0.2 + Math.random() * 0.2,
          Top: 0.15 + Math.random() * 0.2,
        },
      }));

      const successfulEnrollments = enrollmentResults.filter(result => result.success);
      const avgQuality = successfulEnrollments.reduce((sum, result) => sum + result.quality, 0) / successfulEnrollments.length;

      return {
        enrollmentResults,
        successCount: successfulEnrollments.length,
        totalAttempts: biometricImages.length,
        averageQuality: avgQuality,
        overallSuccess: successfulEnrollments.length >= 2, // Need at least 2 successful enrollments
      };
    };

    const enrollmentResult = simulateEnrollment();

    // Store enrollment results
    const enrollmentRecords = await Promise.all(
      enrollmentResult.enrollmentResults.map(async (result, index) => {
        if (result.success) {
          return await prisma.biometricVerification.create({
            data: {
              personType,
              personId,
              verificationType,
              capturedBiometric: biometricImages[index],
              storedBiometric: `stored_${result.faceId}`,
              verificationResult: 'MATCH', // Enrollment is successful
              matchConfidence: result.quality,
              qualityScore: result.quality,
              processingTime: 1000 + Math.floor(Math.random() * 1000),
              awsRekognitionResponse: {
                Face: {
                  FaceId: result.faceId,
                  BoundingBox: result.boundingBox,
                  ImageId: `image_${index}`,
                  Confidence: result.quality * 100,
                },
                FaceModelVersion: "6.0",
                UnindexedFaces: [],
              },
              auditLog: {
                action: 'biometric_enrollment',
                timestamp: new Date(),
                initiatedBy: session.user.id,
                imageIndex: index,
                success: result.success,
              },
            },
          });
        }
        return null;
      })
    );

    const successfulRecords = enrollmentRecords.filter(record => record !== null);

    // Update person's biometric status if enrollment was successful
    if (enrollmentResult.overallSuccess) {
      if (personType === 'CHILD') {
        await prisma.child.update({
          where: { id: personId },
          data: {
            biometricId: successfulRecords[0]?.id,
            faceRecognitionEnabled: true,
          },
        });
      }
    }

    return NextResponse.json({
      success: enrollmentResult.overallSuccess,
      enrollment: {
        totalAttempts: enrollmentResult.totalAttempts,
        successfulEnrollments: enrollmentResult.successCount,
        averageQuality: enrollmentResult.averageQuality,
        enrollmentIds: successfulRecords.map(record => record?.id).filter(Boolean),
      },
      message: enrollmentResult.overallSuccess
        ? 'Biometric enrollment completed successfully'
        : 'Biometric enrollment failed - insufficient quality images',
    });
  } catch (error) {
    console.error('Error enrolling biometric data:', error);
    return NextResponse.json(
      { error: 'Failed to enroll biometric data' },
      { status: 500 }
    );
  }
}
