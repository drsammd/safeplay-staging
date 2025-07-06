
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  messageType: z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM_UPDATE', 'STATUS_CHANGE']).default('TEXT'),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number()
  })).optional()
})

// Create timeline entry for ticket events
async function createTimelineEntry(
  ticketId: string,
  eventType: string,
  description: string,
  performedBy?: string,
  performerType: string = 'USER'
) {
  await db.supportTicketTimeline.create({
    data: {
      ticketId,
      eventType: eventType as any,
      description,
      performedBy,
      performerType: performerType as any
    }
  })
}

// Check if user can access ticket
async function canAccessTicket(ticketId: string, userId: string, userRole: string) {
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      venue: {
        select: { adminId: true }
      }
    }
  })

  if (!ticket) return false

  // User can access their own tickets
  if (ticket.userId === userId) return true

  // Venue admin can access tickets related to their venues
  if (userRole === 'VENUE_ADMIN' && ticket.venue?.adminId === userId) return true

  // Company admin can access all tickets
  if (userRole === 'SUPER_ADMIN') return true

  return false
}

// Update first response time if this is the first response
async function updateFirstResponseTime(ticketId: string) {
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    select: { firstResponseTime: true, createdAt: true }
  })

  if (ticket && !ticket.firstResponseTime) {
    const responseTime = Math.floor(
      (new Date().getTime() - ticket.createdAt.getTime()) / (1000 * 60)
    )

    await db.supportTicket.update({
      where: { id: ticketId },
      data: { firstResponseTime: responseTime }
    })
  }
}

// GET /api/support/tickets/[id]/messages - Get ticket messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticketId = params.id

    // Check access permissions
    const hasAccess = await canAccessTicket(ticketId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeInternal = searchParams.get('includeInternal') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = { ticketId }

    // Only agents can see internal messages
    if (!includeInternal || (session.user.role === 'PARENT')) {
      whereClause.isInternal = false
    }

    const [messages, total] = await Promise.all([
      db.supportTicketMessage.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit
      }),
      db.supportTicketMessage.count({ where: whereClause })
    ])

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching ticket messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/support/tickets/[id]/messages - Add message to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticketId = params.id
    const body = await request.json()
    const validatedData = createMessageSchema.parse(body)

    // Check access permissions
    const hasAccess = await canAccessTicket(ticketId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only agents can create internal messages
    if (validatedData.isInternal && session.user.role === 'PARENT') {
      return NextResponse.json({ error: 'Only agents can create internal messages' }, { status: 403 })
    }

    // Determine sender type
    let senderType = 'USER'
    if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'VENUE_ADMIN') {
      senderType = 'AGENT'
    }

    // Create the message
    const message = await db.supportTicketMessage.create({
      data: {
        ticketId,
        senderId: session.user.id,
        senderType: senderType as any,
        content: validatedData.content,
        messageType: validatedData.messageType as any,
        isInternal: validatedData.isInternal,
        attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : undefined
      }
    })

    // Update first response time if this is from an agent
    if (senderType === 'AGENT') {
      await updateFirstResponseTime(ticketId)
    }

    // Create timeline entry
    const description = validatedData.isInternal 
      ? `Internal note added by ${session.user.name}`
      : `Message added by ${session.user.name}`

    await createTimelineEntry(
      ticketId,
      'COMMENT_ADDED',
      description,
      session.user.id,
      senderType
    )

    // Update ticket status if it was waiting for user and user replied
    if (senderType === 'USER') {
      const ticket = await db.supportTicket.findUnique({
        where: { id: ticketId },
        select: { status: true }
      })

      if (ticket?.status === 'WAITING_FOR_USER') {
        await db.supportTicket.update({
          where: { id: ticketId },
          data: { status: 'IN_PROGRESS' }
        })

        await createTimelineEntry(
          ticketId,
          'STATUS_CHANGED',
          'Status changed from WAITING_FOR_USER to IN_PROGRESS (user replied)',
          session.user.id,
          'SYSTEM'
        )
      }
    }

    return NextResponse.json(message, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating ticket message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
