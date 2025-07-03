
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  department: z.enum(['TECHNICAL', 'BILLING', 'SAFETY', 'VENUE_SUPPORT', 'PRODUCT', 'GENERAL']).optional(),
  agentId: z.string().optional(),
  granularity: z.enum(['day', 'week', 'month']).default('day')
})

// Generate analytics for a specific date range
async function generateAnalytics(startDate: Date, endDate: Date, filters: any = {}) {
  const whereClause: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }

  // Apply filters
  if (filters.department) {
    whereClause.category = filters.department
  }
  if (filters.agentId) {
    whereClause.assignedToId = filters.agentId
  }

  // Ticket metrics
  const [
    totalTickets,
    resolvedTickets,
    closedTickets,
    avgResolutionTime,
    avgFirstResponseTime,
    ticketsByStatus,
    ticketsByPriority,
    ticketsByCategory,
    satisfactionStats
  ] = await Promise.all([
    // Total tickets created
    db.supportTicket.count({ where: whereClause }),
    
    // Resolved tickets
    db.supportTicket.count({
      where: { ...whereClause, status: 'RESOLVED' }
    }),
    
    // Closed tickets
    db.supportTicket.count({
      where: { ...whereClause, status: 'CLOSED' }
    }),
    
    // Average resolution time
    db.supportTicket.aggregate({
      where: {
        ...whereClause,
        status: 'RESOLVED',
        resolutionTime: { not: null }
      },
      _avg: { resolutionTime: true }
    }),
    
    // Average first response time
    db.supportTicket.aggregate({
      where: {
        ...whereClause,
        firstResponseTime: { not: null }
      },
      _avg: { firstResponseTime: true }
    }),
    
    // Tickets by status
    db.supportTicket.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true }
    }),
    
    // Tickets by priority
    db.supportTicket.groupBy({
      by: ['priority'],
      where: whereClause,
      _count: { priority: true }
    }),
    
    // Tickets by category
    db.supportTicket.groupBy({
      by: ['category'],
      where: whereClause,
      _count: { category: true }
    }),
    
    // Satisfaction statistics
    db.supportTicket.aggregate({
      where: {
        ...whereClause,
        satisfactionRating: { not: null }
      },
      _avg: { satisfactionRating: true },
      _count: { satisfactionRating: true }
    })
  ])

  // AI metrics
  const chatWhereClause: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }

  const [
    aiChatStats,
    escalationStats,
    chatSessionStats,
    kbStats
  ] = await Promise.all([
    // AI chat interactions
    db.chatMessage.aggregate({
      where: {
        ...chatWhereClause,
        aiGenerated: true
      },
      _count: { id: true },
      _avg: { aiConfidence: true }
    }),
    
    // AI escalations
    db.supportChatSession.count({
      where: {
        ...chatWhereClause,
        isAIOnly: false,
        aiHandoffAt: { not: null }
      }
    }),
    
    // Chat session metrics
    db.supportChatSession.aggregate({
      where: chatWhereClause,
      _count: { id: true },
      _avg: { 
        sessionDuration: true,
        waitTime: true,
        rating: true
      }
    }),
    
    // Knowledge base metrics
    db.knowledgeBaseArticle.aggregate({
      where: {
        publishedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { viewCount: true },
      _avg: { avgRating: true }
    })
  ])

  // Agent performance
  const agentPerformance = await db.supportAgent.findMany({
    where: filters.agentId ? { id: filters.agentId } : {},
    select: {
      id: true,
      user: {
        select: { name: true, email: true }
      },
      department: true,
      agentLevel: true,
      totalTicketsHandled: true,
      avgResolutionTime: true,
      avgSatisfactionRating: true,
      escalationRate: true,
      status: true,
      isActive: true
    }
  })

  return {
    period: {
      startDate,
      endDate,
      totalDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    },
    tickets: {
      total: totalTickets,
      resolved: resolvedTickets,
      closed: closedTickets,
      resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0,
      avgResolutionTime: avgResolutionTime._avg.resolutionTime || 0,
      avgFirstResponseTime: avgFirstResponseTime._avg.firstResponseTime || 0,
      byStatus: ticketsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {} as any),
      byPriority: ticketsByPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.priority
        return acc
      }, {} as any),
      byCategory: ticketsByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.category
        return acc
      }, {} as any)
    },
    satisfaction: {
      avgRating: satisfactionStats._avg.satisfactionRating || 0,
      totalResponses: satisfactionStats._count.satisfactionRating || 0,
      npsScore: 0 // TODO: Calculate NPS based on ratings
    },
    ai: {
      totalInteractions: aiChatStats._count.id || 0,
      avgConfidence: aiChatStats._avg.aiConfidence || 0,
      escalations: escalationStats,
      escalationRate: aiChatStats._count.id > 0 ? (escalationStats / aiChatStats._count.id) * 100 : 0
    },
    chat: {
      totalSessions: chatSessionStats._count.id || 0,
      avgDuration: chatSessionStats._avg.sessionDuration || 0,
      avgWaitTime: chatSessionStats._avg.waitTime || 0,
      avgRating: chatSessionStats._avg.rating || 0
    },
    knowledgeBase: {
      totalViews: kbStats._sum.viewCount || 0,
      avgRating: kbStats._avg.avgRating || 0
    },
    agents: agentPerformance
  }
}

