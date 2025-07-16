
import { NextRequest, NextResponse } from 'next/server';
import { fixedSubscriptionService } from '@/lib/stripe/subscription-service-fixed';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIGNUP SUBSCRIPTION API START ===');
    
    const { priceId, paymentMethodId, discountCodeId, userEmail, userName } = await request.json();
    console.log('📥 Request data:', { 
      priceId, 
      hasPaymentMethod: !!paymentMethodId, 
      hasDiscountCode: !!discountCodeId,
      userEmail,
      userName
    });

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    if (!userEmail || !userName) {
      return NextResponse.json({ error: 'User email and name are required' }, { status: 400 });
    }

    // Check if plan exists for this price ID
    const plan = fixedSubscriptionService.getPlanByPriceId(priceId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    console.log('📋 Plan found:', plan.name, 'Type:', plan.planType);

    // Create Stripe customer for signup
    const customer = await stripe.customers.create({
      email: userEmail,
      name: userName,
      metadata: {
        platform: 'safeplay',
        signup_flow: 'true'
      }
    });

    console.log('✅ Stripe customer created:', customer.id);

    // Attach payment method to customer
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });
      
      //Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Build subscription parameters
    const subscriptionParams: any = {
      customer: customer.id,
      items: [{ price: priceId }],
      metadata: {
        planType: plan.planType,
        signup_flow: 'true'
      },
      expand: ['latest_invoice.payment_intent'],
    };

    if (paymentMethodId) {
      subscriptionParams.default_payment_method = paymentMethodId;
    }

    // Add 7-day trial
    if (plan.trialDays > 0) {
      subscriptionParams.trial_period_days = plan.trialDays;
    }

    console.log('🔗 Creating subscription in Stripe...');
    const subscription = await stripe.subscriptions.create(subscriptionParams);

    console.log('✅ Stripe subscription created:', subscription.id);

    const response = {
      subscription,
      customer,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      status: subscription.status,
      planType: plan.planType,
      planName: plan.name,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ SIGNUP SUBSCRIPTION API ERROR:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create subscription', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
