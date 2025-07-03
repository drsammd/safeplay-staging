
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailAutomationEngine } from '@/lib/services/email-automation-engine';
import { EmailTrigger } from '@prisma/client';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow system-level triggers (no auth required for internal use)
    // But require auth for manual triggers from UI
    const body = await request.json();
    const { trigger, userId, metadata, delayMinutes, requireAuth = true } = body;

    if (requireAuth && (!session?.user || !['COMPANY_ADMIN', 'VENUE_ADMIN'].includes(session.user.role))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    if (!trigger || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: trigger and userId' }, 
        { status: 400 }
      );
    }

    // Validate trigger type
    if (!Object.values(EmailTrigger).includes(trigger)) {
      return NextResponse.json(
        { error: 'Invalid trigger type' }, 
        { status: 400 }
      );
    }

    const result = await emailAutomationEngine.processTrigger({
      trigger,
      userId,
      metadata,
      delayMinutes
    });

    return NextResponse.json({
      success: result.success,
      scheduledExecutions: result.scheduledExecutions,
      errors: result.errors,
      message: `Trigger ${trigger} processed for user ${userId}`
    });

  } catch (error) {
    console.error('Error processing trigger:', error);
    return NextResponse.json(
      { error: 'Failed to process trigger' }, 
      { status: 500 }
    );
  }
}
