
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
  notes: z.string().optional()
})

// GET /api/family/members - Get all family members for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const includeBlocked = url.searchParams.get('includeBlocked') === 'true'
    const role = url.searchParams.get('role')
    const status = url.searchParams.get('status') || 'ACTIVE'

    let whereClause: any = {
      OR: [
        { familyOwnerId: session.user.id },
        { memberUserId: session.user.id }
      ]
    }

    if (!includeBlocked) {
      whereClause.isBlocked = false
    }

    if (role) {
      whereClause.familyRole = role.toUpperCase()
    }

    if (status !== 'all') {
      whereClause.status = status.toUpperCase()
    }

    const familyMembers = await prisma.familyMember.findMany({
      where: whereClause,
      include: {
        familyOwner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        memberUser: {
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
                profilePhoto: true
              }
            }
          }
        },
        permissions: {
          where: { isActive: true }
        }
      },
      orderBy: [
        { emergencyContact: 'desc' },
        { emergencyContactOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // Separate into families I own vs families I'm a member of
    const ownedFamilies = familyMembers.filter(member => member.familyOwnerId === session.user.id)
    const memberOfFamilies = familyMembers.filter(member => member.memberUserId === session.user.id)

    return NextResponse.json({
      ownedFamilies,
      memberOfFamilies,
      total: familyMembers.length
    })

  } catch (error) {
    console.error('Error fetching family members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/family/members - Add family member (alternative to invitation system)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a parent
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can add family members' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateMemberSchema.extend({
      memberUserId: z.string(),
      familyRole: z.enum([
        'SPOUSE', 'GRANDPARENT', 'SIBLING', 'RELATIVE', 'FRIEND', 
        'NANNY', 'BABYSITTER', 'TEACHER', 'GUARDIAN', 'EMERGENCY_CONTACT', 'CUSTOM'
      ])
    }).parse(body)

    // Check if member user exists
    const memberUser = await prisma.user.findUnique({
      where: { id: data.memberUserId }
    })

    if (!memberUser) {
      return NextResponse.json({ error: 'Member user not found' }, { status: 404 })
    }

    // Check if family relationship already exists
    const existingMember = await prisma.familyMember.findUnique({
      where: {
        familyOwnerId_memberUserId: {
          familyOwnerId: session.user.id,
          memberUserId: data.memberUserId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'This person is already a family member' }, { status: 400 })
    }

    // Create family member
    const familyMember = await prisma.familyMember.create({
      data: {
        familyOwnerId: session.user.id,
        memberUserId: data.memberUserId,
        familyRole: data.familyRole,
        displayName: data.displayName || memberUser.name,
        relationship: data.relationship,
        canViewAllChildren: data.canViewAllChildren || false,
        canEditChildren: data.canEditChildren || false,
        canCheckInOut: data.canCheckInOut || false,
        canViewPhotos: data.canViewPhotos ?? true,
        canViewVideos: data.canViewVideos ?? true,
        canPurchaseMedia: data.canPurchaseMedia || false,
        canReceiveAlerts: data.canReceiveAlerts ?? true,
        canViewLocation: data.canViewLocation ?? true,
        canViewReports: data.canViewReports || false,
        canManageFamily: data.canManageFamily || false,
        canMakePayments: data.canMakePayments || false,
        photoAccess: data.photoAccess || 'FULL',
        videoAccess: data.videoAccess || 'FULL',
        alertTypes: data.alertTypes || [],
        allowedVenues: data.allowedVenues || [],
        timeRestrictions: data.timeRestrictions || {},
        emergencyContact: data.emergencyContact || false,
        emergencyContactOrder: data.emergencyContactOrder,
        notificationChannels: data.notificationChannels || [],
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
        notificationFrequency: data.notificationFrequency || 'REAL_TIME',
        notes: data.notes
      },
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

    // Log the activity
    await prisma.familyActivityLog.create({
      data: {
        familyOwnerId: session.user.id,
        actorId: session.user.id,
        targetId: data.memberUserId,
        actionType: 'INVITE_MEMBER',
        resourceType: 'FAMILY_MEMBER',
        resourceId: familyMember.id,
        actionDescription: `Added ${memberUser.name} as ${data.familyRole.toLowerCase()}`,
        actionData: { 
          familyRole: data.familyRole,
          memberEmail: memberUser.email
        }
      }
    })

    return NextResponse.json({
      familyMember,
      message: 'Family member added successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
    }
    console.error('Error adding family member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
