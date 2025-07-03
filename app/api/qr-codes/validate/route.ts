
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Validate QR code data
function validateQRData(qrData: string): any {
  try {
    const decoded = Buffer.from(qrData, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    
    // Check timestamp for expiration (if security level requires it)
    if (data.timestamp && data.security === 'HIGH') {
      const age = Date.now() - data.timestamp;
      const maxAge = 30 * 60 * 1000; // 30 minutes for high security
      if (age > maxAge) {
        return { valid: false, reason: 'QR code expired' };
      }
    }

    return { valid: true, data };
  } catch (error) {
    return { valid: false, reason: 'Invalid QR code format' };
  }
}

// POST /api/qr-codes/validate - Validate and process QR code scan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { qrCode, venueId, operation = 'CHECK_IN', kioskId } = body;

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      );
    }

    // Check if it's a child QR code
    const childQRCode = await prisma.childQRCode.findFirst({
      where: { qrCode, isActive: true },
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

    if (childQRCode) {
      // Validate QR code expiration and usage limits
      if (childQRCode.expiresAt && new Date() > childQRCode.expiresAt) {
        return NextResponse.json(
          { error: 'QR code has expired' },
          { status: 400 }
        );
      }

      if (childQRCode.maxUsage && childQRCode.usageCount >= childQRCode.maxUsage) {
        return NextResponse.json(
          { error: 'QR code usage limit exceeded' },
          { status: 400 }
        );
      }

      // Validate QR data
      const validation = validateQRData(childQRCode.qrData as any);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.reason },
          { status: 400 }
        );
      }

      // Update usage count
      await prisma.childQRCode.update({
        where: { id: childQRCode.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
          lastUsedBy: session.user.id,
        },
      });

      return NextResponse.json({
        valid: true,
        type: 'child',
        qrCodeType: childQRCode.purpose,
        child: {
          id: childQRCode.child.id,
          firstName: childQRCode.child.firstName,
          lastName: childQRCode.child.lastName,
          status: childQRCode.child.status,
          profilePhoto: childQRCode.child.profilePhoto,
          parent: childQRCode.child.parent,
        },
        securityLevel: childQRCode.securityLevel,
        biometricRequired: childQRCode.securityLevel === 'HIGH' || childQRCode.securityLevel === 'MAXIMUM',
        nextSteps: {
          allowCheckIn: operation === 'CHECK_IN' && childQRCode.child.status !== 'CHECKED_IN',
          allowCheckOut: operation === 'CHECK_OUT' && childQRCode.child.status === 'CHECKED_IN',
          requiresBiometric: childQRCode.securityLevel === 'HIGH' || childQRCode.securityLevel === 'MAXIMUM',
          requiresStaffApproval: childQRCode.securityLevel === 'MAXIMUM',
        },
      });
    }

    // Check if it's a parent QR code
    const parentQRCode = await prisma.parentQRCode.findFirst({
      where: { qrCode, isActive: true },
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
    });

    if (parentQRCode) {
      // Validate QR code expiration and usage limits
      if (parentQRCode.expiresAt && new Date() > parentQRCode.expiresAt) {
        return NextResponse.json(
          { error: 'QR code has expired' },
          { status: 400 }
        );
      }

      if (parentQRCode.maxUsage && parentQRCode.usageCount >= parentQRCode.maxUsage) {
        return NextResponse.json(
          { error: 'QR code usage limit exceeded' },
          { status: 400 }
        );
      }

      // Validate QR data
      const validation = validateQRData(parentQRCode.qrData as any);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.reason },
          { status: 400 }
        );
      }

      // Get linked children information
      const linkedChildren = await prisma.child.findMany({
        where: { id: { in: Array.isArray(parentQRCode.linkedChildren) ? parentQRCode.linkedChildren as string[] : [] } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          profilePhoto: true,
          currentVenueId: true,
        },
      });

      // Update usage count
      await prisma.parentQRCode.update({
        where: { id: parentQRCode.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
          lastUsedBy: session.user.id,
        },
      });

      return NextResponse.json({
        valid: true,
        type: 'parent',
        qrCodeType: parentQRCode.purpose,
        parent: parentQRCode.parent,
        linkedChildren,
        securityLevel: parentQRCode.securityLevel,
        biometricRequired: parentQRCode.biometricRequired,
        emergencyOverride: parentQRCode.emergencyOverride,
        nextSteps: {
          allowPickup: linkedChildren.some(child => child.status === 'CHECKED_IN'),
          allowAuthorization: true,
          requiresBiometric: parentQRCode.biometricRequired,
          requiresStaffApproval: parentQRCode.securityLevel === 'MAXIMUM',
        },
      });
    }

    // Check if it's a venue QR code
    const venueQRCode = await prisma.venueQRCode.findFirst({
      where: { qrCode, isActive: true },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (venueQRCode) {
      return NextResponse.json({
        valid: true,
        type: 'venue',
        qrCodeType: venueQRCode.qrType,
        venue: venueQRCode.venue,
        purpose: venueQRCode.purpose,
        nextSteps: {
          venueAccess: true,
          informationAccess: venueQRCode.qrType === 'INFO',
          emergencyProcedures: venueQRCode.qrType === 'EMERGENCY',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid or expired QR code' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error validating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to validate QR code' },
      { status: 500 }
    );
  }
}
