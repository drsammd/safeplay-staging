
/**
 * SafePlay Fixed Signup API Route
 * Addresses critical authentication persistence issues
 * 
 * FIXES:
 * - Ensures proper user creation and database transactions
 * - Prevents session contamination during signup
 * - Adds comprehensive error handling and logging
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiErrorHandler, withErrorHandling, ErrorType } from "@/lib/error-handler";
import { authSessionManager } from "@/lib/auth-session-manager";

export const dynamic = "force-dynamic";

// Enhanced validation schema with better error handling
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
  }, z.string().min(5, "Home address must be at least 5 characters")),
  
  homeAddressValidation: z.any().optional(),
  
  useDifferentBillingAddress: z.preprocess((val) => {
    if (val === true || val === "true" || val === 1 || val === "1") return true;
    if (val === false || val === "false" || val === 0 || val === "0") return false;
    return false;
  }, z.boolean().default(false)),
  
  billingAddress: z.preprocess((val) => {
    if (typeof val === "string") return val.trim();
    return String(val || "").trim();
  }, z.string().optional()),
  
  billingAddressValidation: z.any().optional(),
  
  selectedPlan: z.object({
    id: z.string(),
    name: z.string(),
    stripePriceId: z.string().nullable(),
    billingInterval: z.enum(["monthly", "yearly", "lifetime", "free"]),
    amount: z.number(),
    planType: z.string(),
  }).nullable().optional(),
  
  subscriptionData: z.any().optional(),
  
  // Additional fields
  homeAddressFields: z.any().optional(),
  billingAddressFields: z.any().optional(),
  debugMetadata: z.any().optional(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const debugId = `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔍 FIXED SIGNUP API [${debugId}]: Starting signup process`);
  console.log(`🔍 FIXED SIGNUP API [${debugId}]: Timestamp: ${new Date().toISOString()}`);

  // Parse request body
  let body;
  try {
    body = await request.json();
    console.log(`🔍 FIXED SIGNUP API [${debugId}]: Request body parsed successfully`);
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

  // Validate request data
  const validation = signupSchema.safeParse(body);
  
  if (!validation.success) {
    console.error(`🚨 FIXED SIGNUP API [${debugId}]: Validation failed:`, validation.error.issues);
    return apiErrorHandler.createErrorResponse(
      ErrorType.VALIDATION,
      'SIGNUP_VALIDATION_FAILED',
      'Invalid signup data',
      400,
      { 
        issues: validation.error.issues, 
        debugId
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
    homeAddress,
    homeAddressValidation,
    useDifferentBillingAddress,
    billingAddress,
    billingAddressValidation,
    selectedPlan, 
    subscriptionData 
  } = validation.data;

  // Normalize email
  const email = rawEmail.toLowerCase().trim();
  console.log(`✅ FIXED SIGNUP API [${debugId}]: Validation passed for email: ${email}`);

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

  // Create user in database transaction
  console.log(`🔄 FIXED SIGNUP API [${debugId}]: Starting database transaction`);
  
  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
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

      // Create legal agreements
      const agreementVersion = "1.0";
      
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

      // Create parental consent for parent accounts
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
      }

      // Create default FREE subscription
      await tx.userSubscription.create({
        data: {
          userId: newUser.id,
          status: "ACTIVE",
          planType: "FREE",
          autoRenew: false,
          cancelAtPeriodEnd: false,
          currentPeriodStart: currentTime,
          currentPeriodEnd: new Date(currentTime.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });

      console.log(`✅ FIXED SIGNUP API [${debugId}]: User setup completed: ${newUser.email}`);
      return newUser;
    });

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
        message: "Account created successfully"
      },
      debugId
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`🚨 FIXED SIGNUP API [${debugId}]: Transaction failed:`, error);
    
    return new NextResponse(JSON.stringify({
      error: 'Failed to create account',
      debugId,
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
