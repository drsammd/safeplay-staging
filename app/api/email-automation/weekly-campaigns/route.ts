
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailAutomationEngine } from '@/lib/services/email-automation-engine';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'VENUE_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'analytics') {
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const analytics = await emailAutomationEngine.getWeeklyCampaignAnalytics(start, end);
      
      return NextResponse.json({
        success: true,
        analytics
      });
    }

    // Get active weekly campaign rules
    const weeklyRules = await prisma.emailAutomationRule.findMany({
      where: {
        triggerConditions: {
          path: 'campaignType',
          equals: 'weekly_safety_tips'
        }
      },
      include: {
        template: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get campaign status
    const totalRecipients = await prisma.user.count({
      where: {
        role: {
          in: ['PARENT', 'VENUE_ADMIN']
        },
        email: {
          not: ""
        }
      }
    });

    const recentExecutions = await prisma.emailAutomationExecution.count({
      where: {
        rule: {
          triggerConditions: {
            path: 'campaignType',
            equals: 'weekly_safety_tips'
          }
        },
        scheduledAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    return NextResponse.json({
      success: true,
      campaigns: weeklyRules,
      stats: {
        totalCampaigns: weeklyRules.length,
        activeCampaigns: weeklyRules.filter(rule => rule.isActive).length,
        totalRecipients,
        recentExecutions
      }
    });

  } catch (error) {
    console.error('Error fetching weekly campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'create_campaign') {
      // Create weekly safety tips campaign
      await emailAutomationEngine.createWeeklySafetyTipsCampaign(session.user.id);
      
      return NextResponse.json({
        success: true,
        message: 'Weekly safety tips campaign created successfully'
      });
    }

    if (action === 'process_weekly_trigger') {
      // Process weekly campaign trigger (for testing)
      const result = await emailAutomationEngine.processWeeklyCampaignTrigger();
      
      return NextResponse.json({
        success: result.success,
        processedCampaigns: result.processedCampaigns,
        errors: result.errors
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error managing weekly campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to manage weekly campaigns' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ruleId, isActive } = await request.json();

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    // Update campaign rule status
    await prisma.emailAutomationRule.update({
      where: { id: ruleId },
      data: { 
        isActive,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Campaign ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Error updating weekly campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update weekly campaign' },
      { status: 500 }
    );
  }
}
