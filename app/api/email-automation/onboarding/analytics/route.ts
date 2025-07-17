

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiErrorHandler, withErrorHandling, ErrorType } from '@/lib/error-handler';
import { ExecutionStatus } from '@prisma/client';

export const dynamic = "force-dynamic";

/**
 * GET /api/email-automation/onboarding/analytics - Get onboarding sequence analytics
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || !['SUPER_ADMIN', 'VENUE_ADMIN'].includes(session.user.role)) {
    return apiErrorHandler.createErrorResponse(
      ErrorType.AUTHORIZATION,
      'FORBIDDEN',
      'Admin access required',
      403
    );
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Get onboarding sequence executions
    const executions = await prisma.emailAutomationExecution.findMany({
      where: {
        scheduledAt: {
          gte: startDate
        },
        rule: {
          name: {
            startsWith: 'Onboarding Day'
          }
        }
      },
      include: {
        rule: {
          include: {
            template: true
          }
        },
        emailLog: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });

    // Calculate analytics
    const totalUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    });

    const usersWithOnboarding = new Set(executions.map(e => e.userId)).size;
    const totalScheduledEmails = executions.length;
    const sentEmails = executions.filter(e => e.status === ExecutionStatus.COMPLETED && e.emailLog).length;
    const openedEmails = executions.filter(e => e.emailLog?.openedAt).length;
    const clickedEmails = executions.filter(e => e.emailLog?.clickedAt).length;
    const cancelledEmails = executions.filter(e => e.status === ExecutionStatus.CANCELLED).length;

    // Calculate completion rates by day
    const completionByDay: Record<string, any> = {};
    for (let day = 1; day <= 7; day++) {
      const dayExecutions = executions.filter(e => 
        e.rule.template.name.includes(`Day ${day}`)
      );
      const dayScheduled = dayExecutions.length;
      const daySent = dayExecutions.filter(e => 
        e.status === ExecutionStatus.COMPLETED && e.emailLog
      ).length;
      const dayOpened = dayExecutions.filter(e => e.emailLog?.openedAt).length;
      const dayClicked = dayExecutions.filter(e => e.emailLog?.clickedAt).length;

      completionByDay[`day${day}`] = {
        day,
        scheduled: dayScheduled,
        sent: daySent,
        opened: dayOpened,
        clicked: dayClicked,
        sentRate: dayScheduled > 0 ? (daySent / dayScheduled) * 100 : 0,
        openRate: daySent > 0 ? (dayOpened / daySent) * 100 : 0,
        clickRate: daySent > 0 ? (dayClicked / daySent) * 100 : 0
      };
    }

    // Calculate user completion status
    const userCompletionStats: Record<string, number> = {
      not_started: 0,
      in_progress: 0,
      completed: 0
    };
    const userGroups = executions.reduce((acc, execution) => {
      if (!acc[execution.userId]) {
        acc[execution.userId] = [];
      }
      acc[execution.userId].push(execution);
      return acc;
    }, {} as Record<string, any[]>);

    Object.values(userGroups).forEach((userExecutions: any[]) => {
      const sentCount = userExecutions.filter(e => 
        e.status === ExecutionStatus.COMPLETED && e.emailLog
      ).length;
      
      const completionStatus = sentCount === 0 ? 'not_started' :
                              sentCount < 7 ? 'in_progress' : 'completed';
      
      userCompletionStats[completionStatus]++;
    });

    const analytics = {
      overview: {
        totalUsers,
        usersWithOnboarding,
        onboardingAdoptionRate: totalUsers > 0 ? (usersWithOnboarding / totalUsers) * 100 : 0,
        totalScheduledEmails,
        sentEmails,
        openedEmails,
        clickedEmails,
        cancelledEmails,
        deliveryRate: totalScheduledEmails > 0 ? (sentEmails / totalScheduledEmails) * 100 : 0,
        openRate: sentEmails > 0 ? (openedEmails / sentEmails) * 100 : 0,
        clickRate: sentEmails > 0 ? (clickedEmails / sentEmails) * 100 : 0,
        cancellationRate: totalScheduledEmails > 0 ? (cancelledEmails / totalScheduledEmails) * 100 : 0
      },
      completionByDay,
      userCompletionStats: {
        notStarted: userCompletionStats.not_started || 0,
        inProgress: userCompletionStats.in_progress || 0,
        completed: userCompletionStats.completed || 0
      },
      recentActivity: executions.slice(0, 50).map(e => ({
        id: e.id,
        userId: e.userId,
        userEmail: e.user.email,
        userName: e.user.name,
        templateName: e.rule.template.name,
        status: e.status,
        scheduledAt: e.scheduledAt,
        executedAt: e.executedAt,
        opened: !!e.emailLog?.openedAt,
        clicked: !!e.emailLog?.clickedAt,
        openedAt: e.emailLog?.openedAt,
        clickedAt: e.emailLog?.clickedAt
      })),
      dateRange: {
        startDate,
        endDate: new Date(),
        days
      }
    };

    return apiErrorHandler.createSuccessResponse({
      analytics
    });

  } catch (error) {
    console.error('Error fetching onboarding analytics:', error);
    return apiErrorHandler.createErrorResponse(
      ErrorType.INTERNAL,
      'ONBOARDING_ANALYTICS_ERROR',
      'Failed to fetch onboarding analytics',
      500
    );
  }
});

