
import { prisma } from '../db';
import { SubscriptionStatus, SubscriptionPlan } from '@prisma/client';

// Demo subscription service for development/demo environments
export class DemoSubscriptionService {
  
  // Get all available plans
  getAvailablePlans() {
    return [
      {
        id: 'basic',
        name: 'Basic Plan',
        description: 'Perfect for families with 1-2 children',
        planType: 'BASIC' as SubscriptionPlan,
        price: 9.99,
        yearlyPrice: 99.99,
        lifetimePrice: null,
        stripePriceId: 'demo_price_basic_monthly',
        stripeYearlyPriceId: 'demo_price_basic_yearly',
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
        name: 'Premium Plan',
        description: 'Enhanced features for active families',
        planType: 'PREMIUM' as SubscriptionPlan,
        price: 19.99,
        yearlyPrice: 199.99,
        lifetimePrice: null,
        stripePriceId: 'demo_price_premium_monthly',
        stripeYearlyPriceId: 'demo_price_premium_yearly',
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
        id: 'family',
        name: 'Family Plan',
        description: 'Unlimited access for large families',
        planType: 'FAMILY' as SubscriptionPlan,
        price: 29.99,
        yearlyPrice: 299.99,
        lifetimePrice: null,
        stripePriceId: 'demo_price_family_monthly',
        stripeYearlyPriceId: 'demo_price_family_yearly',
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
    try {
      console.log('🚀 DEMO MODE: Creating signup subscription for plan:', planId);

      // Find the plan
      const plans = this.getAvailablePlans();
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error(`No plan found for ID: ${planId}`);
      }

      console.log('📋 DEMO MODE: Found plan for signup:', plan.name, 'Type:', plan.planType);

      // Generate temporary IDs that will be linked to user later
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const demoCustomerId = `demo_cus_signup_${tempId}`;
      const demoSubscriptionId = `demo_sub_signup_${tempId}`;

      // Calculate dates
      const now = new Date();
      const trialEnd = new Date(now.getTime() + (plan.trialDays * 24 * 60 * 60 * 1000));
      const currentPeriodEnd = new Date(trialEnd.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days after trial

      // Return a mock Stripe subscription object with customer info
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
            tempId: tempId
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
          planId: planId
        },
        latest_invoice: {
          payment_intent: {
            status: 'succeeded',
            client_secret: `demo_pi_signup_${tempId}_secret`
          }
        }
      };

      console.log('🎉 DEMO MODE: Signup subscription created successfully!');
      return mockSubscription;

    } catch (error) {
      console.error('❌ DEMO MODE: Error in createSignupSubscription:', error);
      throw error;
    }
  }

  // Create a demo subscription (simulates Stripe integration)
  async createSubscription(
    userId: string, 
    planId: string, 
    paymentMethodId?: string
  ) {
    try {
      console.log('🎭 DEMO MODE: Creating subscription for:', { userId, planId, paymentMethodId });

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Find the plan
      const plans = this.getAvailablePlans();
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error(`No plan found for ID: ${planId}`);
      }

      console.log('📋 DEMO MODE: Found plan:', plan.name, 'Type:', plan.planType);

      // Simulate Stripe customer creation
      const demoCustomerId = `demo_cus_${userId}_${Date.now()}`;
      const demoSubscriptionId = `demo_sub_${userId}_${Date.now()}`;

      // Calculate dates
      const now = new Date();
      const trialEnd = new Date(now.getTime() + (plan.trialDays * 24 * 60 * 60 * 1000));
      const currentPeriodEnd = new Date(trialEnd.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days after trial

      // Create/update subscription record in database
      await prisma.userSubscription.upsert({
        where: { userId },
        create: {
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
        },
        update: {
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

      console.log('✅ DEMO MODE: Database subscription record created/updated');

      // Return a mock Stripe subscription object
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
          demoMode: 'true'
        },
        latest_invoice: {
          payment_intent: {
            status: 'succeeded',
            client_secret: 'demo_client_secret'
          }
        }
      };

      console.log('🎉 DEMO MODE: Subscription created successfully!');
      return mockSubscription;

    } catch (error) {
      console.error('❌ DEMO MODE: Error in createSubscription:', error);
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
    try {
      const subscription = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      if (!subscription) {
        return { hasSubscription: false };
      }

      const plan = this.getPlanByType(subscription.planType);
      
      return {
        hasSubscription: true,
        subscription,
        plan,
        isActive: ['ACTIVE', 'TRIALING'].includes(subscription.status),
        isTrialing: subscription.status === 'TRIALING',
        trialEndsAt: subscription.trialEnd,
        currentPeriodEndsAt: subscription.currentPeriodEnd
      };

    } catch (error) {
      console.error('Error getting subscription status:', error);
      return { hasSubscription: false, error: error.message };
    }
  }
}

export const demoSubscriptionService = new DemoSubscriptionService();
