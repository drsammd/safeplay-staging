
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { demoSubscriptionService } from '@/lib/stripe/demo-subscription-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { planId, paymentMethodId, isSignupFlow } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Handle signup flow (no authentication required)
    if (!session?.user?.id) {
      console.log('🚀 DEMO API: Handling signup flow - no authentication required');
      console.log('🚀 DEMO API: Creating temporary subscription for signup with plan:', planId);

      // Create a temporary subscription for signup flow
      const tempSubscription = await demoSubscriptionService.createSignupSubscription(
        planId,
        paymentMethodId
      );

      return NextResponse.json({
        success: true,
        subscription: tempSubscription,
        customer: tempSubscription.customer,
        isSignupFlow: true,
        message: 'Demo subscription prepared for signup! This is a test environment.'
      });
    }

    // Handle authenticated user flow (existing logic)
    console.log('🎭 DEMO API: Creating subscription for authenticated user:', session.user.id, 'Plan:', planId);

    // Create subscription using demo service
    const subscription = await demoSubscriptionService.createSubscription(
      session.user.id,
      planId,
      paymentMethodId
    );

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Demo subscription created successfully! This is a test environment.'
    });

  } catch (error) {
    console.error('Demo subscription API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const status = await demoSubscriptionService.getSubscriptionStatus(session.user.id);

    return NextResponse.json({
      success: true,
      ...status
    });

  } catch (error) {
    console.error('Demo subscription status API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
