

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailAutomationService } from '@/lib/services/email-automation-service';
import { emailAutomationEngine } from '@/lib/services/email-automation-engine';
import { emailTemplateService } from '@/lib/services/email-template-service';
import { prisma } from '@/lib/db';
import { apiErrorHandler, withErrorHandling, ErrorType } from '@/lib/error-handler';

export const dynamic = "force-dynamic";

/**
 * POST /api/email-automation/onboarding/test - Test onboarding sequence (admin only)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
    return apiErrorHandler.createErrorResponse(
      ErrorType.AUTHORIZATION,
      'FORBIDDEN',
      'Admin access required',
      403
    );
  }

  const body = await request.json();
  const { 
    userId = session.user.id,
    day = 1,
    sendActualEmail = false,
    testEmail 
  } = body;

  if (day < 1 || day > 7) {
    return apiErrorHandler.createErrorResponse(
      ErrorType.VALIDATION,
      'INVALID_DAY',
      'Day must be between 1 and 7',
      400
    );
  }

  try {
    // Get the user for context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        children: true
      }
    });

    if (!user) {
      return apiErrorHandler.createErrorResponse(
        ErrorType.NOT_FOUND,
        'USER_NOT_FOUND',
        'User not found',
        404
      );
    }

    // Get the onboarding template for the specified day
    const template = await prisma.emailTemplate.findFirst({
      where: {
        templateType: 'ONBOARDING',
        name: {
          contains: `Day ${day}`
        }
      }
    });

    if (!template) {
      return apiErrorHandler.createErrorResponse(
        ErrorType.NOT_FOUND,
        'TEMPLATE_NOT_FOUND',
        `Onboarding template for day ${day} not found`,
        404
      );
    }

    // Prepare template variables
    const templateVariables = {
      userName: user.name?.split(' ')[0] || 'User',
      userEmail: user.email,
      dashboardUrl: `${process.env.NEXTAUTH_URL}/parent`,
      helpCenterUrl: `${process.env.NEXTAUTH_URL}/docs`,
      childrenUrl: `${process.env.NEXTAUTH_URL}/parent/children`,
      biometricUrl: `${process.env.NEXTAUTH_URL}/venue-admin/biometric`,
      checkInGuideUrl: `${process.env.NEXTAUTH_URL}/docs/parent`,
      mobileAppUrl: `${process.env.NEXTAUTH_URL}/parent/mobile`,
      qrCodeGuideUrl: `${process.env.NEXTAUTH_URL}/venue-admin/qr-codes`,
      alertSettingsUrl: `${process.env.NEXTAUTH_URL}/parent/account`,
      notificationPrefsUrl: `${process.env.NEXTAUTH_URL}/parent/account`,
      emergencyGuideUrl: `${process.env.NEXTAUTH_URL}/docs`,
      analyticsUrl: `${process.env.NEXTAUTH_URL}/parent`,
      reportsGuideUrl: `${process.env.NEXTAUTH_URL}/docs`,
      advancedFeaturesUrl: `${process.env.NEXTAUTH_URL}/docs`,
      communityUrl: `${process.env.NEXTAUTH_URL}/docs`,
      supportUrl: `${process.env.NEXTAUTH_URL}/contact`,
      profileGuideUrl: `${process.env.NEXTAUTH_URL}/docs/parent`,
      securityGuideUrl: `${process.env.NEXTAUTH_URL}/docs`,
      videoTutorialUrl: `${process.env.NEXTAUTH_URL}/docs`,
      completionBadgeUrl: '',
      hasChildren: user.children && user.children.length > 0,
      hasBiometricData: false, // Default for testing
      hasAnalyticsData: false, // Default for testing
      trackingPixel: `<img src="${process.env.NEXTAUTH_URL}/api/email-tracking/open?id=test_${day}_${Date.now()}" width="1" height="1" style="display:none;" alt="" />`
    };

    // Render the template
    const renderedTemplate = emailTemplateService.renderTemplate(template, templateVariables);

    if (sendActualEmail) {
      // Send actual test email
      const emailData = {
        recipientId: userId,
        recipientEmail: testEmail || user.email,
        subject: renderedTemplate.subject,
        htmlContent: renderedTemplate.htmlContent,
        textContent: renderedTemplate.textContent,
        templateId: template.id,
        priority: 'NORMAL' as any,
        metadata: {
          testMode: true,
          testDay: day,
          testDate: new Date().toISOString()
        }
      };

      const result = await emailAutomationService.sendEmail(emailData);
      
      return apiErrorHandler.createSuccessResponse({
        testMode: 'actual_email',
        day,
        template: template.name,
        emailSent: result.success,
        recipientEmail: testEmail || user.email,
        messageId: result.messageId,
        rendered: {
          subject: renderedTemplate.subject,
          hasHtmlContent: !!renderedTemplate.htmlContent,
          hasTextContent: !!renderedTemplate.textContent
        }
      });
    } else {
      // Return rendered template for preview
      return apiErrorHandler.createSuccessResponse({
        testMode: 'preview_only',
        day,
        template: template.name,
        variables: templateVariables,
        rendered: {
          subject: renderedTemplate.subject,
          htmlContent: renderedTemplate.htmlContent,
          textContent: renderedTemplate.textContent
        }
      });
    }

  } catch (error) {
    console.error('Error testing onboarding sequence:', error);
    return apiErrorHandler.createErrorResponse(
      ErrorType.INTERNAL,
      'ONBOARDING_TEST_ERROR',
      'Failed to test onboarding sequence',
      500
    );
  }
});

