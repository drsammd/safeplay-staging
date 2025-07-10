
import { stripe, stripeConfig } from './config';
import { prisma } from '../db';
import { SubscriptionStatus, SubscriptionPlan } from '@prisma/client';

// Define the plan mapping to match database schema
const PLAN_DEFINITIONS = {
  BASIC: {
    id: 'basic',
    name: 'Basic Plan',
    description: 'Perfect for families with 1-2 children',
    planType: 'BASIC' as SubscriptionPlan,
    price: 9.99,
    yearlyPrice: 99.99,
    lifetimePrice: null,
    stripePriceId: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_basic_monthly',
    stripeYearlyPriceId: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || 'price_basic_yearly',
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
    biometricFeatures: false,
    realTimeTracking: true,
    emergencyFeatures: true,
    familySharing: false,
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium Plan',
    description: 'Enhanced features for active families',
    planType: 'PREMIUM' as SubscriptionPlan,
    price: 19.99,
    yearlyPrice: 199.99,
    lifetimePrice: null,
    stripePriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
    stripeYearlyPriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
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
  },
  FAMILY: {
    id: 'family',
    name: 'Family Plan',
    description: 'Unlimited access for large families',
    planType: 'FAMILY' as SubscriptionPlan,
    price: 29.99,
    yearlyPrice: 299.99,
    lifetimePrice: null,
    stripePriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_family_monthly',
    stripeYearlyPriceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_family_yearly',
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
  },
  LIFETIME: {
    id: 'lifetime',
    name: 'Lifetime Plan',
    description: 'One-time payment, lifetime access',
    planType: 'LIFETIME' as SubscriptionPlan,
    price: 0,
    yearlyPrice: null,
    lifetimePrice: 499.99,
    stripePriceId: null,
    stripeYearlyPriceId: null,
    stripeLifetimePriceId: process.env.STRIPE_LIFETIME_PRICE_ID || 'price_lifetime_onetime',
    currency: 'usd',
    trialDays: 0,
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
  }
};

export class FixedSubscriptionService {
  
  // Get all available plans
  getAvailablePlans() {
    return Object.values(PLAN_DEFINITIONS);
  }

  // Get plan by type
  getPlanByType(planType: SubscriptionPlan) {
    return PLAN_DEFINITIONS[planType];
  }

  // Get plan by price ID
  getPlanByPriceId(priceId: string) {
    return Object.values(PLAN_DEFINITIONS).find(plan => 
      plan.stripePriceId === priceId || 
      plan.stripeYearlyPriceId === priceId || 
      plan.stripeLifetimePriceId === priceId
    );
  }

  // Create a new Stripe customer
  async createCustomer(userId: string, email: string, name: string) {
    try {
      console.log('🏪 SERVICE: Starting createCustomer for:', { userId, email, name });
      
      // First check if customer already exists
      const existingSubscription = await prisma.userSubscription.findUnique({
        where: { userId }
      });
      
      console.log('🔍 SERVICE: Existing subscription check:', {
        hasExisting: !!existingSubscription,
        hasStripeCustomerId: !!existingSubscription?.stripeCustomerId
      });

      // If customer already exists, return early
      if (existingSubscription?.stripeCustomerId) {
        console.log('✅ SERVICE: Customer already exists:', existingSubscription.stripeCustomerId);
        
        // Verify customer exists in Stripe
        try {
          const existingCustomer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
          console.log('✅ SERVICE: Verified existing customer in Stripe');
          return existingCustomer;
        } catch (stripeError) {
          console.log('⚠️ SERVICE: Existing customer not found in Stripe, creating new one');
          // Continue to create new customer
        }
      }

      console.log('🏪 SERVICE: Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          platform: 'safeplay'
        }
      });

      console.log('✅ SERVICE: Stripe customer created:', customer.id);

      // Store the customer ID in database
      if (existingSubscription) {
        await prisma.userSubscription.update({
          where: { userId },
          data: { stripeCustomerId: customer.id }
        });
      }

