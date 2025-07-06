
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const updateTicketSchema = z.object({
  status: z.enum([
    'OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_VENDOR',
    'RESOLVED', 'CLOSED', 'REOPENED', 'ESCALATED', 'ON_HOLD'
  ]).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
  assignedToId: z.string().nullable().optional(),
  resolution: z.string().optional(),
  satisfactionRating: z.number().min(1).max(5).optional(),
  feedbackText: z.string().optional()
})

// Create timeline entry for ticket events
async function createTimelineEntry(
  ticketId: string,
  eventType: string,
  description: string,
  performedBy?: string,
  performerType: string = 'USER',
  oldValue?: string,
  newValue?: string
) {
  await db.supportTicketTimeline.create({
    data: {
      ticketId,
      eventType: eventType as any,
      description,
      performedBy,
      performerType: performerType as any,
      oldValue,
      newValue
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

// GET /api/support/tickets/[id] - Get ticket details
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

    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        venue: {
          select: { id: true, name: true }
        },
        assignedTo: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        messages: {
          include: {
            ticket: false // Avoid circular reference
          },
          orderBy: { createdAt: 'asc' }
        },
        timelineEntries: {
          orderBy: { createdAt: 'desc' }
        },
        escalations: {
          include: {
            fromAgent: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            },
            toAgent: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json(ticket)

  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}

// PATCH /api/support/tickets/[id] - Update ticket
export async function PATCH(
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
    const validatedData = updateTicketSchema.parse(body)

    // Check access permissions
    const hasAccess = await canAccessTicket(ticketId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current ticket state
    const currentTicket = await db.supportTicket.findUnique({
      where: { id: ticketId }
    })

    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    const timelineEntries: Array<{
      eventType: string
      description: string
      oldValue?: string
      newValue?: string
    }> = []

    // Track status changes
    if (validatedData.status && validatedData.status !== currentTicket.status) {
      updateData.status = validatedData.status
      
      if (validatedData.status === 'RESOLVED') {
        updateData.resolvedAt = new Date()
        updateData.resolvedBy = session.user.id
        updateData.resolutionTime = Math.floor(
          (new Date().getTime() - currentTicket.createdAt.getTime()) / (1000 * 60)
        )
      }

      timelineEntries.push({
        eventType: 'STATUS_CHANGED',
        description: `Status changed from ${currentTicket.status} to ${validatedData.status}`,
        oldValue: currentTicket.status,
        newValue: validatedData.status
      })
    }

    // Track priority changes
    if (validatedData.priority && validatedData.priority !== currentTicket.priority) {
      updateData.priority = validatedData.priority
      timelineEntries.push({
        eventType: 'PRIORITY_CHANGED',
        description: `Priority changed from ${currentTicket.priority} to ${validatedData.priority}`,
        oldValue: currentTicket.priority,
        newValue: validatedData.priority
      })
    }

    // Track assignment changes
    if (validatedData.assignedToId !== undefined && validatedData.assignedToId !== currentTicket.assignedToId) {
      updateData.assignedToId = validatedData.assignedToId
      updateData.assignedAt = validatedData.assignedToId ? new Date() : null

      const description = validatedData.assignedToId 
        ? `Ticket assigned to agent`
        : `Ticket unassigned`

      timelineEntries.push({
        eventType: 'ASSIGNED',
        description,
        oldValue: currentTicket.assignedToId || 'unassigned',
        newValue: validatedData.assignedToId || 'unassigned'
      })
    }

    // Handle resolution
    if (validatedData.resolution) {
      updateData.resolution = validatedData.resolution
    }

    // Handle feedback
    if (validatedData.satisfactionRating || validatedData.feedbackText) {
      if (validatedData.satisfactionRating) {
        updateData.satisfactionRating = validatedData.satisfactionRating
      }
      if (validatedData.feedbackText) {
        updateData.feedbackText = validatedData.feedbackText
      }
      updateData.feedbackAt = new Date()

      timelineEntries.push({
        eventType: 'COMMENT_ADDED',
        description: `Feedback provided by ${session.user.name}`,
      })
    }

    // Update the ticket
    const updatedTicket = await db.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        venue: {
          select: { id: true, name: true }
        },
        assignedTo: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    // Create timeline entries
    for (const entry of timelineEntries) {
      await createTimelineEntry(
        ticketId,
        entry.eventType,
        entry.description,
        session.user.id,
        session.user.role === 'SUPER_ADMIN' || session.user.role === 'VENUE_ADMIN' ? 'AGENT' : 'USER',
        entry.oldValue,
        entry.newValue
      )
    }

    return NextResponse.json(updatedTicket)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    )
  }
}

// DELETE /api/support/tickets/[id] - Delete ticket (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ticketId = params.id

    await db.supportTicket.delete({
      where: { id: ticketId }
    })

    return NextResponse.json({ message: 'Ticket deleted successfully' })

  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    )
  }
}
