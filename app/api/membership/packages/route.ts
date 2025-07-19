
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
// import { MembershipType } from '@prisma/client'; // Type not available in current schema

export const dynamic = 'force-dynamic';

// GET /api/membership/packages - Get membership packages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const packageType = searchParams.get('packageType') as MembershipType | null;
    const isActive = searchParams.get('isActive') === 'true';

    const where: any = {};

    if (venueId) {
      where.OR = [
        { venueId: venueId },
        { venueId: null }, // Company-wide packages
      ];
    }

    if (packageType) where.packageType = packageType;
    if (isActive !== undefined) where.isActive = isActive;

    const packages = await prisma.membershipPackage.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        memberships: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            transactions: true,
          },
        },
      },
      orderBy: [
        { venueId: 'asc' }, // Company-wide packages first
        { price: 'asc' },
      ],
    });

    // Add calculated statistics
    const packagesWithStats = packages.map(pkg => ({
      ...pkg,
      stats: {
        totalMemberships: pkg._count.memberships,
        activeMemberships: pkg.memberships.filter(m => m.status === 'ACTIVE').length,
        totalTransactions: pkg._count.transactions,
      },
    }));

    return NextResponse.json({ packages: packagesWithStats });
  } catch (error) {
    console.error('Error fetching membership packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch membership packages' },
      { status: 500 }
    );
  }
}

// POST /api/membership/packages - Create membership package (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow venue admin or company admin to create packages
    if (session.user.role === 'PARENT') {
      return NextResponse.json(
        { error: 'Only venue administrators can create packages' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      venueId,
      packageType,
      duration,
      price,
      currency = 'USD',
      benefits,
      checkInLimit,
      guestLimit,
      photoCredits,
      videoCredits,
      prioritySupport = false,
      discountPercentage,
      autoRenewal = false,
      minimumAge,
      maximumAge,
      familySize,
      terms,
      cancellationPolicy,
      refundPolicy,
    } = body;

    // Validate required fields
    if (!name || !packageType || !duration || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: name, packageType, duration, price' },
        { status: 400 }
      );
    }

    // If venue-specific package, verify admin has access to venue
    if (venueId && session.user.role === 'VENUE_ADMIN') {
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

    const membershipPackage = await prisma.membershipPackage.create({
      data: {
        name,
        description,
        venueId,
        packageType,
        duration,
        price,
        currency,
        benefits,
        checkInLimit,
        guestLimit,
        photoCredits,
        videoCredits,
        prioritySupport,
        discountPercentage,
        autoRenewal,
        minimumAge,
        maximumAge,
        familySize,
        terms,
        cancellationPolicy,
        refundPolicy,
      },
      include: {
        venue: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      package: membershipPackage,
      message: 'Membership package created successfully',
    });
  } catch (error) {
    console.error('Error creating membership package:', error);
    return NextResponse.json(
      { error: 'Failed to create membership package' },
      { status: 500 }
    );
  }
}
