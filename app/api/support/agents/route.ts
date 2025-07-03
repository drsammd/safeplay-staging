
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const createAgentSchema = z.object({
  userId: z.string(),
  agentLevel: z.enum(['L1', 'L2', 'L3', 'SPECIALIST', 'SUPERVISOR', 'MANAGER']).default('L1'),
  department: z.enum(['TECHNICAL', 'BILLING', 'SAFETY', 'VENUE_SUPPORT', 'PRODUCT', 'GENERAL']),
  specializations: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  maxConcurrentTickets: z.number().min(1).max(50).default(10),
  workingHours: z.object({
    timezone: z.string().default('UTC'),
    schedule: z.record(z.object({
      start: z.string(),
      end: z.string(),
      available: z.boolean()
    }))
  }).optional()
})

const updateAgentSchema = createAgentSchema.partial().extend({
  status: z.enum(['ONLINE', 'OFFLINE', 'BUSY', 'AWAY', 'ON_BREAK']).optional(),
  isActive: z.boolean().optional(),
  isOnBreak: z.boolean().optional()
})

// Calculate agent performance metrics
async function calculateAgentMetrics(agentId: string) {
  const [
    ticketStats,
    avgResolutionTime,
    avgSatisfaction,
    escalationStats
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
    })
  ])

  const escalationRate = ticketStats > 0 ? (escalationStats / ticketStats) * 100 : 0

  return {
    totalTicketsHandled: ticketStats,
    avgResolutionTime: avgResolutionTime._avg.resolutionTime || 0,
    avgSatisfactionRating: avgSatisfaction._avg.satisfactionRating || 0,
    escalationRate
  }
}

// GET /api/support/agents - List support agents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const department = searchParams.get('department')
    const status = searchParams.get('status')
    const agentLevel = searchParams.get('agentLevel')
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}
    if (department) whereClause.department = department
    if (status) whereClause.status = status
    if (agentLevel) whereClause.agentLevel = agentLevel
    if (isActive !== null) whereClause.isActive = isActive === 'true'

    const [agents, total] = await Promise.all([
      db.supportAgent.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          _count: {
            select: { 
              assignedTickets: {
                where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
              }
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { status: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      db.supportAgent.count({ where: whereClause })
    ])

    return NextResponse.json({
      agents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching support agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

// POST /api/support/agents - Create new support agent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createAgentSchema.parse(body)

    // Check if user exists and is not already an agent
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
      include: { supportAgent: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.supportAgent) {
      return NextResponse.json({ error: 'User is already a support agent' }, { status: 409 })
    }

    // Only admins can be support agents
    if (user.role === 'PARENT') {
      return NextResponse.json({ error: 'Parents cannot be support agents' }, { status: 400 })
    }

    // Create the support agent
    const agent = await db.supportAgent.create({
      data: {
        userId: validatedData.userId,
        agentLevel: validatedData.agentLevel as any,
        department: validatedData.department as any,
        specializations: validatedData.specializations ? JSON.stringify(validatedData.specializations) : undefined,
        languages: validatedData.languages ? JSON.stringify(validatedData.languages) : undefined,
        maxConcurrentTickets: validatedData.maxConcurrentTickets,
        workingHours: validatedData.workingHours ? JSON.stringify(validatedData.workingHours) : undefined,
        timezone: validatedData.workingHours?.timezone || 'UTC',
        status: 'OFFLINE',
        isActive: true
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    return NextResponse.json(agent, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating support agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}
