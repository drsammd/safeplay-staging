
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CheckInOutType, CheckInMethod, ChildStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/check-in-out - Get check-in/out events with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const childId = searchParams.get('childId');
    const eventType = searchParams.get('eventType') as CheckInOutType | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (session.user.role === 'PARENT') {
      where.parentId = session.user.id;
    } else if (session.user.role === 'VENUE_ADMIN' && venueId) {
      where.venueId = venueId;
    }

    if (childId) where.childId = childId;
    if (eventType) where.eventType = eventType;

    const events = await prisma.checkInOutEvent.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        membership: {
          select: {
            id: true,
            memberId: true,
            status: true,
            tierLevel: true,
          },
        },
        kiosk: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        biometricVerifications: {
          select: {
            id: true,
            verificationResult: true,
            matchConfidence: true,
            verificationType: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      events,
      pagination: {
        limit,
        offset,
        total: await prisma.checkInOutEvent.count({ where }),
      },
    });
  } catch (error) {
    console.error('Error fetching check-in/out events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-in/out events' },
      { status: 500 }
    );
  }
}

// POST /api/check-in-out - Create new check-in/out event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      childId,
      venueId,
      eventType,
      method = 'STAFF_MANUAL',
      qrCode,
      biometricRequired = false,
      membershipId,
      kioskId,
      kioskSessionId,
      notes,
      metadata,
    } = body;

    // Validate required fields
    if (!childId || !venueId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: childId, venueId, eventType' },
        { status: 400 }
      );
    }

    // Verify child access permissions
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

    // Verify venue access permissions for venue admin
    if (session.user.role === 'VENUE_ADMIN') {
      const venue = await prisma.venue.findFirst({
        where: { id: venueId, adminId: session.user.id },
      });
      if (!venue) {
        return NextResponse.json(
          { error: 'Venue not found or access denied' },
          { status: 403 }
        );
      }
    }

    // Create check-in/out event
    const checkInOutEvent = await prisma.checkInOutEvent.create({
      data: {
        childId,
        venueId,
        parentId: session.user.role === 'PARENT' ? session.user.id : body.parentId,
        eventType,
        method,
        qrCode,
        authorizedBy: session.user.id,
        isAuthorized: true,
        requiresVerification: biometricRequired,
        membershipId,
        kioskId,
        kioskSessionId,
        notes,
        metadata,
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    // Update child status
    const newStatus = eventType === 'CHECK_IN' ? 'CHECKED_IN' : 'CHECKED_OUT';
    await prisma.child.update({
      where: { id: childId },
      data: { 
        status: newStatus,
        currentVenueId: eventType === 'CHECK_IN' ? venueId : null,
      },
    });

    // If biometric verification is required, trigger biometric process
    if (biometricRequired && method !== 'STAFF_MANUAL') {
      // This would integrate with biometric verification API
      // For now, we'll create a pending verification record
      await prisma.biometricVerification.create({
        data: {
          checkInEventId: checkInOutEvent.id,
          personType: 'CHILD',
          personId: childId,
          verificationType: 'FACE_RECOGNITION',
          capturedBiometric: '', // Would be populated by biometric capture
          verificationResult: 'PENDING',
          auditLog: {
            action: 'biometric_verification_initiated',
            timestamp: new Date(),
            initiatedBy: session.user.id,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      checkInOutEvent,
      message: `Child ${eventType === 'CHECK_IN' ? 'checked in' : 'checked out'} successfully`,
    });
  } catch (error) {
    console.error('Error creating check-in/out event:', error);
    return NextResponse.json(
      { error: 'Failed to create check-in/out event' },
      { status: 500 }
    );
  }
}
