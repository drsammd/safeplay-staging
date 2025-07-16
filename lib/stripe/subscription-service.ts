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
        include: { user: true, paymentMethod: true }
      });

      console.log('🔍 SERVICE: Existing subscription lookup result:', {
        found: !!userSub,
        hasStripeCustomerId: !!userSub?.stripeCustomerId,
        currentPlanType: userSub?.planType,
        hasActiveStripeSubscription: !!userSub?.stripeSubscriptionId
      });

      // 🚨 CRITICAL FIX: Cancel existing subscription before creating new one
      if (userSub?.stripeSubscriptionId) {
        console.log('🔄 SERVICE: CANCELING existing subscription before creating new one:', userSub.stripeSubscriptionId);
        console.log('🔄 SERVICE: This prevents duplicate active subscriptions in Stripe');
        
        try {
          // Cancel the existing subscription immediately
          await stripe.subscriptions.cancel(userSub.stripeSubscriptionId);
          console.log('✅ SERVICE: Successfully canceled old subscription:', userSub.stripeSubscriptionId);
          
          // Update database record to reflect cancellation
          await prisma.userSubscription.update({
            where: { userId },
            data: {
              status: 'CANCELED',
              canceledAt: new Date(),
              cancelAtPeriodEnd: false
            }
          });
          console.log('✅ SERVICE: Database updated to reflect canceled subscription');
          
        } catch (cancelError) {
          console.error('⚠️ SERVICE: Error canceling existing subscription:', cancelError);
          // Continue anyway - might be already canceled or invalid
          console.log('⚠️ SERVICE: Continuing with new subscription creation despite cancel error');
        }
      }

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

      // Find the plan associated with this price ID (v1.5.4 - Enhanced validation)
      console.log('📋 SERVICE: Looking up subscription plan for price:', priceId);
      console.log('📋 SERVICE: Environment variables check:');
      console.log('📋 SERVICE: STRIPE_STARTER_MONTHLY_PRICE_ID:', process.env.STRIPE_STARTER_MONTHLY_PRICE_ID);
      console.log('📋 SERVICE: STRIPE_STARTER_YEARLY_PRICE_ID:', process.env.STRIPE_STARTER_YEARLY_PRICE_ID);
      console.log('📋 SERVICE: STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID:', process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID);
      console.log('📋 SERVICE: STRIPE_PROFESSIONAL_YEARLY_PRICE_ID:', process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID);
      console.log('📋 SERVICE: STRIPE_ENTERPRISE_MONTHLY_PRICE_ID:', process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID);
      console.log('📋 SERVICE: STRIPE_ENTERPRISE_YEARLY_PRICE_ID:', process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID);
      
      // Updated plan definitions using environment variables (v1.5.4 - Enhanced with fallbacks)
      const PLAN_DEFINITIONS = {
        // Basic Plan
        [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_basic_monthly']: { id: 'basic', name: 'Basic Plan', planType: 'BASIC', trialDays: 7, billingInterval: 'MONTHLY' },
        [process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_basic_yearly']: { id: 'basic', name: 'Basic Plan', planType: 'BASIC', trialDays: 7, billingInterval: 'YEARLY' },
        
        // Premium Plan
        [process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || 'price_premium_monthly']: { id: 'premium', name: 'Premium Plan', planType: 'PREMIUM', trialDays: 7, billingInterval: 'MONTHLY' },
        [process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || 'price_premium_yearly']: { id: 'premium', name: 'Premium Plan', planType: 'PREMIUM', trialDays: 7, billingInterval: 'YEARLY' },
        
        // Family Plan  
        [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_family_monthly']: { id: 'family', name: 'Family Plan', planType: 'FAMILY', trialDays: 7, billingInterval: 'MONTHLY' },
        [process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_family_yearly']: { id: 'family', name: 'Family Plan', planType: 'FAMILY', trialDays: 7, billingInterval: 'YEARLY' },
        
        // Common test price IDs (for development/testing)
        'price_1234567890': { id: 'basic', name: 'Basic Plan (Test)', planType: 'BASIC', trialDays: 7, billingInterval: 'MONTHLY' },
        'price_test_basic': { id: 'basic', name: 'Basic Plan (Test)', planType: 'BASIC', trialDays: 7, billingInterval: 'MONTHLY' }
      };
      
      // Filter out undefined/null keys
      const validPlanDefinitions = Object.fromEntries(
        Object.entries(PLAN_DEFINITIONS).filter(([key]) => key && key !== 'undefined' && key !== 'null')
      );
      
      const plan = validPlanDefinitions[priceId];

      console.log('📋 SERVICE: Plan lookup result:', {
        found: !!plan,
        planName: plan?.name,
        planType: plan?.planType,
        trialDays: plan?.trialDays,
        billingInterval: plan?.billingInterval
      });

      console.log('📋 SERVICE: Available valid price IDs:', Object.keys(validPlanDefinitions));

      if (!plan) {
        console.log('❌ SERVICE: No plan found for price ID:', priceId);
        console.log('📋 SERVICE: Requested price ID type:', typeof priceId);
        console.log('📋 SERVICE: Requested price ID length:', priceId?.length);
        
        // Enhanced error message with debugging info
        const errorMessage = `Invalid price ID: "${priceId}". This price ID is not configured in our system. Available price IDs: ${Object.keys(validPlanDefinitions).join(', ')}. Please check your Stripe configuration or contact support.`;
        
        console.error('❌ SERVICE: DETAILED ERROR:', {
          requestedPriceId: priceId,
          availablePriceIds: Object.keys(validPlanDefinitions),
          environmentVariables: {
            basic_monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
            basic_yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
            premium_monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
            premium_yearly: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID,
            family_monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
            family_yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID
          }
        });
        
        throw new Error(errorMessage);
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
        console.log('💳 SERVICE: Attaching payment method to customer...');
        
        try {
          // Attach payment method to customer first
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: stripeCustomerId,
          });
          console.log('✅ SERVICE: Payment method attached to customer:', stripeCustomerId);
          
          // Set as default payment method for customer
          await stripe.customers.update(stripeCustomerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
          console.log('✅ SERVICE: Payment method set as default for customer');
          
          // Add to subscription params
          subscriptionParams.default_payment_method = paymentMethodId;
          console.log('✅ SERVICE: Payment method added to subscription params');
          
        } catch (attachError) {
          console.error('❌ SERVICE: Error attaching payment method:', attachError);
          // If payment method is already attached, continue
          if (attachError?.message?.includes('already attached')) {
            console.log('⚠️ SERVICE: Payment method already attached, continuing...');
            subscriptionParams.default_payment_method = paymentMethodId;
          } else {
            throw new Error(`Failed to attach payment method: ${attachError?.message}`);
          }
        }
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

  // Create FREE Plan Subscription (v1.5.4) - Create actual $0 subscription in Stripe
  async createFreePlanSubscription(userId: string, email: string, name: string) {
    try {
      console.log('=== CREATE FREE PLAN SUBSCRIPTION DEBUG START ===');
      console.log('🆓 SERVICE: Creating FREE plan subscription for:', { userId, email, name });
      console.log('🆓 SERVICE: Timestamp:', new Date().toISOString());
      
      // Check if user already has a subscription
      const existingSubscription = await prisma.userSubscription.findUnique({
        where: { userId }
      });
      
      console.log('🔍 SERVICE: Existing subscription check:', {
        hasExisting: !!existingSubscription,
        existingPlanType: existingSubscription?.planType,
        existingStatus: existingSubscription?.status
      });

      // Get or create Stripe customer
      let stripeCustomerId: string;
      
      if (existingSubscription?.stripeCustomerId) {
        console.log('✅ SERVICE: Using existing Stripe customer:', existingSubscription.stripeCustomerId);
        stripeCustomerId = existingSubscription.stripeCustomerId;
        
        // Verify customer exists in Stripe
        try {
          await stripe.customers.retrieve(stripeCustomerId);
          console.log('✅ SERVICE: Verified existing customer in Stripe');
        } catch (stripeError) {
          console.log('⚠️ SERVICE: Customer not found in Stripe, creating new one');
          const customer = await this.createCustomer(userId, email, name);
          stripeCustomerId = customer.id;
        }
      } else {
        console.log('🏪 SERVICE: Creating new Stripe customer for FREE plan...');
        const customer = await this.createCustomer(userId, email, name);
        stripeCustomerId = customer.id;
      }

      // Create FREE plan as actual $0 subscription for consistency
      console.log('💰 SERVICE: Creating $0 subscription in Stripe for FREE plan...');
      
      // First, create a $0 price in Stripe if it doesn't exist
      let freePlanPriceId = process.env.STRIPE_FREE_PLAN_PRICE_ID;
      
      if (!freePlanPriceId) {
        console.log('🆓 SERVICE: Creating $0 price for FREE plan in Stripe...');
        
        // Create a product for FREE plan
        const freeProduct = await stripe.products.create({
          name: 'SafePlay FREE Plan',
          description: 'No credit card required - Basic safety features',
          metadata: {
            planType: 'FREE',
            platform: 'safeplay'
          }
        });
        
        // Create $0 price for the product
        const freePrice = await stripe.prices.create({
          unit_amount: 0, // $0.00
          currency: 'usd',
          recurring: {
            interval: 'month'
          },
          product: freeProduct.id,
          metadata: {
            planType: 'FREE',
            platform: 'safeplay'
          }
        });
        
        freePlanPriceId = freePrice.id;
        console.log('✅ SERVICE: Created FREE plan price in Stripe:', freePlanPriceId);
      }

      // Create the subscription
      const subscriptionParams: any = {
        customer: stripeCustomerId,
        items: [{ price: freePlanPriceId }],
        metadata: {
          userId,
          planType: 'FREE',
          platform: 'safeplay'
        }
      };

      console.log('🚀 SERVICE: Creating $0 subscription with params:', {
        customer: stripeCustomerId,
        priceId: freePlanPriceId,
        planType: 'FREE'
      });

      const subscription = await stripe.subscriptions.create(subscriptionParams);
      
      console.log('✅ SERVICE: Stripe $0 subscription created:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: subscription.customer
      });

      // Update or create database record
      const currentTime = new Date();
      const subscriptionData = {
        userId,
        planType: 'FREE' as any,
        status: this.mapStripeStatusToPrisma(subscription.status),
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: subscription.current_period_start 
          ? new Date(subscription.current_period_start * 1000) 
          : currentTime,
        currentPeriodEnd: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000) 
          : new Date(currentTime.getTime() + (365 * 24 * 60 * 60 * 1000)), // 1 year
        cancelAtPeriodEnd: false,
        autoRenew: false // FREE plans don't auto-renew
      };

      if (existingSubscription) {
        console.log('📝 SERVICE: Updating existing subscription record');
        await prisma.userSubscription.update({
          where: { userId },
          data: subscriptionData
        });
      } else {
        console.log('📝 SERVICE: Creating new subscription record');
        await prisma.userSubscription.create({
          data: subscriptionData
        });
      }

      console.log('✅ SERVICE: FREE plan subscription created successfully');
      
      return {
        success: true,
        subscription,
        customer: { id: stripeCustomerId },
        planType: 'FREE'
      };

    } catch (error) {
      console.error('❌ SERVICE: Error creating FREE plan subscription:', error);
      throw error;
    }
  }

  // Downgrade to Free Plan (v1.5.3) - Cancel paid subscription and switch to FREE
  async downgradeToFreePlan(userId: string) {
    try {
      console.log('=== DOWNGRADE TO FREE PLAN DEBUG START ===');
      console.log('🔄 SERVICE: Downgrading to Free Plan for user:', { userId });
      
      // Get current subscription
      const userSub = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { user: true }
      });
      
      if (!userSub) {
        throw new Error('No subscription found for user');
      }
      
      console.log('🔍 SERVICE: Current subscription:', {
        planType: userSub.planType,
        status: userSub.status,
        hasStripeSubscription: !!userSub.stripeSubscriptionId,
        hasStripeCustomer: !!userSub.stripeCustomerId
      });
      
      // Cancel active Stripe subscription if exists
      if (userSub.stripeSubscriptionId) {
        console.log('🔄 SERVICE: Canceling active Stripe subscription:', userSub.stripeSubscriptionId);
        
        try {
          await stripe.subscriptions.cancel(userSub.stripeSubscriptionId);
          console.log('✅ SERVICE: Stripe subscription canceled successfully');
        } catch (cancelError) {
          console.error('⚠️ SERVICE: Error canceling Stripe subscription:', cancelError);
          // Continue with downgrade even if cancellation fails
        }
      }
      
      // Ensure user has Stripe customer for future upgrades
      let stripeCustomerId = userSub.stripeCustomerId;
      if (!stripeCustomerId && userSub.user) {
        console.log('🏪 SERVICE: Creating Stripe customer for FREE plan user...');
        try {
          const customer = await this.createCustomer(userId, userSub.user.email, userSub.user.name);
          stripeCustomerId = customer.id;
          console.log('✅ SERVICE: Stripe customer created for FREE plan user:', stripeCustomerId);
        } catch (customerError) {
          console.error('⚠️ SERVICE: Failed to create Stripe customer, continuing without:', customerError);
        }
      }
      
      // Update subscription to FREE plan
      const updatedSubscription = await prisma.userSubscription.update({
        where: { userId },
        data: {
          planType: 'FREE',
          status: 'ACTIVE',
          stripeCustomerId: stripeCustomerId,
          stripeSubscriptionId: null, // No Stripe subscription for FREE plan
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          cancelAtPeriodEnd: false,
          canceledAt: new Date(), // Mark when downgrade occurred
          trialStart: null,
          trialEnd: null,
          autoRenew: false,
          metadata: {
            ...userSub.metadata,
            downgradedToFree: true,
            downgradedAt: new Date().toISOString(),
            previousPlanType: userSub.planType
          }
        }
      });
      
      console.log('✅ SERVICE: Subscription updated to FREE plan');
      
      // Log subscription change
      await this.logSubscriptionChange(userId, 'DOWNGRADED', {
        id: 'free_plan_downgrade',
        status: 'active',
        customer: stripeCustomerId,
        metadata: { 
          planType: 'FREE',
          downgradedFrom: userSub.planType,
          downgradedAt: new Date().toISOString()
        }
      });
      
      console.log('🎉 SERVICE: Downgrade to FREE plan completed successfully!');
      return updatedSubscription;
      
    } catch (error) {
      console.error('❌ SERVICE: Error downgrading to FREE plan:', error);
      throw error;
    }
  }

  // Downgrade to Free Plan (v1.5.1) - Cancel current subscription and create free plan
  async downgradeToFreePlan(userId: string) {
    try {
      console.log('=== DOWNGRADE TO FREE PLAN DEBUG START ===');
      console.log('🔽 SERVICE: Starting downgrade to Free Plan for userId:', userId);

      // Get current subscription
      const userSub = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { user: true }
      });

      if (!userSub) {
        throw new Error('No subscription found to downgrade');
      }

      console.log('🔍 SERVICE: Current subscription found:', {
        planType: userSub.planType,
        status: userSub.status,
        stripeSubscriptionId: userSub.stripeSubscriptionId
      });

      // Cancel current Stripe subscription if it exists
      if (userSub.stripeSubscriptionId) {
        console.log('🚫 SERVICE: Canceling current Stripe subscription:', userSub.stripeSubscriptionId);
        try {
          await stripe.subscriptions.cancel(userSub.stripeSubscriptionId);
          console.log('✅ SERVICE: Current subscription canceled successfully');
        } catch (cancelError) {
          console.log('⚠️ SERVICE: Error canceling subscription (continuing anyway):', cancelError);
        }
      }

      // Update subscription to Free Plan
      console.log('🆓 SERVICE: Updating subscription to FREE plan...');
      const updatedSubscription = await prisma.userSubscription.update({
        where: { userId },
        data: {
          planType: 'FREE',
          status: 'ACTIVE',
          stripeSubscriptionId: null, // No Stripe subscription for free plan
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          cancelAtPeriodEnd: false,
          canceledAt: null,
          trialStart: null,
          trialEnd: null,
        }
      });

      console.log('✅ SERVICE: Subscription updated to FREE plan:', updatedSubscription);

      // Log subscription change
      await this.logSubscriptionChange(userId, 'DOWNGRADED', { 
        id: 'free_plan_downgrade',
        from: userSub.planType,
        to: 'FREE',
        timestamp: new Date().toISOString()
      });

      console.log('✅ SERVICE: Downgrade to Free Plan completed successfully');
      return updatedSubscription;

    } catch (error) {
      console.error('❌ SERVICE: Error downgrading to Free Plan:', error);
      throw error;
    }
  }

  // Create individual purchase (v1.5.0) - $0.99 photo or $2.99 video
  async createIndividualPurchase(
    userId: string,
    purchaseType: 'PHOTO' | 'VIDEO_MONTAGE',
    memoryId?: string,
    paymentMethodId?: string
  ) {
    try {
      console.log('=== INDIVIDUAL PURCHASE DEBUG START ===');
      console.log('💰 SERVICE: Creating individual purchase:', { userId, purchaseType, memoryId });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get pricing
      const amount = purchaseType === 'PHOTO' ? 0.99 : 2.99;
      const priceId = purchaseType === 'PHOTO' 
        ? process.env.STRIPE_INDIVIDUAL_PHOTO_PRICE_ID
        : process.env.STRIPE_INDIVIDUAL_VIDEO_PRICE_ID;

      if (!priceId) {
        throw new Error(`No Stripe price ID configured for ${purchaseType}`);
      }

      // Get or create Stripe customer
      let stripeCustomerId = user.subscription?.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.createCustomer(userId, user.email, user.name);
        stripeCustomerId = customer.id;
      }

      // Create Stripe checkout session for individual purchase
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/parent/memories?purchase_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/parent/memories?purchase_canceled=true`,
        metadata: {
          userId,
          purchaseType,
          memoryId: memoryId || '',
          amount: amount.toString()
        }
      });

      // Create purchase record in database
      const purchase = await prisma.individualPurchase.create({
        data: {
          userId,
          purchaseType: purchaseType as any,
          amount,
          currency: 'usd',
          stripeSessionId: checkoutSession.id,
          paymentStatus: 'PENDING' as any,
          memoryId,
          metadata: {
            checkoutSessionId: checkoutSession.id,
            priceId,
            createdAt: new Date().toISOString()
          }
        }
      });

      console.log('✅ SERVICE: Individual purchase created:', purchase.id);
      return { purchase, checkoutUrl: checkoutSession.url };
    } catch (error) {
      console.error('❌ SERVICE: Error creating individual purchase:', error);
      throw error;
    }
  }

  // Create photo/video pack purchase (v1.5.0) - $9.99, $19.99, or $29.99
  async createPhotoVideoPackPurchase(
    userId: string,
    packType: 'PACK_1' | 'PACK_2' | 'PACK_3',
    paymentMethodId?: string
  ) {
    try {
      console.log('=== PHOTO/VIDEO PACK PURCHASE DEBUG START ===');
      console.log('📦 SERVICE: Creating pack purchase:', { userId, packType });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get pack configuration
      const packConfig = {
        PACK_1: { price: 9.99, photoCredits: 5, videoCredits: 3, priceId: process.env.STRIPE_PACK_1_PRICE_ID },
        PACK_2: { price: 19.99, photoCredits: 10, videoCredits: 5, priceId: process.env.STRIPE_PACK_2_PRICE_ID },
        PACK_3: { price: 29.99, photoCredits: 20, videoCredits: 10, priceId: process.env.STRIPE_PACK_3_PRICE_ID }
      }[packType];

      if (!packConfig.priceId) {
        throw new Error(`No Stripe price ID configured for ${packType}`);
      }

      // Get or create Stripe customer
      let stripeCustomerId = user.subscription?.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.createCustomer(userId, user.email, user.name);
        stripeCustomerId = customer.id;
      }

      // Create Stripe checkout session for pack purchase
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [{
          price: packConfig.priceId,
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/parent/memories?pack_purchase_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/parent/memories?pack_purchase_canceled=true`,
        metadata: {
          userId,
          packType,
          amount: packConfig.price.toString(),
          photoCredits: packConfig.photoCredits.toString(),
          videoCredits: packConfig.videoCredits.toString()
        }
      });

      // Create pack purchase record in database
      const packPurchase = await prisma.photoVideoPackPurchase.create({
        data: {
          userId,
          packType: packType as any,
          amount: packConfig.price,
          currency: 'usd',
          stripeSessionId: checkoutSession.id,
          paymentStatus: 'PENDING' as any,
          photoCredits: packConfig.photoCredits,
          videoCredits: packConfig.videoCredits,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
          metadata: {
            checkoutSessionId: checkoutSession.id,
            priceId: packConfig.priceId,
            createdAt: new Date().toISOString()
          }
        }
      });

      console.log('✅ SERVICE: Photo/video pack purchase created:', packPurchase.id);
      return { packPurchase, checkoutUrl: checkoutSession.url };
    } catch (error) {
      console.error('❌ SERVICE: Error creating pack purchase:', error);
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
        where: { userId }
      });

      if (!userSub || userSub.status !== SubscriptionStatus.ACTIVE) {
        return false;
      }

      const planType = userSub.planType;
      
      // Check feature access based on plan type
      switch (feature) {
        case 'premiumAlerts':
          return ['PREMIUM', 'ENTERPRISE'].includes(planType);
        case 'aiInsights':
          return ['PREMIUM', 'ENTERPRISE'].includes(planType);
        case 'prioritySupport':
          return ['PREMIUM', 'ENTERPRISE'].includes(planType);
        case 'unlimitedDownloads':
          return ['PREMIUM', 'ENTERPRISE'].includes(planType);
        case 'advancedAnalytics':
          return ['PREMIUM', 'ENTERPRISE'].includes(planType);
        case 'biometricFeatures':
          return ['ENTERPRISE'].includes(planType);
        case 'realTimeTracking':
          return ['BASIC', 'PREMIUM', 'ENTERPRISE'].includes(planType);
        case 'emergencyFeatures':
          return ['BASIC', 'PREMIUM', 'ENTERPRISE'].includes(planType);
        case 'familySharing':
          return ['PREMIUM', 'ENTERPRISE'].includes(planType);
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
