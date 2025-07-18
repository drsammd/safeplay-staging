
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const updateInvitationSchema = z.object({
  action: z.enum(['accept', 'decline', 'revoke', 'resend']),
  revokeReason: z.string().optional(),
  createAccount: z.boolean().optional(),
  accountData: z.object({
    name: z.string(),
    password: z.string().min(6)
  }).optional()
})

// GET /api/family/invitations/[id] - Get specific invitation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invitation = await prisma.familyInvitation.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check if user has access to this invitation
    const hasAccess = invitation.inviterId === session.user.id || 
                      invitation.inviteeEmail === session.user.email ||
                      invitation.inviteeId === session.user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Add linked children information (linkedChildrenIds property doesn't exist in schema)
    let linkedChildren: any[] = []
    // TODO: Implement linked children functionality when schema is updated
    
    return NextResponse.json({
      ...invitation,
      linkedChildren
    })

  } catch (error) {
    console.error('Error fetching family invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/family/invitations/[id] - Update invitation (accept, decline, revoke)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateInvitationSchema.parse(body)

    const invitation = await prisma.familyInvitation.findUnique({
      where: { id: params.id },
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

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check if invitation is still valid
    if (invitation.expiresAt < new Date()) {
      await prisma.familyInvitation.update({
        where: { id: params.id },
        data: { status: 'EXPIRED' }
      })
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    let updatedInvitation
    let familyMember: any = null

    switch (data.action) {
      case 'accept':
        // Check if user can accept this invitation
        if (invitation.inviteeEmail !== session.user.email && !invitation.acceptedBy) {
          return NextResponse.json({ error: 'Cannot accept this invitation' }, { status: 403 })
        }

        if (invitation.status !== 'PENDING') {
          return NextResponse.json({ error: 'Invitation is no longer pending' }, { status: 400 })
        }

        // Handle account creation if needed
        let acceptedByUserId = session.user.id
        if (data.createAccount && data.accountData) {
          // Create new account for the invitee
          const existingUser = await prisma.user.findUnique({
            where: { email: invitation.inviteeEmail }
          })

          if (existingUser) {
            return NextResponse.json({ error: 'Account already exists for this email' }, { status: 400 })
          }

          const bcrypt = require('bcryptjs')
          const hashedPassword = await bcrypt.hash(data.accountData.password, 12)

          const newUser = await prisma.user.create({
            data: {
              email: invitation.inviteeEmail,
              name: data.accountData.name,
              password: hashedPassword,
              role: 'PARENT'
            }
          })

          acceptedByUserId = newUser.id
        }

        // Update invitation status
        updatedInvitation = await prisma.familyInvitation.update({
          where: { id: params.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            inviteeId: acceptedByUserId
          }
        })

        // Create family member relationship
        familyMember = await prisma.familyMember.create({
          data: {
            familyId: invitation.inviterId,
            memberId: acceptedByUserId,
            relationship: invitation.relationship,
            invitedBy: invitation.inviterId,
            status: 'ACTIVE'
          }
        })

        // Create child access records for linked children (linkedChildrenIds doesn't exist in schema)
        // TODO: Implement child access records when schema is updated

        // Log the activity (familyActivityLog model doesn't exist in schema)
        // TODO: Implement activity logging when schema is updated

        break

      case 'decline':
        if (invitation.inviteeEmail !== session.user.email) {
          return NextResponse.json({ error: 'Cannot decline this invitation' }, { status: 403 })
        }

        if (invitation.status !== 'PENDING') {
          return NextResponse.json({ error: 'Invitation is no longer pending' }, { status: 400 })
        }

        updatedInvitation = await prisma.familyInvitation.update({
          where: { id: params.id },
          data: {
            status: 'DECLINED',
            declinedAt: new Date()
          }
        })

        // Log the activity (familyActivityLog model doesn't exist in schema)
        // TODO: Implement activity logging when schema is updated

        break

      case 'revoke':
        if (invitation.inviterId !== session.user.id) {
          return NextResponse.json({ error: 'Cannot revoke this invitation' }, { status: 403 })
        }

        if (invitation.status !== 'PENDING') {
          return NextResponse.json({ error: 'Can only revoke pending invitations' }, { status: 400 })
        }

        updatedInvitation = await prisma.familyInvitation.update({
          where: { id: params.id },
          data: {
            status: 'REVOKED',
            revokedAt: new Date(),
            revokedBy: session.user.id,
            revokeReason: data.revokeReason
          }
        })

        // Log the activity (familyActivityLog model doesn't exist in schema)
        // TODO: Implement activity logging when schema is updated

        break

      case 'resend':
        if (invitation.inviterId !== session.user.id) {
          return NextResponse.json({ error: 'Cannot resend this invitation' }, { status: 403 })
        }

        if (invitation.status !== 'PENDING') {
          return NextResponse.json({ error: 'Can only resend pending invitations' }, { status: 400 })
        }

        // Update timestamp for resend (remindersSent and lastReminderAt don't exist in schema)
        updatedInvitation = await prisma.familyInvitation.update({
          where: { id: params.id },
          data: {
            sentAt: new Date()
          }
        })

        // TODO: Send reminder email

        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      invitation: updatedInvitation,
      familyMember,
      message: `Invitation ${data.action}ed successfully`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
    }
    console.error('Error updating family invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/family/invitations/[id] - Delete invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invitation = await prisma.familyInvitation.findUnique({
      where: { id: params.id }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Only inviter can delete invitation
    if (invitation.inviterId !== session.user.id) {
      return NextResponse.json({ error: 'Cannot delete this invitation' }, { status: 403 })
    }

    await prisma.familyInvitation.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Invitation deleted successfully' })

  } catch (error) {
    console.error('Error deleting family invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
