

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailAutomationEngine } from '@/lib/services/email-automation-engine';
import { prisma } from '@/lib/db';
import { apiErrorHandler, withErrorHandling, ErrorType } from '@/lib/error-handler';

export const dynamic = "force-dynamic";

/**
 * GET /api/email-automation/onboarding - Get onboarding progress for user
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return apiErrorHandler.createErrorResponse(
      ErrorType.AUTHENTICATION,
      'UNAUTHORIZED',
      'Authentication required',
      401
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || session.user.id;

  // Only allow users to check their own progress unless they're admin
  if (userId !== session.user.id && session.user.role !== 'COMPANY_ADMIN') {
    return apiErrorHandler.createErrorResponse(
      ErrorType.AUTHORIZATION,
      'FORBIDDEN',
      'Access denied',
      403
    );
  }

  try {
    const progress = await emailAutomationEngine.getOnboardingProgress(userId);
    
    return apiErrorHandler.createSuccessResponse({
      onboardingProgress: progress,
      userId
    });

  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
    return apiErrorHandler.createErrorResponse(
      ErrorType.INTERNAL,
      'ONBOARDING_PROGRESS_ERROR',
      'Failed to fetch onboarding progress',
      500
    );
  }
});

/**
 * DELETE /api/email-automation/onboarding - Cancel onboarding sequence
 */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return apiErrorHandler.createErrorResponse(
      ErrorType.AUTHENTICATION,
      'UNAUTHORIZED',
      'Authentication required',
      401
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || session.user.id;
  const reason = searchParams.get('reason') || 'User request';

  // Only allow users to cancel their own sequence unless they're admin
  if (userId !== session.user.id && session.user.role !== 'COMPANY_ADMIN') {
    return apiErrorHandler.createErrorResponse(
      ErrorType.AUTHORIZATION,
      'FORBIDDEN',
      'Access denied',
      403
    );
  }

  try {
    const result = await emailAutomationEngine.cancelOnboardingSequence(userId, reason);
    
    return apiErrorHandler.createSuccessResponse({
      cancelled: result.success,
      cancelledEmails: result.cancelledEmails,
      message: result.message,
      userId
    });

  } catch (error) {
    console.error('Error cancelling onboarding sequence:', error);
    return apiErrorHandler.createErrorResponse(
      ErrorType.INTERNAL,
      'ONBOARDING_CANCEL_ERROR',
      'Failed to cancel onboarding sequence',
      500
    );
  }
});

/**
 * POST /api/email-automation/onboarding - Trigger onboarding sequence (admin only)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'COMPANY_ADMIN') {
    return apiErrorHandler.createErrorResponse(
      ErrorType.AUTHORIZATION,
      'FORBIDDEN',
      'Admin access required',
      403
    );
  }

  const body = await request.json();
  const { userId, metadata = {} } = body;

  if (!userId) {
    return apiErrorHandler.createErrorResponse(
      ErrorType.VALIDATION,
      'MISSING_USER_ID',
      'User ID is required',
      400
    );
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return apiErrorHandler.createErrorResponse(
        ErrorType.NOT_FOUND,
        'USER_NOT_FOUND',
        'User not found',
        404
      );
    }

    const result = await emailAutomationEngine.processOnboardingTrigger(userId, {
      ...metadata,
      triggeredBy: 'admin',
      adminUserId: session.user.id,
      triggerDate: new Date().toISOString()
    });
    
    return apiErrorHandler.createSuccessResponse({
      triggered: result.success,
      scheduledEmails: result.scheduledEmails,
      errors: result.errors,
      userId
    });

  } catch (error) {
    console.error('Error triggering onboarding sequence:', error);
    return apiErrorHandler.createErrorResponse(
      ErrorType.INTERNAL,
      'ONBOARDING_TRIGGER_ERROR',
      'Failed to trigger onboarding sequence',
      500
    );
  }
});

