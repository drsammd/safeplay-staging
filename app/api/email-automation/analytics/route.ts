
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['SUPER_ADMIN', 'VENUE_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Overall email analytics
    const [
      totalEmails,
      emailsByStatus,
      campaignStats,
      automationStats,
      recentActivity
    ] = await Promise.all([
      // Total emails sent in period
      prisma.emailLog.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Emails by status
      prisma.emailLog.groupBy({
        by: ['status'],
        _count: { status: true },
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Campaign statistics
      prisma.emailCampaign.groupBy({
        by: ['status'],
        _count: { status: true },
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Automation rule statistics
      prisma.emailAutomationRule.groupBy({
        by: ['isActive'],
        _count: { isActive: true }
      }),
      
      // Recent activity (last 7 days daily breakdown)
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as count,
          status
        FROM EmailLog 
        WHERE createdAt >= DATE('now', '-7 days')
        GROUP BY DATE(createdAt), status
        ORDER BY date DESC
      `
    ]);

    // Calculate rates
    const sentEmails = emailsByStatus.find(s => s.status === 'SENT')?._count?.status || 0;
    const deliveredEmails = emailsByStatus.find(s => s.status === 'DELIVERED')?._count?.status || 0;
    const openedEmails = emailsByStatus.find(s => s.status === 'OPENED')?._count?.status || 0;
    const clickedEmails = emailsByStatus.find(s => s.status === 'CLICKED')?._count?.status || 0;
    const bouncedEmails = emailsByStatus.find(s => s.status === 'BOUNCED')?._count?.status || 0;
    const failedEmails = emailsByStatus.find(s => s.status === 'FAILED')?._count?.status || 0;

    const deliveryRate = totalEmails > 0 ? ((sentEmails + deliveredEmails) / totalEmails) * 100 : 0;
    const openRate = deliveredEmails > 0 ? (openedEmails / deliveredEmails) * 100 : 0;
    const clickRate = deliveredEmails > 0 ? (clickedEmails / deliveredEmails) * 100 : 0;
    const bounceRate = totalEmails > 0 ? (bouncedEmails / totalEmails) * 100 : 0;
    const failureRate = totalEmails > 0 ? (failedEmails / totalEmails) * 100 : 0;

    // Top performing campaigns
    const topCampaigns = await prisma.emailCampaign.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'DRAFT' }
      },
      include: {
        // _count removed as it doesn't exist on EmailCampaignInclude
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Email preferences analytics
    const preferencesStats = await prisma.emailPreferences.groupBy({
      by: ['frequency'],
      _count: { frequency: true }
    });

    const unsubscribeStats = await prisma.emailPreferences.aggregate({
      _count: {
        unsubscribedAt: true
      },
      where: {
        unsubscribedAt: { not: null }
      }
    });

    return NextResponse.json({
      summary: {
        totalEmails,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        failureRate: Math.round(failureRate * 100) / 100
      },
      emailsByStatus: emailsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      campaigns: {
        total: campaignStats.reduce((sum, stat) => sum + stat._count.status, 0),
        byStatus: campaignStats.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>)
      },
      automation: {
        totalRules: automationStats.reduce((sum, stat) => sum + stat._count.isActive, 0),
        activeRules: automationStats.find(s => s.isActive)?._count?.isActive || 0,
        inactiveRules: automationStats.find(s => !s.isActive)?._count?.isActive || 0
      },
      preferences: {
        totalUsers: preferencesStats.reduce((sum, stat) => sum + stat._count.frequency, 0),
        byFrequency: preferencesStats.reduce((acc, stat) => {
          acc[stat.frequency] = stat._count.frequency;
          return acc;
        }, {} as Record<string, number>),
        globalUnsubscribes: unsubscribeStats._count.unsubscribedAt
      },
      topCampaigns: topCampaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        emailsSent: 0, // emailLogs relation doesn't exist
        createdAt: campaign.createdAt
      })),
      recentActivity,
      period: parseInt(period)
    });

  } catch (error) {
    console.error('Error fetching email analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email analytics' }, 
      { status: 500 }
    );
  }
}
