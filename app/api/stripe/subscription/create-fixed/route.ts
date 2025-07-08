
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fixedSubscriptionService } from '@/lib/stripe/subscription-service-fixed';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== FIXED SUBSCRIPTION API START ===');
    
    const session = await getServerSession(authOptions);
    console.log('👤 Session check:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, paymentMethodId, discountCodeId } = await request.json();
    console.log('📥 Request data:', { priceId, hasPaymentMethod: !!paymentMethodId, hasDiscountCode: !!discountCodeId });

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Check if plan exists for this price ID
    const plan = fixedSubscriptionService.getPlanByPriceId(priceId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    console.log('📋 Plan found:', plan.name, 'Type:', plan.planType);

    // Create subscription
    const subscription = await fixedSubscriptionService.createSubscription(
      session.user.id,
      priceId,
      paymentMethodId,
      discountCodeId
    );

    console.log('✅ Subscription created successfully:', subscription.id);

    const response = {
      subscription,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      status: subscription.status,
      planType: plan.planType,
      planName: plan.name,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ FIXED SUBSCRIPTION API ERROR:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create subscription', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
