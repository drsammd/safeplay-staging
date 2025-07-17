
/**
 * SafePlay Fixed Signup API Route v1.5.19
 * Addresses critical authentication persistence issues
 * 
 * FIXES:
 * - Ensures proper user creation and database transactions
 * - Prevents session contamination during signup
 * - Adds comprehensive error handling and logging
 * - CRITICAL v1.5.19: Fixed foreign key constraint violation in cleanAccountInitializer
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiErrorHandler, withErrorHandling, ErrorType } from "@/lib/error-handler";
import { authSessionManager } from "@/lib/auth-session-manager";
import { demoAccountProtection } from "@/lib/demo-account-protection";
import { cleanAccountInitializer } from "@/lib/clean-account-initializer";

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

      // CRITICAL: Initialize clean account structure using protection system
      const cleanInitResult = await cleanAccountInitializer.initializeCleanAccount({
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        ipAddress,
        userAgent,
        prismaInstance: tx // Pass transaction context to prevent foreign key constraint issues
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
      console.log(`✅ FIXED SIGNUP API [${debugId}]: User setup completed: ${newUser.email}`);
      return newUser;
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
