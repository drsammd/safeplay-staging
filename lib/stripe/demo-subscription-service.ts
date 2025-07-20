
import { prisma } from '../db';
import { SubscriptionStatus, SubscriptionPlan } from '@prisma/client';

// Demo subscription service for development/demo environments
export class DemoSubscriptionService {
  
  // Get all available plans with real Stripe price IDs
  getAvailablePlans() {
    return [
      {
        id: 'basic',
        name: 'Starter Plan',
        description: 'Perfect for families with 1-2 children',
        planType: 'BASIC' as SubscriptionPlan,
        price: 9.99,
        yearlyPrice: 99.99,
        lifetimePrice: null,
        stripePriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_1RjxePC2961Zxi3Wku9h51bx',
        stripeYearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_1RjxePC2961Zxi3W1DWonzM2',
        stripeLifetimePriceId: null,
        currency: 'usd',
        trialDays: 7,
        maxChildren: 2,
        maxPhotoDownloads: 25,
        maxVideoDownloads: 10,
        unlimitedDownloads: false,
        premiumAlerts: false,
        aiInsights: false,
        prioritySupport: false,
        advancedAnalytics: false,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: false,
        features: ['Real-time tracking', 'Emergency features', 'Basic alerts']
      },
      {
        id: 'premium',
        name: 'Professional Plan',
        description: 'Enhanced features for active families',
        planType: 'PREMIUM' as SubscriptionPlan,
        price: 19.99,
        yearlyPrice: 199.99,
        lifetimePrice: null,
        stripePriceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || 'price_1RjxeQC2961Zxi3WYMyCkKBk',
        stripeYearlyPriceId: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || 'price_1RjxeQC2961Zxi3WJiOiKaME',
        stripeLifetimePriceId: null,
        currency: 'usd',
        trialDays: 7,
        maxChildren: 5,
        maxPhotoDownloads: 100,
        maxVideoDownloads: 50,
        unlimitedDownloads: false,
        premiumAlerts: true,
        aiInsights: true,
        prioritySupport: false,
        advancedAnalytics: true,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: true,
        features: ['Premium alerts', 'AI insights', 'Advanced analytics', 'Biometric features', 'Family sharing']
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        description: 'Unlimited access for large families',
        planType: 'ENTERPRISE' as SubscriptionPlan,
        price: 29.99,
        yearlyPrice: 299.99,
        lifetimePrice: null,
        stripePriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_1RjxeRC2961Zxi3WbYHieRfm',
        stripeYearlyPriceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_1RjxeRC2961Zxi3WiuHVSCVe',
        stripeLifetimePriceId: null,
        currency: 'usd',
        trialDays: 7,
        maxChildren: -1, // unlimited
        maxPhotoDownloads: -1, // unlimited
        maxVideoDownloads: -1, // unlimited
        unlimitedDownloads: true,
        premiumAlerts: true,
        aiInsights: true,
        prioritySupport: true,
        advancedAnalytics: true,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: true,
        features: ['Everything in Premium', 'Unlimited children', 'Priority support', 'Advanced family management']
      }
    ];
  }

  // Get plan by type
  getPlanByType(planType: SubscriptionPlan) {
    const plans = this.getAvailablePlans();
    return plans.find(plan => plan.planType === planType);
  }

  // Create a demo subscription for signup flow (no user ID required)
  async createSignupSubscription(
    planId: string, 
    paymentMethodId?: string
  ) {
    // COMPREHENSIVE DEBUGGING - START
    const debugId = `demo_signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🔍 DEMO SIGNUP DEBUG [${debugId}]: createSignupSubscription called at ${new Date().toISOString()}`);
      console.log(`🔍 DEMO SIGNUP DEBUG [${debugId}]: Parameters:`, { planId, paymentMethodId });
      console.log(`🚀 DEMO SIGNUP DEBUG [${debugId}]: Creating signup subscription for plan: ${planId}`);

