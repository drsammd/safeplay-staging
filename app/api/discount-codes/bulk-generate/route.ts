
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { discountService } from '@/lib/stripe/discount-service';
import { 
  DiscountType, 
  DiscountCategory, 
  UserRole 
} from '@prisma/client';

// POST - Bulk generate discount codes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== UserRole.COMPANY_ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      codePattern,
      quantity,
      name,
      description,
      discountType,
      discountValue,
      category,
      maxUses,
      maxUsesPerUser = 1,
      startsAt,
      expiresAt,
      applicablePlans = [],
      minimumPurchase,
      campaignName,
      prefix = '',
      suffix = '',
      isTest = false
    } = await request.json();

    if (!quantity || quantity < 1 || quantity > 1000) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 1000' }, 
        { status: 400 }
      );
    }

    // Generate unique codes
    const generateUniqueCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = prefix;
      
      // Generate random part
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      code += suffix;
      return code;
    };

    const generatedCodes = [];
    const existingCodes = new Set();

    // Get existing codes to avoid duplicates
    const existing = await prisma.discountCode.findMany({
      select: { code: true }
    });
    existing.forEach(code => existingCodes.add(code.code));

    // Generate codes
    for (let i = 0; i < quantity; i++) {
      let code;
      let attempts = 0;
      
      do {
        code = generateUniqueCode();
        attempts++;
        
        if (attempts > 100) {
          throw new Error('Unable to generate unique codes. Please try with different parameters.');
        }
      } while (existingCodes.has(code));
      
      existingCodes.add(code);
      
      generatedCodes.push({
        code,
        name: `${name} ${i + 1}`,
        description,
        discountType,
        discountValue,
        category,
        maxUses,
        maxUsesPerUser,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        applicablePlans,
        minimumPurchase,
        campaignName,
        createdBy: session.user.id,
        isTest,
        tags: ['bulk-generated', campaignName || 'bulk-campaign'].filter(Boolean)
      });
    }

    // Create all codes in database
    const createdCodes = await prisma.$transaction(
      generatedCodes.map(codeData => 
        prisma.discountCode.create({ data: codeData })
      )
    );

    // Create Stripe coupons for non-test codes (in background)
    if (!isTest) {
      // Process in background to avoid timeout
      setImmediate(async () => {
        for (const code of createdCodes) {
          try {
            await discountService.createStripeCoupon(code);
            await discountService.createStripePromotionCode(code);
          } catch (error) {
            console.error(`Error creating Stripe objects for code ${code.code}:`, error);
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      generated: createdCodes.length,
      codes: createdCodes.map(code => ({
        id: code.id,
        code: code.code,
        name: code.name
      })),
      campaignName
    }, { status: 201 });

  } catch (error) {
    console.error('Error bulk generating discount codes:', error);
    return NextResponse.json(
      { error: 'Failed to generate discount codes' }, 
      { status: 500 }
    );
  }
}

