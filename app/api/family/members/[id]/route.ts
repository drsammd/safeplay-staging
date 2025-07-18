
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const updateMemberSchema = z.object({
  displayName: z.string().optional(),
  relationship: z.string().optional(),
  familyRole: z.enum([
    'SPOUSE', 'GRANDPARENT', 'SIBLING', 'RELATIVE', 'FRIEND', 
    'NANNY', 'BABYSITTER', 'TEACHER', 'GUARDIAN', 'EMERGENCY_CONTACT', 'CUSTOM'
  ]).optional(),
  canViewAllChildren: z.boolean().optional(),
  canEditChildren: z.boolean().optional(),
  canCheckInOut: z.boolean().optional(),
  canViewPhotos: z.boolean().optional(),
  canViewVideos: z.boolean().optional(),
  canPurchaseMedia: z.boolean().optional(),
  canReceiveAlerts: z.boolean().optional(),
  canViewLocation: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  canManageFamily: z.boolean().optional(),
  canMakePayments: z.boolean().optional(),
  photoAccess: z.enum(['FULL', 'THUMBNAILS_ONLY', 'NO_ACCESS', 'APPROVED_ONLY', 'RECENT_ONLY']).optional(),
  videoAccess: z.enum(['FULL', 'THUMBNAILS_ONLY', 'NO_ACCESS', 'APPROVED_ONLY', 'RECENT_ONLY']).optional(),
  alertTypes: z.array(z.string()).optional(),
  allowedVenues: z.array(z.string()).optional(),
  timeRestrictions: z.object({
    allowedHours: z.array(z.object({
      start: z.string(),
      end: z.string(),
      days: z.array(z.number())
    })).optional(),
    timezone: z.string().optional()
  }).optional(),
  emergencyContact: z.boolean().optional(),
  emergencyContactOrder: z.number().optional(),
  notificationChannels: z.array(z.string()).optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  notificationFrequency: z.enum(['REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'EMERGENCY_ONLY', 'DISABLED']).optional(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED', 'PENDING_VERIFICATION', 'REMOVED']).optional(),
  isBlocked: z.boolean().optional(),
  blockReason: z.string().optional(),
  blockedFromChildren: z.array(z.string()).optional()
})

// GET /api/family/members/[id] - Get specific family member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const familyMember = await prisma.familyMember.findUnique({
      where: { id: params.id },
      include: {
        familyOwner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            verificationLevel: true
          }
        },
        childAccess: {
          include: {
            child: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhoto: true,
                dateOfBirth: true
              }
            }
          }
        },
        permissions: {
          where: { isActive: true }
        }
      }
    })

    if (!familyMember) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    // Check if user has access to view this family member
    const hasAccess = familyMember.familyOwnerId === session.user.id || 
                      familyMember.memberId === session.user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ familyMember })

  } catch (error) {
    console.error('Error fetching family member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/family/members/[id] - Update family member
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
    const data = updateMemberSchema.parse(body)

    const familyMember = await prisma.familyMember.findUnique({
      where: { id: params.id },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!familyMember) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    // Check permissions - only family owner can update, or member can update their own settings
    const isOwner = familyMember.familyOwnerId === session.user.id
    const isMember = familyMember.memberId === session.user.id

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Members can only update limited fields
    let updateData: any = {}
    
    if (isOwner) {
      // Family owner can update all fields
      updateData = {
        ...data,
        lastPermissionUpdate: new Date(),
        permissionUpdatedBy: session.user.id
      }

      // Handle blocking
      if (data.isBlocked !== undefined) {
        if (data.isBlocked && !familyMember.isBlocked) {
          updateData.blockedAt = new Date()
          updateData.blockedBy = session.user.id
        } else if (!data.isBlocked && familyMember.isBlocked) {
          updateData.blockedAt = null
          updateData.blockedBy = null
          updateData.blockReason = null
        }
      }
    } else if (isMember) {
      // Members can only update notification preferences and display name
      const allowedFields = [
        'displayName', 'notificationChannels', 'quietHoursStart', 
        'quietHoursEnd', 'notificationFrequency'
      ]
      
      updateData = Object.fromEntries(
        Object.entries(data).filter(([key]) => allowedFields.includes(key))
      )
    }

    // Store previous state for audit log
    const previousState = {
      familyRole: familyMember.familyRole,
      canViewAllChildren: familyMember.canViewAllChildren,
      canEditChildren: familyMember.canEditChildren,
      canCheckInOut: familyMember.canCheckInOut,
      canPurchaseMedia: familyMember.canPurchaseMedia,
      isBlocked: familyMember.isBlocked,
      status: familyMember.status
    }

    // Update family member
    const updatedFamilyMember = await prisma.familyMember.update({
      where: { id: params.id },
      data: updateData,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log the activity
    const actionType = data.isBlocked ? 'BLOCK_MEMBER' : 
                      data.isBlocked === false ? 'UNBLOCK_MEMBER' : 
                      'UPDATE_PERMISSIONS'

    // Log the activity - familyActivityLog model doesn't exist
    // await prisma.familyActivityLog.create({
    //   data: {
    //     familyOwnerId: familyMember.familyOwnerId,
    //     actorId: session.user.id,
    //     targetId: familyMember.memberId,
    //     actionType,
    //     resourceType: 'FAMILY_MEMBER',
    //     resourceId: familyMember.id,
    //     actionDescription: `Updated ${familyMember.member.name}'s permissions`,
    //     actionData: {
    //       changes: updateData,
    //       previousState,
    //       isOwnerUpdate: isOwner
    //     }
    //   }
    // })

    return NextResponse.json({
      familyMember: updatedFamilyMember,
      message: 'Family member updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
    }
    console.error('Error updating family member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/family/members/[id] - Remove family member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const reason = url.searchParams.get('reason') || 'Removed by family owner'

    const familyMember = await prisma.familyMember.findUnique({
      where: { id: params.id },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!familyMember) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    // Only family owner can remove members, or member can remove themselves
    const isOwner = familyMember.familyOwnerId === session.user.id
    const isMember = familyMember.memberId === session.user.id

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Remove child access records
      await tx.childAccess.deleteMany({
        where: { familyMemberId: params.id }
      })

      // Remove permissions
      await tx.familyPermission.deleteMany({
        where: { familyMemberId: params.id }
      })

      // Remove family member
      await tx.familyMember.delete({
        where: { id: params.id }
      })

      // Log the activity - familyActivityLog model doesn't exist
      // await tx.familyActivityLog.create({
      //   data: {
      //     familyOwnerId: familyMember.familyOwnerId,
      //     actorId: session.user.id,
      //     targetId: familyMember.memberId,
      //     actionType: 'REMOVE_MEMBER',
      //     resourceType: 'FAMILY_MEMBER',
      //     resourceId: familyMember.id,
      //     actionDescription: isMember ? 
      //       `${familyMember.member.name} left the family` :
      //       `Removed ${familyMember.member.name} from family`,
      //     actionData: {
      //       reason,
      //       removedByMember: isMember,
      //       familyRole: familyMember.familyRole
      //     }
      //   }
      // })
    })

    return NextResponse.json({
      message: 'Family member removed successfully'
    })

  } catch (error) {
    console.error('Error removing family member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
