
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
    const hasAccess = invitation.inviterUserId === session.user.id || 
                      invitation.inviteeEmail === session.user.email ||
                      invitation.acceptedBy === session.user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Add linked children information
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
            acceptedBy: acceptedByUserId,
            acceptanceIpAddress: clientIp,
            acceptanceUserAgent: userAgent
          }
        })

        // Create family member relationship
        const permissionSet = invitation.permissionSet as any || {}
        familyMember = await prisma.familyMember.create({
          data: {
            familyId: invitation.inviterUserId,
            memberId: acceptedByUserId,
            familyRole: invitation.familyRole,
            displayName: invitation.inviteeName,
            invitationId: invitation.id,
            canViewAllChildren: permissionSet.canViewAllChildren || false,
            canEditChildren: permissionSet.canEditChildren || false,
            canCheckInOut: permissionSet.canCheckInOut || false,
            canViewPhotos: permissionSet.canViewPhotos !== false,
            canViewVideos: permissionSet.canViewVideos !== false,
            canPurchaseMedia: permissionSet.canPurchaseMedia || false,
            canReceiveAlerts: permissionSet.canReceiveAlerts !== false,
            canViewLocation: permissionSet.canViewLocation !== false,
            canViewReports: permissionSet.canViewReports || false,
            canManageFamily: permissionSet.canManageFamily || false,
            canMakePayments: permissionSet.canMakePayments || false,
            photoAccess: permissionSet.photoAccess || 'FULL',
            videoAccess: permissionSet.videoAccess || 'FULL',
            emergencyContact: permissionSet.emergencyContact || false,
            notificationFrequency: permissionSet.notificationFrequency || 'REAL_TIME'
          }
        })

        // Create child access records for linked children
        if (invitation.linkedChildrenIds && Array.isArray(invitation.linkedChildrenIds)) {
          const childAccessRecords = (invitation.linkedChildrenIds as string[]).map(childId => ({
            childId,
            familyMemberId: familyMember.id,
            grantedBy: invitation.inviterUserId,
            accessedBy: acceptedByUserId,
            accessLevel: 'BASIC' as const,
            canViewProfile: true,
            canViewLocation: permissionSet.canViewLocation !== false,
            canViewPhotos: permissionSet.canViewPhotos !== false,
            canViewVideos: permissionSet.canViewVideos !== false,
            canReceiveAlerts: permissionSet.canReceiveAlerts !== false,
            canCheckInOut: permissionSet.canCheckInOut || false,
            canPurchaseMedia: permissionSet.canPurchaseMedia || false
          }))

          await prisma.childAccess.createMany({
            data: childAccessRecords
          })
        }

        // Log the activity
        await prisma.familyActivityLog.create({
          data: {
            familyId: invitation.inviterUserId,
            actorId: acceptedByUserId,
            actionType: 'ACCEPT_INVITATION',
            resourceType: 'INVITATION',
            resourceId: invitation.id,
            actionDescription: `${session.user.name || session.user.email} accepted family invitation`,
            actionData: { 
              invitationId: invitation.id,
              familyRole: invitation.familyRole,
              linkedChildrenCount: Array.isArray(invitation.linkedChildrenIds) ? invitation.linkedChildrenIds.length : 0
            },
            ipAddress: clientIp,
            sessionId: session.user.id
          }
        })

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

        // Log the activity
        await prisma.familyActivityLog.create({
          data: {
            familyId: invitation.inviterUserId,
            actorId: session.user.id,
            actionType: 'DECLINE_INVITATION',
            resourceType: 'INVITATION',
            resourceId: invitation.id,
            actionDescription: `${session.user.name || session.user.email} declined family invitation`,
            ipAddress: clientIp,
            sessionId: session.user.id
          }
        })

        break

      case 'revoke':
        if (invitation.inviterUserId !== session.user.id) {
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

        // Log the activity
        await prisma.familyActivityLog.create({
          data: {
            familyId: invitation.inviterUserId,
            actorId: session.user.id,
            actionType: 'REVOKE_INVITATION',
            resourceType: 'INVITATION',
            resourceId: invitation.id,
            actionDescription: `Revoked family invitation to ${invitation.inviteeEmail}`,
            actionData: { 
              reason: data.revokeReason,
              inviteeEmail: invitation.inviteeEmail
            },
            ipAddress: clientIp,
            sessionId: session.user.id
          }
        })

        break

      case 'resend':
        if (invitation.inviterUserId !== session.user.id) {
          return NextResponse.json({ error: 'Cannot resend this invitation' }, { status: 403 })
        }

        if (invitation.status !== 'PENDING') {
          return NextResponse.json({ error: 'Can only resend pending invitations' }, { status: 400 })
        }

        // Update reminder count and timestamp
        updatedInvitation = await prisma.familyInvitation.update({
          where: { id: params.id },
          data: {
            remindersSent: invitation.remindersSent + 1,
            lastReminderAt: new Date()
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
    if (invitation.inviterUserId !== session.user.id) {
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
