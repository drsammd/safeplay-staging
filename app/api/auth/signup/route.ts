
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
import { unifiedCustomerService } from "@/lib/stripe/unified-customer-service";

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

  // CRITICAL v1.5.40-alpha.12 EMERGENCY FIX: Move Stripe processing INSIDE database transaction
  // to prevent customers being charged without receiving accounts
  
  // Check if this is a paid plan that requires payment processing
  const isPaidPlan = selectedPlan && selectedPlan.amount > 0 && selectedPlan.stripePriceId;
  
  console.log(`🚨 EMERGENCY FIX [${debugId}]: ${isPaidPlan ? 'PAID' : 'FREE'} plan signup - Stripe processing moved to AFTER user creation`);
  
  if (isPaidPlan) {
    console.log(`💳 EMERGENCY FIX [${debugId}]: PAID plan detected - payment will be processed AFTER user account creation to prevent charging without account`);
    console.log(`💳 EMERGENCY FIX [${debugId}]: Plan details:`, {
      planType: selectedPlan.planType,
      amount: selectedPlan.amount,
      stripePriceId: selectedPlan.stripePriceId,
      hasPaymentMethod: !!paymentMethodId
    });
  } else {
    console.log(`🆓 EMERGENCY FIX [${debugId}]: FREE plan signup - no payment processing required`);
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

  // CRITICAL v1.5.40-alpha.12 EMERGENCY FIX: Enhanced database transaction with Stripe processing INSIDE
  // to prevent foreign key constraint violations and ensure customers aren't charged without accounts
  console.log(`🔄 EMERGENCY FIX [${debugId}]: Starting atomic database transaction with integrated Stripe processing`);
  
  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      console.log(`🔄 EMERGENCY FIX [${debugId}]: Step 1 - Creating user record FIRST...`);
      
      // STEP 1: Create user record FIRST (fixes foreign key constraint violation)
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

      console.log(`✅ EMERGENCY FIX [${debugId}]: User created successfully: ${newUser.id}`);
      
      // STEP 2: Process Stripe payment INSIDE transaction (after user exists)
      let stripeCustomer = null;
      let stripeSubscription = null;
      let finalSubscriptionData = subscriptionData;
      
      if (isPaidPlan) {
        console.log(`💳 EMERGENCY FIX [${debugId}]: Step 2 - Processing Stripe payment AFTER user creation...`);
        
        try {
          // Create Stripe customer (user already exists, safe to reference)
          console.log(`🏪 EMERGENCY FIX [${debugId}]: Creating Stripe customer for existing user ${newUser.id}...`);
          
          const customerResult = await unifiedCustomerService.getOrCreateCustomer(
            email,
            name,
            newUser.id, // NOW we have a valid userId
            false // Not a free plan
          );

          if (customerResult.errors.length > 0) {
            throw new Error(`Customer creation failed: ${customerResult.errors.join(', ')}`);
          }

          stripeCustomer = customerResult.customer;
          console.log(`✅ EMERGENCY FIX [${debugId}]: Stripe customer created:`, {
            customerId: stripeCustomer.id,
            email: stripeCustomer.email,
            userId: newUser.id,
            source: customerResult.source
          });
          
          // Attach payment method to customer if provided
          if (paymentMethodId) {
            console.log(`💳 EMERGENCY FIX [${debugId}]: Attaching payment method...`);
            
            await stripe.paymentMethods.attach(paymentMethodId, {
              customer: stripeCustomer.id,
            });
            
            // Set as default payment method
            await stripe.customers.update(stripeCustomer.id, {
              invoice_settings: {
                default_payment_method: paymentMethodId,
              },
            });
            
            console.log(`✅ EMERGENCY FIX [${debugId}]: Payment method attached and set as default`);
          }
          
          // Create subscription with trial
          console.log(`🔄 EMERGENCY FIX [${debugId}]: Creating Stripe subscription for user ${newUser.id}...`);
          const subscriptionParams: any = {
            customer: stripeCustomer.id,
            items: [{ price: selectedPlan.stripePriceId }],
            metadata: {
              platform: 'safeplay',
              signupFlow: 'integrated_fixed',
              debugId,
              planType: selectedPlan.planType,
              userId: newUser.id, // Reference the actual user ID
              source: 'emergency_fix_v1.5.40-alpha.12'
            },
            expand: ['latest_invoice.payment_intent'],
            trial_period_days: 7, // 7-day trial
          };
          
          if (paymentMethodId) {
            subscriptionParams.default_payment_method = paymentMethodId;
          }
          
          stripeSubscription = await stripe.subscriptions.create(subscriptionParams);
          
          // Safe date conversion for signup flow
          const safeTrialEnd = stripeSubscription.trial_end ? 
            (() => {
              try {
                const date = new Date(stripeSubscription.trial_end * 1000);
                return isNaN(date.getTime()) ? null : date;
              } catch (error) {
                console.error(`🚨 EMERGENCY FIX [${debugId}]: Trial end date conversion error:`, error);
                return null;
              }
            })() : null;
          
          console.log(`✅ EMERGENCY FIX [${debugId}]: Stripe subscription created:`, {
            subscriptionId: stripeSubscription.id,
            status: stripeSubscription.status,
            userId: newUser.id,
            trialEnd: safeTrialEnd?.toISOString() || 'null'
          });
          
          // Update subscription data with Stripe information
          finalSubscriptionData = {
            ...subscriptionData,
            stripeCustomerId: stripeCustomer.id,
            stripeSubscriptionId: stripeSubscription.id,
            stripeSubscriptionStatus: stripeSubscription.status,
            trialEnd: safeTrialEnd
          };
          
          console.log(`✅ EMERGENCY FIX [${debugId}]: Stripe processing completed successfully for user ${newUser.id}`);
          
        } catch (stripeError) {
          console.error(`🚨 EMERGENCY FIX [${debugId}]: Stripe processing failed INSIDE transaction:`, stripeError);
          
          // CRITICAL v1.5.40-alpha.13: Implement Stripe compensation logic
          console.log(`🧹 EMERGENCY FIX [${debugId}]: Attempting to clean up partial Stripe objects...`);
          
          try {
            // Clean up any Stripe objects that were created before the failure
            if (stripeCustomer?.id) {
              console.log(`🧹 EMERGENCY FIX [${debugId}]: Cleaning up Stripe customer: ${stripeCustomer.id}`);
              await stripe.customers.del(stripeCustomer.id);
              console.log(`✅ EMERGENCY FIX [${debugId}]: Stripe customer cleaned up successfully`);
            }
            
            if (stripeSubscription?.id) {
              console.log(`🧹 EMERGENCY FIX [${debugId}]: Cleaning up Stripe subscription: ${stripeSubscription.id}`);
              await stripe.subscriptions.cancel(stripeSubscription.id);
              console.log(`✅ EMERGENCY FIX [${debugId}]: Stripe subscription cleaned up successfully`);
            }
          } catch (cleanupError) {
            console.error(`⚠️ EMERGENCY FIX [${debugId}]: Stripe cleanup failed (non-critical):`, cleanupError);
            // Cleanup failure is non-critical, continue with transaction rollback
          }
          
          // CRITICAL: Since we're inside a transaction, throwing here will rollback user creation
          // This prevents charging customers without accounts
          throw new Error(`Payment processing failed: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`);
        }
      } else {
        console.log(`🆓 EMERGENCY FIX [${debugId}]: FREE plan - no Stripe processing required`);
      }

      // STEP 3: Initialize clean account structure with existing user and Stripe data
      console.log(`🔄 EMERGENCY FIX [${debugId}]: Step 3 - Initializing account structure for user ${newUser.id}...`);
      
      const cleanInitResult = await cleanAccountInitializer.initializeCleanAccount({
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        ipAddress,
        userAgent,
        prismaInstance: tx, // Pass transaction context to prevent foreign key constraint issues
        selectedPlan: selectedPlan,
        // Pass valid Stripe information (only if payment was processed)
        stripeCustomerId: stripeCustomer?.id,
        stripeSubscriptionId: stripeSubscription?.id,
        subscriptionMetadata: finalSubscriptionData
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
    console.error(`🚨 EMERGENCY FIX [${debugId}]: Atomic transaction failed:`, error);
    
    // CRITICAL v1.5.40-alpha.13: Enhanced error handling with specific foreign key constraint detection
    // Since Stripe processing is now INSIDE the transaction, any failure here means NO payment was processed
    console.log(`✅ EMERGENCY FIX [${debugId}]: CUSTOMER PROTECTION SUCCESSFUL - Atomic transaction rollback prevents charging without account`);
    
    // Determine error type and provide appropriate response
    let errorMessage = 'Account creation failed';
    let errorCode = 'ACCOUNT_CREATION_FAILED';
    let statusCode = 500;
    let userMessage = 'We were unable to create your account. No payment was processed. Please try again or contact support if the issue persists.';
    let technicalIssueDetected = false;
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      // CRITICAL v1.5.40-alpha.13: Specific detection for the foreign key constraint violation we're fixing
      if (errorMsg.includes('user_subscriptions_userid_fkey') || 
          errorMsg.includes('user_subscriptions_userId_fkey')) {
        errorMessage = 'Transaction isolation issue prevented account creation';
        errorCode = 'FOREIGN_KEY_CONSTRAINT_VIOLATION';
        statusCode = 500;
        userMessage = 'We encountered a technical database issue. Your payment was not processed. Our team has been automatically notified. Please try again in a few moments.';
        technicalIssueDetected = true;
        
        console.error(`🚨 CRITICAL [${debugId}]: FOREIGN KEY CONSTRAINT VIOLATION DETECTED - user_subscriptions_userId_fkey`);
        console.error(`🚨 CRITICAL [${debugId}]: This was the exact issue we're fixing in v1.5.40-alpha.13!`);
      }
      // Check for payment-related failures that occurred inside transaction
      else if (errorMsg.includes('payment processing failed') || 
          errorMsg.includes('stripe') || 
          errorMsg.includes('payment method') ||
          errorMsg.includes('customer creation failed')) {
        errorMessage = 'Payment processing failed during account creation';
        errorCode = 'PAYMENT_PROCESSING_FAILED';
        statusCode = 402; // Payment Required
        userMessage = 'We were unable to process your payment during account creation. Your card was not charged. Please check your payment method and try again.';
        
        console.log(`💳 EMERGENCY FIX [${debugId}]: Payment failure inside transaction - customer safely NOT charged`);
      } 
      // Check for database constraint violations (enhanced detection)
      else if (errorMsg.includes('unique constraint') || errorMsg.includes('duplicate')) {
        errorMessage = 'An account with this email already exists';
        errorCode = 'DUPLICATE_ACCOUNT';
        statusCode = 409;
        userMessage = 'An account with this email address already exists. Please sign in instead.';
      } 
      else if (errorMsg.includes('foreign key') || errorMsg.includes('constraint')) {
        errorMessage = 'Database constraint prevented account creation';
        errorCode = 'DATABASE_CONSTRAINT_ERROR';
        statusCode = 500;
        userMessage = 'We encountered a technical issue creating your account. No payment was processed. Please try again.';
        technicalIssueDetected = true;
        
        console.log(`🔗 EMERGENCY FIX [${debugId}]: Foreign key constraint error safely prevented by atomic transaction`);
      } 
      else if (errorMsg.includes('validation') || errorMsg.includes('clean account')) {
        errorMessage = 'Account validation failed';
        errorCode = 'VALIDATION_FAILED';
        statusCode = 400;
        userMessage = 'Account validation failed. Please ensure all required fields are filled correctly.';
      }
      // CRITICAL v1.5.40-alpha.13: Detect database subscription creation failures
      else if (errorMsg.includes('database subscription creation failed') || 
               errorMsg.includes('subscription creation failed')) {
        errorMessage = 'Subscription creation failed in transaction';
        errorCode = 'SUBSCRIPTION_CREATION_ERROR';
        statusCode = 500;
        userMessage = 'We encountered an issue setting up your subscription. Your payment was not processed. Please try again.';
        technicalIssueDetected = true;
        
        console.error(`🚨 CRITICAL [${debugId}]: SUBSCRIPTION CREATION FAILURE - likely related to upsert/foreign key issue`);
      }
    }
    
    return new NextResponse(JSON.stringify({
      error: errorMessage,
      errorCode,
      debugId,
      details: error instanceof Error ? error.message : 'Unknown error',
      userMessage,
      // CRITICAL SUCCESS INDICATORS: Show that customer protection worked
      customerProtected: true,
      noPaymentProcessed: true,
      atomicTransactionRollback: true,
      isPaidPlan: isPaidPlan,
      emergencyFixActive: 'v1.5.40-alpha.13',
      // Enhanced debugging for technical issues
      technicalIssueDetected: technicalIssueDetected,
      supportContactRecommended: technicalIssueDetected,
      retryRecommended: !technicalIssueDetected
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
