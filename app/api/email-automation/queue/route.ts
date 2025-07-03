
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailAutomationService } from '@/lib/services/email-automation-service';
import { emailAutomationEngine } from '@/lib/services/email-automation-engine';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get SES quota information
    const sesQuota = await emailAutomationService.getSESQuota();

    return NextResponse.json({
      sesQuota,
      message: 'Email queue status retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching queue status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue status' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, limit } = body;

    let result;

    switch (action) {
      case 'process-queue':
        result = await emailAutomationService.processEmailQueue(limit || 100);
        break;
      
      case 'process-automations':
        result = await emailAutomationEngine.executeScheduledAutomations(limit || 100);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      action,
      result,
      message: `${action} completed successfully`
    });

  } catch (error) {
    console.error('Error processing queue action:', error);
    return NextResponse.json(
      { error: 'Failed to process queue action' }, 
      { status: 500 }
    );
  }
}
