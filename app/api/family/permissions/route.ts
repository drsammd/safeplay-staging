
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const createPermissionSchema = z.object({
  familyMemberId: z.string(),
  permissionType: z.enum([
    'VIEW_CHILD', 'EDIT_CHILD', 'TRACK_LOCATION', 'VIEW_MEDIA', 'DOWNLOAD_MEDIA', 
    'PURCHASE_MEDIA', 'RECEIVE_ALERTS', 'CHECK_IN_OUT', 'AUTHORIZE_PICKUP', 
    'VIEW_REPORTS', 'MANAGE_FAMILY', 'MAKE_PAYMENTS', 'EMERGENCY_ACCESS', 'CUSTOM_PERMISSION'
  ]),
  resourceType: z.enum([
    'CHILD', 'PHOTO', 'VIDEO', 'REPORT', 'ALERT', 'VENUE', 'FAMILY', 'PAYMENT', 'EMERGENCY_CONTACT'
  ]),
  resourceId: z.string().optional(),
  permissionLevel: z.enum(['NONE', 'READ', 'WRITE', 'ADMIN', 'EMERGENCY', 'CUSTOM']),
  canRead: z.boolean().default(false),
  canWrite: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canShare: z.boolean().default(false),
  canDownload: z.boolean().default(false),
  expiresAt: z.string().optional(),
  timeRestrictions: z.object({
    allowedHours: z.array(z.object({
      start: z.string(),
      end: z.string(),
      days: z.array(z.number())
    })).optional(),
    timezone: z.string().optional()
  }).optional(),
  locationRestrictions: z.array(z.string()).optional(),
  contextRestrictions: z.object({}).optional(),
  usageLimit: z.number().optional(),
  grantReason: z.string().optional()
})

// GET /api/family/permissions - Get permissions for family members
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const familyMemberId = url.searchParams.get('familyMemberId')
    const permissionType = url.searchParams.get('permissionType')
    const resourceType = url.searchParams.get('resourceType')
    const resourceId = url.searchParams.get('resourceId')
    const isActive = url.searchParams.get('isActive')

    let whereClause: any = {
      OR: [
        { grantedBy: session.user.id },
        { receivedBy: session.user.id }
      ]
    }

    if (familyMemberId) {
      whereClause.familyMemberId = familyMemberId
    }

    if (permissionType) {
      whereClause.permissionType = permissionType.toUpperCase()
    }

    if (resourceType) {
      whereClause.resourceType = resourceType.toUpperCase()
    }

    if (resourceId) {
      whereClause.resourceId = resourceId
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    const permissions = await prisma.familyPermission.findMany({
      where: whereClause,
      include: {
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
        grantee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        grantedAt: 'desc'
      }
    })

    return NextResponse.json({ permissions })

  } catch (error) {
    console.error('Error fetching family permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/family/permissions - Create new permission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createPermissionSchema.parse(body)

    // Verify family member exists and user has permission to grant
    const familyMember = await prisma.familyMember.findUnique({
      where: { id: data.familyMemberId },
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

    // Only family owner can grant permissions
    if (familyMember.familyOwnerId !== session.user.id) {
      return NextResponse.json({ error: 'Only family owner can grant permissions' }, { status: 403 })
    }

    // Check if permission already exists
    const existingPermission = await prisma.familyPermission.findFirst({
      where: {
        familyMemberId: data.familyMemberId,
        permissionType: data.permissionType,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        isActive: true
      }
    })

    if (existingPermission) {
      return NextResponse.json({ error: 'Permission already exists' }, { status: 400 })
    }

    // Parse expiration date if provided
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null

    // Create permission
    const permission = await prisma.familyPermission.create({
      data: {
        familyMemberId: data.familyMemberId,
        granterId: session.user.id,
        granteeId: familyMember.memberId,
        grantedBy: session.user.id,
        receivedBy: familyMember.memberId,
        permissionType: data.permissionType,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        permissionLevel: data.permissionLevel,
        canRead: data.canRead,
        canWrite: data.canWrite,
        canDelete: data.canDelete,
        canShare: data.canShare || data.canDownload, // Map canDownload to canShare
        expiresAt,
        conditions: {
          timeRestrictions: data.timeRestrictions || {},
          locationRestrictions: data.locationRestrictions || [],
          contextRestrictions: data.contextRestrictions || {},
          usageLimit: data.usageLimit,
          grantReason: data.grantReason,
          canDownload: data.canDownload
        }
      },
      include: {
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

    // Log the activity - familyActivityLog model doesn't exist
    // await prisma.familyActivityLog.create({
    //   data: {
    //     familyOwnerId: familyMember.familyOwnerId,
    //     actorId: session.user.id,
    //     targetId: familyMember.memberId,
    //     actionType: 'UPDATE_PERMISSIONS',
    //     resourceType: 'PERMISSION',
    //     resourceId: permission.id,
    //     actionDescription: `Granted ${data.permissionType} permission to ${familyMember.member.name}`,
    //     actionData: {
    //       permissionType: data.permissionType,
    //       resourceType: data.resourceType,
    //       resourceId: data.resourceId,
    //       permissionLevel: data.permissionLevel,
    //       reason: data.grantReason
    //     }
    //   }
    // })

    return NextResponse.json({
      permission,
      message: 'Permission granted successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating family permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
