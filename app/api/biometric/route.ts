
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { IdentityVerificationType } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/biometric - Get biometric verification records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('personId');
    const personType = searchParams.get('personType');
    const result = searchParams.get('result');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (session.user.role === 'PARENT') {
      // Only allow access to their own or their children's biometric records
      const children = await prisma.child.findMany({
        where: { parentId: session.user.id },
        select: { id: true },
      });
      const allowedPersonIds = [session.user.id, ...children.map(child => child.id)];
      where.personId = { in: allowedPersonIds };
    }

    if (personId) where.personId = personId;
    if (personType) where.personType = personType;
    if (result) where.verificationResult = result;

    const biometricVerifications = await prisma.identityVerification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      biometricVerifications,
      pagination: {
        limit,
        offset,
        total: await prisma.identityVerification.count({ where }),
      },
    });
  } catch (error) {
    console.error('Error fetching biometric verifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch biometric verifications' },
      { status: 500 }
    );
  }
}

// POST /api/biometric - Create biometric verification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      checkInEventId,
      pickupEventId,
      personType,
      personId,
      verificationType,
      capturedBiometric, // Base64 image or biometric data
      deviceInfo,
      environmentalFactors,
    } = body;

    // Validate required fields
    if (!personType || !personId || !verificationType || !capturedBiometric) {
      return NextResponse.json(
        { error: 'Missing required fields: personType, personId, verificationType, capturedBiometric' },
        { status: 400 }
      );
    }

    // For demo purposes, simulate biometric verification
    // In production, this would integrate with AWS Rekognition or other biometric services
    const simulateVerification = () => {
      const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
      const qualityScore = Math.random() * 0.2 + 0.8; // 80-100% quality
      const processingTime = Math.floor(Math.random() * 2000) + 500; // 500-2500ms
      
      return {
        matchConfidence: confidence,
        verificationResult: confidence > 0.85 ? 'MATCH' : confidence > 0.6 ? 'PARTIAL_MATCH' : 'NO_MATCH',
        qualityScore,
        processingTime,
        livenessDetected: Math.random() > 0.1, // 90% success rate
        spoofingDetected: Math.random() < 0.05, // 5% false positive rate
        awsRekognitionResponse: {
          FaceMatches: confidence > 0.6 ? [{
            Similarity: confidence * 100,
            Face: {
              BoundingBox: {
                Width: 0.4,
                Height: 0.5,
                Left: 0.3,
                Top: 0.25
              },
              Confidence: qualityScore * 100
            }
          }] : [],
          SearchedFaceId: personId,
          FaceModelVersion: "6.0"
        }
      };
    };

    const verificationResult = simulateVerification();

    const biometricVerification = await prisma.identityVerification.create({
      data: {
        userId: personId,
        verificationType,
        status: verificationResult.verificationResult === 'MATCH' ? 'VERIFIED' : 'FAILED',
        verificationScore: verificationResult.matchConfidence,
        metadata: {
          awsRekognitionResponse: verificationResult.awsRekognitionResponse,
          processingTime: verificationResult.processingTime,
          deviceInfo,
          environmentalFactors,
          qualityScore: verificationResult.qualityScore,
          livenessDetected: verificationResult.livenessDetected,
          spoofingDetected: verificationResult.spoofingDetected,
          auditLog: {
            action: 'biometric_verification_completed',
            timestamp: new Date(),
            initiatedBy: session.user.id,
            result: verificationResult.verificationResult,
            confidence: verificationResult.matchConfidence,
          },
        },
      },
    });

    // Update related check-in event if verification is successful
    if (checkInEventId && verificationResult.verificationResult === 'MATCH') {
      await prisma.checkInOutEvent.update({
        where: { id: checkInEventId },
        data: {
          verifiedBy: session.user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      biometricVerification: {
        id: biometricVerification.id,
        verificationScore: biometricVerification.verificationScore,
        status: biometricVerification.status,
        
      },
      message: 'Biometric verification completed',
    });
  } catch (error) {
    console.error('Error creating biometric verification:', error);
    return NextResponse.json(
      { error: 'Failed to create biometric verification' },
      { status: 500 }
    );
  }
}
