
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
        { memberId: session.user.id }
      ]
    }

    if (!includeBlocked) {
      // Filter out blocked/suspended statuses instead of using non-existent isBlocked field
      whereClause.status = {
        notIn: ['SUSPENDED', 'REMOVED']
      }
    }

    if (role) {
      // Map familyRole to relationship since that's the actual field in schema
      whereClause.relationship = role.toUpperCase()
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
        { status: 'desc' },
        { joinedAt: 'asc' }
      ]
    })

    // Transform data to match UI expectations
    const transformMember = (member: any) => {
      const permissions = member.permissions || []
      const hasPermission = (type: string) => permissions.some((p: any) => p.permissionType === type)
      const isEmergencyContact = hasPermission('EMERGENCY_CONTACT')
      
      return {
        ...member,
        // Map relationship to familyRole for UI compatibility
        familyRole: member.relationship || 'OTHER',
        // Add display name (use member name as fallback)
        displayName: member.member?.name || member.member?.email?.split('@')[0],
        // Calculate permission flags from permissions array
        emergencyContact: isEmergencyContact,
        emergencyContactOrder: isEmergencyContact ? 1 : null,
        isBlocked: member.status === 'SUSPENDED' || member.status === 'REMOVED',
        canViewAllChildren: hasPermission('VIEW_ALL_CHILDREN') || hasPermission('FULL_ACCESS'),
        canEditChildren: hasPermission('EDIT_CHILDREN') || hasPermission('FULL_ACCESS'),
        canCheckInOut: hasPermission('CHECK_IN_OUT') || hasPermission('FULL_ACCESS'),
        canViewPhotos: hasPermission('VIEW_PHOTOS') || hasPermission('FULL_ACCESS'),
        canViewVideos: hasPermission('VIEW_VIDEOS') || hasPermission('FULL_ACCESS'),
        canPurchaseMedia: hasPermission('PURCHASE_MEDIA') || hasPermission('FULL_ACCESS'),
        canReceiveAlerts: hasPermission('RECEIVE_ALERTS') || isEmergencyContact,
        canViewLocation: hasPermission('VIEW_LOCATION') || hasPermission('FULL_ACCESS'),
        canViewReports: hasPermission('VIEW_REPORTS') || hasPermission('FULL_ACCESS'),
        canManageFamily: hasPermission('MANAGE_FAMILY') || hasPermission('FULL_ACCESS'),
        canMakePayments: hasPermission('MAKE_PAYMENTS') || hasPermission('FULL_ACCESS'),
        // Set default access levels
        photoAccess: hasPermission('FULL_ACCESS') ? 'FULL' : hasPermission('VIEW_PHOTOS') ? 'THUMBNAILS_ONLY' : 'NO_ACCESS',
        videoAccess: hasPermission('FULL_ACCESS') ? 'FULL' : hasPermission('VIEW_VIDEOS') ? 'THUMBNAILS_ONLY' : 'NO_ACCESS',
        alertTypes: isEmergencyContact ? ['EMERGENCY', 'SAFETY'] : [],
        allowedVenues: [],
        timeRestrictions: null,
        notificationChannels: ['EMAIL'],
        quietHoursStart: null,
        quietHoursEnd: null,
        notificationFrequency: isEmergencyContact ? 'REAL_TIME' : 'DAILY',
        lastActiveAt: member.joinedAt, // Fallback since we don't track last active yet
      }
    }

    const transformedMembers = familyMembers.map(transformMember)

    // Separate into families I own vs families I'm a member of
    const ownedFamilies = transformedMembers.filter(member => member.familyOwnerId === session.user.id)
    const memberOfFamilies = transformedMembers.filter(member => member.memberId === session.user.id)

    return NextResponse.json({
      ownedFamilies,
      memberOfFamilies,
      total: transformedMembers.length
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
      memberId: z.string(),
      familyRole: z.enum([
        'SPOUSE', 'GRANDPARENT', 'SIBLING', 'RELATIVE', 'FRIEND', 
        'NANNY', 'BABYSITTER', 'TEACHER', 'GUARDIAN', 'EMERGENCY_CONTACT', 'CUSTOM'
      ])
    }).parse(body)

    // Check if member user exists
    const memberUser = await prisma.user.findUnique({
      where: { id: data.memberId }
    })

    if (!memberUser) {
      return NextResponse.json({ error: 'Member user not found' }, { status: 404 })
    }

    // Check if family relationship already exists
    const existingMember = await prisma.familyMember.findUnique({
      where: {
        familyId_memberId: {
          familyId: session.user.id,
          memberId: data.memberId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'This person is already a family member' }, { status: 400 })
    }

    // Create family member - using only fields that exist in schema
    const familyMember = await prisma.familyMember.create({
      data: {
        familyId: session.user.id,
        familyOwnerId: session.user.id,
        memberId: data.memberId,
        relationship: data.familyRole, // Map familyRole to relationship enum
        notes: data.notes,
        invitedBy: session.user.id
      },
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

    // Log the activity (simplified for now) - familyActivityLog model doesn't exist
    try {
      // await prisma.familyActivityLog.create({
      //   data: {
      //     familyOwnerId: session.user.id,
      //     actorId: session.user.id,
      //     targetId: data.memberId,
      //     actionType: 'INVITE_MEMBER',
      //     actionDescription: `Added ${memberUser.name} as family member`,
      //     resourceId: familyMember.id
      //   }
      // })
    } catch (error) {
      console.log('Activity log creation failed:', error)
      // Don't fail the request if activity log fails
    }

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
