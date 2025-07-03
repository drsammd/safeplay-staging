
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const childAccessSchema = z.object({
  childId: z.string(),
  accessLevel: z.enum(['FULL', 'BASIC', 'EMERGENCY_ONLY', 'RESTRICTED', 'BLOCKED', 'CUSTOM']).default('BASIC'),
  canViewProfile: z.boolean().default(true),
  canEditProfile: z.boolean().default(false),
  canViewLocation: z.boolean().default(true),
  canTrackLocation: z.boolean().default(true),
  canViewPhotos: z.boolean().default(true),
  canViewVideos: z.boolean().default(true),
  canDownloadMedia: z.boolean().default(false),
  canPurchaseMedia: z.boolean().default(false),
  canReceiveAlerts: z.boolean().default(true),
  canCheckInOut: z.boolean().default(false),
  canAuthorizePickup: z.boolean().default(false),
  canViewReports: z.boolean().default(false),
  canViewAnalytics: z.boolean().default(false),
  canManageEmergencyContacts: z.boolean().default(false),
  alertTypes: z.array(z.string()).optional(),
  emergencyAlerts: z.boolean().default(true),
  routineAlerts: z.boolean().default(true),
  photoAlerts: z.boolean().default(true),
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
  isTemporary: z.boolean().default(false),
  temporaryStart: z.string().optional(),
  temporaryEnd: z.string().optional(),
  temporaryReason: z.string().optional(),
  grantReason: z.string().optional(),
  legalDocuments: z.array(z.string()).optional(),
  consentGiven: z.boolean().default(false),
  expiresAt: z.string().optional()
})

// GET /api/family/members/[id]/child-access - Get child access for family member
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
      where: { id: params.id }
    })

    if (!familyMember) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    // Check permissions
    const hasAccess = familyMember.familyOwnerId === session.user.id || 
                      familyMember.memberUserId === session.user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const childAccess = await prisma.childAccess.findMany({
      where: { familyMemberId: params.id },
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
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ childAccess })

  } catch (error) {
    console.error('Error fetching child access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/family/members/[id]/child-access - Grant child access to family member
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = childAccessSchema.parse(body)

    const familyMember = await prisma.familyMember.findUnique({
      where: { id: params.id },
      include: {
        memberUser: {
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

    // Only family owner can grant child access
    if (familyMember.familyOwnerId !== session.user.id) {
      return NextResponse.json({ error: 'Only family owner can grant child access' }, { status: 403 })
    }

    // Verify child belongs to the family owner
    const child = await prisma.child.findUnique({
      where: { 
        id: data.childId,
        parentId: session.user.id
      }
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found or access denied' }, { status: 404 })
    }

    // Check if access already exists
    const existingAccess = await prisma.childAccess.findUnique({
      where: {
        childId_familyMemberId: {
          childId: data.childId,
          familyMemberId: params.id
        }
      }
    })

    if (existingAccess) {
      return NextResponse.json({ error: 'Access already exists for this child' }, { status: 400 })
    }

    // Parse dates if provided
    const temporaryStart = data.temporaryStart ? new Date(data.temporaryStart) : null
    const temporaryEnd = data.temporaryEnd ? new Date(data.temporaryEnd) : null
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null

    // Create child access
    const childAccess = await prisma.childAccess.create({
      data: {
        childId: data.childId,
        familyMemberId: params.id,
        grantedBy: session.user.id,
        accessedBy: familyMember.memberUserId,
        accessLevel: data.accessLevel,
        canViewProfile: data.canViewProfile,
        canEditProfile: data.canEditProfile,
        canViewLocation: data.canViewLocation,
        canTrackLocation: data.canTrackLocation,
        canViewPhotos: data.canViewPhotos,
        canViewVideos: data.canViewVideos,
        canDownloadMedia: data.canDownloadMedia,
        canPurchaseMedia: data.canPurchaseMedia,
        canReceiveAlerts: data.canReceiveAlerts,
        canCheckInOut: data.canCheckInOut,
        canAuthorizePickup: data.canAuthorizePickup,
        canViewReports: data.canViewReports,
        canViewAnalytics: data.canViewAnalytics,
        canManageEmergencyContacts: data.canManageEmergencyContacts,
        alertTypes: data.alertTypes || [],
        emergencyAlerts: data.emergencyAlerts,
        routineAlerts: data.routineAlerts,
        photoAlerts: data.photoAlerts,
        timeRestrictions: data.timeRestrictions || {},
        venueRestrictions: data.venueRestrictions || [],
        activityRestrictions: data.activityRestrictions || [],
        isTemporary: data.isTemporary,
        temporaryStart,
        temporaryEnd,
        temporaryReason: data.temporaryReason,
        grantReason: data.grantReason,
        legalDocuments: data.legalDocuments || [],
        consentGiven: data.consentGiven,
        expiresAt
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        }
      }
    })

    // Log the activity
    await prisma.familyActivityLog.create({
      data: {
        familyOwnerId: familyMember.familyOwnerId,
        actorId: session.user.id,
        targetId: familyMember.memberUserId,
        actionType: 'GRANT_CHILD_ACCESS',
        resourceType: 'CHILD_ACCESS',
        resourceId: childAccess.id,
        actionDescription: `Granted ${familyMember.memberUser.name} access to ${child.firstName} ${child.lastName}`,
        actionData: {
          childId: data.childId,
          accessLevel: data.accessLevel,
          isTemporary: data.isTemporary,
          grantReason: data.grantReason
        }
      }
    })

    return NextResponse.json({
      childAccess,
      message: 'Child access granted successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
    }
    console.error('Error granting child access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
