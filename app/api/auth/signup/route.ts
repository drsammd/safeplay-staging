
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
  // Parse and validate request body
  const body = await request.json();
  const validation = signupSchema.safeParse(body);
  
  if (!validation.success) {
    return apiErrorHandler.createErrorResponse(
      ErrorType.VALIDATION,
      'SIGNUP_VALIDATION_FAILED',
      'Invalid signup data',
      400,
      { issues: validation.error.issues }
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

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return apiErrorHandler.createErrorResponse(
      ErrorType.CONFLICT,
      'USER_ALREADY_EXISTS',
      'An account with this email already exists',
      409,
      { email }
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Get request metadata for compliance tracking
  const ipAddress = request.headers.get("x-forwarded-for") || 
                   request.headers.get("x-real-ip") || 
                   "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Get current time for timestamps
  const currentTime = new Date();

  // Create user and legal agreements in a transaction
  const user = await prisma.$transaction(async (tx) => {
    // Create user
    const newUser = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    // Log address information (database storage will be implemented later)
    if (homeAddress) {
      console.log('✅ Address validation completed for user:', newUser.id);
      console.log('Home address:', homeAddress);
      console.log('Home address validation:', {
        isValid: homeAddressValidation?.isValid,
        confidence: homeAddressValidation?.confidence,
        standardizedAddress: homeAddressValidation?.standardizedAddress
      });

      if (useDifferentBillingAddress && billingAddress) {
        console.log('✅ Separate billing address validated for user:', newUser.id);
        console.log('Billing address:', billingAddress);
        console.log('Billing address validation:', {
          isValid: billingAddressValidation?.isValid,
          confidence: billingAddressValidation?.confidence,
          standardizedAddress: billingAddressValidation?.standardizedAddress
        });
      } else {
        console.log('ℹ️ Using home address as billing address for user:', newUser.id);
      }
    }

    // Create legal agreement records
    const agreementVersion = "1.0"; // Current version of legal documents

    // Terms of Service agreement
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

    // Privacy Policy agreement
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

    // COPPA consent for parent accounts
    if (role === "PARENT") {
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
      console.log('✅ Creating subscription for user:', newUser.id, 'Plan:', selectedPlan.planType);
      
      // Map plan type to subscription enum
      const subscriptionPlan = selectedPlan.planType.toUpperCase() as 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
      
      // Check if Stripe subscription was already created during payment
      if (subscriptionData?.subscription?.id && subscriptionData?.customer?.id) {
        console.log('💳 Linking existing Stripe subscription to user:', newUser.id);
        
        const stripeSubscription = subscriptionData.subscription;
        const stripeCustomer = subscriptionData.customer;
        
        const subscriptionRecord: any = {
          userId: newUser.id,
          planType: subscriptionPlan,
          status: stripeSubscription.status === 'trialing' ? 'TRIALING' : 'ACTIVE',
          stripeCustomerId: String(stripeCustomer.id),
          stripeSubscriptionId: String(stripeSubscription.id),
          currentPeriodStart: stripeSubscription.current_period_start 
            ? new Date(stripeSubscription.current_period_start * 1000) 
            : currentTime,
          currentPeriodEnd: stripeSubscription.current_period_end 
            ? new Date(stripeSubscription.current_period_end * 1000) 
            : new Date(currentTime.getTime() + (7 * 24 * 60 * 60 * 1000)),
          cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
          canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
          trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
          trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
          autoRenew: selectedPlan.billingInterval !== 'lifetime',
          metadata: {
            selectedPlan: selectedPlan,
            registrationFlow: true,
            createdAt: currentTime.toISOString(),
            stripeSubscriptionData: stripeSubscription
          }
        };

        await tx.userSubscription.create({
          data: subscriptionRecord,
        });

        console.log('✅ Stripe subscription linked successfully for user:', newUser.id);
      } else {
        // Create local subscription record (for free plans or fallback)
        const subscriptionRecord: any = {
          userId: newUser.id,
          planType: subscriptionPlan,
          status: selectedPlan.planType === 'FREE' ? 'ACTIVE' : 'TRIALING',
          startDate: currentTime,
          autoRenew: selectedPlan.billingInterval !== 'lifetime',
          metadata: {
            selectedPlan: selectedPlan,
            registrationFlow: true,
            createdAt: currentTime.toISOString()
          }
        };

        // Add trial period for non-free plans
        if (selectedPlan.planType !== 'FREE') {
          subscriptionRecord.trialStart = currentTime;
          subscriptionRecord.trialEnd = new Date(currentTime.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days trial
        }

        await tx.userSubscription.create({
          data: subscriptionRecord,
        });

        console.log('✅ Local subscription created successfully for user:', newUser.id);
      }
    } else {
      console.log('ℹ️ No plan selected, creating user without subscription');
    }

    return newUser;
  });

  // Trigger 7-Day Onboarding Sequence (with comprehensive debugging)
  try {
    console.log(`🔍 SIGNUP DEBUG: About to trigger email automation for user ${user.id} (${email}) at ${new Date().toISOString()}`);
    console.log(`🔍 SIGNUP DEBUG: User created successfully - ID: ${user.id}, Email: ${email}, CreatedAt: ${user.createdAt}`);
    
    // Add significant delay to ensure user is fully committed to database
    console.log(`⏳ SIGNUP DEBUG: Waiting 500ms for database transaction to fully commit...`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Significantly increased delay
    
    console.log(`📧 SIGNUP DEBUG: Starting email automation trigger for user ${user.id}`);
    
    const automationResult = await emailAutomationEngine.processOnboardingTrigger(user.id, {
      signupDate: new Date().toISOString(),
      userRole: role,
      userName: name,
      userEmail: email,
      ipAddress,
      userAgent,
      debugContext: 'signup-flow',
      transactionDelay: 200
    });
    
    console.log(`✅ SIGNUP DEBUG: Email automation completed for user ${email}:`, automationResult);
  } catch (error) {
    console.error(`🚨 SIGNUP DEBUG: Failed to trigger onboarding sequence for user ${email}:`, error);
    console.error(`🚨 SIGNUP DEBUG: Error details:`, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      userId: user.id,
      userEmail: email,
      timestamp: new Date().toISOString()
    });
    // Don't fail the signup if email automation fails
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  // Get subscription information if it exists
  let subscriptionInfo = null;
  if (selectedPlan) {
    try {
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
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    }
  }

  return apiErrorHandler.createSuccessResponse({
    user: userWithoutPassword,
    subscription: subscriptionInfo,
    selectedPlan: selectedPlan,
    message: selectedPlan 
      ? `Account created successfully with ${selectedPlan.name} plan`
      : "Account created successfully with legal compliance tracking"
  });
});
