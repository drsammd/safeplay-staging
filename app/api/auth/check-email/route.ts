
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiErrorHandler, withErrorHandling, ErrorType } from "@/lib/error-handler";

export const dynamic = "force-dynamic";

const checkEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  console.log(`🔍 CHECK-EMAIL API v1.5.34: Request received`);
  
  let body;
  try {
    body = await request.json();
    console.log(`🔍 CHECK-EMAIL API: Request body:`, body);
  } catch (error) {
    console.error(`🚨 CHECK-EMAIL API: Invalid JSON in request:`, error);
    return apiErrorHandler.createErrorResponse(
      ErrorType.VALIDATION,
      'INVALID_JSON',
      'Invalid JSON in request body',
      400,
      { error: 'Request body must be valid JSON' }
    );
  }

  const validation = checkEmailSchema.safeParse(body);
  
  if (!validation.success) {
    console.error(`🚨 CHECK-EMAIL API: Validation failed:`, validation.error.issues);
    return apiErrorHandler.createErrorResponse(
      ErrorType.VALIDATION,
      'EMAIL_VALIDATION_FAILED',
      'Invalid email address',
      400,
      { issues: validation.error.issues }
    );
  }

  const { email } = validation.data;
  
  // Normalize email to lowercase for consistency
  const normalizedEmail = email.toLowerCase().trim();
  console.log(`🔍 CHECK-EMAIL API: Checking email: ${normalizedEmail}`);

  try {
    // Test database connection first
    await prisma.$connect();
    console.log(`🔍 CHECK-EMAIL API: Database connection successful`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true }
    });

    const userExists = !!existingUser;
    console.log(`🔍 CHECK-EMAIL API: User exists check result: ${userExists}`);

    if (userExists) {
      console.log(`🚨 CHECK-EMAIL API: Email already exists in database: ${normalizedEmail}`);
    } else {
      console.log(`✅ CHECK-EMAIL API: Email is available: ${normalizedEmail}`);
    }

    const response = {
      exists: userExists,
      email: normalizedEmail
    };

    console.log(`✅ CHECK-EMAIL API: Returning response:`, response);
    return NextResponse.json(response);

  } catch (error) {
    console.error(`❌ CHECK-EMAIL API: Database error:`, error);
    
    // More specific error handling
    if (error.message?.includes('connect')) {
      console.error(`❌ CHECK-EMAIL API: Database connection failed`);
      return apiErrorHandler.createErrorResponse(
        ErrorType.DATABASE,
        'DATABASE_CONNECTION_FAILED',
        'Database connection failed',
        500,
        { email: normalizedEmail, error: 'Unable to connect to database' }
      );
    }

    return apiErrorHandler.createErrorResponse(
      ErrorType.DATABASE,
      'EMAIL_CHECK_FAILED',
      'Failed to check email availability',
      500,
      { email: normalizedEmail, error: error.message }
    );
  } finally {
    await prisma.$disconnect();
  }
});