// GET /api/support/analytics - Get support analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'COMPANY_ADMIN' && session.user.role !== 'VENUE_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const validatedQuery = analyticsQuerySchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      department: searchParams.get('department'),
      agentId: searchParams.get('agentId'),
      granularity: searchParams.get('granularity') || 'day'
    })

    // Default to last 30 days if no date range provided
    const endDate = validatedQuery.endDate ? new Date(validatedQuery.endDate) : new Date()
    const startDate = validatedQuery.startDate 
      ? new Date(validatedQuery.startDate) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Generate analytics
    const analytics = await generateAnalytics(startDate, endDate, {
      department: validatedQuery.department,
      agentId: validatedQuery.agentId
    })

    // Store analytics snapshot (for historical tracking)
    try {
      await db.supportAnalytics.upsert({
        where: { date: new Date(new Date().toDateString()) },
        update: {
          ticketsCreated: analytics.tickets.total,
          ticketsResolved: analytics.tickets.resolved,
          ticketsClosed: analytics.tickets.closed,
          avgResolutionTime: analytics.tickets.avgResolutionTime,
          avgFirstResponseTime: analytics.tickets.avgFirstResponseTime,
          aiInteractions: analytics.ai.totalInteractions,
          aiEscalations: analytics.ai.escalations,
          aiAccuracyRate: 100 - analytics.ai.escalationRate,
          chatSessionsStarted: analytics.chat.totalSessions,
          avgChatDuration: analytics.chat.avgDuration,
          avgChatWaitTime: analytics.chat.avgWaitTime,
          avgSatisfactionRating: analytics.satisfaction.avgRating,
          satisfactionResponses: analytics.satisfaction.totalResponses,
          kbArticleViews: analytics.knowledgeBase.totalViews,
          avgKbRating: analytics.knowledgeBase.avgRating,
          totalActiveAgents: analytics.agents.filter(a => a.isActive).length,
          categoryBreakdown: JSON.stringify(analytics.tickets.byCategory),
          priorityBreakdown: JSON.stringify(analytics.tickets.byPriority)
        },
        create: {
          date: new Date(new Date().toDateString()),
          ticketsCreated: analytics.tickets.total,
          ticketsResolved: analytics.tickets.resolved,
          ticketsClosed: analytics.tickets.closed,
          avgResolutionTime: analytics.tickets.avgResolutionTime,
          avgFirstResponseTime: analytics.tickets.avgFirstResponseTime,
          aiInteractions: analytics.ai.totalInteractions,
          aiEscalations: analytics.ai.escalations,
          aiAccuracyRate: 100 - analytics.ai.escalationRate,
          chatSessionsStarted: analytics.chat.totalSessions,
          avgChatDuration: analytics.chat.avgDuration,
          avgChatWaitTime: analytics.chat.avgWaitTime,
          avgSatisfactionRating: analytics.satisfaction.avgRating,
          satisfactionResponses: analytics.satisfaction.totalResponses,
          kbArticleViews: analytics.knowledgeBase.totalViews,
          avgKbRating: analytics.knowledgeBase.avgRating,
          totalActiveAgents: analytics.agents.filter(a => a.isActive).length,
          categoryBreakdown: JSON.stringify(analytics.tickets.byCategory),
          priorityBreakdown: JSON.stringify(analytics.tickets.byPriority)
        }
      })
    } catch (error) {
      console.log('Analytics storage failed (non-critical):', error)
    }

    return NextResponse.json(analytics)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating support analytics:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    )
  }
}

