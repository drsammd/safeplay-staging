
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  messageType: z.enum(['TEXT', 'IMAGE', 'FILE', 'TYPING_INDICATOR', 'SYSTEM_MESSAGE']).default('TEXT'),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number()
  })).optional()
})

// Check if user can access chat session
async function canAccessSession(sessionId: string, userId: string, userRole: string) {
  const session = await db.supportChatSession.findUnique({
    where: { sessionId },
    include: {
      agent: {
        select: { userId: true }
      }
    }
  })

  if (!session) return null

  // User can access their own sessions
  if (session.userId === userId) return session

  // Agent can access assigned sessions
  if (session.agent?.userId === userId) return session

  // Company admin can access all sessions
  if (userRole === 'SUPER_ADMIN') return session

  return null
}

// GET /api/support/chat-sessions/[sessionId]/messages - Get chat messages
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.sessionId

    // Check access permissions
    const chatSession = await canAccessSession(sessionId, session.user.id, session.user.role)
    if (!chatSession) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const since = searchParams.get('since') // ISO timestamp for real-time updates

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = { sessionId: chatSession.id }

    if (since) {
      whereClause.createdAt = {
        gt: new Date(since)
      }
    }

    const [messages, total] = await Promise.all([
      db.chatMessage.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
        skip: since ? 0 : skip, // Don't paginate for real-time updates
        take: since ? undefined : limit
      }),
      since ? Promise.resolve(0) : db.chatMessage.count({ where: { sessionId: chatSession.id } })
    ])

    return NextResponse.json({
      messages,
      pagination: since ? null : {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/support/chat-sessions/[sessionId]/messages - Send message in chat
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.sessionId
    const body = await request.json()
    const validatedData = createMessageSchema.parse(body)

    // Check access permissions
    const chatSession = await canAccessSession(sessionId, session.user.id, session.user.role)
    if (!chatSession) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if session is active
    if (chatSession.status === 'ENDED') {
      return NextResponse.json({ error: 'Chat session has ended' }, { status: 400 })
    }

    // Determine sender type
    let senderType = 'USER'
    if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'VENUE_ADMIN') {
      // Check if user is the assigned agent
      const isAssignedAgent = chatSession.agent?.userId === session.user.id
      if (isAssignedAgent) {
        senderType = 'AGENT'
      }
    }

    // Create the message
    const message = await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        senderId: session.user.id,
        senderType: senderType as any,
        content: validatedData.content,
        messageType: validatedData.messageType as any,
        attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : undefined
      }
    })

    // Update session status if needed
    if (chatSession.status === 'WAITING' && senderType === 'AGENT') {
      await db.supportChatSession.update({
        where: { id: chatSession.id },
        data: {
          status: 'ACTIVE',
          humanTakeoverAt: new Date(),
          waitTime: Math.floor(
            (new Date().getTime() - chatSession.createdAt.getTime()) / 1000
          )
        }
      })
    }

    // TODO: Implement real-time notifications via WebSocket
    // This would notify other participants that a new message arrived

    return NextResponse.json(message, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating chat message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
