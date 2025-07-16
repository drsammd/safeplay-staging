
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscriptionService } from '@/lib/stripe/subscription-service';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting subscription modification...');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    // Log request details
    console.log('📋 Request details:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    const session = await getServerSession(authOptions);
    console.log('🔐 Session check result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session user ID');
      console.log('❌ Session details:', JSON.stringify(session, null, 2));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', {
      userId: session.user.id,
      userEmail: session.user.email
    });

    const requestBody = await request.json();
    console.log('📋 Full request body:', JSON.stringify(requestBody, null, 2));
    
    const { planId } = requestBody;
    console.log('📋 Extracted planId:', {
      planId: planId,
      planIdType: typeof planId,
      planIdLength: planId?.length,
      planIdTrimmed: planId?.trim?.()
    });

    if (!planId) {
      console.log('❌ Missing plan ID');
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get the plan details
    console.log('🔍 Fetching plan details for ID:', planId);
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      console.log('❌ Plan not found in database');
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    console.log('✅ Plan found:', {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      stripePriceId: plan.stripePriceId
    });

    // For this implementation, we'll create Stripe prices on the fly
    // In production, you'd want these pre-created
    console.log('💰 Getting or creating Stripe price...');
    const priceId = await getOrCreateStripePrice(plan);
    console.log('✅ Stripe price ID:', priceId);

    // Get current subscription
    console.log('🔍 Fetching user subscription...');
    const userSub = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id },
      include: { user: true, paymentMethod: true }
    });

    console.log('📊 User subscription data:', {
      exists: !!userSub,
      stripeSubscriptionId: userSub?.stripeSubscriptionId,
      stripeCustomerId: userSub?.stripeCustomerId,
      currentPlanType: userSub?.planType,
      status: userSub?.status
    });

    if (!userSub) {
      console.log('❌ No subscription found for user - creating new subscription...');
      
      // Create a new subscription for the user
      try {
        const newSubscription = await createNewSubscription(session.user.id, session.user.email || '', priceId, plan);
        
        return NextResponse.json({
          subscription: {
            id: newSubscription.id,
            status: newSubscription.status,
            current_period_end: (newSubscription as any).current_period_end
          },
          message: 'New subscription created successfully'
        });
      } catch (error) {
        console.error('❌ Error creating new subscription:', error);
        return NextResponse.json({ 
          error: 'Failed to create subscription',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    if (!userSub.stripeSubscriptionId) {
      console.log('❌ No active subscription found - missing stripeSubscriptionId');
      return NextResponse.json({ 
        error: 'No active subscription found',
        details: 'User subscription exists but missing Stripe subscription ID'
      }, { status: 404 });
    }

    // Test Stripe connectivity and handle missing entities
    console.log('🔗 Testing Stripe connectivity...');
    
    // Check if customer exists in Stripe
    let customerId = userSub.stripeCustomerId;
    let needsCustomerCreation = false;
    
    if (!customerId || customerId.startsWith('cus_demo_')) {
      needsCustomerCreation = true;
    } else {
      // Verify customer exists in Stripe
      try {
        await stripe.customers.retrieve(customerId);
        console.log('✅ Stripe customer verified:', customerId);
      } catch (customerError) {
        console.log('❌ Stripe customer not found, will create new one:', customerError);
        needsCustomerCreation = true;
      }
    }
    
    if (needsCustomerCreation) {
      console.log('🆕 Creating new Stripe customer...');
      
      // Create real Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email || '',
        name: session.user.name || session.user.email?.split('@')[0] || 'SafePlay User',
        metadata: {
          userId: session.user.id,
          platform: 'safeplay'
        }
      });
      
      console.log('✅ Created Stripe customer:', customer.id);
      customerId = customer.id;
      
      // Update customer ID in database
      await prisma.userSubscription.update({
        where: { userId: session.user.id },
        data: {
          stripeCustomerId: customer.id
        }
      });
      
      console.log('✅ Updated database with new customer ID');
    }
    
    // Check if subscription exists in Stripe and is valid
    const isDemoSubscription = userSub.stripeSubscriptionId?.startsWith('sub_demo_');
    let needsSubscriptionCreation = isDemoSubscription;
    
    if (!isDemoSubscription && userSub.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(userSub.stripeSubscriptionId);
        console.log('✅ Stripe subscription found:', {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          customer: stripeSubscription.customer,
          items: stripeSubscription.items.data.length
        });
        
        // If this is just a plan change for existing subscription, proceed normally
        if (stripeSubscription.customer === customerId) {
          console.log('✅ Valid subscription found, proceeding with plan change...');
        } else {
          console.log('❌ Subscription customer mismatch, will create new subscription');
          needsSubscriptionCreation = true;
        }
      } catch (stripeError) {
        console.error('❌ Stripe subscription not found:', stripeError);
        needsSubscriptionCreation = true;
      }
    }
    
    if (needsSubscriptionCreation) {
      console.log('🆕 Creating new Stripe subscription...');
      
      // Create real Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId!,
        items: [{ price: priceId }],
        trial_period_days: 7, // Give users a trial period
        metadata: {
          userId: session.user.id,
          planId: plan.id
        }
      });
      
      console.log('✅ Created Stripe subscription:', subscription.id);
      
      // Update database with new subscription ID and plan
      const stripeSubscription = subscription as any;
      await prisma.userSubscription.update({
        where: { userId: session.user.id },
        data: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          planId: plan.id,
          status: subscription.status === 'active' ? 'ACTIVE' : subscription.status === 'trialing' ? 'TRIALING' : 'INCOMPLETE',
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
          trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        }
      });
      
      console.log('✅ Updated database with new subscription');
      
      return NextResponse.json({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: stripeSubscription.current_period_end
        },
        message: 'Subscription created successfully'
      });
    }

    // Modify the subscription
    console.log('🔄 Calling subscription service to change subscription...');
    const subscription = await subscriptionService.changeSubscription(session.user.id, priceId);
    console.log('✅ Subscription modified successfully:', subscription.id);

    // Update the plan in our database
    console.log('💾 Updating plan in database...');
    await prisma.userSubscription.update({
      where: { userId: session.user.id },
      data: { planId: plan.id }
    });
    console.log('✅ Database updated successfully');

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: (subscription as any).current_period_end
      },
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    console.error('❌ Error modifying subscription:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to modify subscription',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

async function getOrCreateStripePrice(plan: any): Promise<string> {
  console.log('💰 Getting or creating Stripe price for plan:', plan.name);
  
  // Check if we already have a Stripe price for this plan
  if (plan.stripePriceId) {
    console.log('✅ Existing Stripe price found:', plan.stripePriceId);
    return plan.stripePriceId;
  }

  console.log('🆕 Creating new Stripe price...');
  console.log('Price details:', {
    amount: parseFloat(plan.price),
    amountInCents: Math.round(parseFloat(plan.price) * 100),
    currency: plan.currency,
    planType: plan.planType,
    billingInterval: plan.billingInterval
  });

  try {
    // Map billing interval to Stripe format
    const intervalMap: Record<string, string> = {
      'MONTHLY': 'month',
      'YEARLY': 'year',
      'WEEKLY': 'week',
      'DAILY': 'day'
    };
    
    const stripeInterval = intervalMap[plan.billingInterval] || 'month';
    console.log('📅 Mapped billing interval:', plan.billingInterval, '->', stripeInterval);

    // Create a Stripe price
    const price = await stripe.prices.create({
      unit_amount: Math.round(parseFloat(plan.price) * 100), // Convert to cents
      currency: plan.currency.toLowerCase(),
      recurring: plan.planType === 'LIFETIME' ? undefined : {
        interval: stripeInterval as any
      },
      product_data: {
        name: plan.name
      },
      metadata: {
        planId: plan.id,
        planType: plan.planType
      }
    });

    console.log('✅ Stripe price created:', price.id);

    // Save the price ID back to our database
    console.log('💾 Saving price ID to database...');
    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: { stripePriceId: price.id }
    });

    console.log('✅ Price ID saved to database');
    return price.id;
  } catch (error) {
    console.error('❌ Error creating Stripe price:', error);
    throw error;
  }
}

