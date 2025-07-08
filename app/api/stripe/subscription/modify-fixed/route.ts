
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fixedSubscriptionService } from '@/lib/stripe/subscription-service-fixed';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== FIXED SUBSCRIPTION MODIFY API START ===');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await request.json();
    console.log('📥 Modify request:', { priceId, userId: session.user.id });

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Check if plan exists for this price ID
    const plan = fixedSubscriptionService.getPlanByPriceId(priceId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    console.log('📋 Plan found:', plan.name, 'Type:', plan.planType);

    // Change subscription
    const subscription = await fixedSubscriptionService.changeSubscription(
      session.user.id,
      priceId
    );

    console.log('✅ Subscription modified successfully:', subscription.id);

    return NextResponse.json({
      subscription,
      planType: plan.planType,
      planName: plan.name,
      success: true
    });
  } catch (error) {
    console.error('❌ FIXED SUBSCRIPTION MODIFY API ERROR:', error);
    return NextResponse.json(
      { 
        error: 'Failed to modify subscription', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
