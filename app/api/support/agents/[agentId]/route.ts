
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const updateAgentSchema = z.object({
  agentLevel: z.enum(['L1', 'L2', 'L3', 'SPECIALIST', 'SUPERVISOR', 'MANAGER']).optional(),
  department: z.enum(['TECHNICAL', 'BILLING', 'SAFETY', 'VENUE_SUPPORT', 'PRODUCT', 'GENERAL']).optional(),
  specializations: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'BUSY', 'AWAY', 'ON_BREAK']).optional(),
  isActive: z.boolean().optional(),
  maxConcurrentTickets: z.number().min(1).max(50).optional(),
  workingHours: z.object({
    timezone: z.string(),
    schedule: z.record(z.object({
      start: z.string(),
      end: z.string(),
      available: z.boolean()
    }))
  }).optional(),
  isOnBreak: z.boolean().optional()
})

// Calculate agent performance metrics
async function calculateAgentMetrics(agentId: string) {
  const [
    ticketStats,
    avgResolutionTime,
    avgSatisfaction,
    escalationStats,
    chatStats
  ] = await Promise.all([
    // Total tickets handled
    db.supportTicket.count({
      where: { assignedToId: agentId }
    }),
    
    // Average resolution time
    db.supportTicket.aggregate({
      where: {
        assignedToId: agentId,
        status: 'RESOLVED',
        resolutionTime: { not: null }
      },
      _avg: { resolutionTime: true }
    }),
    
    // Average satisfaction rating
    db.supportTicket.aggregate({
      where: {
        assignedToId: agentId,
        satisfactionRating: { not: null }
      },
      _avg: { satisfactionRating: true }
    }),
    
    // Escalation rate
    db.ticketEscalation.count({
      where: { fromAgentId: agentId }
    }),

    // Chat session stats
    db.supportChatSession.aggregate({
      where: { agentId },
      _count: { id: true },
      _avg: { rating: true }
    })
  ])

  const escalationRate = ticketStats > 0 ? (escalationStats / ticketStats) * 100 : 0

  return {
    totalTicketsHandled: ticketStats,
    avgResolutionTime: avgResolutionTime._avg.resolutionTime || 0,
    avgSatisfactionRating: avgSatisfaction._avg.satisfactionRating || 0,
    escalationRate,
    totalChatSessions: chatStats._count.id || 0,
    avgChatRating: chatStats._avg.rating || 0
  }
}

// GET /api/support/agents/[agentId] - Get agent details
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agentId = params.agentId

    // Users can only view their own agent profile, admins can view all
    if (session.user.role !== 'SUPER_ADMIN') {
      const userAgent = await db.supportAgent.findFirst({
        where: { 
          id: agentId,
          userId: session.user.id 
        }
      })
      
      if (!userAgent) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const agent = await db.supportAgent.findUnique({
      where: { id: agentId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        assignedTickets: {
          where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER'] } },
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        chatSessions: {
          where: { status: { in: ['WAITING', 'ACTIVE'] } },
          select: {
            id: true,
            sessionId: true,
            status: true,
            priority: true,
            createdAt: true,
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Calculate performance metrics
    const metrics = await calculateAgentMetrics(agentId)

    // Update agent metrics in database
    await db.supportAgent.update({
      where: { id: agentId },
      data: {
        totalTicketsHandled: metrics.totalTicketsHandled,
        avgResolutionTime: metrics.avgResolutionTime,
        avgSatisfactionRating: metrics.avgSatisfactionRating,
        escalationRate: metrics.escalationRate,
        currentTicketLoad: agent.assignedTickets.length,
        lastActiveAt: new Date()
      }
    })

    return NextResponse.json({
      ...agent,
      metrics
    })

  } catch (error) {
    console.error('Error fetching agent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}

// PATCH /api/support/agents/[agentId] - Update agent
export async function PATCH(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agentId = params.agentId
    const body = await request.json()
    const validatedData = updateAgentSchema.parse(body)

    // Check permissions
    const agent = await db.supportAgent.findUnique({
      where: { id: agentId },
      select: { userId: true }
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Users can update their own status, admins can update everything
    const canUpdateAll = session.user.role === 'SUPER_ADMIN'
    const canUpdateStatus = agent.userId === session.user.id

    if (!canUpdateAll && !canUpdateStatus) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}

    // Status updates (agents can update their own status)
    if (validatedData.status && (canUpdateAll || canUpdateStatus)) {
      updateData.status = validatedData.status
      updateData.lastActiveAt = new Date()
      
      if (validatedData.status === 'ON_BREAK') {
        updateData.isOnBreak = true
        updateData.breakStartTime = new Date()
      } else if (updateData.isOnBreak) {
        updateData.isOnBreak = false
        updateData.breakStartTime = null
      }
    }

    // Break status (agents can update their own)
    if (validatedData.isOnBreak !== undefined && (canUpdateAll || canUpdateStatus)) {
      updateData.isOnBreak = validatedData.isOnBreak
      
      if (validatedData.isOnBreak) {
        updateData.breakStartTime = new Date()
        updateData.status = 'ON_BREAK'
      } else {
        updateData.breakStartTime = null
        updateData.status = 'ONLINE'
      }
    }

    // Admin-only updates
    if (canUpdateAll) {
      if (validatedData.agentLevel) updateData.agentLevel = validatedData.agentLevel
      if (validatedData.department) updateData.department = validatedData.department
      if (validatedData.specializations) updateData.specializations = JSON.stringify(validatedData.specializations)
      if (validatedData.languages) updateData.languages = JSON.stringify(validatedData.languages)
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
      if (validatedData.maxConcurrentTickets) updateData.maxConcurrentTickets = validatedData.maxConcurrentTickets
      if (validatedData.workingHours) {
        updateData.workingHours = JSON.stringify(validatedData.workingHours)
        updateData.timezone = validatedData.workingHours.timezone
      }
    }

    const updatedAgent = await db.supportAgent.update({
      where: { id: agentId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    return NextResponse.json(updatedAgent)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating agent:', error)
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}

// DELETE /api/support/agents/[agentId] - Delete agent (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const agentId = params.agentId

    // Check for active assignments
    const activeTickets = await db.supportTicket.count({
      where: {
        assignedToId: agentId,
        status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER'] }
      }
    })

    const activeSessions = await db.supportChatSession.count({
      where: {
        agentId,
        status: { in: ['WAITING', 'ACTIVE'] }
      }
    })

    if (activeTickets > 0 || activeSessions > 0) {
      return NextResponse.json({
        error: 'Cannot delete agent with active assignments',
        details: {
          activeTickets,
          activeSessions
        }
      }, { status: 400 })
    }

    await db.supportAgent.delete({
      where: { id: agentId }
    })

    return NextResponse.json({ message: 'Agent deleted successfully' })

  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    )
  }
}