      // Find the plan
      console.log(`📋 DEMO SIGNUP DEBUG [${debugId}]: Looking up plan in available plans...`);
      const plans = this.getAvailablePlans();
      console.log(`📋 DEMO SIGNUP DEBUG [${debugId}]: Available plans:`, plans.map(p => ({ id: p.id, name: p.name, type: p.planType })));
      
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        const errorMsg = `No plan found for ID: ${planId}`;
        console.error(`🚨 DEMO SIGNUP DEBUG [${debugId}]: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log(`✅ DEMO SIGNUP DEBUG [${debugId}]: Found plan for signup:`, { name: plan.name, type: plan.planType, price: plan.price });

      // Generate temporary IDs that will be linked to user later
      console.log(`🆔 DEMO SIGNUP DEBUG [${debugId}]: Generating temporary IDs...`);
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const demoCustomerId = `demo_cus_signup_${tempId}`;
      const demoSubscriptionId = `demo_sub_signup_${tempId}`;
      console.log(`✅ DEMO SIGNUP DEBUG [${debugId}]: Generated IDs:`, { tempId, demoCustomerId, demoSubscriptionId });

      // Calculate dates
      console.log(`📅 DEMO SIGNUP DEBUG [${debugId}]: Calculating subscription dates...`);
      const now = new Date();
      const trialEnd = new Date(now.getTime() + (plan.trialDays * 24 * 60 * 60 * 1000));
      const currentPeriodEnd = new Date(trialEnd.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days after trial
      console.log(`📅 DEMO SIGNUP DEBUG [${debugId}]: Dates calculated:`, {
        now: now.toISOString(),
        trialEnd: trialEnd.toISOString(),
        currentPeriodEnd: currentPeriodEnd.toISOString(),
        trialDays: plan.trialDays
      });

      // Return a mock Stripe subscription object with customer info
      console.log(`🏗️ DEMO SIGNUP DEBUG [${debugId}]: Building mock subscription object...`);
      const mockSubscription = {
        id: demoSubscriptionId,
        object: 'subscription',
        customer: {
          id: demoCustomerId,
          object: 'customer',
          created: Math.floor(now.getTime() / 1000),
          email: null, // Will be set during signup
          metadata: {
            signupFlow: 'true',
            planType: plan.planType,
            demoMode: 'true',
            tempId: tempId,
            debugId: debugId
          }
        },
        status: 'trialing',
        current_period_start: Math.floor(now.getTime() / 1000),
        current_period_end: Math.floor(currentPeriodEnd.getTime() / 1000),
        trial_start: Math.floor(now.getTime() / 1000),
        trial_end: Math.floor(trialEnd.getTime() / 1000),
        cancel_at_period_end: false,
        canceled_at: null,
        metadata: {
          planType: plan.planType,
          demoMode: 'true',
          signupFlow: 'true',
          tempId: tempId,
          planId: planId,
          debugId: debugId
        },
        latest_invoice: {
          payment_intent: {
            status: 'succeeded',
            client_secret: `demo_pi_signup_${tempId}_secret`
          }
        }
      };

      console.log(`✅ DEMO SIGNUP DEBUG [${debugId}]: Mock subscription object created:`, {
        subscriptionId: mockSubscription.id,
        customerId: mockSubscription.customer.id,
        status: mockSubscription.status,
        planType: mockSubscription.metadata.planType,
        debugId: debugId
      });

      console.log(`🎉 DEMO SIGNUP DEBUG [${debugId}]: Signup subscription created successfully!`);
      return mockSubscription;

    } catch (error) {
      console.error(`🚨 DEMO SIGNUP DEBUG [${debugId}]: Error in createSignupSubscription:`, {
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorName: error?.name,
        fullError: error,
        planId,
        paymentMethodId,
        debugId
      });
      throw error;
    }
  }

  // Create a demo subscription (simulates Stripe integration)
  async createSubscription(
    userId: string, 
    planId: string, 
    paymentMethodId?: string
  ) {
    // COMPREHENSIVE DEBUGGING - START
    const debugId = `demo_auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🔍 DEMO AUTH DEBUG [${debugId}]: createSubscription called at ${new Date().toISOString()}`);
      console.log(`🔍 DEMO AUTH DEBUG [${debugId}]: Parameters:`, { userId, planId, paymentMethodId });
      console.log(`🎭 DEMO AUTH DEBUG [${debugId}]: Creating subscription for authenticated user:`, { userId, planId, paymentMethodId });

      // Get user info
      console.log(`👤 DEMO AUTH DEBUG [${debugId}]: Looking up user in database...`);
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      console.log(`👤 DEMO AUTH DEBUG [${debugId}]: User lookup result:`, user ? { id: user.id, email: user.email, name: user.name } : 'USER NOT FOUND');

      if (!user) {
        const errorMsg = `User not found for ID: ${userId}`;
        console.error(`🚨 DEMO AUTH DEBUG [${debugId}]: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Find the plan
      console.log(`📋 DEMO AUTH DEBUG [${debugId}]: Looking up plan in available plans...`);
      const plans = this.getAvailablePlans();
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        const errorMsg = `No plan found for ID: ${planId}`;
        console.error(`🚨 DEMO AUTH DEBUG [${debugId}]: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log(`📋 DEMO AUTH DEBUG [${debugId}]: Found plan:`, { name: plan.name, type: plan.planType, price: plan.price });

      // Simulate Stripe customer creation
      console.log(`🆔 DEMO AUTH DEBUG [${debugId}]: Generating demo Stripe IDs...`);
      const demoCustomerId = `demo_cus_${userId}_${Date.now()}`;
      const demoSubscriptionId = `demo_sub_${userId}_${Date.now()}`;
      console.log(`✅ DEMO AUTH DEBUG [${debugId}]: Generated IDs:`, { demoCustomerId, demoSubscriptionId });

      // Calculate dates
      console.log(`📅 DEMO AUTH DEBUG [${debugId}]: Calculating subscription dates...`);
      const now = new Date();
      const trialEnd = new Date(now.getTime() + (plan.trialDays * 24 * 60 * 60 * 1000));
      const currentPeriodEnd = new Date(trialEnd.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days after trial
      console.log(`📅 DEMO AUTH DEBUG [${debugId}]: Dates calculated:`, {
        now: now.toISOString(),
        trialEnd: trialEnd.toISOString(),
        currentPeriodEnd: currentPeriodEnd.toISOString(),
        trialDays: plan.trialDays
      });

      // Create/update subscription record in database
      console.log(`💾 DEMO AUTH DEBUG [${debugId}]: Creating/updating subscription record in database...`);
      // CRITICAL v1.5.40-alpha.17 EMERGENCY FIX: Replace problematic upsert with explicit create/update
      // This prevents foreign key constraint violations during demo subscription creation
      console.log('🚨 EMERGENCY FIX v1.5.40-alpha.17: Using explicit create/update for demo subscription instead of problematic upsert');
      
      const existingSubscription = await prisma.userSubscription.findUnique({
        where: { userId }
      });
      
      let dbResult;
      if (existingSubscription) {
        // Update existing subscription
        dbResult = await prisma.userSubscription.update({
          where: { userId },
          data: {
            planType: plan.planType,
            status: 'TRIALING' as SubscriptionStatus,
            stripeSubscriptionId: demoSubscriptionId,
            currentPeriodStart: now,
            currentPeriodEnd: currentPeriodEnd,
            trialStart: now,
            trialEnd: trialEnd,
            cancelAtPeriodEnd: false,
            canceledAt: null,
          }
        });
      } else {
        // Create new subscription only if user exists
        const userExists = await prisma.user.findUnique({
          where: { id: userId }
        });
        
        if (userExists) {
          dbResult = await prisma.userSubscription.create({
            data: {
              userId,
              planType: plan.planType,
              status: 'TRIALING' as SubscriptionStatus,
              stripeCustomerId: demoCustomerId,
              stripeSubscriptionId: demoSubscriptionId,
              currentPeriodStart: now,
              currentPeriodEnd: currentPeriodEnd,
              trialStart: now,
              trialEnd: trialEnd,
              cancelAtPeriodEnd: false,
            }
          });
        } else {
          console.error('🚨 DEMO ERROR: User not found for demo subscription creation:', userId);
          throw new Error('User not found for demo subscription creation');
        }
      }

      console.log(`✅ DEMO AUTH DEBUG [${debugId}]: Database subscription record created/updated:`, {
        id: dbResult.id,
        userId: dbResult.userId,
        planType: dbResult.planType,
        status: dbResult.status
      });

      // Return a mock Stripe subscription object
      console.log(`🏗️ DEMO AUTH DEBUG [${debugId}]: Building mock subscription object...`);
      const mockSubscription = {
        id: demoSubscriptionId,
        object: 'subscription',
        customer: demoCustomerId,
        status: 'trialing',
        current_period_start: Math.floor(now.getTime() / 1000),
        current_period_end: Math.floor(currentPeriodEnd.getTime() / 1000),
        trial_start: Math.floor(now.getTime() / 1000),
        trial_end: Math.floor(trialEnd.getTime() / 1000),
        cancel_at_period_end: false,
        canceled_at: null,
        metadata: {
          userId,
          planType: plan.planType,
          demoMode: 'true',
          debugId: debugId
        },
        latest_invoice: {
          payment_intent: {
            status: 'succeeded',
            client_secret: 'demo_client_secret'
          }
        }
      };

      console.log(`🎉 DEMO AUTH DEBUG [${debugId}]: Subscription created successfully!`);
      return mockSubscription;

    } catch (error) {
      console.error(`🚨 DEMO AUTH DEBUG [${debugId}]: Error in createSubscription:`, {
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorName: error?.name,
        fullError: error,
        userId,
        planId,
        paymentMethodId,
        debugId
      });
      throw error;
    }
  }

  // Simulate payment intent creation
  async createPaymentIntent(userId: string, planId: string) {
    try {
      console.log('💳 DEMO MODE: Creating payment intent for:', { userId, planId });

      const plans = this.getAvailablePlans();
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error(`No plan found for ID: ${planId}`);
      }

      // Return a mock payment intent
      const mockPaymentIntent = {
        id: `demo_pi_${userId}_${Date.now()}`,
        object: 'payment_intent',
        amount: Math.round(plan.price * 100), // Convert to cents
        currency: 'usd',
        status: 'requires_confirmation',
        client_secret: `demo_pi_${userId}_${Date.now()}_secret`,
        metadata: {
          userId,
          planId,
          demoMode: 'true'
        }
      };

      console.log('✅ DEMO MODE: Payment intent created');
      return mockPaymentIntent;

    } catch (error) {
      console.error('❌ DEMO MODE: Error creating payment intent:', error);
      throw error;
    }
  }

  // Simulate payment confirmation
  async confirmPayment(paymentIntentId: string) {
    console.log('✅ DEMO MODE: Payment confirmed for:', paymentIntentId);
    
    return {
      id: paymentIntentId,
      status: 'succeeded',
      charges: {
        data: [{
          id: `demo_ch_${Date.now()}`,
          amount: 999, // $9.99 in cents
          currency: 'usd',
          status: 'succeeded'
        }]
      }
    };
  }

  // Get subscription status
  async getSubscriptionStatus(userId: string) {
    // COMPREHENSIVE DEBUGGING - START
    const debugId = `demo_status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🔍 DEMO STATUS DEBUG [${debugId}]: getSubscriptionStatus called at ${new Date().toISOString()}`);
      console.log(`🔍 DEMO STATUS DEBUG [${debugId}]: Parameters:`, { userId });
      
      console.log(`💾 DEMO STATUS DEBUG [${debugId}]: Looking up subscription in database...`);
      const subscription = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      console.log(`💾 DEMO STATUS DEBUG [${debugId}]: Subscription lookup result:`, subscription ? {
        id: subscription.id,
        userId: subscription.userId,
        planType: subscription.planType,
        status: subscription.status
      } : 'NO SUBSCRIPTION FOUND');

      if (!subscription) {
        console.log(`ℹ️ DEMO STATUS DEBUG [${debugId}]: No subscription found for user ${userId}`);
        return { hasSubscription: false, debugId };
      }

      console.log(`📋 DEMO STATUS DEBUG [${debugId}]: Getting plan details for type: ${subscription.planType}`);
      const plan = this.getPlanByType(subscription.planType);
      console.log(`📋 DEMO STATUS DEBUG [${debugId}]: Plan details:`, plan ? { id: plan.id, name: plan.name, type: plan.planType } : 'PLAN NOT FOUND');
      
      const result = {
        hasSubscription: true,
        subscription,
        plan,
        isActive: ['ACTIVE', 'TRIALING'].includes(subscription.status),
        isTrialing: subscription.status === 'TRIALING',
        trialEndsAt: subscription.trialEnd,
        currentPeriodEndsAt: subscription.currentPeriodEnd,
        debugId
      };

      console.log(`✅ DEMO STATUS DEBUG [${debugId}]: Subscription status result:`, {
        hasSubscription: result.hasSubscription,
        isActive: result.isActive,
        isTrialing: result.isTrialing,
        status: subscription.status,
        planType: subscription.planType,
        debugId
      });

      return result;

    } catch (error) {
      console.error(`🚨 DEMO STATUS DEBUG [${debugId}]: Error getting subscription status:`, {
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorName: error?.name,
        fullError: error,
        userId,
        debugId
      });
      return { hasSubscription: false, error: error?.message, debugId };
    }
  }
}

export const demoSubscriptionService = new DemoSubscriptionService();
