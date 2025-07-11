// @ts-nocheck

import { stripe, stripeConfig } from './config';
import { prisma } from '../db';
import { SubscriptionStatus, BillingInterval, SubscriptionPlanType } from '@prisma/client';

export class SubscriptionService {
  
  // Create a new Stripe customer
  async createCustomer(userId: string, email: string, name: string) {
    try {
      console.log('=== CREATE CUSTOMER DEBUG START ===');
      console.log('🏪 SERVICE: Starting createCustomer for:', { userId, email, name });
      console.log('🏪 SERVICE: Timestamp:', new Date().toISOString());
      
      // First check if customer already exists to prevent duplicates
      const existingSubscription = await prisma.userSubscription.findUnique({
        where: { userId }
      });
      
      console.log('🔍 SERVICE: Existing subscription check in createCustomer:', {
        hasExisting: !!existingSubscription,
        hasStripeCustomerId: !!existingSubscription?.stripeCustomerId,
        fullRecord: existingSubscription
      });

      // If customer already exists, return early to prevent duplicate creation
      if (existingSubscription?.stripeCustomerId) {
        console.log('✅ SERVICE: Customer already exists, skipping creation:', existingSubscription.stripeCustomerId);
        
        // Verify customer exists in Stripe
        try {
          const existingCustomer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
          console.log('✅ SERVICE: Verified existing customer in Stripe:', {
            id: existingCustomer.id,
            email: (existingCustomer as any).email
          });
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

      console.log('✅ SERVICE: Stripe customer created:', {
        customerId: customer.id,
        email: customer.email,
        name: customer.name
      });

      // Store the customer ID in database
      if (existingSubscription) {
        console.log('📝 SERVICE: Updating existing subscription with customer ID');
        await prisma.userSubscription.update({
          where: { userId },
          data: {
            stripeCustomerId: customer.id,
          }
        });
      }
      // Don't create subscription record here - wait for successful payment

      console.log('✅ SERVICE: createCustomer completed successfully');
      return customer;
    } catch (error) {
      console.error('❌ SERVICE: Error creating Stripe customer:', error);
      console.error('❌ SERVICE: Customer creation error details:', {
        userId,
        email,
        name,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
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
      console.log('=== CREATE SUBSCRIPTION DEBUG START ===');
      console.log('🎯 SERVICE: Starting createSubscription for:', { 
        userId, 
        priceId, 
        hasPaymentMethod: !!paymentMethodId,
        hasDiscountCode: !!discountCodeId,
        timestamp: new Date().toISOString()
      });

      // Get user info
      console.log('👤 SERVICE: Looking up user in database...');
      console.log('🔍 SERVICE: Searching for userId:', userId);
      console.log('🔍 SERVICE: UserId type:', typeof userId);
      console.log('🔍 SERVICE: UserId length:', userId?.length);
      
      // 🔍 AGGRESSIVE DEBUGGING: Trace phantom user ID "cmcxeysqi0000jiij569qtc8m"
      const PHANTOM_USER_ID = 'cmcxeysqi0000jiij569qtc8m';
      const isPhantomUser = userId === PHANTOM_USER_ID;
      
      if (isPhantomUser) {
        console.log('🚨🚨🚨 PHANTOM USER ID DETECTED! 🚨🚨🚨');
        console.log('🔍 TARGET USER ID:', userId);
        console.log('🔍 Call Stack:', new Error().stack);
        console.log('🔍 Function: createSubscription in subscription-service.ts');
        console.log('🔍 Time:', new Date().toISOString());
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      console.log('👤 SERVICE: User lookup result:', {
        found: !!user,
        email: user?.email,
        name: user?.name,
        searchedId: userId,
        isPhantomUser: isPhantomUser
      });

      if (!user) {
        console.log('❌ SERVICE: User not found in createSubscription');
        console.log('🔍 SERVICE: Phantom user ID detected:', userId);
        console.log('🔍 SERVICE: This may be from cached/stale session data');
        
        if (isPhantomUser) {
          console.log('🚨 CONFIRMED: This is the specific phantom user ID we\'re tracking!');
          console.log('🔍 This confirms the issue is stale session data with deleted user');
        }
        
        // Check if there are any similar user IDs in database
        console.log('🔍 SERVICE: Checking for similar user IDs...');
        try {
          const recentUsers = await prisma.user.findMany({
            select: { id: true, email: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5
          });
          console.log('🔍 SERVICE: Recent users:', recentUsers.map(u => ({ id: u.id, email: u.email })));
        } catch (similarError) {
          console.log('❌ SERVICE: Could not fetch similar users:', similarError.message);
        }
        
        // FIXED: Enhanced error message with better user guidance
        const enhancedError = new Error(`STALE_SESSION_ERROR: Your session has expired or become invalid. Please sign out and sign back in to continue.`);
        enhancedError.name = 'StaleSessionError';
        enhancedError.cause = 'PHANTOM_USER_ID';
        (enhancedError as any).userFriendlyMessage = 'Your session has expired. Please sign out and sign back in to continue.';
        (enhancedError as any).actionRequired = 'SIGN_OUT_AND_BACK_IN';
        (enhancedError as any).details = {
          userId: userId,
          userIdType: typeof userId,
          userIdLength: userId?.length,
          timestamp: new Date().toISOString(),
          suggestion: 'Sign out and sign back in to refresh session',
          isPhantomUser: isPhantomUser
        };
        
        throw enhancedError;
      }

      // Get or create customer
      console.log('🔍 SERVICE: Looking up existing subscription...');
      let userSub = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { user: true, plan: true }
      });

      console.log('🔍 SERVICE: Existing subscription lookup result:', {
        found: !!userSub,
        hasStripeCustomerId: !!userSub?.stripeCustomerId,
        currentPlan: userSub?.plan?.name
      });

      let stripeCustomerId: string;

      if (!userSub?.stripeCustomerId) {
        console.log('🏪 SERVICE: Creating customer in createSubscription...');
        // Create customer first if it doesn't exist
        const customer = await this.createCustomer(userId, user.email, user.name);
        stripeCustomerId = customer.id;
        console.log('✅ SERVICE: Customer created/retrieved:', stripeCustomerId);
      } else {
        stripeCustomerId = userSub.stripeCustomerId;
        console.log('✅ SERVICE: Using existing customer:', stripeCustomerId);
      }

      // Find the plan associated with this price ID (use hardcoded plans since SubscriptionPlan table doesn't exist)
      console.log('📋 SERVICE: Looking up subscription plan for price:', priceId);
      
      // Hardcoded plan definitions to match the plans API
      const PLAN_DEFINITIONS = {
        'price_basic_monthly': { id: 'basic', name: 'Basic Plan', planType: 'BASIC', trialDays: 7, billingInterval: 'MONTHLY' },
        'price_basic_yearly': { id: 'basic', name: 'Basic Plan', planType: 'BASIC', trialDays: 7, billingInterval: 'YEARLY' },
        'price_premium_monthly': { id: 'premium', name: 'Premium Plan', planType: 'PREMIUM', trialDays: 7, billingInterval: 'MONTHLY' },
        'price_premium_yearly': { id: 'premium', name: 'Premium Plan', planType: 'PREMIUM', trialDays: 7, billingInterval: 'YEARLY' },
        'price_family_monthly': { id: 'family', name: 'Family Plan', planType: 'FAMILY', trialDays: 7, billingInterval: 'MONTHLY' },
        'price_family_yearly': { id: 'family', name: 'Family Plan', planType: 'FAMILY', trialDays: 7, billingInterval: 'YEARLY' },
        'price_lifetime_onetime': { id: 'lifetime', name: 'Lifetime Plan', planType: 'LIFETIME', trialDays: 0, billingInterval: 'LIFETIME' }
      };
      
      const plan = PLAN_DEFINITIONS[priceId];

      console.log('📋 SERVICE: Plan lookup result:', {
        found: !!plan,
        planName: plan?.name,
        planType: plan?.planType,
        trialDays: plan?.trialDays
      });

      if (!plan) {
        console.log('❌ SERVICE: No plan found for price ID:', priceId);
        console.log('📋 SERVICE: Available price IDs:', Object.keys(PLAN_DEFINITIONS));
        throw new Error(`No plan found for price ID: ${priceId}. Available: ${Object.keys(PLAN_DEFINITIONS).join(', ')}`);
      }

      console.log('⚙️ SERVICE: Building subscription parameters...');
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
        console.log('💳 SERVICE: Adding payment method to subscription');
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      // Handle discount code if provided
      if (discountCodeId) {
        console.log('🎫 SERVICE: Processing discount code...');
        try {
          const { discountService } = await import('./discount-service');
          
          // Get the discount code
          const discountCode = await prisma.discountCode.findUnique({
            where: { id: discountCodeId }
          });

          console.log('🎫 SERVICE: Discount code lookup:', {
            found: !!discountCode,
            code: discountCode?.code,
            hasStripeCoupon: !!discountCode?.stripeCouponId
          });

          if (discountCode && discountCode.stripeCouponId) {
            // Validate the discount code
            const validation = await discountService.validateDiscountCode(
              discountCode.code,
              userId,
              plan.planType as any,
              undefined // We don't know the exact amount yet
            );

            console.log('🎫 SERVICE: Discount validation result:', validation);

            if (validation.isValid) {
              subscriptionParams.coupon = discountCode.stripeCouponId;
              subscriptionParams.metadata.discountCodeId = discountCodeId;
              console.log('✅ SERVICE: Discount applied to subscription');
            }
          }
        } catch (discountError) {
          console.log('⚠️ SERVICE: Error processing discount code:', discountError);
          // Continue without discount if there's an error
        }
      }

      // Add 7-day trial for all plans
      if (plan.trialDays && plan.trialDays > 0) {
        console.log('🆓 SERVICE: Adding trial period:', plan.trialDays, 'days');
        subscriptionParams.trial_period_days = plan.trialDays;
      }

      console.log('🚀 SERVICE: Final subscription parameters:', {
        customer: stripeCustomerId,
        priceId,
        hasPaymentMethod: !!subscriptionParams.default_payment_method,
        hasCoupon: !!subscriptionParams.coupon,
        trialDays: subscriptionParams.trial_period_days
      });

      console.log('🔗 SERVICE: Creating subscription in Stripe...');
      const subscription = await stripe.subscriptions.create(subscriptionParams);

      console.log('✅ SERVICE: Stripe subscription created successfully:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: subscription.customer,
        hasLatestInvoice: !!subscription.latest_invoice
      });

      // Create subscription record in database only after Stripe success
      console.log('💾 SERVICE: Creating subscription record in database...');
      const currentPeriodStart = (subscription as any).current_period_start 
        ? new Date((subscription as any).current_period_start * 1000) 
        : new Date();
      const currentPeriodEnd = (subscription as any).current_period_end 
        ? new Date((subscription as any).current_period_end * 1000) 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      console.log('📅 SERVICE: Subscription period dates:', {
        currentPeriodStart,
        currentPeriodEnd
      });

      await prisma.userSubscription.upsert({
        where: { userId },
        create: {
          userId,
          planType: plan.planType as any,
          status: this.mapStripeStatusToPrisma((subscription as any).status),
          stripeCustomerId,
          stripeSubscriptionId: (subscription as any).id,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
          canceledAt: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000) : null,
          trialStart: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000) : null,
          trialEnd: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
        },
        update: {
          planType: plan.planType as any,
          status: this.mapStripeStatusToPrisma((subscription as any).status),
          stripeSubscriptionId: (subscription as any).id,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
          canceledAt: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000) : null,
          trialStart: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000) : null,
          trialEnd: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
        }
      });

      console.log('✅ SERVICE: Database subscription record created/updated');

      // Record discount usage if discount was applied
      if (discountCodeId && (subscription as any).discounts && (subscription as any).discounts.length > 0) {
        console.log('🎫 SERVICE: Recording discount usage...');
        try {
          const { discountService } = await import('./discount-service');
          const dbSubscription = await prisma.userSubscription.findUnique({
            where: { userId }
          });
          if (dbSubscription) {
            await discountService.recordDiscountUsage(discountCodeId, userId, {
              subscriptionId: dbSubscription.id,
              planType: plan.planType as any
            });
            console.log('✅ SERVICE: Discount usage recorded');
          }
        } catch (discountError) {
          console.log('⚠️ SERVICE: Error recording discount usage:', discountError);
        }
      }

      // Log subscription history
      console.log('📝 SERVICE: Logging subscription change...');
      try {
        await this.logSubscriptionChange(userId, 'CREATED', subscription);
        console.log('✅ SERVICE: Subscription history logged');
      } catch (historyError) {
        console.log('⚠️ SERVICE: Error logging subscription history:', historyError);
      }

      console.log('🎉 SERVICE: createSubscription completed successfully!');
      return subscription;
    } catch (error) {
      console.error('❌ SERVICE: Error in createSubscription:', error);
      console.error('❌ SERVICE: createSubscription error details:', {
        userId,
        priceId,
        hasPaymentMethod: !!paymentMethodId,
        hasDiscountCode: !!discountCodeId,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // Update subscription from Stripe data
  async updateSubscriptionFromStripe(stripeSubscription: any) {
    try {
      const userId = stripeSubscription.metadata?.userId;
      if (!userId) {
        throw new Error('Missing userId in subscription metadata');
      }

      // Handle dates properly for trial subscriptions
      const currentPeriodStart = stripeSubscription.current_period_start 
        ? new Date(stripeSubscription.current_period_start * 1000) 
        : new Date();
      const currentPeriodEnd = stripeSubscription.current_period_end 
        ? new Date(stripeSubscription.current_period_end * 1000) 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      console.log('📅 Service: Updating subscription with dates:', {
        current_period_start: stripeSubscription.current_period_start,
        current_period_end: stripeSubscription.current_period_end,
        computed_start: currentPeriodStart,
        computed_end: currentPeriodEnd
      });

      await prisma.userSubscription.update({
        where: { userId },
        data: {
          stripeSubscriptionId: stripeSubscription.id,
          status: this.mapStripeStatusToPrisma(stripeSubscription.status),
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
          trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
          trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        }
      });

      // Log subscription history
      await this.logSubscriptionChange(userId, 'CREATED', stripeSubscription);

    } catch (error) {
      console.error('Error updating subscription from Stripe:', error);
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

      await this.updateSubscriptionFromStripe(canceledSubscription);
      await this.logSubscriptionChange(userId, 'CANCELED', canceledSubscription);

      return canceledSubscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Upgrade/downgrade subscription
  async changeSubscription(userId: string, newPriceId: string) {
    try {
      console.log('🔄 SubscriptionService.changeSubscription called');
      console.log('Parameters:', { userId, newPriceId });

      const userSub = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      console.log('User subscription found:', {
        exists: !!userSub,
        stripeSubscriptionId: userSub?.stripeSubscriptionId,
        stripeCustomerId: userSub?.stripeCustomerId
      });

      if (!userSub?.stripeSubscriptionId) {
        console.log('❌ No active subscription found in changeSubscription');
        throw new Error('No active subscription found');
      }

      console.log('🔍 Retrieving subscription from Stripe...');
      const subscription = await stripe.subscriptions.retrieve(userSub.stripeSubscriptionId);
      
      console.log('✅ Stripe subscription retrieved:', {
        id: subscription.id,
        status: subscription.status,
        itemsCount: subscription.items.data.length,
        currentPriceId: subscription.items.data[0]?.price?.id
      });

      console.log('🔄 Updating subscription with new price...');
      const updatedSubscription = await stripe.subscriptions.update(userSub.stripeSubscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      console.log('✅ Stripe subscription updated:', {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        newPriceId: updatedSubscription.items.data[0]?.price?.id
      });

      console.log('💾 Updating subscription from Stripe data...');
      await this.updateSubscriptionFromStripe(updatedSubscription);
      
      console.log('📝 Logging subscription change...');
      await this.logSubscriptionChange(userId, 'UPGRADED', updatedSubscription);

      console.log('✅ Subscription change completed successfully');
      return updatedSubscription;
    } catch (error) {
      console.error('❌ Error changing subscription:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // Helper methods
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

  private async logSubscriptionChange(userId: string, changeType: string, stripeData: any) {
    try {
      // Get the actual plan type from the user's subscription
      const userSub = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      const planType = userSub?.planType || 'BASIC'; // Use actual plan type or fallback to BASIC
      
      await prisma.subscriptionHistory.create({
        data: {
          userId,
          planType: planType as any,
          action: changeType as any,
          newStatus: this.mapStripeStatusToPrisma(stripeData.status),
          effectiveDate: new Date(),
          metadata: stripeData,
        }
      });
    } catch (error) {
      console.error('Error logging subscription change:', error);
    }
  }



  // Check subscription status and features
  async checkSubscriptionAccess(userId: string, feature: string): Promise<boolean> {
    try {
      const userSub = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true }
      });

      if (!userSub || userSub.status !== SubscriptionStatus.ACTIVE) {
        return false;
      }

      const plan = userSub.plan;
      
      // Check feature access based on plan
      switch (feature) {
        case 'premiumAlerts':
          return plan.premiumAlerts;
        case 'aiInsights':
          return plan.aiInsights;
        case 'prioritySupport':
          return plan.prioritySupport;
        case 'unlimitedDownloads':
          return plan.unlimitedDownloads;
        case 'advancedAnalytics':
          return plan.advancedAnalytics;
        case 'biometricFeatures':
          return plan.biometricFeatures;
        case 'realTimeTracking':
          return plan.realTimeTracking;
        case 'emergencyFeatures':
          return plan.emergencyFeatures;
        case 'familySharing':
          return plan.familySharing;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking subscription access:', error);
      return false;
    }
  }

  // Track usage for billing
  async trackUsage(userId: string, feature: string, quantity = 1, metadata?: any) {
    try {
      const now = new Date();
      const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      await prisma.usageRecord.create({
        data: {
          userId,
          featureType: feature as any,
          quantity,
          billingPeriod,
          metadata,
          timestamp: now,
        }
      });

      // Update monthly usage counters
      await this.updateMonthlyUsage(userId, feature, quantity);
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  private async updateMonthlyUsage(userId: string, feature: string, quantity: number) {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const userSub = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      if (!userSub) return;

      // Reset counters if it's a new month
      if (userSub.lastUsageReset < monthStart) {
        await prisma.userSubscription.update({
          where: { userId },
          data: {
            monthlyPhotoDownloads: 0,
            monthlyVideoDownloads: 0,
            monthlyMemoryUsage: 0,
            monthlyAlerts: 0,
            lastUsageReset: monthStart,
          }
        });
      }

      // Update specific usage counter
      const updateData: any = {};
      switch (feature) {
        case 'PHOTO_DOWNLOAD':
          updateData.monthlyPhotoDownloads = { increment: quantity };
          break;
        case 'VIDEO_DOWNLOAD':
          updateData.monthlyVideoDownloads = { increment: quantity };
          break;
        case 'MEMORY_STORAGE':
          updateData.monthlyMemoryUsage = { increment: quantity };
          break;
        case 'ALERT_GENERATION':
          updateData.monthlyAlerts = { increment: quantity };
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.userSubscription.update({
          where: { userId },
          data: updateData
        });
      }
    } catch (error) {
      console.error('Error updating monthly usage:', error);
    }
  }
}

export const subscriptionService = new SubscriptionService();
