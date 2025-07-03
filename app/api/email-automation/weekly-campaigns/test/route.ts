
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailAutomationService } from '@/lib/services/email-automation-service';
import { emailTemplateService } from '@/lib/services/email-template-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateName, testEmail, weekNumber } = await request.json();

    if (!templateName || !testEmail) {
      return NextResponse.json(
        { error: 'Template name and test email are required' },
        { status: 400 }
      );
    }

    // Find the template
    const template = await prisma.emailTemplate.findFirst({
      where: {
        name: templateName,
        templateType: 'NEWSLETTER'
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Prepare test variables
    const testVariables = {
      userName: 'Test User',
      weekNumber: weekNumber || 1,
      dashboardUrl: `${process.env.NEXTAUTH_URL}/parent`,
      biometricUrl: `${process.env.NEXTAUTH_URL}/venue-admin/biometric`,
      emergencyContactsUrl: `${process.env.NEXTAUTH_URL}/parent/account`,
      analyticsUrl: `${process.env.NEXTAUTH_URL}/venue-admin/ai-analytics`,
      alertSettingsUrl: `${process.env.NEXTAUTH_URL}/venue-admin/alerts`,
      mobileAppUrl: `${process.env.NEXTAUTH_URL}/parent/mobile`,
      checkInGuideUrl: `${process.env.NEXTAUTH_URL}/docs/parent`,
      unsubscribeUrl: `${process.env.NEXTAUTH_URL}/api/email-automation/unsubscribe?token=test`,
      tipOfTheWeek: 'Always supervise children on playground equipment and check for potential hazards.',
      localWeather: 'Sunny, 75°F - Perfect playground weather!',
      hasSetupBiometrics: false,
      weeklyStats: {
        totalVisits: 12,
        totalHours: 24,
        safetyScore: 95
      }
    };

    // Render the template
    const renderedTemplate = emailTemplateService.renderTemplate(template, testVariables);

    // For testing purposes, we'll just return a success message
    // In a production environment, you would integrate with the actual email service
    return NextResponse.json({
      success: true,
      message: `Test email would be sent to ${testEmail}`,
      previewData: {
        subject: `[TEST] ${renderedTemplate.subject}`,
        htmlContent: renderedTemplate.htmlContent.substring(0, 200) + '...',
        templateName,
        weekNumber: weekNumber || 1
      }
    });

  } catch (error) {
    console.error('Error sending test weekly campaign email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
