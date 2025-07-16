
/**
 * SafePlay Fixed Stripe Signup Subscription API
 * Addresses critical session contamination issues in Stripe integration
 * 
 * FIXES:
 * - Validates user context before Stripe operations
 * - Prevents session contamination during payment processing
 * - Ensures correct user information is sent to Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { fixedSubscriptionService } from '@/lib/stripe/subscription-service-fixed';
import { authSessionManager } from '@/lib/auth-session-manager';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const debugId = `stripe_signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`💳 FIXED STRIPE SIGNUP API [${debugId}]: Starting signup subscription process`);
    
    const { priceId, paymentMethodId, discountCodeId, userEmail, userName, userId } = await request.json();
    
    console.log(`📥 FIXED STRIPE SIGNUP API [${debugId}]: Request data:`, { 
      priceId, 
      hasPaymentMethod: !!paymentMethodId, 
      hasDiscountCode: !!discountCodeId,
      userEmail,
      userName,
      userId
    });

    // CRITICAL FIX: Validate user context to prevent session contamination
    if (userId) {
      console.log(`🔐 FIXED STRIPE SIGNUP API [${debugId}]: Validating user context`);
      
      const isValidUser = await authSessionManager.validateUserForStripe(userId, userEmail, userName);
      
      if (!isValidUser) {
        console.error(`🚨 FIXED STRIPE SIGNUP API [${debugId}]: User validation failed - potential session contamination`);
        return NextResponse.json({ 
          error: 'User validation failed - session contamination detected',
          debugId,
          userValidation: false
        }, { status: 400 });
      }
      
      console.log(`✅ FIXED STRIPE SIGNUP API [${debugId}]: User validation passed`);
    }

    // Validate required fields
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    if (!userEmail || !userName) {
      return NextResponse.json({ error: 'User email and name are required' }, { status: 400 });
    }

    // Check if plan exists
    const plan = fixedSubscriptionService.getPlanByPriceId(priceId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    console.log(`📋 FIXED STRIPE SIGNUP API [${debugId}]: Plan found: ${plan.name}`);

    // CRITICAL FIX: Double-check user existence before creating Stripe customer
    let dbUser = null;
    if (userId) {
      dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });

      if (!dbUser) {
        console.error(`🚨 FIXED STRIPE SIGNUP API [${debugId}]: User not found in database: ${userId}`);
        return NextResponse.json({ 
          error: 'User not found in database',
          debugId,
          userId
        }, { status: 404 });
      }

      if (!dbUser.isActive) {
        console.error(`🚨 FIXED STRIPE SIGNUP API [${debugId}]: User account inactive: ${dbUser.email}`);
        return NextResponse.json({ 
          error: 'User account is inactive',
          debugId,
          userId
        }, { status: 400 });
      }

      // Final validation - ensure email matches
      if (dbUser.email.toLowerCase() !== userEmail.toLowerCase()) {
        console.error(`🚨 FIXED STRIPE SIGNUP API [${debugId}]: Email mismatch - potential session contamination`);
        console.error(`🚨 FIXED STRIPE SIGNUP API [${debugId}]: Database email: ${dbUser.email}, Request email: ${userEmail}`);
        return NextResponse.json({ 
          error: 'Email mismatch detected - session contamination prevented',
          debugId,
          databaseEmail: dbUser.email,
          requestEmail: userEmail
        }, { status: 400 });
      }
    }

    // Create Stripe customer with validated data
    const customer = await stripe.customers.create({
      email: userEmail,
      name: userName,
      metadata: {
        platform: 'safeplay',
        signup_flow: 'true',
        user_id: userId || 'unknown',
        validation_debug_id: debugId
      }
    });

    console.log(`✅ FIXED STRIPE SIGNUP API [${debugId}]: Stripe customer created: ${customer.id}`);

    // Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });
      
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
        signup_flow: 'true',
        user_id: userId || 'unknown',
        validation_debug_id: debugId
      },
      expand: ['latest_invoice.payment_intent'],
    };

    if (paymentMethodId) {
      subscriptionParams.default_payment_method = paymentMethodId;
    }

    // Add trial period if applicable
    if (plan.trialDays > 0) {
      subscriptionParams.trial_period_days = plan.trialDays;
    }

    console.log(`🔗 FIXED STRIPE SIGNUP API [${debugId}]: Creating subscription in Stripe`);
    const subscription = await stripe.subscriptions.create(subscriptionParams);

    console.log(`✅ FIXED STRIPE SIGNUP API [${debugId}]: Stripe subscription created: ${subscription.id}`);

    // Create session isolation for the user
    if (userId) {
      await authSessionManager.createSecureSessionIsolation(userId);
    }

    const response = {
      subscription,
      customer,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      status: subscription.status,
      planType: plan.planType,
      planName: plan.name,
      userValidation: {
        userId: userId || null,
        emailMatch: dbUser ? dbUser.email === userEmail : true,
        nameMatch: dbUser ? dbUser.name === userName : true,
        debugId
      }
    };

    console.log(`✅ FIXED STRIPE SIGNUP API [${debugId}]: Process completed successfully`);

    return NextResponse.json(response);

  } catch (error) {
    console.error(`❌ FIXED STRIPE SIGNUP API [${debugId}]: Error:`, error);
    
    return NextResponse.json({
      error: 'Failed to create subscription',
      debugId,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