async function createNewSubscription(userId: string, email: string, priceId: string, plan: any) {
  console.log('🆕 Creating new subscription for user:', userId);
  
  // Create Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: email.split('@')[0], // Use email prefix as name
    metadata: {
      userId,
      platform: 'safeplay'
    }
  });
  
  console.log('✅ Created Stripe customer:', customer.id);
  
  // Create Stripe subscription with trial period (no payment required)
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    trial_period_days: 7, // 7-day trial to avoid payment method requirement
    metadata: {
      userId,
      planId: plan.id
    }
  });
  
  console.log('✅ Created Stripe subscription:', subscription.id);
  
  // Create database subscription record with proper date handling
  const stripeSubscription = subscription as any;
  const currentPeriodStart = stripeSubscription.current_period_start 
    ? new Date(stripeSubscription.current_period_start * 1000) 
    : new Date();
  const currentPeriodEnd = stripeSubscription.current_period_end 
    ? new Date(stripeSubscription.current_period_end * 1000) 
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  await prisma.userSubscription.create({
    data: {
      userId,
      planId: plan.id,
      status: stripeSubscription.status === 'active' ? 'ACTIVE' : stripeSubscription.status === 'trialing' ? 'TRIALING' : 'INCOMPLETE',
      stripeCustomerId: customer.id,
      stripeSubscriptionId: stripeSubscription.id,
      currentPeriodStart,
      currentPeriodEnd,
      trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
      billingInterval: 'MONTHLY'
    }
  });
  
  console.log('✅ Created database subscription record');
  
  return subscription;
}
