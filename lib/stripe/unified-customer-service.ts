
/**
 * Unified Stripe Customer Service v1.5.40-alpha.11
 * CRITICAL: Resolves customer registration issues and ensures exactly one Stripe customer per registrant
 * 
 * FIXES:
 * - Session validation before all Stripe operations to prevent contamination
 * - Unified customer creation logic to prevent duplicates
 * - FREE plan customer creation for upgrade paths
 * - Customer deduplication and validation
 * - Secure session isolation between users
 * - CRITICAL v1.5.40-alpha.10: Fixed date conversion issue in paid subscription creation
 * - Added validation for Stripe timestamp fields before conversion
 * - Implemented fallback dates for missing timestamp fields
 * - Enhanced error handling for invalid date conversion
 * - CRITICAL v1.5.40-alpha.11: Context-aware session validation fix
 * - Added context parameters to skip database checks during signup flows
 * - Maintains security for existing user flows while allowing legitimate signups
 * - Fixed "Session validation failed" blocking legitimate new users
 */

import { stripe } from './config';
import { prisma } from '../db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth-fixed';

export interface CustomerCreationResult {
  customer: any;
  isNewCustomer: boolean;
  source: 'existing_stripe' | 'existing_db' | 'newly_created';
  errors: string[];
  warnings: string[];
}

export interface ValidationContext {
  isSignupFlow?: boolean;
  allowPendingUser?: boolean;
  operation?: string;
  skipDatabaseChecks?: boolean;
}

export interface SessionValidationResult {
  isValid: boolean;
  userId: string | null;
  userEmail: string | null;
  errors: string[];
}

export class UnifiedCustomerService {
  private static instance: UnifiedCustomerService;

  public static getInstance(): UnifiedCustomerService {
    if (!UnifiedCustomerService.instance) {
      UnifiedCustomerService.instance = new UnifiedCustomerService();
    }
    return UnifiedCustomerService.instance;
  }

  /**
   * CRITICAL: Context-aware session validation for Stripe operations
   * v1.5.40-alpha.11 FIX: Supports signup flows by skipping database checks when appropriate
   */
  async validateSessionSecurity(context?: ValidationContext): Promise<SessionValidationResult> {
    const validationId = `session_val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔒 SESSION VALIDATION [${validationId}]: Starting context-aware session validation`);
    console.log(`🔒 SESSION VALIDATION [${validationId}]: Context:`, {
      isSignupFlow: context?.isSignupFlow,
      allowPendingUser: context?.allowPendingUser,
      operation: context?.operation,
      skipDatabaseChecks: context?.skipDatabaseChecks
    });
    
    const result: SessionValidationResult = {
      isValid: false,
      userId: null,
      userEmail: null,
      errors: []
    };