      return customer;
    } catch (error) {
      console.error('❌ SERVICE: Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Create a subscription
  async createSubscription(
    userId: string, 
    priceId: string, 
    paymentMethodId?: string,
    discountCodeId?: string
  ) {
    try {
      console.log('🎯 SERVICE: Starting createSubscription for:', { 
        userId, 
        priceId, 
        hasPaymentMethod: !!paymentMethodId,
        hasDiscountCode: !!discountCodeId
      });

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Find the plan associated with this price ID
      const plan = this.getPlanByPriceId(priceId);
      if (!plan) {
        throw new Error(`No plan found for price ID: ${priceId}`);
      }

      console.log('📋 SERVICE: Found plan:', plan.name, 'Type:', plan.planType);

      // Get or create customer
      let userSub = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      let stripeCustomerId: string;

      if (!userSub?.stripeCustomerId) {
        console.log('🏪 SERVICE: Creating customer...');
        const customer = await this.createCustomer(userId, user.email, user.name);
        stripeCustomerId = customer.id;
      } else {
        stripeCustomerId = userSub.stripeCustomerId;
      }

      console.log('✅ SERVICE: Customer ID:', stripeCustomerId);

      // Build subscription parameters
      const subscriptionParams: any = {
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        metadata: {
          userId,
          planType: plan.planType,
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

      console.log('🔗 SERVICE: Creating subscription in Stripe...');
      const subscription = await stripe.subscriptions.create(subscriptionParams);

      console.log('✅ SERVICE: Stripe subscription created:', subscription.id);

      // Create/update subscription record in database
      const currentPeriodStart = subscription.current_period_start 
        ? new Date(subscription.current_period_start * 1000) 
        : new Date();
      const currentPeriodEnd = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000) 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.userSubscription.upsert({
        where: { userId },
        create: {
          userId,
          planType: plan.planType,
          status: this.mapStripeStatusToPrisma(subscription.status),
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        },
        update: {
          planType: plan.planType,
          status: this.mapStripeStatusToPrisma(subscription.status),
          stripeSubscriptionId: subscription.id,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        }
      });

      console.log('✅ SERVICE: Database subscription record created/updated');

      // Log subscription history
      await this.logSubscriptionChange(userId, 'CREATED', subscription);

      return subscription;
    } catch (error) {
      console.error('❌ SERVICE: Error in createSubscription:', error);
      throw error;
    }
  }

  // Change subscription
  async changeSubscription(userId: string, newPriceId: string) {
    try {
      console.log('🔄 SERVICE: Starting changeSubscription for:', { userId, newPriceId });

      const userSub = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      if (!userSub?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const subscription = await stripe.subscriptions.retrieve(userSub.stripeSubscriptionId);
      
      const updatedSubscription = await stripe.subscriptions.update(userSub.stripeSubscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      // Update database with new plan type
      const plan = this.getPlanByPriceId(newPriceId);
      if (plan) {
        await prisma.userSubscription.update({
          where: { userId },
          data: {
            planType: plan.planType,
            status: this.mapStripeStatusToPrisma(updatedSubscription.status),
          }
        });
      }

      await this.logSubscriptionChange(userId, 'UPGRADED', updatedSubscription);

      return updatedSubscription;
    } catch (error) {
      console.error('❌ SERVICE: Error changing subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string, immediately = false) {
    try {
      const userSub = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      if (!userSub?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      let canceledSubscription;
      if (immediately) {
        canceledSubscription = await stripe.subscriptions.cancel(userSub.stripeSubscriptionId);
      } else {
        canceledSubscription = await stripe.subscriptions.update(userSub.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
      }

      await prisma.userSubscription.update({
        where: { userId },
        data: {
          status: this.mapStripeStatusToPrisma(canceledSubscription.status),
          cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
          canceledAt: canceledSubscription.canceled_at ? new Date(canceledSubscription.canceled_at * 1000) : null,
        }
      });

      await this.logSubscriptionChange(userId, 'CANCELLED', canceledSubscription);

      return canceledSubscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Helper methods
  private mapStripeStatusToPrisma(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'trialing': 'TRIALING',
      'active': 'ACTIVE',
      'past_due': 'PAST_DUE',
      'canceled': 'CANCELLED',
      'unpaid': 'UNPAID',
      'incomplete': 'ACTIVE', // Treat as active for now
      'incomplete_expired': 'EXPIRED',
    };
    return statusMap[stripeStatus] as SubscriptionStatus || 'ACTIVE';
  }

  private async logSubscriptionChange(userId: string, changeType: string, stripeData: any) {
    try {
      const userSub = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      if (userSub) {
        await prisma.subscriptionHistory.create({
          data: {
            userId,
            planType: userSub.planType,
            action: changeType as any,
            newStatus: userSub.status,
            effectiveDate: new Date(),
            metadata: stripeData,
          }
        });
      }
    } catch (error) {
      console.error('Error logging subscription change:', error);
    }
  }
}

export const fixedSubscriptionService = new FixedSubscriptionService();
