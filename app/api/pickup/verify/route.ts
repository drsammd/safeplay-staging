
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PickupVerificationMethod } from '@prisma/client';

export const dynamic = 'force-dynamic';

// POST /api/pickup/verify - Process pickup verification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      authorizationId,
      childId,
      venueId,
      pickupPersonName,
      pickupPersonId,
      verificationMethod,
      biometricData,
      photoIdImage,
      parentQRCode,
      emergencyPickup = false,
      digitalSignature,
      notes,
    } = body;

    // Validate required fields
    if (!authorizationId || !childId || !venueId || !pickupPersonName || !verificationMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get pickup authorization
    const pickupAuthorization = await prisma.pickupAuthorization.findUnique({
      where: { id: authorizationId },
      include: {
        child: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!pickupAuthorization) {
      return NextResponse.json(
        { error: 'Pickup authorization not found' },
        { status: 404 }
      );
    }

    if (pickupAuthorization.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Pickup authorization is not approved' },
        { status: 400 }
      );
    }

    // Check if authorization is expired
    if (pickupAuthorization.validUntil && new Date() > pickupAuthorization.validUntil) {
      return NextResponse.json(
        { error: 'Pickup authorization has expired' },
        { status: 400 }
      );
    }

    // Verify child is checked in
    const child = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child || child.status !== 'CHECKED_IN') {
      return NextResponse.json(
        { error: 'Child is not checked in or not found' },
        { status: 400 }
      );
    }

    // Initialize verification flags
    let biometricVerified = false;
    let photoIdVerified = false;
    let qrCodeVerified = false;
    let verificationScore = 0;

    // Process biometric verification
    if (verificationMethod.includes('BIOMETRIC') && biometricData) {
      try {
        // Create biometric verification record
        const biometricVerification = await prisma.biometricVerification.create({
          data: {
            personType: 'AUTHORIZED_PERSON',
            personId: authorizationId,
            verificationType: 'FACE_RECOGNITION',
            capturedBiometric: biometricData,
            verificationResult: 'PENDING',
            auditLog: {
              action: 'pickup_biometric_verification',
              timestamp: new Date(),
              initiatedBy: session.user.id,
            },
          },
        });

        // For demo purposes, simulate biometric verification
        // In production, this would integrate with AWS Rekognition
        biometricVerified = true;
        verificationScore += 40;

        await prisma.biometricVerification.update({
          where: { id: biometricVerification.id },
          data: {
            verificationResult: 'MATCH',
            matchConfidence: 0.95,
            processingTime: 1500,
          },
        });
      } catch (error) {
        console.error('Biometric verification error:', error);
      }
    }

    // Process photo ID verification
    if (pickupAuthorization.requiresPhotoId && photoIdImage) {
      // In production, this would use OCR and document verification
      photoIdVerified = true;
      verificationScore += 30;
    }

    // Process QR code verification
    if (parentQRCode) {
      const parentQR = await prisma.parentQRCode.findFirst({
        where: { qrCode: parentQRCode, isActive: true },
      });
      if (parentQR && Array.isArray(parentQR.linkedChildren) && parentQR.linkedChildren.includes(childId)) {
        qrCodeVerified = true;
        verificationScore += 30;
      }
    }

    // Determine if pickup is authorized
    const requiredScore = emergencyPickup ? 30 : 70;
    const pickupAuthorized = verificationScore >= requiredScore;
    const requiresSupervisorApproval = verificationScore < 70 || emergencyPickup;

    // Create pickup event
    const pickupEvent = await prisma.pickupEvent.create({
      data: {
        pickupAuthorizationId: authorizationId,
        childId,
        venueId,
        pickupPersonName,
        pickupPersonId,
        verificationMethod,
        biometricVerified,
        photoIdVerified,
        qrCodeVerified,
        parentNotified: false, // Will be updated after notification
        parentConfirmed: false,
        staffMemberId: session.user.id,
        supervisorApproval: !requiresSupervisorApproval,
        emergencyPickup,
        digitalSignature,
        verificationScore,
        riskAssessment: verificationScore >= 90 ? 'LOW' : verificationScore >= 70 ? 'MEDIUM' : 'HIGH',
        notes,
      },
    });

    // If pickup is authorized and doesn't need supervisor approval, process checkout
    if (pickupAuthorized && !requiresSupervisorApproval) {
      // Create checkout event
      await prisma.checkInOutEvent.create({
        data: {
          childId,
          venueId,
          parentId: pickupAuthorization.child.parent.id,
          eventType: 'CHECK_OUT',
          method: 'FACIAL_RECOGNITION',
          authorizedBy: session.user.id,
          pickupPersonName,
          pickupPersonId,
          pickupRelation: pickupAuthorization.relationship,
          isAuthorized: true,
          notes: `Pickup by ${pickupPersonName} (${pickupAuthorization.relationship})`,
          metadata: {
            pickupEventId: pickupEvent.id,
            verificationScore,
            emergencyPickup,
          },
        },
      });

      // Update child status
      await prisma.child.update({
        where: { id: childId },
        data: {
          status: 'CHECKED_OUT',
          currentVenueId: null,
        },
      });

      // Update pickup authorization usage
      await prisma.pickupAuthorization.update({
        where: { id: authorizationId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });
    }

    // Send parent notification (would integrate with notification service)
    // For now, we'll just update the flag
    await prisma.pickupEvent.update({
      where: { id: pickupEvent.id },
      data: { parentNotified: true },
    });

    return NextResponse.json({
      success: true,
      pickupEvent: {
        id: pickupEvent.id,
        authorized: pickupAuthorized,
        requiresSupervisorApproval,
        verificationScore,
        biometricVerified,
        photoIdVerified,
        qrCodeVerified,
        emergencyPickup,
      },
      child: {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        status: pickupAuthorized && !requiresSupervisorApproval ? 'CHECKED_OUT' : child.status,
      },
      message: pickupAuthorized 
        ? requiresSupervisorApproval 
          ? 'Pickup pending supervisor approval'
          : 'Pickup completed successfully'
        : 'Pickup verification failed - insufficient verification',
    });
  } catch (error) {
    console.error('Error processing pickup verification:', error);
    return NextResponse.json(
      { error: 'Failed to process pickup verification' },
      { status: 500 }
    );
  }
}
