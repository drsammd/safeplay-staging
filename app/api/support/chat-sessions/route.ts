
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const createSessionSchema = z.object({
  department: z.enum(['TECHNICAL', 'BILLING', 'SAFETY', 'VENUE_SUPPORT', 'PRODUCT', 'GENERAL']).default('GENERAL'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  initialMessage: z.string().min(1, 'Initial message is required'),
  context: z.object({
    page: z.string().optional(),
    venueId: z.string().optional()
  }).optional()
})

const updateSessionSchema = z.object({
  status: z.enum(['WAITING', 'ACTIVE', 'TRANSFERRED', 'ENDED', 'ABANDONED']).optional(),
  agentId: z.string().nullable().optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  endReason: z.string().optional()
})

// GET /api/support/chat-sessions - List chat sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const department = searchParams.get('department')

    const skip = (page - 1) * limit

    // Build where clause based on user role
    const whereClause: any = {}

    if (session.user.role === 'PARENT') {
      whereClause.userId = session.user.id
    } else if (session.user.role === 'VENUE_ADMIN') {
      // Venue admins can see their assigned sessions or sessions related to their venues
      const userVenues = await db.venue.findMany({
        where: { adminId: session.user.id },
        select: { id: true }
      })
      
      const venueIds = userVenues.map(v => v.id)
      
      whereClause.OR = [
        { userId: session.user.id },
        { 
          agent: {
            userId: session.user.id
          }
        }
      ]
    }
    // SUPER_ADMIN can see all sessions

    // Apply filters
    if (status) whereClause.status = status
    if (department) whereClause.department = department

    const [chatSessions, total] = await Promise.all([
      db.supportChatSession.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          agent: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.supportChatSession.count({ where: whereClause })
    ])

    return NextResponse.json({
      sessions: chatSessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    )
  }
}

// POST /api/support/chat-sessions - Create new chat session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSessionSchema.parse(body)

    // Generate unique session ID
    const sessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create chat session
    const chatSession = await db.supportChatSession.create({
      data: {
        sessionId,
        userId: session.user.id,
        status: 'WAITING',
        isAIOnly: false, // This is for human agent chat
        department: validatedData.department as any,
        priority: validatedData.priority as any,
        initialQuery: validatedData.initialMessage,
        language: 'en',
        userAgent: request.headers.get('user-agent'),
        referrerPage: validatedData.context?.page
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    // Create initial message
    const initialMessage = await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        senderId: session.user.id,
        senderType: 'USER',
        content: validatedData.initialMessage,
        messageType: 'TEXT'
      }
    })

    // TODO: Implement agent assignment logic
    // For now, we'll leave it unassigned and agents can pick it up

    return NextResponse.json({
      session: chatSession,
      initialMessage
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating chat session:', error)
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    )
  }
}
