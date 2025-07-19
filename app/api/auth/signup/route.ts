
/**
 * SafePlay Fixed Signup API Route v1.5.33-alpha.9
 * CRITICAL: FREE PLAN Data Validation Fix
 * 
 * FIXES:
 * - Ensures proper user creation and database transactions
 * - Prevents session contamination during signup
 * - Adds comprehensive error handling and logging
 * - CRITICAL v1.5.21: Fixed payment-account sync issue
 * - Enhanced validation to prevent validation failures after payment success
 * - Improved rollback mechanisms to prevent charging users without accounts
 * - CRITICAL v1.5.33-alpha.9: Fixed FREE PLAN data validation issues
 * - Conditional address validation based on plan type (FREE vs PAID)
 * - Default homeAddress handling for FREE PLAN users
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiErrorHandler, withErrorHandling, ErrorType } from "@/lib/error-handler";
import { authSessionManager } from "@/lib/auth-session-manager";
import { demoAccountProtection } from "@/lib/demo-account-protection";
import { cleanAccountInitializer } from "@/lib/clean-account-initializer";
import { stripe } from "@/lib/stripe/config";

export const dynamic = "force-dynamic";

// Enhanced validation schema with better error handling
// CRITICAL v1.5.33-alpha.9 FIX: FREE PLAN data validation support
const signupSchema = z.object({
  email: z.preprocess((val) => {
    if (typeof val === "string") return val.trim().toLowerCase();
    return String(val || "").trim().toLowerCase();
  }, z.string().email("Invalid email address")),
  
  password: z.preprocess((val) => {
    return typeof val === "string" ? val : String(val || "");
  }, z.string().min(8, "Password must be at least 8 characters")),
  
  name: z.preprocess((val) => {
    if (typeof val === "string") return val.trim();
    return String(val || "").trim();
  }, z.string().min(2, "Name must be at least 2 characters")),
  
  role: z.preprocess((val) => {
    return typeof val === "string" ? val : "PARENT";
  }, z.enum(["PARENT", "VENUE_ADMIN", "SUPER_ADMIN"]).default("PARENT")),
  
  agreeToTerms: z.preprocess((val) => {
    if (val === true || val === "true" || val === 1 || val === "1") return true;
    if (val === false || val === "false" || val === 0 || val === "0") return false;
    return Boolean(val);
  }, z.boolean().refine(val => val === true, "You must agree to the Terms of Service")),
  
  agreeToPrivacy: z.preprocess((val) => {
    if (val === true || val === "true" || val === 1 || val === "1") return true;
    if (val === false || val === "false" || val === 0 || val === "0") return false;
    return Boolean(val);
  }, z.boolean().refine(val => val === true, "You must agree to the Privacy Policy")),
  
  homeAddress: z.preprocess((val) => {
    if (typeof val === "string") return val.trim();
    return String(val || "").trim();
  }, z.string()),
  
  homeAddressValidation: z.preprocess((val) => {
    // CRITICAL v1.5.21 FIX: Handle null/undefined homeAddressValidation safely
    if (val === null || val === undefined) return {};
    if (typeof val === 'object' && val !== null) return val;
    return {};
  }, z.any().optional()),
  
  useDifferentBillingAddress: z.preprocess((val) => {
    if (val === true || val === "true" || val === 1 || val === "1") return true;
    if (val === false || val === "false" || val === 0 || val === "0") return false;
    return false;
  }, z.boolean().default(false)),
  
  billingAddress: z.preprocess((val) => {
    if (typeof val === "string") return val.trim();
    return String(val || "").trim();
  }, z.string().nullable().optional()),
  
  billingAddressValidation: z.preprocess((val) => {
    // CRITICAL v1.5.21 FIX: Handle null/undefined billingAddressValidation safely
    if (val === null || val === undefined) return {};
    if (typeof val === 'object' && val !== null) return val;
    return {};
  }, z.any().optional()),
  
  selectedPlan: z.object({
    id: z.string(),
    name: z.string(),
    stripePriceId: z.string().nullable(),
    billingInterval: z.enum(["monthly", "yearly", "lifetime", "free"]),
    amount: z.number(),
    planType: z.string(),
  }).nullable().optional(),
  
  subscriptionData: z.any().optional(),
  
  // CRITICAL v1.5.19 FIX: Add payment method for integrated signup
  paymentMethodId: z.string().nullable().optional(),
  
  // Additional fields
  homeAddressFields: z.any().optional(),
  billingAddressFields: z.any().optional(),
  debugMetadata: z.any().optional(),
}).refine((data) => {
  // CRITICAL v1.5.33-alpha.9 FIX: Conditional address validation for FREE vs PAID plans
  const isFreeOrNoPlan = !data.selectedPlan || 
                         data.selectedPlan.amount === 0 || 
                         data.selectedPlan.planType === "FREE" || 
                         data.selectedPlan.billingInterval === "free";
  
  // For FREE PLAN users, homeAddress is not required
  if (isFreeOrNoPlan) {
    return true;
  }
  
  // For PAID PLAN users, homeAddress must be at least 5 characters
  return data.homeAddress && data.homeAddress.trim().length >= 5;
}, {
  message: "Home address is required for paid plans and must be at least 5 characters",
  path: ["homeAddress"]
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const debugId = `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔍 FIXED SIGNUP API [${debugId}]: Starting integrated signup process`);
  console.log(`🔍 FIXED SIGNUP API [${debugId}]: Timestamp: ${new Date().toISOString()}`);

  // Parse request body
  let body;
  try {
    body = await request.json();
    console.log(`🔍 FIXED SIGNUP API [${debugId}]: Request body parsed successfully`);
    console.log(`🔍 FIXED SIGNUP API [${debugId}]: Selected plan:`, body.selectedPlan);
    console.log(`🔍 FIXED SIGNUP API [${debugId}]: Payment method:`, body.paymentMethodId ? 'Provided' : 'Not provided');
  } catch (parseError) {
    console.error(`🚨 FIXED SIGNUP API [${debugId}]: Request body parsing failed:`, parseError);
    return new NextResponse(JSON.stringify({
      error: 'Invalid JSON in request body',
      debugId,
      parseError: parseError?.message
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // CRITICAL v1.5.21: Enhanced validation with detailed debugging
  const validation = signupSchema.safeParse(body);
  
  if (!validation.success) {
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: ❌ VALIDATION FAILED - Detailed breakdown:`);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: Validation error issues:`, JSON.stringify(validation.error.issues, null, 2));
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: Failed validation details:`);
    
    validation.error.issues.forEach((issue, index) => {
      console.error(`🚨 SIGNUP DEBUG [${debugId}]: Issue ${index + 1}:`, {
        path: issue.path,
        message: issue.message,
        code: issue.code,
        received: (issue as any).received,
        expected: (issue as any).expected
      });
    });
    
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: Actual values being validated:`);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: - email: ${typeof body.email} ${body.email}`);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: - password length: ${typeof body.password} ${body.password?.length || 'undefined'}`);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: - name: ${typeof body.name} ${body.name}`);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: - role: ${typeof body.role} ${body.role}`);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: - agreeToTerms: ${typeof body.agreeToTerms} ${body.agreeToTerms}`);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: - agreeToPrivacy: ${typeof body.agreeToPrivacy} ${body.agreeToPrivacy}`);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: - homeAddress length: ${typeof body.homeAddress} ${body.homeAddress?.length || 'undefined'}`);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: - homeAddress: ${body.homeAddress}`);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: - homeAddressValidation: ${typeof body.homeAddressValidation} ${JSON.stringify(body.homeAddressValidation)}`);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: - billingAddressValidation: ${typeof body.billingAddressValidation} ${JSON.stringify(body.billingAddressValidation)}`);
    
    return apiErrorHandler.createErrorResponse(
      ErrorType.VALIDATION,
      'SIGNUP_VALIDATION_FAILED',
      'Invalid signup data',
      400,
      { 
        issues: validation.error.issues, 
        debugId,
        rawBody: body
      }
    );
  }

  const { 
    email: rawEmail, 
    password, 
    name, 
    role, 
    agreeToTerms, 
    agreeToPrivacy, 
    homeAddress: originalHomeAddress,
    homeAddressValidation,
    useDifferentBillingAddress,
    billingAddress,
    billingAddressValidation,
    selectedPlan, 
    subscriptionData,
    paymentMethodId
  } = validation.data;
  
  // Create mutable homeAddress for FREE PLAN handling
  let homeAddress = originalHomeAddress;

  // Normalize email
  const email = rawEmail.toLowerCase().trim();
  console.log(`✅ FIXED SIGNUP API [${debugId}]: Validation passed for email: ${email}`);
  
  // CRITICAL v1.5.19 FIX: Log payment and plan information for debugging
  console.log(`💳 FIXED SIGNUP API [${debugId}]: Plan and payment details:`, {
    hasSelectedPlan: !!selectedPlan,
    planType: selectedPlan?.planType,
    planAmount: selectedPlan?.amount,
    stripePriceId: selectedPlan?.stripePriceId,
    hasPaymentMethod: !!paymentMethodId,
    paymentMethodId: paymentMethodId ? `${paymentMethodId.substring(0, 10)}...` : 'None'
  });

  // CRITICAL: Check if this is a demo account
  const isDemoAccount = demoAccountProtection.isDemoAccount(email);
  
  if (isDemoAccount) {
    console.error(`🚨 FIXED SIGNUP API [${debugId}]: Attempted signup for demo account: ${email}`);
    return apiErrorHandler.createErrorResponse(
      ErrorType.AUTHORIZATION,
      'DEMO_ACCOUNT_SIGNUP_BLOCKED',
      'Demo accounts cannot be created through signup',
      403,
      { email, debugId }
    );
  }

  // Check if user already exists
  console.log(`🔍 FIXED SIGNUP API [${debugId}]: Checking if user exists`);
  
  let existingUser;
  try {
    existingUser = await prisma.user.findUnique({
      where: { email },
    });
  } catch (dbError) {
    console.error(`🚨 FIXED SIGNUP API [${debugId}]: Database query failed:`, dbError);
    return new NextResponse(JSON.stringify({
      error: 'Database connection error during user lookup',
      debugId,
      dbError: dbError?.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (existingUser) {
    console.error(`🚨 FIXED SIGNUP API [${debugId}]: User already exists: ${email}`);
    return apiErrorHandler.createErrorResponse(
      ErrorType.CONFLICT,
      'USER_ALREADY_EXISTS',
      'An account with this email already exists',
      409,
      { email, debugId }
    );
  }

  // CRITICAL v1.5.21: Pre-validate account creation requirements before payment
  console.log(`🔍 FIXED SIGNUP API [${debugId}]: Pre-validating account creation requirements...`);
  
  try {
    // Validate all required data is present for account creation
    if (!email || !password || !name) {
      throw new Error('Missing required fields for account creation');
    }
    
    // CRITICAL v1.5.33-alpha.9 FIX: Conditional address validation for FREE vs PAID plans
    const isFreeOrNoPlan = !selectedPlan || 
                           selectedPlan.amount === 0 || 
                           selectedPlan.planType === "FREE" || 
                           selectedPlan.billingInterval === "free";
    
    if (isFreeOrNoPlan) {
      console.log(`🆓 FIXED SIGNUP API [${debugId}]: FREE PLAN detected - address validation skipped`);
      // For FREE PLAN users, provide a default home address if empty
      if (!homeAddress || homeAddress.trim().length === 0) {
        // Use a safe default that won't interfere with functionality
        homeAddress = "Not Provided (Free Plan)";
        console.log(`🆓 FIXED SIGNUP API [${debugId}]: Set default homeAddress for FREE PLAN user`);
      }
    } else {
      // For PAID PLAN users, validate address requirements
      if (!homeAddress || homeAddress.trim().length < 5) {
        throw new Error('Invalid home address for account creation');
      }
      console.log(`💳 FIXED SIGNUP API [${debugId}]: PAID PLAN address validation passed`);
    }
    
    // For paid plans, validate payment requirements
    if (selectedPlan && selectedPlan.amount > 0) {
      if (!selectedPlan.stripePriceId) {
        throw new Error('Missing Stripe price ID for paid plan');
      }
      console.log(`✅ FIXED SIGNUP API [${debugId}]: Paid plan validation passed`);
    }
    
    console.log(`✅ FIXED SIGNUP API [${debugId}]: Pre-validation completed successfully`);
  } catch (preValidationError) {
    console.error(`🚨 FIXED SIGNUP API [${debugId}]: Pre-validation failed:`, preValidationError);
    return new NextResponse(JSON.stringify({
      error: 'Account creation requirements not met',
      debugId,
      details: preValidationError instanceof Error ? preValidationError.message : 'Unknown validation error',
      userMessage: 'Please ensure all required fields are filled out correctly.'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // CRITICAL v1.5.31: Process payment ONLY after pre-validation passes
  let stripeCustomer = null;
  let stripeSubscription = null;
  let finalSubscriptionData = subscriptionData;
  
  // Check if this is a paid plan that requires payment processing
  const isPaidPlan = selectedPlan && selectedPlan.amount > 0 && selectedPlan.stripePriceId;
  
  if (isPaidPlan) {
    console.log(`💳 FIXED SIGNUP API [${debugId}]: Processing payment for paid plan:`, {
      planType: selectedPlan.planType,
      amount: selectedPlan.amount,
      stripePriceId: selectedPlan.stripePriceId
    });
    
    try {
      // CRITICAL v1.5.31 FIX: Create single Stripe customer for signup (subscription service will not create duplicate)
      console.log(`🏪 FIXED SIGNUP API [${debugId}]: Creating Stripe customer for signup...`);
      stripeCustomer = await stripe.customers.create({
        email,
        name,
        metadata: {
          platform: 'safeplay',
          signupFlow: 'integrated',
          debugId
        }
      });
      console.log(`✅ FIXED SIGNUP API [${debugId}]: Stripe customer created:`, {
        customerId: stripeCustomer.id,
        email: stripeCustomer.email
      });
      
      // Attach payment method to customer if provided
      if (paymentMethodId) {
        console.log(`💳 FIXED SIGNUP API [${debugId}]: Attaching payment method...`);
        
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomer.id,
        });
        
        // Set as default payment method
        await stripe.customers.update(stripeCustomer.id, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
        
        console.log(`✅ FIXED SIGNUP API [${debugId}]: Payment method attached and set as default`);
      }
      
      // Create subscription with trial
      console.log(`🔄 FIXED SIGNUP API [${debugId}]: Creating Stripe subscription...`);
      const subscriptionParams: any = {
        customer: stripeCustomer.id,
        items: [{ price: selectedPlan.stripePriceId }],
        metadata: {
          platform: 'safeplay',
          signupFlow: 'integrated',
          debugId,
          planType: selectedPlan.planType
        },
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: 7, // 7-day trial
      };
      
      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }
      
      stripeSubscription = await stripe.subscriptions.create(subscriptionParams);
      
      console.log(`✅ FIXED SIGNUP API [${debugId}]: Stripe subscription created:`, {
        subscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null
      });
      
      // Update subscription data with Stripe information
      finalSubscriptionData = {
        ...subscriptionData,
        stripeCustomerId: stripeCustomer.id,
        stripeSubscriptionId: stripeSubscription.id,
        stripeSubscriptionStatus: stripeSubscription.status,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null
      };
      
      console.log(`✅ FIXED SIGNUP API [${debugId}]: Payment processing completed successfully`);
      
    } catch (paymentError) {
      console.error(`🚨 FIXED SIGNUP API [${debugId}]: Payment processing failed:`, paymentError);
      
      // Clean up any created Stripe resources
      if (stripeCustomer) {
        try {
          await stripe.customers.del(stripeCustomer.id);
          console.log(`🧹 FIXED SIGNUP API [${debugId}]: Cleaned up Stripe customer`);
        } catch (cleanupError) {
          console.error(`⚠️ FIXED SIGNUP API [${debugId}]: Failed to cleanup Stripe customer:`, cleanupError);
        }
      }
      
      return new NextResponse(JSON.stringify({
        error: 'Payment processing failed',
        debugId,
        details: paymentError instanceof Error ? paymentError.message : 'Unknown payment error',
        userMessage: 'We were unable to process your payment. Please check your payment method and try again.'
      }), {
        status: 402, // Payment Required
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } else {
    console.log(`🆓 FIXED SIGNUP API [${debugId}]: Processing FREE plan signup - no payment required`);
  }

  // Hash password
  console.log(`🔐 FIXED SIGNUP API [${debugId}]: Hashing password`);
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (hashError) {
    console.error(`🚨 FIXED SIGNUP API [${debugId}]: Password hashing failed:`, hashError);
    return new NextResponse(JSON.stringify({
      error: 'Password processing error',
      debugId,
      hashError: hashError?.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get request metadata
  const ipAddress = request.headers.get("x-forwarded-for") || 
                    request.headers.get("x-real-ip") || 
                    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const currentTime = new Date();

  // CRITICAL v1.5.21: Enhanced database transaction with robust error handling
  console.log(`🔄 FIXED SIGNUP API [${debugId}]: Starting enhanced database transaction`);
  
  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      console.log(`🔄 FIXED SIGNUP API [${debugId}]: Creating user record...`);
      
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          isActive: true,
          lastLoginAt: currentTime,
        },
      });

      console.log(`✅ FIXED SIGNUP API [${debugId}]: User created: ${newUser.id}`);

      // CRITICAL v1.5.21: Enhanced clean account initialization with comprehensive error handling
      console.log(`🔄 FIXED SIGNUP API [${debugId}]: Initializing clean account structure...`);
      
      const cleanInitResult = await cleanAccountInitializer.initializeCleanAccount({
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        ipAddress,
        userAgent,
        prismaInstance: tx, // Pass transaction context to prevent foreign key constraint issues
        // CRITICAL FIX: Pass selected plan information to create correct subscription
        selectedPlan: selectedPlan,
        // CRITICAL v1.5.31 FIX: Pass Stripe information from payment processing to prevent duplicate customer creation
        stripeCustomerId: stripeCustomer?.id || finalSubscriptionData?.stripeCustomerId,
        stripeSubscriptionId: stripeSubscription?.id || finalSubscriptionData?.stripeSubscriptionId,
        subscriptionMetadata: finalSubscriptionData,
        // CRITICAL v1.5.31 FIX: Pass existing customer to prevent duplicate creation
        existingStripeCustomerId: stripeCustomer?.id
      });

      if (!cleanInitResult.success) {
        console.error(`🚨 FIXED SIGNUP API [${debugId}]: Clean account initialization failed:`, cleanInitResult.errors);
        throw new Error(`Clean account initialization failed: ${cleanInitResult.errors.join(', ')}`);
      }

      if (!cleanInitResult.isClean) {
        console.error(`🚨 FIXED SIGNUP API [${debugId}]: Account is not clean after initialization`);
        throw new Error('Account failed cleanliness validation');
      }

      console.log(`✅ FIXED SIGNUP API [${debugId}]: Clean account initialization successful`);
      
      // CRITICAL v1.5.33: Enhanced account creation integrity verification
      console.log(`🔍 FIXED SIGNUP API [${debugId}]: Verifying account creation integrity...`);
      
      // Check that user exists
      const userCheck = await tx.user.findUnique({ where: { id: newUser.id } });
      if (!userCheck) {
        throw new Error('User creation verification failed - user not found');
      }
      
      // CRITICAL FIX v1.5.33: Proper subscription verification with correct model name
      const subscriptionCheck = await tx.userSubscription.findFirst({ where: { userId: newUser.id } });
      if (!subscriptionCheck) {
        console.error(`🚨 FIXED SIGNUP API [${debugId}]: Subscription verification failed - checking transaction state`);
        
        // Additional debugging for subscription creation
        const allSubscriptions = await tx.userSubscription.findMany({ where: { userId: newUser.id } });
        console.error(`🚨 FIXED SIGNUP API [${debugId}]: Found ${allSubscriptions.length} subscriptions in transaction`);
        
        throw new Error('Subscription creation verification failed - subscription not found');
      }
      
      // Check that legal agreements exist
      const legalAgreementsCheck = await tx.legalAgreement.count({ where: { userId: newUser.id } });
      if (legalAgreementsCheck === 0) {
        throw new Error('Legal agreements creation verification failed - no agreements found');
      }
      
      console.log(`✅ FIXED SIGNUP API [${debugId}]: Account creation integrity verified - User: ${userCheck.email}, Subscription: ${subscriptionCheck.planType}, Legal: ${legalAgreementsCheck} agreements`);
      console.log(`✅ FIXED SIGNUP API [${debugId}]: User setup completed: ${newUser.email}`);
      return newUser;
    }, {
      maxWait: 10000, // 10 seconds
      timeout: 30000, // 30 seconds
    });

    // CRITICAL: Final validation - ensure no contamination
    const finalValidation = await demoAccountProtection.validateNoContamination(user.id, user.email);
    
    if (!finalValidation) {
      console.error(`🚨 FIXED SIGNUP API [${debugId}]: CRITICAL - Account failed final contamination check`);
      
      // Clean up the created user
      await prisma.userSubscription.deleteMany({ where: { userId: user.id } });
      await prisma.legalAgreement.deleteMany({ where: { userId: user.id } });
      await prisma.emailPreferences.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      
      return new NextResponse(JSON.stringify({
        error: 'Account contamination detected - signup cancelled',
        debugId,
        details: 'Account failed final contamination validation'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create secure session isolation
    await authSessionManager.createSecureSessionIsolation(user.id);

    console.log(`✅ FIXED SIGNUP API [${debugId}]: Signup process completed successfully`);

    return new NextResponse(JSON.stringify({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        protection: {
          isDemoAccount: false,
          isClean: true,
          protectionEnabled: true
        },
        message: "Protected account created successfully"
      },
      debugId
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`🚨 FIXED SIGNUP API [${debugId}]: Transaction failed:`, error);
    
    // CRITICAL v1.5.21: Enhanced rollback mechanism with comprehensive error handling
    if (stripeCustomer || stripeSubscription) {
      console.log(`🔄 FIXED SIGNUP API [${debugId}]: Rolling back payment due to account creation failure`);
      
      try {
        // Cancel subscription if it was created
        if (stripeSubscription) {
          console.log(`🔄 FIXED SIGNUP API [${debugId}]: Canceling Stripe subscription: ${stripeSubscription.id}`);
          await stripe.subscriptions.cancel(stripeSubscription.id);
          console.log(`✅ FIXED SIGNUP API [${debugId}]: Stripe subscription canceled: ${stripeSubscription.id}`);
        }
        
        // Delete customer if it was created
        if (stripeCustomer) {
          console.log(`🔄 FIXED SIGNUP API [${debugId}]: Deleting Stripe customer: ${stripeCustomer.id}`);
          await stripe.customers.del(stripeCustomer.id);
          console.log(`✅ FIXED SIGNUP API [${debugId}]: Stripe customer deleted: ${stripeCustomer.id}`);
        }
        
        console.log(`✅ FIXED SIGNUP API [${debugId}]: Payment rollback completed successfully`);
        
        // Return appropriate error after successful rollback
        return new NextResponse(JSON.stringify({
          error: 'Account creation failed',
          debugId,
          details: error instanceof Error ? error.message : 'Unknown error',
          userMessage: 'We were unable to create your account. No payment was processed. Please try again or contact support if the issue persists.',
          paymentRolledBack: true
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (rollbackError) {
        console.error(`🚨 FIXED SIGNUP API [${debugId}]: Payment rollback failed:`, rollbackError);
        
        // Log critical issue for manual intervention
        console.error(`🚨 CRITICAL ISSUE [${debugId}]: Payment succeeded but account creation failed, and payment rollback failed. Manual intervention required.`, {
          email,
          stripeCustomerId: stripeCustomer?.id,
          stripeSubscriptionId: stripeSubscription?.id,
          originalError: error instanceof Error ? error.message : 'Unknown error',
          rollbackError: rollbackError instanceof Error ? rollbackError.message : 'Unknown rollback error',
          timestamp: new Date().toISOString()
        });
        
        return new NextResponse(JSON.stringify({
          error: 'Critical payment processing error - please contact support immediately',
          debugId,
          details: 'Payment was processed but account creation failed. Payment rollback also failed. Please contact support immediately for assistance.',
          userMessage: 'We encountered a critical issue creating your account. Your payment may have been processed. Please contact support at support@safeplay.com immediately for assistance.',
          criticalIssue: true,
          requiresManualIntervention: true
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Return error for non-payment related failures
    return new NextResponse(JSON.stringify({
      error: 'Failed to create account',
      debugId,
      details: error instanceof Error ? error.message : 'Unknown error',
      userMessage: 'We were unable to create your account. Please try again or contact support if the issue persists.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
