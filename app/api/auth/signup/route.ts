
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

    // Store address information
    if (homeAddress) {
      console.log('✅ Storing home address for user:', newUser.id);
      
      // Create home address record
      await tx.userAddress.create({
        data: {
          userId: newUser.id,
          type: 'HOME',
          address: homeAddress,
          isVerified: homeAddressValidation?.isValid || false,
          verificationData: homeAddressValidation ? JSON.stringify(homeAddressValidation) : null,
          isPrimary: true,
          metadata: {
            confidence: homeAddressValidation?.confidence,
            standardizedAddress: homeAddressValidation?.standardizedAddress,
            originalInput: homeAddressValidation?.originalInput,
            createdAt: currentTime.toISOString(),
            source: 'registration'
          }
        }
      });

      // Create billing address record if different from home address
      if (useDifferentBillingAddress && billingAddress) {
        console.log('✅ Storing separate billing address for user:', newUser.id);
        
        await tx.userAddress.create({
          data: {
            userId: newUser.id,
            type: 'BILLING',
            address: billingAddress,
            isVerified: billingAddressValidation?.isValid || false,
            verificationData: billingAddressValidation ? JSON.stringify(billingAddressValidation) : null,
            isPrimary: false,
            metadata: {
              confidence: billingAddressValidation?.confidence,
              standardizedAddress: billingAddressValidation?.standardizedAddress,
              originalInput: billingAddressValidation?.originalInput,
              createdAt: currentTime.toISOString(),
              source: 'registration'
            }
          }
        });
      } else {
        console.log('ℹ️ Using home address as billing address for user:', newUser.id);
        
        // Create billing address record that references the same address as home
        await tx.userAddress.create({
          data: {
            userId: newUser.id,
            type: 'BILLING',
            address: homeAddress,
            isVerified: homeAddressValidation?.isValid || false,
            verificationData: homeAddressValidation ? JSON.stringify(homeAddressValidation) : null,
            isPrimary: false,
            metadata: {
              confidence: homeAddressValidation?.confidence,
              standardizedAddress: homeAddressValidation?.standardizedAddress,
              originalInput: homeAddressValidation?.originalInput,
              createdAt: currentTime.toISOString(),
              source: 'registration',
              sameAsHome: true
            }
          }
        });
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
      
      const subscriptionData: any = {
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
        subscriptionData.trialStart = currentTime;
        subscriptionData.trialEnd = new Date(currentTime.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days trial
      }

      await tx.userSubscription.create({
        data: subscriptionData,
      });

      console.log('✅ Subscription created successfully for user:', newUser.id);
    } else {
      console.log('ℹ️ No plan selected, creating user without subscription');
    }

    return newUser;
  });

  // Trigger 7-Day Onboarding Sequence
  try {
    await emailAutomationEngine.processOnboardingTrigger(user.id, {
      signupDate: new Date().toISOString(),
      userRole: role,
      userName: name,
      userEmail: email,
      ipAddress,
      userAgent
    });
    console.log(`✅ 7-day onboarding sequence triggered for user: ${email}`);
  } catch (error) {
    console.error(`❌ Failed to trigger onboarding sequence for user ${email}:`, error);
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
