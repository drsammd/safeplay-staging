
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum([
    'TECHNICAL_ISSUE', 'ACCOUNT_BILLING', 'CHILD_SAFETY', 'VENUE_SETUP',
    'FEATURE_REQUEST', 'BUG_REPORT', 'CAMERA_SUPPORT', 'FACE_RECOGNITION',
    'ALERTS_NOTIFICATIONS', 'CHECK_IN_OUT', 'SUBSCRIPTION', 'PAYMENT',
    'VERIFICATION', 'MOBILE_APP', 'GENERAL_INQUIRY', 'EMERGENCY',
    'COMPLAINT', 'FEEDBACK'
  ]),
  subCategory: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).default('MEDIUM'),
  severity: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  venueId: z.string().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number()
  })).optional()
})

// Generate unique ticket number
async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await db.supportTicket.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`)
      }
    }
  })
  
  return `SP-${year}-${String(count + 1).padStart(4, '0')}`
}

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

// GET /api/support/tickets - List tickets with filtering and pagination
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
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const assignedToId = searchParams.get('assignedToId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause based on user role and filters
    const whereClause: any = {}

    // Role-based filtering
    if (session.user.role === 'PARENT') {
      whereClause.userId = session.user.id
    } else if (session.user.role === 'VENUE_ADMIN') {
      // Get user's managed venues
      const userVenues = await db.venue.findMany({
        where: { adminId: session.user.id },
        select: { id: true }
      })
      whereClause.OR = [
        { userId: session.user.id },
        { venueId: { in: userVenues.map(v => v.id) } }
      ]
    }
    // COMPANY_ADMIN can see all tickets

    // Apply filters
    if (status) whereClause.status = status
    if (category) whereClause.category = category
    if (priority) whereClause.priority = priority
    if (assignedToId) whereClause.assignedToId = assignedToId

    // Search in title and description
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where: whereClause,
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
          _count: {
            select: { messages: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      db.supportTicket.count({ where: whereClause })
    ])

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

// POST /api/support/tickets - Create new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTicketSchema.parse(body)

    // Generate unique ticket number
    const ticketNumber = await generateTicketNumber()

    // Create the ticket
    const ticket = await db.supportTicket.create({
      data: {
        ticketNumber,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category as any,
        subCategory: validatedData.subCategory,
        priority: validatedData.priority as any,
        severity: validatedData.severity as any,
        userId: session.user.id,
        userRole: session.user.role as any,
        venueId: validatedData.venueId,
        attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : undefined,
        source: 'WEB_FORM'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        venue: {
          select: { id: true, name: true }
        }
      }
    })

    // Create timeline entry
    await createTimelineEntry(
      ticket.id,
      'CREATED',
      `Ticket created by ${session.user.name}`,
      session.user.id,
      'USER'
    )

    // TODO: Trigger AI processing for initial response
    // This will be implemented when we create the AI service

    return NextResponse.json(ticket, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}
