
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiErrorHandler, withErrorHandling, ErrorType } from "@/lib/error-handler";
import { emailAutomationEngine } from "@/lib/services/email-automation-engine";

export const dynamic = "force-dynamic";

// Request validation schema
const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["PARENT", "VENUE_ADMIN", "SUPER_ADMIN"]).default("PARENT"),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the Terms of Service"),
  agreeToPrivacy: z.boolean().refine(val => val === true, "You must agree to the Privacy Policy"),
  // Enhanced address information
  homeAddress: z.string().min(10, "Home address must be at least 10 characters"),
  homeAddressValidation: z.object({
    isValid: z.boolean(),
    confidence: z.number(),
    standardizedAddress: z.any().optional(),
    originalInput: z.string(),
  }).optional(),
  useDifferentBillingAddress: z.boolean().default(false),
  billingAddress: z.string().optional(),
  billingAddressValidation: z.object({
    isValid: z.boolean(),
    confidence: z.number(),
    standardizedAddress: z.any().optional(),
    originalInput: z.string(),
  }).optional(),
  selectedPlan: z.object({
    id: z.string(),
    name: z.string(),
    stripePriceId: z.string(),
    billingInterval: z.enum(["monthly", "yearly", "lifetime"]),
    amount: z.number(),
    planType: z.string(),
  }).optional(),
  subscriptionData: z.any().optional(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // COMPREHENSIVE DEBUGGING - START
  const debugId = `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔍 SIGNUP DEBUG [${debugId}]: === SIGNUP API CALLED ===`);
  console.log(`🔍 SIGNUP DEBUG [${debugId}]: Timestamp: ${new Date().toISOString()}`);
  console.log(`🔍 SIGNUP DEBUG [${debugId}]: Request URL: ${request.url}`);
  console.log(`🔍 SIGNUP DEBUG [${debugId}]: Request method: ${request.method}`);
  
  // Parse and validate request body with comprehensive error handling
  let body;
  try {
    console.log(`🔍 SIGNUP DEBUG [${debugId}]: === PARSING REQUEST BODY ===`);
    body = await request.json();
    console.log(`🔍 SIGNUP DEBUG [${debugId}]: ✅ Request body parsed successfully`);
    console.log(`🔍 SIGNUP DEBUG [${debugId}]: Request body summary:`, {
      email: body?.email,
      name: body?.name,
      role: body?.role,
      hasSubscriptionData: !!body?.subscriptionData,
      hasSelectedPlan: !!body?.selectedPlan,
      subscriptionDataDebugId: body?.subscriptionData?.debugId,
      fullBodyKeys: body ? Object.keys(body) : 'no body'
    });
    console.log(`🔍 SIGNUP DEBUG [${debugId}]: Full request body:`, JSON.stringify(body, null, 2));
  } catch (parseError) {
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: ❌ CRITICAL: Failed to parse request body:`, parseError);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: Parse error details:`, {
      message: parseError?.message,
      stack: parseError?.stack,
      name: parseError?.name
    });
    return new NextResponse(JSON.stringify({
      error: 'Invalid JSON in request body',
      debugId,
      parseError: parseError?.message
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const validation = signupSchema.safeParse(body);
  
  if (!validation.success) {
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: Validation failed:`, validation.error.issues);
    return apiErrorHandler.createErrorResponse(
      ErrorType.VALIDATION,
      'SIGNUP_VALIDATION_FAILED',
      'Invalid signup data',
      400,
      { issues: validation.error.issues, debugId }
    );
  }

  const { 
    email: rawEmail, 
    password, 
    name, 
    role, 
    agreeToTerms, 
    agreeToPrivacy, 
    homeAddress,
    homeAddressValidation,
    useDifferentBillingAddress,
    billingAddress,
    billingAddressValidation,
    selectedPlan, 
    subscriptionData 
  } = validation.data;
  
  // Normalize email to lowercase for consistency
  const email = rawEmail.toLowerCase().trim();
  console.log(`✅ SIGNUP DEBUG [${debugId}]: Validation passed for email: ${email}, name: ${name}`);

  // Check if user already exists
  console.log(`🔍 SIGNUP DEBUG [${debugId}]: === CHECKING IF USER EXISTS ===`);
  console.log(`🔍 SIGNUP DEBUG [${debugId}]: About to query database for email: ${email}`);
  
  let existingUser;
  try {
    console.log(`🔍 SIGNUP DEBUG [${debugId}]: Calling prisma.user.findUnique...`);
    existingUser = await prisma.user.findUnique({
      where: { email },
    });
    console.log(`🔍 SIGNUP DEBUG [${debugId}]: ✅ Database query completed`);
    console.log(`🔍 SIGNUP DEBUG [${debugId}]: Existing user result:`, existingUser ? 'USER EXISTS' : 'USER NOT FOUND');
  } catch (dbError) {
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: ❌ CRITICAL: Database query failed:`, dbError);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: Database error details:`, {
      message: dbError?.message,
      stack: dbError?.stack,
      name: dbError?.name,
      code: dbError?.code
    });
    return new NextResponse(JSON.stringify({
      error: 'Database connection error during user lookup',
      debugId,
      dbError: dbError?.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (existingUser) {
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: User already exists with email: ${email}`);
    return apiErrorHandler.createErrorResponse(
      ErrorType.CONFLICT,
      'USER_ALREADY_EXISTS',
      'An account with this email already exists',
      409,
      { email, debugId }
    );
  }

  console.log(`✅ SIGNUP DEBUG [${debugId}]: User does not exist, proceeding with creation`);

  // Hash password
  console.log(`🔐 SIGNUP DEBUG [${debugId}]: === HASHING PASSWORD ===`);
  let hashedPassword;
  try {
    console.log(`🔐 SIGNUP DEBUG [${debugId}]: Calling bcrypt.hash...`);
    hashedPassword = await bcrypt.hash(password, 12);
    console.log(`✅ SIGNUP DEBUG [${debugId}]: Password hashed successfully`);
  } catch (hashError) {
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: ❌ CRITICAL: Password hashing failed:`, hashError);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: Hash error details:`, {
      message: hashError?.message,
      stack: hashError?.stack,
      name: hashError?.name
    });
    return new NextResponse(JSON.stringify({
      error: 'Password processing error',
      debugId,
      hashError: hashError?.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get request metadata for compliance tracking
  const ipAddress = request.headers.get("x-forwarded-for") || 
                   request.headers.get("x-real-ip") || 
                   "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Get current time for timestamps
  const currentTime = new Date();
  console.log(`⏰ SIGNUP DEBUG [${debugId}]: Creating user at ${currentTime.toISOString()}`);

  // Create user and legal agreements in a transaction
  console.log(`🔄 SIGNUP DEBUG [${debugId}]: === STARTING DATABASE TRANSACTION ===`);
  console.log(`🔄 SIGNUP DEBUG [${debugId}]: Transaction will create user, legal agreements, and subscription if applicable`);
  
  let user;
  try {
    console.log(`🔄 SIGNUP DEBUG [${debugId}]: Calling prisma.$transaction...`);
    user = await prisma.$transaction(async (tx) => {
      console.log(`📝 SIGNUP DEBUG [${debugId}]: === INSIDE TRANSACTION: Creating user record ===`);
      console.log(`📝 SIGNUP DEBUG [${debugId}]: User data to create:`, {
        email,
        name,
        role,
        hasPassword: !!hashedPassword
      });
      
      // Create user
      let newUser;
      try {
        console.log(`📝 SIGNUP DEBUG [${debugId}]: Calling tx.user.create...`);
        newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role,
          },
        });
        console.log(`✅ SIGNUP DEBUG [${debugId}]: User created successfully`);
        console.log(`✅ SIGNUP DEBUG [${debugId}]: User details: ID=${newUser.id}, email=${newUser.email}, createdAt=${newUser.createdAt}`);
      } catch (userCreateError) {
        console.error(`🚨 SIGNUP DEBUG [${debugId}]: ❌ CRITICAL: User creation failed:`, userCreateError);
        console.error(`🚨 SIGNUP DEBUG [${debugId}]: User creation error details:`, {
          message: userCreateError?.message,
          stack: userCreateError?.stack,
          name: userCreateError?.name,
          code: userCreateError?.code
        });
        throw userCreateError;
      }

    // Log address information (database storage will be implemented later)
    if (homeAddress) {
      console.log(`✅ SIGNUP DEBUG [${debugId}]: Address validation completed for user: ${newUser.id}`);
      console.log(`📍 SIGNUP DEBUG [${debugId}]: Home address: ${homeAddress}`);
      console.log(`📍 SIGNUP DEBUG [${debugId}]: Home address validation:`, {
        isValid: homeAddressValidation?.isValid,
        confidence: homeAddressValidation?.confidence,
        standardizedAddress: homeAddressValidation?.standardizedAddress
      });

      if (useDifferentBillingAddress && billingAddress) {
        console.log(`✅ SIGNUP DEBUG [${debugId}]: Separate billing address validated for user: ${newUser.id}`);
        console.log(`💳 SIGNUP DEBUG [${debugId}]: Billing address: ${billingAddress}`);
        console.log(`💳 SIGNUP DEBUG [${debugId}]: Billing address validation:`, {
          isValid: billingAddressValidation?.isValid,
          confidence: billingAddressValidation?.confidence,
          standardizedAddress: billingAddressValidation?.standardizedAddress
        });
      } else {
        console.log(`ℹ️ SIGNUP DEBUG [${debugId}]: Using home address as billing address for user: ${newUser.id}`);
      }
    }

    // Create legal agreement records
    const agreementVersion = "1.0"; // Current version of legal documents
    console.log(`📋 SIGNUP DEBUG [${debugId}]: === CREATING LEGAL AGREEMENTS ===`);
    console.log(`📋 SIGNUP DEBUG [${debugId}]: Agreement version: ${agreementVersion}`);
    console.log(`📋 SIGNUP DEBUG [${debugId}]: User ID: ${newUser.id}`);
    console.log(`📋 SIGNUP DEBUG [${debugId}]: IP Address: ${ipAddress}`);
    console.log(`📋 SIGNUP DEBUG [${debugId}]: User Agent: ${userAgent}`);

    // Terms of Service agreement
    try {
      console.log(`📋 SIGNUP DEBUG [${debugId}]: Creating Terms of Service agreement...`);
      await tx.legalAgreement.create({
        data: {
          userId: newUser.id,
          agreementType: "TERMS_OF_SERVICE",
          version: agreementVersion,
          agreedAt: currentTime,
          ipAddress,
          userAgent,
          content: "Terms of Service Agreement"
        },
      });
      console.log(`✅ SIGNUP DEBUG [${debugId}]: Terms of Service agreement created`);
    } catch (tosError) {
      console.error(`🚨 SIGNUP DEBUG [${debugId}]: ❌ Terms of Service agreement creation failed:`, tosError);
      throw tosError;
    }

    // Privacy Policy agreement
    try {
      console.log(`📋 SIGNUP DEBUG [${debugId}]: Creating Privacy Policy agreement...`);
      await tx.legalAgreement.create({
        data: {
          userId: newUser.id,
          agreementType: "PRIVACY_POLICY",
          version: agreementVersion,
          agreedAt: currentTime,
          ipAddress,
          userAgent,
          content: "Privacy Policy Agreement"
        },
      });
      console.log(`✅ SIGNUP DEBUG [${debugId}]: Privacy Policy agreement created`);
    } catch (privacyError) {
      console.error(`🚨 SIGNUP DEBUG [${debugId}]: ❌ Privacy Policy agreement creation failed:`, privacyError);
      throw privacyError;
    }

    // COPPA consent for parent accounts
    if (role === "PARENT") {
      console.log(`👨‍👩‍👧‍👦 SIGNUP DEBUG [${debugId}]: Creating parent-specific legal agreements...`);
      
      await tx.legalAgreement.create({
        data: {
          userId: newUser.id,
          agreementType: "PARENTAL_CONSENT",
          version: agreementVersion,
          agreedAt: currentTime,
          ipAddress,
          userAgent,
          content: "Parental Consent Agreement"
        },
      });

      // Biometric consent for parent accounts
      await tx.legalAgreement.create({
        data: {
          userId: newUser.id,
          agreementType: "DATA_PROCESSING_AGREEMENT",
          version: agreementVersion,
          agreedAt: currentTime,
          ipAddress,
          userAgent,
          content: "Data Processing Agreement - Registration Flow with Biometric Data Processing",
        },
      });
    }

    // Create subscription if plan was selected
    if (selectedPlan) {
      console.log(`💳 SIGNUP DEBUG [${debugId}]: Creating subscription for user: ${newUser.id}, Plan: ${selectedPlan.planType}`);
      
      // Map plan type to subscription enum with validation
      const planTypeUpper = selectedPlan.planType.toUpperCase();
      const validPlanTypes = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'];
      const subscriptionPlan = validPlanTypes.includes(planTypeUpper) ? planTypeUpper as 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE' : 'BASIC';
      
      console.log(`💳 SIGNUP DEBUG [${debugId}]: Mapped plan type from ${selectedPlan.planType} to ${subscriptionPlan}`);
      
      // Check if Stripe subscription was already created during payment
      if (subscriptionData?.subscription?.id && subscriptionData?.customer?.id) {
        console.log(`💳 SIGNUP DEBUG [${debugId}]: Linking existing Stripe subscription to user: ${newUser.id}`);
        
        const stripeSubscription = subscriptionData.subscription;
        const stripeCustomer = subscriptionData.customer;
        
        // Map Stripe status to our enum with comprehensive handling
        const mapStripeStatus = (stripeStatus: string): 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING' => {
          const statusMap: Record<string, 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING'> = {
            'active': 'ACTIVE',
            'trialing': 'TRIALING',
            'past_due': 'PAST_DUE',
            'unpaid': 'UNPAID',
            'canceled': 'CANCELLED',
            'cancelled': 'CANCELLED',
            'incomplete': 'ACTIVE', // Treat incomplete as active since payment succeeded
            'incomplete_expired': 'EXPIRED'
          };
          
          const mappedStatus = statusMap[stripeStatus.toLowerCase()] || 'ACTIVE';
          console.log(`💳 SIGNUP DEBUG [${debugId}]: Mapped Stripe status '${stripeStatus}' to '${mappedStatus}'`);
          return mappedStatus;
        };
        
        const subscriptionRecord: any = {
          userId: newUser.id,
          planType: subscriptionPlan,
          status: mapStripeStatus(stripeSubscription.status),
          stripeCustomerId: String(stripeCustomer.id),
          stripeSubscriptionId: String(stripeSubscription.id),
          currentPeriodStart: stripeSubscription.current_period_start 
            ? new Date(stripeSubscription.current_period_start * 1000) 
            : currentTime,
          currentPeriodEnd: stripeSubscription.current_period_end 
            ? new Date(stripeSubscription.current_period_end * 1000) 
            : new Date(currentTime.getTime() + (7 * 24 * 60 * 60 * 1000)),
          cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end || false),
          canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
          trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
          trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
          autoRenew: selectedPlan.billingInterval !== 'lifetime',
          metadata: {
            selectedPlan: selectedPlan,
            registrationFlow: true,
            createdAt: currentTime.toISOString(),
            stripeSubscriptionData: stripeSubscription,
            debugId: debugId
          }
        };

        console.log(`💳 SIGNUP DEBUG [${debugId}]: About to create subscription record:`, JSON.stringify({
          userId: subscriptionRecord.userId,
          planType: subscriptionRecord.planType,
          status: subscriptionRecord.status,
          stripeCustomerId: subscriptionRecord.stripeCustomerId,
          stripeSubscriptionId: subscriptionRecord.stripeSubscriptionId,
          autoRenew: subscriptionRecord.autoRenew
        }, null, 2));

        try {
          await tx.userSubscription.create({
            data: subscriptionRecord,
          });
          console.log(`✅ SIGNUP DEBUG [${debugId}]: Stripe subscription linked successfully for user: ${newUser.id}`);
        } catch (subscriptionError) {
          console.error(`🚨 SIGNUP DEBUG [${debugId}]: ❌ CRITICAL: Subscription creation failed:`, subscriptionError);
          console.error(`🚨 SIGNUP DEBUG [${debugId}]: Subscription error details:`, {
            message: subscriptionError?.message,
            stack: subscriptionError?.stack,
            name: subscriptionError?.name,
            code: subscriptionError?.code,
            meta: subscriptionError?.meta
          });
          throw subscriptionError;
        }
      } else {
        // Create local subscription record (for free plans or fallback)
        console.log(`📝 SIGNUP DEBUG [${debugId}]: Creating local subscription record (no Stripe data)`);
        
        const subscriptionRecord: any = {
          userId: newUser.id,
          planType: subscriptionPlan,
          status: selectedPlan.planType === 'FREE' ? 'ACTIVE' : 'TRIALING',
          startDate: currentTime,
          autoRenew: selectedPlan.billingInterval !== 'lifetime',
          metadata: {
            selectedPlan: selectedPlan,
            registrationFlow: true,
            createdAt: currentTime.toISOString(),
            debugId: debugId
          }
        };

        // Add trial period for non-free plans
        if (selectedPlan.planType !== 'FREE') {
          subscriptionRecord.trialStart = currentTime;
          subscriptionRecord.trialEnd = new Date(currentTime.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days trial
        }

        console.log(`💳 SIGNUP DEBUG [${debugId}]: About to create local subscription record:`, JSON.stringify({
          userId: subscriptionRecord.userId,
          planType: subscriptionRecord.planType,
          status: subscriptionRecord.status,
          autoRenew: subscriptionRecord.autoRenew
        }, null, 2));

        try {
          await tx.userSubscription.create({
            data: subscriptionRecord,
          });
          console.log(`✅ SIGNUP DEBUG [${debugId}]: Local subscription created successfully for user: ${newUser.id}`);
        } catch (localSubscriptionError) {
          console.error(`🚨 SIGNUP DEBUG [${debugId}]: ❌ CRITICAL: Local subscription creation failed:`, localSubscriptionError);
          console.error(`🚨 SIGNUP DEBUG [${debugId}]: Local subscription error details:`, {
            message: localSubscriptionError?.message,
            stack: localSubscriptionError?.stack,
            name: localSubscriptionError?.name,
            code: localSubscriptionError?.code,
            meta: localSubscriptionError?.meta
          });
          throw localSubscriptionError;
        }
      }
    } else {
      console.log(`ℹ️ SIGNUP DEBUG [${debugId}]: No plan selected, creating user without subscription`);
    }

    console.log(`🎉 SIGNUP DEBUG [${debugId}]: Database transaction completed successfully`);
    return newUser;
  });
  console.log(`✅ SIGNUP DEBUG [${debugId}]: Transaction wrapper completed successfully`);
} catch (transactionError) {
  console.error(`🚨 SIGNUP DEBUG [${debugId}]: ❌ CRITICAL: Database transaction failed:`, transactionError);
  console.error(`🚨 SIGNUP DEBUG [${debugId}]: Transaction error details:`, {
    message: transactionError?.message,
    stack: transactionError?.stack,
    name: transactionError?.name,
    code: transactionError?.code,
    meta: transactionError?.meta
  });
  
  // Return detailed error information
  return new NextResponse(JSON.stringify({
    error: 'Database transaction failed during account creation',
    debugId,
    transactionError: transactionError?.message,
    errorCode: transactionError?.code,
    timestamp: new Date().toISOString(),
    stage: 'database_transaction'
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

  console.log(`✅ SIGNUP DEBUG [${debugId}]: User and related data created successfully`);
  console.log(`📊 SIGNUP DEBUG [${debugId}]: Final user data:`, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt
  });

  // Trigger 7-Day Onboarding Sequence (with comprehensive debugging)
  console.log(`📧 SIGNUP DEBUG [${debugId}]: === STARTING EMAIL AUTOMATION ===`);
  try {
    console.log(`📧 SIGNUP DEBUG [${debugId}]: About to trigger email automation for user ${user.id} (${email}) at ${new Date().toISOString()}`);
    console.log(`📧 SIGNUP DEBUG [${debugId}]: User created successfully - ID: ${user.id}, Email: ${email}, CreatedAt: ${user.createdAt}`);
    
    // Add significant delay to ensure user is fully committed to database
    console.log(`⏳ SIGNUP DEBUG [${debugId}]: Waiting 750ms for database transaction to fully commit...`);
    await new Promise(resolve => setTimeout(resolve, 750)); // INCREASED TO 750ms
    
    console.log(`📧 SIGNUP DEBUG [${debugId}]: Starting email automation trigger for user ${user.id}`);
    
    const automationResult = await emailAutomationEngine.processOnboardingTrigger(user.id, {
      signupDate: new Date().toISOString(),
      userRole: role,
      userName: name,
      userEmail: email,
      ipAddress,
      userAgent,
      debugContext: 'signup-flow',
      debugId: debugId,
      parentDebugId: debugId,
      transactionDelay: 750
    });
    
    console.log(`✅ SIGNUP DEBUG [${debugId}]: Email automation completed for user ${email}:`, JSON.stringify(automationResult, null, 2));
  } catch (emailError) {
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: ❌ Failed to trigger onboarding sequence for user ${email}:`, emailError);
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: Email automation error details:`, {
      message: emailError?.message,
      stack: emailError?.stack,
      name: emailError?.name,
      userId: user.id,
      userEmail: email,
      timestamp: new Date().toISOString(),
      code: emailError?.code
    });
    console.error(`🚨 SIGNUP DEBUG [${debugId}]: Full email error object:`, JSON.stringify(emailError, null, 2));
    // Don't fail the signup if email automation fails - this is not critical for user creation
    console.log(`⚠️ SIGNUP DEBUG [${debugId}]: Continuing with signup despite email automation failure`);
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  // Get subscription information if it exists
  let subscriptionInfo = null;
  if (selectedPlan) {
    try {
      console.log(`📊 SIGNUP DEBUG [${debugId}]: Retrieving subscription info for response...`);
      const subscription = await prisma.userSubscription.findUnique({
        where: { userId: user.id },
        select: {
          planType: true,
          status: true,
          startDate: true,
          trialStart: true,
          trialEnd: true,
          autoRenew: true,
          metadata: true
        }
      });
      subscriptionInfo = subscription;
      console.log(`✅ SIGNUP DEBUG [${debugId}]: Subscription info retrieved:`, subscriptionInfo);
    } catch (error) {
      console.error(`🚨 SIGNUP DEBUG [${debugId}]: Error fetching subscription info:`, error);
    }
  }

  const responseData = {
    user: userWithoutPassword,
    subscription: subscriptionInfo,
    selectedPlan: selectedPlan,
    message: selectedPlan 
      ? `Account created successfully with ${selectedPlan.name} plan`
      : "Account created successfully with legal compliance tracking",
    debugId
  };

  console.log(`🎉 SIGNUP DEBUG [${debugId}]: Returning success response at ${new Date().toISOString()}`);
  console.log(`📤 SIGNUP DEBUG [${debugId}]: Response data:`, {
    userId: responseData.user.id,
    userEmail: responseData.user.email,
    hasSubscription: !!responseData.subscription,
    debugId: responseData.debugId
  });

  return apiErrorHandler.createSuccessResponse(responseData);
});
