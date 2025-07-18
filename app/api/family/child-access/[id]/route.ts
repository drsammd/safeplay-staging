
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const updateChildAccessSchema = z.object({
  accessLevel: z.enum(['FULL', 'BASIC', 'EMERGENCY_ONLY', 'RESTRICTED', 'BLOCKED', 'CUSTOM']).optional(),
  canViewProfile: z.boolean().optional(),
  canEditProfile: z.boolean().optional(),
  canViewLocation: z.boolean().optional(),
  canTrackLocation: z.boolean().optional(),
  canViewPhotos: z.boolean().optional(),
  canViewVideos: z.boolean().optional(),
  canDownloadMedia: z.boolean().optional(),
  canPurchaseMedia: z.boolean().optional(),
  canReceiveAlerts: z.boolean().optional(),
  canCheckInOut: z.boolean().optional(),
  canAuthorizePickup: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  canViewAnalytics: z.boolean().optional(),
  canManageEmergencyContacts: z.boolean().optional(),
  alertTypes: z.array(z.string()).optional(),
  emergencyAlerts: z.boolean().optional(),
  routineAlerts: z.boolean().optional(),
  photoAlerts: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  blockReason: z.string().optional(),
  timeRestrictions: z.object({
    allowedHours: z.array(z.object({
      start: z.string(),
      end: z.string(),
      days: z.array(z.number())
    })).optional(),
    timezone: z.string().optional()
  }).optional(),
  venueRestrictions: z.array(z.string()).optional(),
  activityRestrictions: z.array(z.string()).optional(),
  isTemporary: z.boolean().optional(),
  temporaryStart: z.string().optional(),
  temporaryEnd: z.string().optional(),
  temporaryReason: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED', 'EXPIRED', 'PENDING']).optional(),
  expiresAt: z.string().optional(),
  revokeReason: z.string().optional()
})

// GET /api/family/child-access/[id] - Get specific child access
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const childAccess = await prisma.childAccess.findUnique({
      where: { id: params.id },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            dateOfBirth: true,
            status: true
          }
        },
        familyMember: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        grantor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        accessor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!childAccess) {
      return NextResponse.json({ error: 'Child access not found' }, { status: 404 })
    }

    // Check if user has permission to view this access
    const hasAccess = childAccess.grantedBy === session.user.id || 
                      childAccess.accessedBy === session.user.id ||
                      childAccess.familyMember.familyOwnerId === session.user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ childAccess })

  } catch (error) {
    console.error('Error fetching child access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/family/child-access/[id] - Update child access
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
    const data = updateChildAccessSchema.parse(body)

    const childAccess = await prisma.childAccess.findUnique({
      where: { id: params.id },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        familyMember: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!childAccess) {
      return NextResponse.json({ error: 'Child access not found' }, { status: 404 })
    }

    // Only grantor (usually parent) can update child access
    if (childAccess.grantedBy !== session.user.id) {
      return NextResponse.json({ error: 'Only the grantor can update child access' }, { status: 403 })
    }

    // Store previous state for audit log
    const previousState = {
      accessLevel: childAccess.accessLevel,
      canViewPhotos: childAccess.canViewPhotos,
      canViewVideos: childAccess.canViewVideos,
      canCheckInOut: childAccess.canCheckInOut,
      isBlocked: childAccess.isBlocked,
      status: childAccess.status
    }

    // Prepare update data
    let updateData: any = { ...data }

    // Handle blocking
    if (data.isBlocked !== undefined) {
      if (data.isBlocked && !childAccess.isBlocked) {
        updateData.blockedAt = new Date()
        updateData.blockedBy = session.user.id
        updateData.status = 'BLOCKED'
      } else if (!data.isBlocked && childAccess.isBlocked) {
        updateData.blockedAt = null
        updateData.blockedBy = null
        updateData.blockReason = null
        updateData.status = 'ACTIVE'
      }
    }

    // Parse dates if provided
    if (data.temporaryStart) {
      updateData.temporaryStart = new Date(data.temporaryStart)
    }
    if (data.temporaryEnd) {
      updateData.temporaryEnd = new Date(data.temporaryEnd)
    }
    if (data.expiresAt) {
      updateData.expiresAt = new Date(data.expiresAt)
    }

    // Remove string date fields from update data
    delete updateData.temporaryStart
    delete updateData.temporaryEnd
    delete updateData.expiresAt

    // Add parsed dates back
    if (data.temporaryStart) updateData.temporaryStart = new Date(data.temporaryStart)
    if (data.temporaryEnd) updateData.temporaryEnd = new Date(data.temporaryEnd)
    if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt)

    // Update child access
    const updatedChildAccess = await prisma.childAccess.update({
      where: { id: params.id },
      data: updateData,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        },
        familyMember: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Log the activity
    const actionType = data.isBlocked ? 'REVOKE_CHILD_ACCESS' : 'UPDATE_PERMISSIONS'
    
    // Log the activity - familyActivityLog model doesn't exist
    // await prisma.familyActivityLog.create({
    //   data: {
    //     familyOwnerId: childAccess.familyMember.familyOwnerId,
    //     actorId: session.user.id,
    //     targetId: childAccess.accessedBy,
    //     actionType,
    //     resourceType: 'CHILD_ACCESS',
    //     resourceId: childAccess.id,
    //     actionDescription: data.isBlocked ? 
    //       `Blocked ${childAccess.familyMember.member.name} from accessing ${childAccess.child.firstName} ${childAccess.child.lastName}` :
    //       `Updated ${childAccess.familyMember.member.name}'s access to ${childAccess.child.firstName} ${childAccess.child.lastName}`,
    //     actionData: {
    //       childId: childAccess.childId,
    //       changes: updateData,
    //       previousState,
    //       reason: data.blockReason || data.revokeReason
    //     }
    //   }
    // })

    return NextResponse.json({
      childAccess: updatedChildAccess,
      message: 'Child access updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
    }
    console.error('Error updating child access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/family/child-access/[id] - Remove child access
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
    const reason = url.searchParams.get('reason') || 'Access revoked by parent'

    const childAccess = await prisma.childAccess.findUnique({
      where: { id: params.id },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        familyMember: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!childAccess) {
      return NextResponse.json({ error: 'Child access not found' }, { status: 404 })
    }

    // Only grantor can remove child access
    if (childAccess.grantedBy !== session.user.id) {
      return NextResponse.json({ error: 'Only the grantor can remove child access' }, { status: 403 })
    }

    // Log the activity before deletion - familyActivityLog model doesn't exist
    // await prisma.familyActivityLog.create({
    //   data: {
    //     familyOwnerId: childAccess.familyMember.familyOwnerId,
    //     actorId: session.user.id,
    //     targetId: childAccess.accessedBy,
    //     actionType: 'REVOKE_CHILD_ACCESS',
    //     resourceType: 'CHILD_ACCESS',
    //     resourceId: childAccess.id,
    //     actionDescription: `Revoked ${childAccess.familyMember.member.name}'s access to ${childAccess.child.firstName} ${childAccess.child.lastName}`,
    //     actionData: {
    //       childId: childAccess.childId,
    //       reason,
    //       accessLevel: childAccess.accessLevel
    //     }
    //   }
    // })

    // Delete child access
    await prisma.childAccess.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Child access removed successfully'
    })

  } catch (error) {
    console.error('Error removing child access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
