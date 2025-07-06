
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

  const { email: rawEmail, password, name, role, agreeToTerms, agreeToPrivacy } = validation.data;
  
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

    // Create legal agreement records
    const currentTime = new Date();
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

  return apiErrorHandler.createSuccessResponse({
    user: userWithoutPassword,
    message: "Account created successfully with legal compliance tracking"
  });
});
