
// @ts-nocheck

import { stripe, stripeConfig } from './config';
import { prisma } from '../db';
import { SubscriptionStatus, BillingInterval, SubscriptionPlanType } from '@prisma/client';

export class EnhancedSubscriptionService {
  
  // Enhanced plan definitions that support both old and new pricing structures
  private getPlanDefinitions(): Record<string, any> {
    // Try to use environment variables first (for new structure)
    const envBasedPlans = {
      // New structure (Sam's 4-tier pricing)
      'starter_monthly': {
        id: 'starter',
        name: 'Starter Plan',
        planType: 'STARTER',
        trialDays: 7,
        billingInterval: 'MONTHLY',
        priceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID
      },
      'starter_yearly': {
        id: 'starter',
        name: 'Starter Plan',
        planType: 'STARTER',
        trialDays: 7,
        billingInterval: 'YEARLY',
        priceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID
      },
      'professional_monthly': {
        id: 'professional',
        name: 'Professional Plan',
        planType: 'PROFESSIONAL',
        trialDays: 7,
        billingInterval: 'MONTHLY',
        priceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID
      },
      'professional_yearly': {
        id: 'professional',
        name: 'Professional Plan',
        planType: 'PROFESSIONAL',
        trialDays: 7,
        billingInterval: 'YEARLY',
        priceId: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID
      },
      'enterprise_monthly': {
        id: 'enterprise',
        name: 'Enterprise Plan',
        planType: 'ENTERPRISE',
        trialDays: 7,
        billingInterval: 'MONTHLY',
        priceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID
      },
      'enterprise_yearly': {
        id: 'enterprise',
        name: 'Enterprise Plan',
        planType: 'ENTERPRISE',
        trialDays: 7,
        billingInterval: 'YEARLY',
        priceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID
      }
    };

    // Fallback to old structure for backward compatibility
    const legacyPlans = {
      'price_basic_monthly': {
        id: 'basic',
        name: 'Basic Plan',
        planType: 'BASIC',
        trialDays: 7,
        billingInterval: 'MONTHLY'
      },
      'price_basic_yearly': {
        id: 'basic',
        name: 'Basic Plan',
        planType: 'BASIC',
        trialDays: 7,
        billingInterval: 'YEARLY'
      },
      'price_premium_monthly': {
        id: 'premium',
        name: 'Premium Plan',
        planType: 'PREMIUM',
        trialDays: 7,
        billingInterval: 'MONTHLY'
      },
      'price_premium_yearly': {
        id: 'premium',
        name: 'Premium Plan',
        planType: 'PREMIUM',
        trialDays: 7,
        billingInterval: 'YEARLY'
      },
      'price_family_monthly': {
        id: 'enterprise',
        name: 'Enterprise Plan',
        planType: 'ENTERPRISE',
        trialDays: 7,
        billingInterval: 'MONTHLY'
      },
      'price_family_yearly': {
        id: 'enterprise',
        name: 'Enterprise Plan',
        planType: 'ENTERPRISE',
        trialDays: 7,
        billingInterval: 'YEARLY'
      },
      'price_lifetime_onetime': {
        id: 'lifetime',
        name: 'Lifetime Plan',
        planType: 'LIFETIME',
        trialDays: 0,
        billingInterval: 'LIFETIME'
      }
    };

    // Filter out plans with missing environment variables and merge with legacy
    const validEnvPlans = Object.fromEntries(
      Object.entries(envBasedPlans).filter(([key, plan]) => plan.priceId)
    );

    return { ...legacyPlans, ...validEnvPlans };
  }

  // Find plan by price ID (supports both direct price IDs and plan keys)
  private findPlanByPriceId(priceId: string): any {
    const planDefinitions = this.getPlanDefinitions();
    
    // Direct lookup
    if (planDefinitions[priceId]) {
      return planDefinitions[priceId];
    }

    // Search by actual price ID in environment variables
    for (const [key, plan] of Object.entries(planDefinitions)) {
      if (plan.priceId === priceId) {
        return plan;
      }
    }

    return null;
  }

