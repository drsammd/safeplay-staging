
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import QRCode from 'qrcode';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Generate secure QR code data
function generateSecureQRData(data: any, securityLevel: string): string {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const qrPayload = {
    ...data,
    timestamp,
    nonce,
    security: securityLevel,
  };

  // For production, this should use proper encryption
  return Buffer.from(JSON.stringify(qrPayload)).toString('base64');
}

// GET /api/qr-codes - Get QR codes for children or parents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const type = searchParams.get('type') as 'child' | 'parent' || 'child';
    const includeQRImage = searchParams.get('includeImage') === 'true';

    if (type === 'child') {
      const where: any = {};
      
      if (session.user.role === 'PARENT') {
        if (childId) {
          // Verify parent has access to this child
          const child = await prisma.child.findFirst({
            where: { id: childId, parentId: session.user.id },
          });
          if (!child) {
            return NextResponse.json(
              { error: 'Child not found or access denied' },
              { status: 403 }
            );
          }
          where.childId = childId;
        } else {
          // Get all children for this parent
          const children = await prisma.child.findMany({
            where: { parentId: session.user.id },
            select: { id: true },
          });
          where.childId = { in: children.map(child => child.id) };
        }
      } else if (childId) {
        where.childId = childId;
      }

      const childQRCodes = await prisma.childQRCode.findMany({
        where: { ...where, isActive: true },
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Generate QR code images if requested
      const qrCodesWithImages = await Promise.all(
        childQRCodes.map(async (qrCodeRecord) => {
          let qrCodeImage = null;
          if (includeQRImage) {
            try {
              qrCodeImage = await QRCode.toDataURL(qrCodeRecord.qrCode, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                margin: 1,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF',
                },
              });
            } catch (error) {
              console.error('Error generating QR code image:', error);
            }
          }

          return {
            ...qrCodeRecord,
            qrCodeImage,
          };
        })
      );

      return NextResponse.json({ childQRCodes: qrCodesWithImages });
    } else {
      // Parent QR codes
      const parentQRCodes = await prisma.parentQRCode.findMany({
        where: { 
          parentId: session.user.id,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const qrCodesWithImages = await Promise.all(
        parentQRCodes.map(async (qrCodeRecord) => {
          let qrCodeImage = null;
          if (includeQRImage) {
            try {
              qrCodeImage = await QRCode.toDataURL(qrCodeRecord.qrCode, {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                margin: 1,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF',
                },
              });
            } catch (error) {
              console.error('Error generating QR code image:', error);
            }
          }

          return {
            ...qrCodeRecord,
            qrCodeImage,
          };
        })
      );

      return NextResponse.json({ parentQRCodes: qrCodesWithImages });
    }
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QR codes' },
      { status: 500 }
    );
  }
}

// POST /api/qr-codes - Generate new QR code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type, // 'child' or 'parent'
      childId,
      purpose,
      securityLevel = 'STANDARD',
      expiresIn, // hours
      maxUsage,
      biometricRequired = false,
    } = body;

    if (type === 'child') {
      if (!childId) {
        return NextResponse.json(
          { error: 'childId is required for child QR codes' },
          { status: 400 }
        );
      }

      // Verify parent has access to this child
      if (session.user.role === 'PARENT') {
        const child = await prisma.child.findFirst({
          where: { id: childId, parentId: session.user.id },
        });
        if (!child) {
          return NextResponse.json(
            { error: 'Child not found or access denied' },
            { status: 403 }
          );
        }
      }

      // Generate unique QR code
      const qrCode = `CHILD_${crypto.randomUUID()}`;
      const qrData = generateSecureQRData({
        type: 'child',
        childId,
        purpose: purpose || 'CHECK_IN_OUT',
      }, securityLevel);

      const childQRCode = await prisma.childQRCode.create({
        data: {
          childId,
          qrCode,
          qrData,
          purpose: purpose || 'CHECK_IN_OUT',
          securityLevel,
          generatedBy: session.user.id,
          expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 60 * 60 * 1000) : null,
          maxUsage,
        },
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Generate QR code image
      const qrCodeImage = await QRCode.toDataURL(qrCode, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return NextResponse.json({
        success: true,
        childQRCode: {
          ...childQRCode,
          qrCodeImage,
        },
        message: 'Child QR code generated successfully',
      });
    } else {
      // Parent QR code
      const linkedChildren = childId ? [childId] : [];

      // Get all children for this parent if no specific child
      if (!childId && session.user.role === 'PARENT') {
        const children = await prisma.child.findMany({
          where: { parentId: session.user.id },
          select: { id: true },
        });
        linkedChildren.push(...children.map(child => child.id));
      }

      const qrCode = `PARENT_${crypto.randomUUID()}`;
      const qrData = generateSecureQRData({
        type: 'parent',
        parentId: session.user.id,
        linkedChildren,
        purpose: purpose || 'PICKUP_AUTHORIZATION',
      }, securityLevel);

      const parentQRCode = await prisma.parentQRCode.create({
        data: {
          parentId: session.user.id,
          qrCode,
          qrData,
          linkedChildren,
          purpose: purpose || 'PICKUP_AUTHORIZATION',
          securityLevel,
          biometricRequired,
          generatedBy: session.user.id,
          expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 60 * 60 * 1000) : null,
          maxUsage,
        },
      });

      // Generate QR code image
      const qrCodeImage = await QRCode.toDataURL(qrCode, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return NextResponse.json({
        success: true,
        parentQRCode: {
          ...parentQRCode,
          qrCodeImage,
        },
        message: 'Parent QR code generated successfully',
      });
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
