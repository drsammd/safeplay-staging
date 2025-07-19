
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MembershipStatus } from '@prisma/client';
// import { MembershipTier } from '@prisma/client'; // Type not available in current schema

export const dynamic = 'force-dynamic';

// GET /api/membership - Get memberships
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const status = searchParams.get('status') as MembershipStatus | null;
    const memberId = searchParams.get('memberId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (session.user.role === 'PARENT') {
      where.parentId = session.user.id;
    } else if (session.user.role === 'VENUE_ADMIN' && venueId) {
      where.venueId = venueId;
    }

    if (status) where.status = status;
    if (memberId) where.memberId = memberId;

    const memberships = await prisma.membership.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            packageType: true,
            duration: true,
            price: true,
            benefits: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        transactions: {
          take: 10,
          orderBy: { timestamp: 'desc' },
          select: {
            id: true,
            transactionType: true,
            amount: true,
            paymentStatus: true,
            timestamp: true,
          },
        },
        checkInEvents: {
          take: 5,
          orderBy: { timestamp: 'desc' },
          select: {
            id: true,
            eventType: true,
            timestamp: true,
            child: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      memberships,
      pagination: {
        limit,
        offset,
        total: await prisma.membership.count({ where }),
      },
    });
  } catch (error) {
    console.error('Error fetching memberships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memberships' },
      { status: 500 }
    );
  }
}

// POST /api/membership - Create new membership
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      packageId,
      venueId,
      autoRenewal = false,
      emergencyContacts,
      specialRequests,
      healthInformation,
      communicationPrefs,
      referredBy,
    } = body;

    // Validate required fields
    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }

    // Get package details
    const membershipPackage = await prisma.membershipPackage.findUnique({
      where: { id: packageId },
    });

    if (!membershipPackage || !membershipPackage.isActive) {
      return NextResponse.json(
        { error: 'Package not found or inactive' },
        { status: 404 }
      );
    }

    // Generate unique member ID
    const memberId = `MEM${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Calculate end date based on package duration
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + membershipPackage.duration);

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        memberId,
        parentId: session.user.id,
        packageId,
        venueId: venueId || membershipPackage.venueId,
        endDate,
        autoRenewal,
        checkInsRemaining: membershipPackage.checkInLimit,
        photoCreditsRemaining: membershipPackage.photoCredits,
        videoCreditsRemaining: membershipPackage.videoCredits,
        emergencyContacts,
        specialRequests,
        healthInformation,
        communicationPrefs,
        referredBy,
        referralCode: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      },
      include: {
        package: {
          select: {
            name: true,
            packageType: true,
            benefits: true,
            price: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      membership,
      message: 'Membership created successfully',
    });
  } catch (error) {
    console.error('Error creating membership:', error);
    return NextResponse.json(
      { error: 'Failed to create membership' },
      { status: 500 }
    );
  }
}

// PATCH /api/membership - Update membership
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      membershipId,
      status,
      suspensionReason,
      cancellationReason,
      autoRenewal,
      emergencyContacts,
      specialRequests,
      healthInformation,
      communicationPrefs,
    } = body;

    if (!membershipId) {
      return NextResponse.json(
        { error: 'Membership ID is required' },
        { status: 400 }
      );
    }

    // Find membership and verify access
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      );
    }

    if (session.user.role === 'PARENT' && membership.parentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'SUSPENDED') {
        updateData.suspendedAt = new Date();
        updateData.suspensionReason = suspensionReason;
      } else if (status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = cancellationReason;
      }
    }

    if (autoRenewal !== undefined) updateData.autoRenewal = autoRenewal;
    if (emergencyContacts) updateData.emergencyContacts = emergencyContacts;
    if (specialRequests) updateData.specialRequests = specialRequests;
    if (healthInformation) updateData.healthInformation = healthInformation;
    if (communicationPrefs) updateData.communicationPrefs = communicationPrefs;

    const updatedMembership = await prisma.membership.update({
      where: { id: membershipId },
      data: updateData,
      include: {
        package: {
          select: {
            name: true,
            packageType: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      membership: updatedMembership,
      message: 'Membership updated successfully',
    });
  } catch (error) {
    console.error('Error updating membership:', error);
    return NextResponse.json(
      { error: 'Failed to update membership' },
      { status: 500 }
    );
  }
}