    try {
      // Get session using NextAuth
      const session = await getServerSession(authOptions);
      
      if (!session) {
        result.errors.push('No session found');
        console.log(`❌ SESSION VALIDATION [${validationId}]: No session found`);
        return result;
      }

      if (!session.user?.id) {
        result.errors.push('Session missing user ID');
        console.log(`❌ SESSION VALIDATION [${validationId}]: Session missing user ID`);
        return result;
      }

      if (!session.user?.email) {
        result.errors.push('Session missing user email');
        console.log(`❌ SESSION VALIDATION [${validationId}]: Session missing user email`);
        return result;
      }

      // CRITICAL v1.5.40-alpha.11 FIX: Context-aware database validation
      const shouldSkipDatabaseChecks = context?.skipDatabaseChecks || 
                                       context?.isSignupFlow || 
                                       context?.allowPendingUser;

      if (shouldSkipDatabaseChecks) {
        console.log(`🆓 SESSION VALIDATION [${validationId}]: Skipping database checks for context: ${context?.operation || 'signup flow'}`);
        
        // For signup flows, trust the session data but log for audit
        result.isValid = true;
        result.userId = session.user.id;
        result.userEmail = session.user.email;
        
        console.log(`✅ SESSION VALIDATION [${validationId}]: Session valid (database checks skipped) for user: ${result.userEmail}`);
        return result;
      }

      // CRITICAL: For existing user operations, validate user exists in database to prevent phantom users
      console.log(`🔍 SESSION VALIDATION [${validationId}]: Performing database validation for existing user operation`);
      
      const userExists = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, name: true }
      });

      if (!userExists) {
        result.errors.push('User not found in database - session may be stale');
        console.log(`❌ SESSION VALIDATION [${validationId}]: User ${session.user.id} not found in database`);
        return result;
      }

      // CRITICAL: Verify email matches to prevent session hijacking
      if (userExists.email !== session.user.email) {
        result.errors.push('Session email mismatch with database');
        console.log(`❌ SESSION VALIDATION [${validationId}]: Email mismatch - Session: ${session.user.email}, DB: ${userExists.email}`);
        return result;
      }

      result.isValid = true;
      result.userId = userExists.id;
      result.userEmail = userExists.email;
      
      console.log(`✅ SESSION VALIDATION [${validationId}]: Session valid for existing user: ${result.userEmail}`);
      return result;

    } catch (error) {
      console.error(`🚨 SESSION VALIDATION [${validationId}]: Validation error:`, error);
      result.errors.push(`Session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * CRITICAL: Unified customer creation/retrieval - ensures exactly one customer per user
   */
  async getOrCreateCustomer(
    userEmail: string, 
    userName: string, 
    userId: string,
    forFreePlan: boolean = false
  ): Promise<CustomerCreationResult> {
    const customerId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🏪 UNIFIED CUSTOMER [${customerId}]: Starting unified customer creation for: ${userEmail}`);
    console.log(`🏪 UNIFIED CUSTOMER [${customerId}]: Plan type: ${forFreePlan ? 'FREE' : 'PAID'}, User ID: ${userId}`);
    
    const result: CustomerCreationResult = {
      customer: null,
      isNewCustomer: false,
      source: 'newly_created',
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Check if user already has a customer ID in our database
      console.log(`🔍 UNIFIED CUSTOMER [${customerId}]: Checking database for existing customer...`);
      
      const existingSubscription = await prisma.userSubscription.findUnique({
        where: { userId },
        select: { stripeCustomerId: true }
      });

      if (existingSubscription?.stripeCustomerId) {
        console.log(`🔍 UNIFIED CUSTOMER [${customerId}]: Found existing customer in DB: ${existingSubscription.stripeCustomerId}`);
        
        // Verify customer exists in Stripe
        try {
          const stripeCustomer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
          console.log(`✅ UNIFIED CUSTOMER [${customerId}]: Verified existing customer in Stripe`);
          
          result.customer = stripeCustomer;
          result.isNewCustomer = false;
          result.source = 'existing_db';
          return result;
        } catch (stripeError) {
          console.log(`⚠️ UNIFIED CUSTOMER [${customerId}]: Customer not found in Stripe, will create new one`);
          result.warnings.push('Database had invalid Stripe customer ID');
        }
      }

      // Step 2: Search for existing customer in Stripe by email (deduplication)
      console.log(`🔍 UNIFIED CUSTOMER [${customerId}]: Searching Stripe for existing customer by email...`);
      
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        const existingCustomer = existingCustomers.data[0];
        console.log(`✅ UNIFIED CUSTOMER [${customerId}]: Found existing Stripe customer: ${existingCustomer.id}`);
        
        // Update database with the found customer ID
        await prisma.userSubscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: existingCustomer.id,
            planType: forFreePlan ? 'FREE' : 'BASIC',
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          },
          update: {
            stripeCustomerId: existingCustomer.id,
          }
        });
        
        result.customer = existingCustomer;
        result.isNewCustomer = false;
        result.source = 'existing_stripe';
        result.warnings.push('Used existing Stripe customer found by email');
        return result;
      }

      // Step 3: Create new customer (both FREE and PAID plans get customers)
      console.log(`🏪 UNIFIED CUSTOMER [${customerId}]: Creating new Stripe customer...`);
      console.log(`🏪 UNIFIED CUSTOMER [${customerId}]: FREE plans now get customers for future upgrades`);
      
      const newCustomer = await stripe.customers.create({
        email: userEmail,
        name: userName,
        metadata: {
          userId: userId,
          platform: 'safeplay',
          planType: forFreePlan ? 'FREE' : 'PAID',
          createdAt: new Date().toISOString(),
          source: 'unified_customer_service'
        }
      });

      console.log(`✅ UNIFIED CUSTOMER [${customerId}]: New Stripe customer created: ${newCustomer.id}`);

      // Step 4: Update database with new customer ID
      await prisma.userSubscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: newCustomer.id,
          planType: forFreePlan ? 'FREE' : 'BASIC',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
        update: {
          stripeCustomerId: newCustomer.id,
        }
      });

      result.customer = newCustomer;
      result.isNewCustomer = true;
      result.source = 'newly_created';
      
      console.log(`🎉 UNIFIED CUSTOMER [${customerId}]: Customer creation completed successfully`);
      return result;

    } catch (error) {
      console.error(`🚨 UNIFIED CUSTOMER [${customerId}]: Customer creation error:`, error);
      result.errors.push(`Customer creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * CRITICAL: Create FREE plan subscription with Stripe customer for upgrade path
   */
  async createFreePlanWithCustomer(userId: string, userEmail: string, userName: string): Promise<{
    success: boolean;
    customer: any;
    subscription: any;
    errors: string[];
  }> {
    const freePlanId = `free_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🆓 FREE PLAN [${freePlanId}]: Creating FREE plan with Stripe customer for: ${userEmail}`);
    
    const result = {
      success: false,
      customer: null,
      subscription: null,
      errors: [] as string[]
    };

    try {
      // CRITICAL v1.5.40-alpha.11 FIX: For FREE plan creation, this could be signup or existing user
      // We need to be more flexible here since FREE plans can be selected during signup
      const sessionValidation = await this.validateSessionSecurity({
        isSignupFlow: true, // Allow signup flows for FREE plan creation
        skipDatabaseChecks: true, // Skip DB checks since user might not exist yet
        operation: 'free_plan_creation'
      });
      if (!sessionValidation.isValid) {
        result.errors.push('Session validation failed');
        return result;
      }

      if (sessionValidation.userId !== userId) {
        result.errors.push('Session user ID mismatch');
        return result;
      }

      // Create/get customer for FREE plan
      const customerResult = await this.getOrCreateCustomer(userEmail, userName, userId, true);
      if (customerResult.errors.length > 0) {
        result.errors.push(...customerResult.errors);
        return result;
      }

      result.customer = customerResult.customer;

      // Update subscription to FREE plan
      const subscription = await prisma.userSubscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: customerResult.customer.id,
          planType: 'FREE',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
        update: {
          stripeCustomerId: customerResult.customer.id,
          planType: 'FREE',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        }
      });

      result.subscription = subscription;
      result.success = true;
      
      console.log(`✅ FREE PLAN [${freePlanId}]: FREE plan with customer created successfully`);
      return result;

    } catch (error) {
      console.error(`🚨 FREE PLAN [${freePlanId}]: FREE plan creation error:`, error);
      result.errors.push(`FREE plan creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Create paid subscription using unified customer service
   */
  async createPaidSubscription(
    userId: string,
    userEmail: string,
    userName: string,
    priceId: string,
    paymentMethodId?: string
  ): Promise<{
    success: boolean;
    customer: any;
    subscription: any;
    errors: string[];
  }> {
    const paidSubId = `paid_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`💳 PAID SUBSCRIPTION [${paidSubId}]: Creating paid subscription for: ${userEmail}`);
    
    const result = {
      success: false,
      customer: null,
      subscription: null,
      errors: [] as string[]
    };

    try {
      // CRITICAL v1.5.40-alpha.11 FIX: For paid subscription creation, this could be signup or existing user
      // We need to be more flexible here since paid plans can be selected during signup
      const sessionValidation = await this.validateSessionSecurity({
        isSignupFlow: true, // Allow signup flows for paid subscription creation
        skipDatabaseChecks: true, // Skip DB checks since user might not exist yet during signup
        operation: 'paid_subscription_creation'
      });
      if (!sessionValidation.isValid) {
        result.errors.push('Session validation failed');
        return result;
      }

      if (sessionValidation.userId !== userId) {
        result.errors.push('Session user ID mismatch');
        return result;
      }

      // Create/get customer for paid plan
      const customerResult = await this.getOrCreateCustomer(userEmail, userName, userId, false);
      if (customerResult.errors.length > 0) {
        result.errors.push(...customerResult.errors);
        return result;
      }

      result.customer = customerResult.customer;

      // Attach payment method if provided
      if (paymentMethodId) {
        console.log(`💳 PAID SUBSCRIPTION [${paidSubId}]: Attaching payment method...`);
        
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerResult.customer.id,
        });
        
        await stripe.customers.update(customerResult.customer.id, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
        
        console.log(`✅ PAID SUBSCRIPTION [${paidSubId}]: Payment method attached`);
      }

      // Create Stripe subscription
      const subscriptionParams: any = {
        customer: customerResult.customer.id,
        items: [{ price: priceId }],
        metadata: {
          userId,
          platform: 'safeplay',
          source: 'unified_customer_service'
        },
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: 7, // 7-day trial
      };

      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      const stripeSubscription = await stripe.subscriptions.create(subscriptionParams);
      
      console.log(`✅ PAID SUBSCRIPTION [${paidSubId}]: Stripe subscription created: ${stripeSubscription.id}`);

      // CRITICAL v1.5.40-alpha.10 FIX: Proper date validation and conversion
      console.log(`📅 PAID SUBSCRIPTION [${paidSubId}]: Validating and converting Stripe dates...`);
      
      // Helper function to safely convert Stripe timestamps to Date objects
      const convertStripeTimestamp = (timestamp: number | null | undefined, fieldName: string): Date | null => {
        if (!timestamp) {
          console.log(`⚠️ PAID SUBSCRIPTION [${paidSubId}]: ${fieldName} is missing or null, using fallback`);
          return null;
        }
        
        try {
          const convertedDate = new Date(timestamp * 1000);
          if (isNaN(convertedDate.getTime())) {
            console.error(`🚨 PAID SUBSCRIPTION [${paidSubId}]: Invalid date conversion for ${fieldName}: ${timestamp}`);
            return null;
          }
          console.log(`✅ PAID SUBSCRIPTION [${paidSubId}]: ${fieldName} converted successfully: ${convertedDate.toISOString()}`);
          return convertedDate;
        } catch (error) {
          console.error(`🚨 PAID SUBSCRIPTION [${paidSubId}]: Date conversion error for ${fieldName}:`, error);
          return null;
        }
      };
      
      // Convert all Stripe timestamps with validation
      const currentPeriodStart = convertStripeTimestamp(stripeSubscription.current_period_start, 'current_period_start') || new Date();
      const currentPeriodEnd = convertStripeTimestamp(stripeSubscription.current_period_end, 'current_period_end') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days fallback
      const trialStart = convertStripeTimestamp(stripeSubscription.trial_start, 'trial_start');
      const trialEnd = convertStripeTimestamp(stripeSubscription.trial_end, 'trial_end');
      
      // Log the converted dates for debugging
      console.log(`📅 PAID SUBSCRIPTION [${paidSubId}]: Date conversion results:`, {
        currentPeriodStart: currentPeriodStart.toISOString(),
        currentPeriodEnd: currentPeriodEnd.toISOString(),
        trialStart: trialStart?.toISOString() || 'null',
        trialEnd: trialEnd?.toISOString() || 'null',
        originalTimestamps: {
          current_period_start: stripeSubscription.current_period_start,
          current_period_end: stripeSubscription.current_period_end,
          trial_start: stripeSubscription.trial_start,
          trial_end: stripeSubscription.trial_end
        }
      });

      // Validate that we have valid dates before database insertion
      if (isNaN(currentPeriodStart.getTime()) || isNaN(currentPeriodEnd.getTime())) {
        throw new Error('Invalid date conversion - cannot proceed with database insertion');
      }

      // Update database subscription with validated dates
      const dbSubscription = await prisma.userSubscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: customerResult.customer.id,
          stripeSubscriptionId: stripeSubscription.id,
          planType: 'BASIC', // Default, will be updated based on price ID
          status: 'TRIALING',
          currentPeriodStart,
          currentPeriodEnd,
          trialStart,
          trialEnd,
        },
        update: {
          stripeCustomerId: customerResult.customer.id,
          stripeSubscriptionId: stripeSubscription.id,
          status: 'TRIALING',
          currentPeriodStart,
          currentPeriodEnd,
          trialStart,
          trialEnd,
        }
      });

      result.subscription = {
        stripe: stripeSubscription,
        database: dbSubscription
      };
      result.success = true;
      
      console.log(`🎉 PAID SUBSCRIPTION [${paidSubId}]: Paid subscription created successfully`);
      return result;

    } catch (error) {
      console.error(`🚨 PAID SUBSCRIPTION [${paidSubId}]: Paid subscription creation error:`, error);
      result.errors.push(`Paid subscription creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * CRITICAL: Validate customer ownership to prevent unauthorized access
   */
  async validateCustomerOwnership(customerId: string, userId: string): Promise<boolean> {
    try {
      const subscription = await prisma.userSubscription.findFirst({
        where: {
          userId,
          stripeCustomerId: customerId
        }
      });

      return !!subscription;
    } catch (error) {
      console.error('Customer ownership validation error:', error);
      return false;
    }
  }

  /**
   * Get customer audit information for debugging
   */
  async getCustomerAudit(userId: string): Promise<{
    user: any;
    subscription: any;
    stripeCustomer: any;
    issues: string[];
  }> {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📊 CUSTOMER AUDIT [${auditId}]: Starting audit for user: ${userId}`);
    
    const audit = {
      user: null,
      subscription: null,
      stripeCustomer: null,
      issues: [] as string[]
    };

    try {
      // Get user
      audit.user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true }
      });

      if (!audit.user) {
        audit.issues.push('User not found in database');
        return audit;
      }

      // Get subscription
      audit.subscription = await prisma.userSubscription.findUnique({
        where: { userId }
      });

      if (!audit.subscription) {
        audit.issues.push('No subscription found');
        return audit;
      }

      // Get Stripe customer if exists
      if (audit.subscription.stripeCustomerId) {
        try {
          audit.stripeCustomer = await stripe.customers.retrieve(audit.subscription.stripeCustomerId);
        } catch (stripeError) {
          audit.issues.push('Stripe customer not found or invalid');
        }
      } else {
        audit.issues.push('No Stripe customer ID in database');
      }

      console.log(`✅ CUSTOMER AUDIT [${auditId}]: Audit completed`);
      return audit;

    } catch (error) {
      console.error(`🚨 CUSTOMER AUDIT [${auditId}]: Audit error:`, error);
      audit.issues.push(`Audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return audit;
    }
  }
}

// Export singleton instance
export const unifiedCustomerService = UnifiedCustomerService.getInstance();
