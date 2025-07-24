
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { discountService } from '@/lib/stripe/discount-service';
import { 
  DiscountType, 
  DiscountCategory, 
  DiscountCodeStatus,
  DiscountApplication,
  UserRole 
} from '@prisma/client';

// GET - List discount codes with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') as DiscountCategory | null;
    const status = searchParams.get('status') as DiscountCodeStatus | null;
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [discountCodes, total] = await Promise.all([
      prisma.discountCode.findMany({
        where,
        include: {
          usageHistory: {
            select: {
              id: true,
              usageStatus: true,
              discountAmount: true,
              finalAmount: true,
              usedAt: true
            }
          },
          _count: {
            select: {
              usageHistory: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.discountCode.count({ where })
    ]);

    // Add calculated fields
    const enrichedCodes = discountCodes.map(code => ({
      ...code,
      totalUsages: code._count.usageHistory,
      successfulUsages: code.usageHistory.filter(u => u.usageStatus === 'REDEEMED').length,
      totalRevenue: code.usageHistory
        .filter(u => u.usageStatus === 'REDEEMED')
        .reduce((sum, u) => sum + (u.finalAmount || 0), 0),
      isExpired: code.expiresAt ? new Date() > code.expiresAt : false,
      isExhausted: code.maxUses ? code.currentUses >= code.maxUses : false
    }));

    return NextResponse.json({
      discountCodes: enrichedCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount codes' }, 
      { status: 500 }
    );
  }
}

// POST - Create new discount code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      category,
      maxUses,
      maxUsesPerUser = 1,
      startsAt,
      expiresAt,
      minimumAmount,
      venueSpecific = false,
      applicableVenues = [],
      userRestrictions = [],
      allowedUserRoles = [],
      restrictToNewUsers = false,
      restrictToFirstTime = false,
      allowedCountries = [],
      allowedStates = [],
      allowedZipCodes = [],
      campaignName,
      affiliateId,
      autoApplyConditions
    } = data;

    // Validate discount code format
    if (!code || typeof code !== 'string' || code.length < 3) {
      return NextResponse.json(
        { error: 'Code must be at least 3 characters long' }, 
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCode = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingCode) {
      return NextResponse.json(
        { error: 'Discount code already exists' }, 
        { status: 400 }
      );
    }

    // Validate discount value
    if (discountType === DiscountType.PERCENTAGE && (discountValue <= 0 || discountValue > 100)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 1 and 100' }, 
        { status: 400 }
      );
    }

    if (discountType === DiscountType.FIXED_AMOUNT && discountValue <= 0) {
      return NextResponse.json(
        { error: 'Fixed amount discount must be greater than 0' }, 
        { status: 400 }
      );
    }

    // Create discount code
    const discountCode = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        type: discountType,
        value: discountValue,
        category,
        usageLimit: maxUses,
        userUsageLimit: maxUsesPerUser,
        validFrom: startsAt ? new Date(startsAt) : new Date(),
        validUntil: expiresAt ? new Date(expiresAt) : null,
        minimumAmount,
        venueSpecific,
        applicableVenues,
        userRestrictions,
        allowedUserRoles,
        restrictToNewUsers,
        restrictToFirstTime,
        allowedCountries,
        allowedStates,
        allowedZipCodes,
        campaignName,
        affiliateId,
        autoApplyConditions,

        createdBy: session.user.id
      }
    });

    // Create Stripe coupon and promotion code
    try {
      if (discountType !== DiscountType.FREE_TRIAL_EXTENSION) {
        await discountService.createStripeCoupon(discountCode);
        await discountService.createStripePromotionCode(discountCode);
      }
    } catch (stripeError) {
      console.error('Error creating Stripe coupon/promotion code:', stripeError);
      // Continue - we can create Stripe objects later if needed
    }

    return NextResponse.json(discountCode, { status: 201 });

  } catch (error) {
    console.error('Error creating discount code:', error);
    return NextResponse.json(
      { error: 'Failed to create discount code' }, 
      { status: 500 }
    );
  }
}

