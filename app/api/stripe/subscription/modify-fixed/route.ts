

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

    const { priceId, paymentMethodId } = await request.json();
    console.log('📥 Modify request:', { priceId, userId: session.user.id, hasPaymentMethod: !!paymentMethodId });

    // 🔧 CRITICAL FIX: Handle FREE plan downgrades
    if (priceId === null || priceId === 'free') {
      console.log('🆓 FIXED API: Processing downgrade to FREE plan');
      
      try {
        const freeSubscription = await fixedSubscriptionService.downgradeToFreePlan(session.user.id);
        
        return NextResponse.json({
          subscription: freeSubscription,
          planType: 'FREE',
          planName: 'Free Plan',
          success: true,
          message: 'Successfully downgraded to FREE plan'
        });
      } catch (error) {
        console.error('❌ FIXED API: Error downgrading to FREE plan:', error);
        
        let errorMessage = 'Failed to downgrade to FREE plan';
        
        if (error instanceof Error) {
          if (error.message.includes('No active subscription')) {
            errorMessage = 'No active subscription found. You may already be on the FREE plan.';
          } else {
            errorMessage = `Unable to downgrade to FREE plan: ${error.message}`;
          }
        }
        
        return NextResponse.json(
          { 
            error: errorMessage,
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        );
      }
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Check if plan exists for this price ID
    const plan = fixedSubscriptionService.getPlanByPriceId(priceId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    console.log('📋 Plan found:', plan.name, 'Type:', plan.planType);

    // 🔧 CRITICAL FIX: Enhanced changeSubscription with payment method support
    const subscription = await fixedSubscriptionService.changeSubscription(
      session.user.id,
      priceId,
      paymentMethodId
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
    
    // Enhanced error handling with specific error messages
    let errorMessage = 'Failed to modify subscription';
    let statusCode = 500;
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('user not found')) {
        errorMessage = 'User account not found. Please log in again.';
        statusCode = 404;
      } else if (errorMsg.includes('no active subscription')) {
        errorMessage = 'No active subscription found. Please contact support.';
        statusCode = 404;
      } else if (errorMsg.includes('invalid price')) {
        errorMessage = 'Invalid plan selected. Please refresh the page and try again.';
        statusCode = 400;
      } else if (errorMsg.includes('customer') && errorMsg.includes('not found')) {
        errorMessage = 'Payment customer not found. Please contact support.';
        statusCode = 404;
      } else if (errorMsg.includes('subscription') && errorMsg.includes('not found')) {
        errorMessage = 'Subscription not found in payment system. Please contact support.';
        statusCode = 404;
      } else if (errorMsg.includes('payment method is required')) {
        errorMessage = 'Payment method is required to upgrade from FREE plan. Please add a payment method first.';
        statusCode = 400;
      } else if (errorMsg.includes('no attached payment source') || errorMsg.includes('no default payment method')) {
        errorMessage = 'No payment method found. Please add a payment method before upgrading your plan.';
        statusCode = 400;
      } else if (errorMsg.includes('insufficient_funds') || errorMsg.includes('card_declined')) {
        errorMessage = 'Payment failed. Please check your payment method and try again.';
        statusCode = 402;
      } else if (errorMsg.includes('authentication') || errorMsg.includes('api_key')) {
        errorMessage = 'Payment system error. Please try again later.';
        statusCode = 503;
      } else {
        // For other errors, use the original error message but make it user-friendly
        errorMessage = `Unable to modify subscription: ${error.message}`;
        statusCode = 500;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}
