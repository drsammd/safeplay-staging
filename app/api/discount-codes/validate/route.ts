
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { discountService } from '@/lib/stripe/discount-service';
import { SubscriptionPlan } from '@prisma/client';

// POST - Validate discount code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { code, planType, purchaseAmount } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Discount code is required' }, { status: 400 });
    }

    // Validate the discount code
    const validation = await discountService.validateDiscountCode(
      code,
      session.user.id,
      planType as SubscriptionPlan,
      purchaseAmount
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          isValid: false, 
          error: validation.reason 
        }, 
        { status: 400 }
      );
    }

    // Return validation result with discount details
    return NextResponse.json({
      isValid: true,
      discountCode: {
        id: validation.discountCode?.id,
        code: validation.discountCode?.code,
        name: validation.discountCode?.name,
        description: validation.discountCode?.description,
        discountType: validation.discountCode?.type,
        discountValue: validation.discountCode?.value,
        discountAmount: validation.discountAmount
      }
    });

  } catch (error) {
    console.error('Error validating discount code:', error);
    return NextResponse.json(
      { error: 'Failed to validate discount code' }, 
      { status: 500 }
    );
  }
}

