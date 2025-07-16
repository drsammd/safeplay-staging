

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
    stripePriceId: process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID || 'price_family_monthly',
    stripeYearlyPriceId: process.env.STRIPE_FAMILY_YEARLY_PRICE_ID || 'price_family_yearly',
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

      // 🔧 CRITICAL FIX: Ensure payment method is attached before creating subscription
      if (!paymentMethodId) {
        throw new Error('Payment method is required for paid subscriptions. Please add a payment method first.');
      }

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

      // 🔧 CRITICAL FIX v1.5.14: Enhanced payment method attachment with comprehensive error handling
      if (paymentMethodId) {
        console.log('💳 FIXED SERVICE v1.5.14: Starting payment method attachment process...');
        console.log('💳 FIXED SERVICE v1.5.14: Payment method ID:', paymentMethodId);
        console.log('💳 FIXED SERVICE v1.5.14: Customer ID:', stripeCustomerId);
        
        try {
          // First, verify the payment method exists
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
          console.log('✅ FIXED SERVICE v1.5.14: Payment method retrieved:', {
            id: paymentMethod.id,
            type: paymentMethod.type,
            customer: paymentMethod.customer
          });
          
          // Check if payment method is already attached to this customer
          if (paymentMethod.customer === stripeCustomerId) {
            console.log('✅ FIXED SERVICE v1.5.14: Payment method already attached to customer');
          } else if (paymentMethod.customer && paymentMethod.customer !== stripeCustomerId) {
            console.log('⚠️ FIXED SERVICE v1.5.14: Payment method attached to different customer, detaching first...');
            // Detach from previous customer
            await stripe.paymentMethods.detach(paymentMethodId);
            console.log('✅ FIXED SERVICE v1.5.14: Payment method detached from previous customer');
          }
          
          // Attach payment method to customer if not already attached
          if (paymentMethod.customer !== stripeCustomerId) {
            console.log('💳 FIXED SERVICE v1.5.14: Attaching payment method to customer...');
            await stripe.paymentMethods.attach(paymentMethodId, {
              customer: stripeCustomerId,
            });
            console.log('✅ FIXED SERVICE v1.5.14: Payment method attached to customer:', stripeCustomerId);
          }
          
          // Set as default payment method for customer
          console.log('🔧 FIXED SERVICE v1.5.14: Setting payment method as default for customer...');
          await stripe.customers.update(stripeCustomerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
          console.log('✅ FIXED SERVICE v1.5.14: Payment method set as default for customer');
          
          // Verify the customer now has the payment method
          const updatedCustomer = await stripe.customers.retrieve(stripeCustomerId);
          console.log('🔍 FIXED SERVICE v1.5.14: Customer payment method verification:', {
            customerId: updatedCustomer.id,
            defaultPaymentMethod: updatedCustomer.invoice_settings?.default_payment_method,
            expectedPaymentMethod: paymentMethodId,
            matches: updatedCustomer.invoice_settings?.default_payment_method === paymentMethodId
          });
          
          // Add to subscription params
          subscriptionParams.default_payment_method = paymentMethodId;
          console.log('✅ FIXED SERVICE v1.5.14: Payment method added to subscription params');
          
        } catch (attachError) {
          console.error('❌ FIXED SERVICE v1.5.14: Error in payment method attachment process:', attachError);
          console.error('❌ FIXED SERVICE v1.5.14: Error details:', {
            message: attachError?.message,
            type: attachError?.type,
            code: attachError?.code,
            decline_code: attachError?.decline_code,
            request_log_url: attachError?.request_log_url
          });
          
          // Enhanced error handling for specific Stripe errors
          if (attachError?.message?.includes('already attached')) {
            console.log('⚠️ FIXED SERVICE v1.5.14: Payment method already attached, continuing...');
            subscriptionParams.default_payment_method = paymentMethodId;
          } else if (attachError?.code === 'resource_missing') {
            throw new Error(`Payment method not found: ${paymentMethodId}. Please try creating a new payment method.`);
          } else if (attachError?.code === 'card_declined') {
            throw new Error(`Payment method declined: ${attachError?.decline_code || 'Unknown reason'}`);
          } else if (attachError?.code === 'invalid_request_error') {
            throw new Error(`Invalid payment method: ${attachError?.message}`);
          } else {
            throw new Error(`Failed to attach payment method: ${attachError?.message || 'Unknown error'}`);
          }
        }
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

  // Create FREE Plan Subscription - for users without existing subscriptions
  async createFreePlanSubscription(userId: string, email: string, name: string) {
    try {
      console.log('🆓 FIXED SERVICE: Creating FREE plan subscription for:', { userId, email, name });
      
      // Check if user already has a subscription
      const existingSubscription = await prisma.userSubscription.findUnique({
        where: { userId }
      });
      
      if (existingSubscription) {
        console.log('✅ FIXED SERVICE: User already has subscription, returning existing');
        return existingSubscription;
      }

      // Get or create Stripe customer
      const customer = await this.createCustomer(userId, email, name);
      console.log('✅ FIXED SERVICE: Customer created/retrieved:', customer.id);

      // Create FREE plan subscription record in database
      const freeSubscription = await prisma.userSubscription.create({
        data: {
          userId,
          planType: 'FREE',
          status: 'ACTIVE',
          stripeCustomerId: customer.id,
          stripeSubscriptionId: null, // FREE plan doesn't need Stripe subscription
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          cancelAtPeriodEnd: false,
          canceledAt: null,
          trialStart: null,
          trialEnd: null,
        }
      });

      console.log('✅ FIXED SERVICE: FREE plan subscription created in database');
      
      // Log subscription creation
      await this.logSubscriptionChange(userId, 'CREATED', { id: 'free-plan', status: 'active' });

      return freeSubscription;
    } catch (error) {
      console.error('❌ FIXED SERVICE: Error creating FREE plan subscription:', error);
      throw error;
    }
  }

  // 🔧 CRITICAL FIX: Enhanced changeSubscription to properly handle FREE plan upgrades
  async changeSubscription(userId: string, newPriceId: string, paymentMethodId?: string) {
    try {
      console.log('🔄 FIXED SERVICE: Starting changeSubscription for:', { userId, newPriceId, hasPaymentMethod: !!paymentMethodId });

      let userSub = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      // If user doesn't have a subscription record, create a FREE plan first
      if (!userSub) {
        console.log('🆓 FIXED SERVICE: User has no subscription record, creating FREE plan first');
        
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });
        
        if (!user) {
          throw new Error('User not found');
        }

        // Create FREE plan subscription
        userSub = await this.createFreePlanSubscription(userId, user.email, user.name);
        console.log('✅ FIXED SERVICE: FREE plan subscription created for upgrade');
      }

      // 🔧 CRITICAL FIX: Handle FREE plan upgrades with payment method requirement
      if (!userSub.stripeSubscriptionId) {
        console.log('🆓 FIXED SERVICE: User has FREE plan, creating new paid subscription');
        
        // For FREE plan upgrades, payment method is required
        if (!paymentMethodId) {
          throw new Error('Payment method is required to upgrade from FREE plan. Please add a payment method first.');
        }
        
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });
        
        if (!user) {
          throw new Error('User not found');
        }

        // Create new subscription with payment method (this will upgrade from FREE to paid)
        const newSubscription = await this.createSubscription(userId, newPriceId, paymentMethodId);
        console.log('✅ FIXED SERVICE: New subscription created for FREE plan upgrade');
        
        return newSubscription;
      }

      // User has existing paid subscription, modify it
      console.log('🔄 FIXED SERVICE: User has existing paid subscription, modifying it');
      
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
      console.error('❌ FIXED SERVICE: Error changing subscription:', error);
      throw error;
    }
  }

  // 🔧 CRITICAL FIX: Enhanced downgrade to FREE plan functionality
  async downgradeToFreePlan(userId: string) {
    try {
      console.log('🔄 FIXED SERVICE: Starting downgrade to FREE plan for:', { userId });

      let userSub = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      if (!userSub) {
        throw new Error('No active subscription found');
      }

      // If user already has FREE plan, return early
      if (userSub.planType === 'FREE') {
        console.log('✅ FIXED SERVICE: User already has FREE plan');
        return userSub;
      }

      // If user has paid subscription, cancel it and switch to FREE
      if (userSub.stripeSubscriptionId) {
        console.log('🔄 FIXED SERVICE: Canceling paid subscription and switching to FREE');
        
        // Cancel the Stripe subscription
        await stripe.subscriptions.cancel(userSub.stripeSubscriptionId);
        
        // Update database to FREE plan
        const updatedSubscription = await prisma.userSubscription.update({
          where: { userId },
          data: {
            planType: 'FREE',
            status: 'ACTIVE',
            stripeSubscriptionId: null, // FREE plan doesn't need Stripe subscription
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            cancelAtPeriodEnd: false,
            canceledAt: null,
            trialStart: null,
            trialEnd: null,
          }
        });

        console.log('✅ FIXED SERVICE: Successfully downgraded to FREE plan');
        
        // Log subscription change
        await this.logSubscriptionChange(userId, 'DOWNGRADED', { id: 'free-plan', status: 'active' });
        
        return updatedSubscription;
      }

      // User already has FREE plan
      console.log('✅ FIXED SERVICE: User already has FREE plan');
      return userSub;
    } catch (error) {
      console.error('❌ FIXED SERVICE: Error downgrading to FREE plan:', error);
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
