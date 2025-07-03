
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'

export const dynamic = "force-dynamic"

// Schema for creating family invitations
const createInvitationSchema = z.object({
  inviteeEmail: z.string().email(),
  inviteeName: z.string().optional(),
  familyRole: z.enum([
    'SPOUSE', 'GRANDPARENT', 'SIBLING', 'RELATIVE', 'FRIEND', 
    'NANNY', 'BABYSITTER', 'TEACHER', 'GUARDIAN', 'EMERGENCY_CONTACT', 'CUSTOM'
  ]),
  invitationMessage: z.string().optional(),
  linkedChildrenIds: z.array(z.string()).optional(),
  permissionSet: z.object({
    canViewAllChildren: z.boolean().default(false),
    canEditChildren: z.boolean().default(false),
    canCheckInOut: z.boolean().default(false),
    canViewPhotos: z.boolean().default(true),
    canViewVideos: z.boolean().default(true),
    canPurchaseMedia: z.boolean().default(false),
    canReceiveAlerts: z.boolean().default(true),
    canViewLocation: z.boolean().default(true),
    canViewReports: z.boolean().default(false),
    canManageFamily: z.boolean().default(false),
    canMakePayments: z.boolean().default(false),
    photoAccess: z.enum(['FULL', 'THUMBNAILS_ONLY', 'NO_ACCESS', 'APPROVED_ONLY', 'RECENT_ONLY']).default('FULL'),
    videoAccess: z.enum(['FULL', 'THUMBNAILS_ONLY', 'NO_ACCESS', 'APPROVED_ONLY', 'RECENT_ONLY']).default('FULL'),
    emergencyContact: z.boolean().default(false),
    notificationFrequency: z.enum(['REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'EMERGENCY_ONLY', 'DISABLED']).default('REAL_TIME')
  }),
  expirationDays: z.number().min(1).max(30).default(7)
})

// GET /api/family/invitations - Get all invitations for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'all' // 'sent', 'received', 'all'
    const status = url.searchParams.get('status') || 'all'

    let whereClause: any = {}

    if (type === 'sent') {
      whereClause.inviterUserId = session.user.id
    } else if (type === 'received') {
      whereClause.inviteeEmail = session.user.email
    } else {
      whereClause = {
        OR: [
          { inviterUserId: session.user.id },
          { inviteeEmail: session.user.email }
        ]
      }
    }

    if (status !== 'all') {
      whereClause.status = status.toUpperCase()
    }

    const invitations = await prisma.familyInvitation.findMany({
      where: whereClause,
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        invitee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add linked children information
    const invitationsWithChildren = await Promise.all(
      invitations.map(async (invitation) => {
        let linkedChildren: any[] = []
        if (invitation.linkedChildrenIds && Array.isArray(invitation.linkedChildrenIds)) {
          linkedChildren = await prisma.child.findMany({
            where: {
              id: { in: invitation.linkedChildrenIds as string[] }
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true
            }
          })
        }

        return {
          ...invitation,
          linkedChildren
        }
      })
    )

    return NextResponse.json({ invitations: invitationsWithChildren })
  } catch (error) {
    console.error('Error fetching family invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/family/invitations - Create new family invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a parent
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { children: true }
    })

    if (!user || user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can send family invitations' }, { status: 403 })
    }

    const body = await request.json()
    const data = createInvitationSchema.parse(body)

    // Check if user is trying to invite themselves
    if (data.inviteeEmail === user.email) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 })
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.familyInvitation.findFirst({
      where: {
        inviterUserId: session.user.id,
        inviteeEmail: data.inviteeEmail,
        status: 'PENDING'
      }
    })

    if (existingInvitation) {
      return NextResponse.json({ error: 'Pending invitation already exists for this email' }, { status: 400 })
    }

    // Check if this person is already a family member
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        familyOwnerId: session.user.id,
        memberUser: {
          email: data.inviteeEmail
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'This person is already a family member' }, { status: 400 })
    }

    // Validate linked children belong to the inviter
    if (data.linkedChildrenIds && data.linkedChildrenIds.length > 0) {
      const childrenCount = await prisma.child.count({
        where: {
          id: { in: data.linkedChildrenIds },
          parentId: session.user.id
        }
      })

      if (childrenCount !== data.linkedChildrenIds.length) {
        return NextResponse.json({ error: 'Some children do not belong to you' }, { status: 400 })
      }
    }

    // Generate unique invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + data.expirationDays)

    // Get client IP and user agent
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create invitation
    const invitation = await prisma.familyInvitation.create({
      data: {
        inviterUserId: session.user.id,
        inviteeEmail: data.inviteeEmail,
        inviteeName: data.inviteeName,
        familyRole: data.familyRole,
        invitationMessage: data.invitationMessage,
        invitationToken,
        linkedChildrenIds: data.linkedChildrenIds || [],
        permissionSet: data.permissionSet,
        expiresAt,
        ipAddress: clientIp,
        userAgent
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // TODO: Send invitation email notification
    // This would integrate with the existing email automation system

    return NextResponse.json({ 
      invitation,
      message: 'Family invitation sent successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating family invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
