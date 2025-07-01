
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { discountService } from '@/lib/stripe/discount-service';
import { prisma } from '@/lib/db';
import { SubscriptionPlanType, BillingInterval } from '@prisma/client';

// POST - Apply discount code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { 
      discountCodeId, 
      subscriptionId, 
      transactionId,
      originalAmount,
      planType,
      billingInterval
    } = await request.json();

    if (!discountCodeId) {
      return NextResponse.json({ error: 'Discount code ID is required' }, { status: 400 });
    }

    // Get the discount code
    const discountCode = await prisma.discountCode.findUnique({
      where: { id: discountCodeId }
    });

    if (!discountCode) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 });
    }

    // Validate the code one more time
    const validation = await discountService.validateDiscountCode(
      discountCode.code,
      session.user.id,
      planType as SubscriptionPlanType,
      originalAmount
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.reason }, 
        { status: 400 }
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (originalAmount) {
      if (discountCode.discountType === 'PERCENTAGE') {
        discountAmount = (originalAmount * discountCode.discountValue) / 100;
      } else if (discountCode.discountType === 'FIXED_AMOUNT') {
        discountAmount = Math.min(discountCode.discountValue, originalAmount);
      }
    }

    const finalAmount = originalAmount - discountAmount;

    // Apply to subscription if provided
    if (subscriptionId) {
      const result = await discountService.applyDiscountToSubscription(
        subscriptionId,
        discountCodeId,
        session.user.id
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }

    // Record the usage
    const headers = request.headers;
    const usage = await discountService.recordDiscountUsage(
      discountCodeId,
      session.user.id,
      {
        subscriptionId,
        transactionId,
        originalAmount,
        discountAmount,
        finalAmount,
        planType: planType as SubscriptionPlanType,
        ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
        userAgent: headers.get('user-agent') || undefined
      }
    );

    // Update analytics
    await discountService.updateDiscountAnalytics(discountCodeId);

    return NextResponse.json({
      success: true,
      usage: {
        id: usage.id,
        originalAmount,
        discountAmount,
        finalAmount,
        savings: discountAmount
      },
      discountCode: {
        name: discountCode.name,
        description: discountCode.description
      }
    });

  } catch (error) {
    console.error('Error applying discount code:', error);
    return NextResponse.json(
      { error: 'Failed to apply discount code' }, 
      { status: 500 }
    );
  }
}