// POST /api/support/analytics - Generate and store daily analytics (cron job)
export async function POST(request: NextRequest) {
  try {
    // This endpoint would typically be called by a cron job
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const today = new Date(yesterday)
    today.setDate(today.getDate() + 1)

    const analytics = await generateAnalytics(yesterday, today)

    // Store analytics for yesterday
    await db.supportAnalytics.upsert({
      where: { date: yesterday },
      update: {
        ticketsCreated: analytics.tickets.total,
        ticketsResolved: analytics.tickets.resolved,
        ticketsClosed: analytics.tickets.closed,
        avgResolutionTime: analytics.tickets.avgResolutionTime,
        avgFirstResponseTime: analytics.tickets.avgFirstResponseTime,
        aiInteractions: analytics.ai.totalInteractions,
        aiEscalations: analytics.ai.escalations,
        aiAccuracyRate: 100 - analytics.ai.escalationRate,
        chatSessionsStarted: analytics.chat.totalSessions,
        avgChatDuration: analytics.chat.avgDuration,
        avgChatWaitTime: analytics.chat.avgWaitTime,
        avgSatisfactionRating: analytics.satisfaction.avgRating,
        satisfactionResponses: analytics.satisfaction.totalResponses,
        kbArticleViews: analytics.knowledgeBase.totalViews,
        avgKbRating: analytics.knowledgeBase.avgRating,
        totalActiveAgents: analytics.agents.filter(a => a.isActive).length,
        categoryBreakdown: JSON.stringify(analytics.tickets.byCategory),
        priorityBreakdown: JSON.stringify(analytics.tickets.byPriority)
      },
      create: {
        date: yesterday,
        ticketsCreated: analytics.tickets.total,
        ticketsResolved: analytics.tickets.resolved,
        ticketsClosed: analytics.tickets.closed,
        avgResolutionTime: analytics.tickets.avgResolutionTime,
        avgFirstResponseTime: analytics.tickets.avgFirstResponseTime,
        aiInteractions: analytics.ai.totalInteractions,
        aiEscalations: analytics.ai.escalations,
        aiAccuracyRate: 100 - analytics.ai.escalationRate,
        chatSessionsStarted: analytics.chat.totalSessions,
        avgChatDuration: analytics.chat.avgDuration,
        avgChatWaitTime: analytics.chat.avgWaitTime,
        avgSatisfactionRating: analytics.satisfaction.avgRating,
        satisfactionResponses: analytics.satisfaction.totalResponses,
        kbArticleViews: analytics.knowledgeBase.totalViews,
        avgKbRating: analytics.knowledgeBase.avgRating,
        totalActiveAgents: analytics.agents.filter(a => a.isActive).length,
        categoryBreakdown: JSON.stringify(analytics.tickets.byCategory),
        priorityBreakdown: JSON.stringify(analytics.tickets.byPriority)
      }
    })

    return NextResponse.json({ 
      message: 'Analytics generated successfully',
      date: yesterday.toISOString(),
      analytics 
    })

  } catch (error) {
    console.error('Error generating daily analytics:', error)
    return NextResponse.json(
      { error: 'Failed to generate daily analytics' },
      { status: 500 }
    )
  }
}