  // Create a new Stripe customer
  async createCustomer(userId: string, email: string, name: string) {
    try {
      console.log('=== ENHANCED CREATE CUSTOMER DEBUG START ===');
      console.log('🏪 SERVICE: Starting createCustomer for:', { userId, email, name });
      
      // Check if customer already exists
      const existingSubscription = await prisma.userSubscription.findUnique({
        where: { userId }
      });
      
      if (existingSubscription?.stripeCustomerId) {
        console.log('✅ SERVICE: Customer already exists:', existingSubscription.stripeCustomerId);
        
        try {
          const existingCustomer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
          return existingCustomer;
        } catch (stripeError) {
          console.log('⚠️ SERVICE: Existing customer not found in Stripe, creating new one');
        }
      }

      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          platform: 'safeplay',
          version: 'enhanced'
        }
      });

      console.log('✅ SERVICE: Enhanced Stripe customer created:', customer.id);

      // Store the customer ID
      if (existingSubscription) {
        await prisma.userSubscription.update({
          where: { userId },
          data: { stripeCustomerId: customer.id }
        });
      }

      return customer;
    } catch (error) {
      console.error('❌ ENHANCED SERVICE: Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Create a subscription with enhanced plan support
  async createSubscription(
    userId: string, 
    priceId: string, 
    paymentMethodId?: string,
    discountCodeId?: string
  ) {
    try {
      console.log('=== ENHANCED CREATE SUBSCRIPTION DEBUG START ===');
      console.log('🎯 ENHANCED SERVICE: Creating subscription with new plan support');
      console.log('🔍 ENHANCED SERVICE: Plan lookup for price ID:', priceId);

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        const enhancedError = new Error(`STALE_SESSION_ERROR: Your session has expired. Please sign out and sign back in.`);
        enhancedError.name = 'StaleSessionError';
        (enhancedError as any).userFriendlyMessage = 'Your session has expired. Please sign out and sign back in to continue.';
        throw enhancedError;
      }

      // Find plan using enhanced lookup
      const plan = this.findPlanByPriceId(priceId);
      
      console.log('📋 ENHANCED SERVICE: Plan lookup result:', {
        found: !!plan,
        planName: plan?.name,
        planType: plan?.planType,
        priceId: priceId,
        resolvedPriceId: plan?.priceId || priceId
      });

      if (!plan) {
        const availablePlans = Object.keys(this.getPlanDefinitions());
        console.log('❌ ENHANCED SERVICE: No plan found. Available plans:', availablePlans);
        throw new Error(`No plan found for price ID: ${priceId}. This may be due to missing environment variables for the new pricing structure.`);
      }

      // Get or create customer
      let userSub = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      let stripeCustomerId: string;
      if (!userSub?.stripeCustomerId) {
        const customer = await this.createCustomer(userId, user.email, user.name);
        stripeCustomerId = customer.id;
      } else {
        stripeCustomerId = userSub.stripeCustomerId;
      }

      // Use the resolved price ID (either from plan.priceId or the original priceId)
      const finalPriceId = plan.priceId || priceId;
      
      console.log('🚀 ENHANCED SERVICE: Creating subscription with price ID:', finalPriceId);

      const subscriptionParams: any = {
        customer: stripeCustomerId,
        items: [{ price: finalPriceId }],
        metadata: {
          userId,
          planType: plan.planType,
          version: 'enhanced'
        },
        expand: ['latest_invoice.payment_intent'],
      };

      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      // Handle discount code
      if (discountCodeId) {
        try {
          const { discountService } = await import('./discount-service');
          const discountCode = await prisma.discountCode.findUnique({
            where: { id: discountCodeId }
          });

          if (discountCode?.stripeCouponId) {
            const validation = await discountService.validateDiscountCode(
              discountCode.code,
              userId,
              plan.planType as any,
              undefined
            );

            if (validation.isValid) {
              subscriptionParams.coupon = discountCode.stripeCouponId;
              subscriptionParams.metadata.discountCodeId = discountCodeId;
            }
          }
        } catch (discountError) {
          console.log('⚠️ ENHANCED SERVICE: Error processing discount:', discountError);
        }
      }

      // Add trial period
      if (plan.trialDays && plan.trialDays > 0) {
        subscriptionParams.trial_period_days = plan.trialDays;
      }

      console.log('🔗 ENHANCED SERVICE: Creating subscription in Stripe...');
      const subscription = await stripe.subscriptions.create(subscriptionParams);

      console.log('✅ ENHANCED SERVICE: Stripe subscription created:', subscription.id);

      // Save to database
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
          planType: plan.planType as any,
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
          planType: plan.planType as any,
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

      console.log('🎉 ENHANCED SERVICE: Subscription created successfully!');
      return subscription;
    } catch (error) {
      console.error('❌ ENHANCED SERVICE: Error creating subscription:', error);
      throw error;
    }
  }

  // Helper method to map Stripe status to Prisma enum
  private mapStripeStatusToPrisma(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'trialing': SubscriptionStatus.TRIALING,
      'active': SubscriptionStatus.ACTIVE,
      'past_due': SubscriptionStatus.PAST_DUE,
      'canceled': SubscriptionStatus.CANCELED,
      'unpaid': SubscriptionStatus.UNPAID,
      'incomplete': SubscriptionStatus.INCOMPLETE,
      'incomplete_expired': SubscriptionStatus.INCOMPLETE_EXPIRED,
    };
    return statusMap[stripeStatus] || SubscriptionStatus.INCOMPLETE;
  }

  // Get available plans (combines old and new structures)
  async getAvailablePlans(): Promise<any[]> {
    const planDefinitions = this.getPlanDefinitions();
    
    return Object.entries(planDefinitions).map(([key, plan]) => ({
      id: plan.id,
      name: plan.name,
      planType: plan.planType,
      priceId: plan.priceId || key,
      billingInterval: plan.billingInterval,
      trialDays: plan.trialDays,
      isNewStructure: !!plan.priceId // Indicates if this is from the new pricing structure
    }));
  }

  // Test method to verify pricing structure
  async testPricingStructure(): Promise<{
    legacy: any[];
    enhanced: any[];
    total: number;
  }> {
    const plans = await this.getAvailablePlans();
    
    const legacy = plans.filter(p => !p.isNewStructure);
    const enhanced = plans.filter(p => p.isNewStructure);
    
    return {
      legacy,
      enhanced,
      total: plans.length
    };
  }
}

export const enhancedSubscriptionService = new EnhancedSubscriptionService();
