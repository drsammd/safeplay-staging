
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

export const dynamic = "force-dynamic"

const acceptInvitationSchema = z.object({
  token: z.string(),
  createAccount: z.boolean().optional().default(false),
  accountData: z.object({
    name: z.string().min(1),
    password: z.string().min(6)
  }).optional(),
  existingUserId: z.string().optional()
})

// POST /api/family/invitations/accept-by-token - Accept invitation by token (for users without accounts)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = acceptInvitationSchema.parse(body)

    // Find invitation by token
    const invitation = await prisma.familyInvitation.findUnique({
      where: { invitationToken: data.token },
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
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 })
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invitation is no longer pending' }, { status: 400 })
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.familyInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      })
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    let acceptedByUserId: string

    if (data.createAccount && data.accountData) {
      // Create new account for the invitee
      const existingUser = await prisma.user.findUnique({
        where: { email: invitation.inviteeEmail }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Account already exists for this email' }, { status: 400 })
      }

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
    } else if (data.existingUserId) {
      // Verify existing user
      const existingUser = await prisma.user.findUnique({
        where: { 
          id: data.existingUserId,
          email: invitation.inviteeEmail
        }
      })

      if (!existingUser) {
        return NextResponse.json({ error: 'Invalid user credentials' }, { status: 400 })
      }

      acceptedByUserId = existingUser.id
    } else {
      return NextResponse.json({ error: 'Must provide account data or existing user ID' }, { status: 400 })
    }

    // Update invitation status
    const updatedInvitation = await prisma.familyInvitation.update({
      where: { id: invitation.id },
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
    const familyMember = await prisma.familyMember.create({
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
        actionDescription: `${invitation.inviteeEmail} accepted family invitation via token`,
        actionData: { 
          invitationId: invitation.id,
          familyRole: invitation.familyRole,
          linkedChildrenCount: Array.isArray(invitation.linkedChildrenIds) ? invitation.linkedChildrenIds.length : 0,
          createdAccount: data.createAccount
        },
        ipAddress: clientIp
      }
    })

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      familyMember,
      invitation: updatedInvitation
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
    }
    console.error('Error accepting invitation by token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
