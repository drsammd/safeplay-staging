
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const updatePermissionSchema = z.object({
  permissionLevel: z.enum(['NONE', 'READ', 'WRITE', 'ADMIN', 'EMERGENCY', 'CUSTOM']).optional(),
  canRead: z.boolean().optional(),
  canWrite: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canShare: z.boolean().optional(),
  canDownload: z.boolean().optional(),
  isActive: z.boolean().optional(),
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
  revokeReason: z.string().optional()
})

// GET /api/family/permissions/[id] - Get specific permission
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permission = await prisma.familyPermission.findUnique({
      where: { id: params.id },
      include: {
        familyMember: {
          include: {
            memberUser: {
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
        recipient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    // Check if user has access to view this permission
    const hasAccess = permission.grantedBy === session.user.id || 
                      permission.receivedBy === session.user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ permission })

  } catch (error) {
    console.error('Error fetching family permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/family/permissions/[id] - Update permission
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
    const data = updatePermissionSchema.parse(body)

    const permission = await prisma.familyPermission.findUnique({
      where: { id: params.id },
      include: {
        familyMember: {
          include: {
            memberUser: {
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

    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    // Only grantor can update permission
    if (permission.grantedBy !== session.user.id) {
      return NextResponse.json({ error: 'Only the grantor can update this permission' }, { status: 403 })
    }

    // Store previous state for audit log
    const previousState = {
      permissionLevel: permission.permissionLevel,
      canRead: permission.canRead,
      canWrite: permission.canWrite,
      canDelete: permission.canDelete,
      isActive: permission.isActive
    }

    // Prepare update data
    let updateData: any = { ...data }

    // Handle deactivation
    if (data.isActive === false && permission.isActive) {
      updateData.deactivatedAt = new Date()
      updateData.deactivatedBy = session.user.id
    }

    // Parse expiration date if provided
    if (data.expiresAt) {
      updateData.expiresAt = new Date(data.expiresAt)
    }

    // Update permission
    const updatedPermission = await prisma.familyPermission.update({
      where: { id: params.id },
      data: updateData,
      include: {
        familyMember: {
          include: {
            memberUser: {
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
    await prisma.familyActivityLog.create({
      data: {
        familyOwnerId: permission.familyMember.familyOwnerId,
        actorId: session.user.id,
        targetId: permission.receivedBy,
        actionType: 'UPDATE_PERMISSIONS',
        resourceType: 'PERMISSION',
        resourceId: permission.id,
        actionDescription: data.isActive === false ? 
          `Revoked ${permission.permissionType} permission from ${permission.familyMember.memberUser.name}` :
          `Updated ${permission.permissionType} permission for ${permission.familyMember.memberUser.name}`,
        actionData: {
          permissionType: permission.permissionType,
          changes: updateData,
          previousState,
          reason: data.revokeReason
        }
      }
    })

    return NextResponse.json({
      permission: updatedPermission,
      message: 'Permission updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
    }
    console.error('Error updating family permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/family/permissions/[id] - Delete permission
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
    const reason = url.searchParams.get('reason') || 'Permission revoked'

    const permission = await prisma.familyPermission.findUnique({
      where: { id: params.id },
      include: {
        familyMember: {
          include: {
            memberUser: {
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

    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    // Only grantor can delete permission
    if (permission.grantedBy !== session.user.id) {
      return NextResponse.json({ error: 'Only the grantor can delete this permission' }, { status: 403 })
    }

    // Log the activity before deletion
    await prisma.familyActivityLog.create({
      data: {
        familyOwnerId: permission.familyMember.familyOwnerId,
        actorId: session.user.id,
        targetId: permission.receivedBy,
        actionType: 'UPDATE_PERMISSIONS',
        resourceType: 'PERMISSION',
        resourceId: permission.id,
        actionDescription: `Deleted ${permission.permissionType} permission for ${permission.familyMember.memberUser.name}`,
        actionData: {
          permissionType: permission.permissionType,
          resourceType: permission.resourceType,
          resourceId: permission.resourceId,
          reason
        }
      }
    })

    // Delete permission
    await prisma.familyPermission.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Permission deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting family permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
