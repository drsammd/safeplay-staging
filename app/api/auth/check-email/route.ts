
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiErrorHandler, withErrorHandling, ErrorType } from "@/lib/error-handler";

export const dynamic = "force-dynamic";

const checkEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const validation = checkEmailSchema.safeParse(body);
  
  if (!validation.success) {
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

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true }
    });

    return apiErrorHandler.createSuccessResponse({
      exists: !!existingUser,
      email: normalizedEmail
    });
  } catch (error) {
    console.error('Error checking email:', error);
    return apiErrorHandler.createErrorResponse(
      ErrorType.DATABASE,
      'EMAIL_CHECK_FAILED',
      'Failed to check email availability',
      500,
      { email: normalizedEmail }
    );
  }
});
