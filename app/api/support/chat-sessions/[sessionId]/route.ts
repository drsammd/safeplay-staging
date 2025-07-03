
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const updateSessionSchema = z.object({
  status: z.enum(['WAITING', 'ACTIVE', 'TRANSFERRED', 'ENDED', 'ABANDONED']).optional(),
  agentId: z.string().nullable().optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  endReason: z.string().optional()
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

  if (!session) return false

  // User can access their own sessions
  if (session.userId === userId) return true

  // Agent can access assigned sessions
  if (session.agent?.userId === userId) return true

  // Company admin can access all sessions
  if (userRole === 'COMPANY_ADMIN') return true

  return false
}

// GET /api/support/chat-sessions/[sessionId] - Get chat session details
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
    const hasAccess = await canAccessSession(sessionId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const chatSession = await db.supportChatSession.findUnique({
      where: { sessionId },
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
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 })
    }

    return NextResponse.json(chatSession)

  } catch (error) {
    console.error('Error fetching chat session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    )
  }
}

// PATCH /api/support/chat-sessions/[sessionId] - Update chat session
export async function PATCH(
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
    const validatedData = updateSessionSchema.parse(body)

    // Check access permissions
    const hasAccess = await canAccessSession(sessionId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current session
    const currentSession = await db.supportChatSession.findUnique({
      where: { sessionId }
    })

    if (!currentSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    // Handle status changes
    if (validatedData.status && validatedData.status !== currentSession.status) {
      updateData.status = validatedData.status

      if (validatedData.status === 'ENDED') {
        updateData.endedAt = new Date()
        updateData.endedBy = 'USER'
        updateData.sessionDuration = Math.floor(
          (new Date().getTime() - currentSession.createdAt.getTime()) / 1000
        )
      }

      if (validatedData.status === 'ACTIVE' && currentSession.status === 'WAITING') {
        updateData.waitTime = Math.floor(
          (new Date().getTime() - currentSession.createdAt.getTime()) / 1000
        )
      }
    }

    // Handle agent assignment
    if (validatedData.agentId !== undefined) {
      updateData.agentId = validatedData.agentId
      
      if (validatedData.agentId && !currentSession.agentId) {
        updateData.humanTakeoverAt = new Date()
        updateData.status = 'ACTIVE'
      }
    }

    // Handle feedback
    if (validatedData.rating || validatedData.feedback) {
      if (validatedData.rating) updateData.rating = validatedData.rating
      if (validatedData.feedback) updateData.feedback = validatedData.feedback
      updateData.feedbackAt = new Date()
    }

    // Handle end reason
    if (validatedData.endReason) {
      updateData.endReason = validatedData.endReason
    }

    // Update the session
    const updatedSession = await db.supportChatSession.update({
      where: { sessionId },
      data: updateData,
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
        }
      }
    })

    return NextResponse.json(updatedSession)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating chat session:', error)
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    )
  }
}
