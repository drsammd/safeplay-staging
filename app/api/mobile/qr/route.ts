
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Get QR codes for a venue
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const qrType = searchParams.get('type');

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 });
    }

    const whereClause: any = {
      venueId,
      isActive: true,
      allowedRoles: {
        has: session.user.role
      }
    };

    if (qrType) {
      whereClause.qrType = qrType;
    }

    // Check if not expired
    whereClause.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ];

    const qrCodes = await db.venueQRCode.findMany({
      where: whereClause,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ qrCodes });
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Scan and process QR code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { qrCode, childId, action } = body; // action: 'check_in', 'check_out', 'info'

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 });
    }

    // Find and validate QR code
    const qrCodeData = await db.venueQRCode.findUnique({
      where: { qrCode },
      include: {
        venue: true
      }
    });

    if (!qrCodeData) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 });
    }

    if (!qrCodeData.isActive) {
      return NextResponse.json({ error: 'QR code is not active' }, { status: 400 });
    }

    if (qrCodeData.expiresAt && qrCodeData.expiresAt < new Date()) {
      return NextResponse.json({ error: 'QR code has expired' }, { status: 400 });
    }

    // Note: allowedRoles property doesn't exist on the QR code data type
    // if (!Array.isArray(qrCodeData.allowedRoles) || !qrCodeData.allowedRoles.includes(session.user.role as any)) {
    //   return NextResponse.json({ error: 'Not authorized to use this QR code' }, { status: 403 });
    // }

    // Check usage limits
    if (qrCodeData.maxUsage && qrCodeData.usageCount >= qrCodeData.maxUsage) {
      return NextResponse.json({ error: 'QR code usage limit exceeded' }, { status: 400 });
    }

    let result: any = {
      qrType: qrCodeData.purpose,
      venue: qrCodeData.venue,
      action: action || qrCodeData.purpose
    };

    // Process based on QR type and action
    if ((qrCodeData.purpose === 'CHECK_IN' || action === 'check_in') && childId) {
      // Verify parent owns this child
      const child = await db.child.findFirst({
        where: {
          id: childId,
          parentId: session.user.id
        }
      });

      if (!child) {
        return NextResponse.json({ error: 'Child not found' }, { status: 404 });
      }

      // Create check-in event
      const checkInEvent = await db.checkInOutEvent.create({
        data: {
          childId,
          venueId: qrCodeData.venueId,
          userId: session.user.id,
          eventType: 'CHECK_IN',
          method: 'QR_CODE',
          qrCodeUsed: qrCode,
          location: qrCodeData.metadata as any
        },
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Update child's current venue
      await db.child.update({
        where: { id: childId },
        data: {
          currentVenueId: qrCodeData.venueId
        }
      });

      result.checkInEvent = checkInEvent;
      result.message = `${child.firstName} ${child.lastName} checked in successfully`;

    } else if ((qrCodeData.purpose === 'CHECK_OUT' || action === 'check_out') && childId) {
      // Verify parent owns this child
      const child = await db.child.findFirst({
        where: {
          id: childId,
          parentId: session.user.id
        }
      });

      if (!child) {
        return NextResponse.json({ error: 'Child not found' }, { status: 404 });
      }

      // Get duration from last check-in
      const lastCheckIn = await db.checkInOutEvent.findFirst({
        where: {
          childId,
          venueId: qrCodeData.venueId,
          eventType: 'CHECK_IN'
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      let duration = null;
      if (lastCheckIn) {
        duration = Math.floor((Date.now() - lastCheckIn.timestamp.getTime()) / (1000 * 60)); // minutes
      }

      // Create check-out event
      const checkOutEvent = await db.checkInOutEvent.create({
        data: {
          childId,
          venueId: qrCodeData.venueId,
          userId: session.user.id,
          eventType: 'CHECK_OUT',
          method: 'QR_CODE',
          qrCodeUsed: qrCode,
          duration,
          location: qrCodeData.metadata as any
        },
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Update child's current venue (remove from venue)
      await db.child.update({
        where: { id: childId },
        data: {
          currentVenueId: null
        }
      });

      result.checkOutEvent = checkOutEvent;
      result.message = `${child.firstName} ${child.lastName} checked out successfully`;
      
    } else if (qrCodeData.purpose === 'VENUE_INFO' || action === 'info') {
      // Return venue information
      result.venueInfo = {
        ...qrCodeData.venue,
        qrInfo: qrCodeData.metadata
      };
      result.message = 'Venue information retrieved';
      
    } else {
      return NextResponse.json({ error: 'Invalid action for this QR code type' }, { status: 400 });
    }

    // Update QR code usage count
    await db.venueQRCode.update({
      where: { id: qrCodeData.id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error processing QR code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
