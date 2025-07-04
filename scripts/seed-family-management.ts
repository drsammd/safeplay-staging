// @ts-nocheck

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function seedFamilyManagement() {
  console.log('🏠 Starting Family Management System Seeding...')

  try {
    // Create test parent user if doesn't exist
    let parentUser = await prisma.user.findUnique({
      where: { email: 'parent@safeplay.com' }
    })

    if (!parentUser) {
      const hashedPassword = await bcrypt.hash('password123', 12)
      parentUser = await prisma.user.create({
        data: {
          email: 'parent@safeplay.com',
          name: 'Sarah Johnson',
          password: hashedPassword,
          role: 'PARENT',
          phone: '+1-555-0123',
          phoneVerified: true,
          identityVerified: true,
          verificationLevel: 'VERIFIED'
        }
      })
      console.log('✅ Created parent user:', parentUser.email)
    }

    // Create children for the parent
    const existingChildren = await prisma.child.findMany({
      where: { parentId: parentUser.id }
    })

    if (existingChildren.length === 0) {
      const children = await Promise.all([
        prisma.child.create({
          data: {
            firstName: 'Emma',
            lastName: 'Johnson',
            dateOfBirth: new Date('2015-03-15'),
            parentId: parentUser.id,
            status: 'ACTIVE',
            profilePhoto: 'https://media.istockphoto.com/id/1294600085/photo/portrait-of-a-happy-young-blonde-beautiful-smiling-girl-with-long-white-hair-model-in-a-red.jpg?s=170667a&w=0&k=20&c=JznQkFwfuHcWB-r4TzOZVSAVhnWaguJ-Lmcex3JJfwU='
          }
        }),
        prisma.child.create({
          data: {
            firstName: 'Lucas',
            lastName: 'Johnson',
            dateOfBirth: new Date('2017-08-22'),
            parentId: parentUser.id,
            status: 'ACTIVE',
            profilePhoto: 'https://img.freepik.com/premium-photo/caucasian-years-old-teen-boy-with-light-brown-hair-wearing-padded-jacket-playing-beach_1078199-6660.jpg'
          }
        }),
        prisma.child.create({
          data: {
            firstName: 'Sophia',
            lastName: 'Johnson',
            dateOfBirth: new Date('2019-12-10'),
            parentId: parentUser.id,
            status: 'ACTIVE',
            profilePhoto: 'https://i.pinimg.com/originals/4b/08/76/4b0876098266dd42fc343f960abf5ecf.jpg'
          }
        })
      ])
      console.log('✅ Created children:', children.map(c => `${c.firstName} ${c.lastName}`).join(', '))
    }

    // Create family member users
    const familyUsers = [
      {
        email: 'michael.johnson@email.com',
        name: 'Michael Johnson',
        role: 'SPOUSE',
        phone: '+1-555-0124'
      },
      {
        email: 'grandma.johnson@email.com',
        name: 'Margaret Johnson',
        role: 'GRANDPARENT',
        phone: '+1-555-0125'
      },
      {
        email: 'nanny.smith@email.com',
        name: 'Lisa Smith',
        role: 'NANNY',
        phone: '+1-555-0126'
      },
      {
        email: 'uncle.tom@email.com',
        name: 'Tom Wilson',
        role: 'RELATIVE',
        phone: '+1-555-0127'
      },
      {
        email: 'emergency.contact@email.com',
        name: 'Dr. Amanda Garcia',
        role: 'EMERGENCY_CONTACT',
        phone: '+1-555-0128'
      }
    ]

    const createdFamilyUsers = []
    for (const userData of familyUsers) {
      let user = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (!user) {
        const hashedPassword = await bcrypt.hash('password123', 12)
        user = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: hashedPassword,
            role: 'PARENT',
            phone: userData.phone,
            phoneVerified: true,
            verificationLevel: 'PHONE_VERIFIED'
          }
        })
        console.log('✅ Created family user:', user.email)
      }
      createdFamilyUsers.push({ ...user, familyRole: userData.role })
    }

    // Create family members with different permission sets
    const children = await prisma.child.findMany({
      where: { parentId: parentUser.id }
    })

    for (const familyUser of createdFamilyUsers) {
      // Check if family member already exists
      const existingMember = await prisma.familyMember.findUnique({
        where: {
          familyOwnerId_memberUserId: {
            familyOwnerId: parentUser.id,
            memberUserId: familyUser.id
          }
        }
      })

      if (!existingMember) {
        // Create family member with role-based permissions
        const permissions = getFamilyRolePermissions(familyUser.familyRole)
        
        const familyMember = await prisma.familyMember.create({
          data: {
            familyOwnerId: parentUser.id,
            memberUserId: familyUser.id,
            familyRole: familyUser.familyRole,
            displayName: familyUser.name,
            relationship: getFamilyRelationship(familyUser.familyRole),
            status: 'ACTIVE',
            joinedAt: new Date(),
            lastActiveAt: new Date(),
            ...permissions
          }
        })

        console.log(`✅ Created family member: ${familyUser.name} as ${familyUser.familyRole}`)

        // Create child access records based on role
        const childAccessPromises = children.map(child => {
          const childPermissions = getChildAccessPermissions(familyUser.familyRole)
          
          return prisma.childAccess.create({
            data: {
              childId: child.id,
              familyMemberId: familyMember.id,
              grantedBy: parentUser.id,
              accessedBy: familyUser.id,
              accessLevel: childPermissions.accessLevel,
              ...childPermissions.permissions,
              grantReason: `Initial access granted for ${familyUser.familyRole.toLowerCase()}`,
              consentGiven: true
            }
          })
        })

        await Promise.all(childAccessPromises)
        console.log(`✅ Granted child access to ${familyUser.name} for all children`)

        // Log the family member addition
        await prisma.familyActivityLog.create({
          data: {
            familyOwnerId: parentUser.id,
            actorId: parentUser.id,
            targetId: familyUser.id,
            actionType: 'INVITE_MEMBER',
            resourceType: 'FAMILY_MEMBER',
            resourceId: familyMember.id,
            actionDescription: `Added ${familyUser.name} as ${familyUser.familyRole.toLowerCase()}`,
            actionData: {
              familyRole: familyUser.familyRole,
              memberEmail: familyUser.email,
              initialSetup: true
            },
            impactLevel: 'MEDIUM',
            status: 'COMPLETED'
          }
        })
      }
    }

    // Create some sample invitations
    await createSampleInvitations(parentUser.id)

    // Create some sample family activity logs
    await createSampleActivityLogs(parentUser.id, createdFamilyUsers)

    console.log('🎉 Family Management System seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding family management system:', error)
    throw error
  }
}

function getFamilyRolePermissions(role: string) {
  const permissionSets = {
    SPOUSE: {
      canViewAllChildren: true,
      canEditChildren: true,
      canCheckInOut: true,
      canViewPhotos: true,
      canViewVideos: true,
      canPurchaseMedia: true,
      canReceiveAlerts: true,
      canViewLocation: true,
      canViewReports: true,
      canManageFamily: false,
      canMakePayments: true,
      photoAccess: 'FULL',
      videoAccess: 'FULL',
      emergencyContact: true,
      emergencyContactOrder: 1,
      notificationFrequency: 'REAL_TIME'
    },
    GRANDPARENT: {
      canViewAllChildren: true,
      canEditChildren: false,
      canCheckInOut: false,
      canViewPhotos: true,
      canViewVideos: true,
      canPurchaseMedia: false,
      canReceiveAlerts: true,
      canViewLocation: true,
      canViewReports: false,
      canManageFamily: false,
      canMakePayments: false,
      photoAccess: 'FULL',
      videoAccess: 'FULL',
      emergencyContact: true,
      emergencyContactOrder: 2,
      notificationFrequency: 'DAILY'
    },
    NANNY: {
      canViewAllChildren: true,
      canEditChildren: false,
      canCheckInOut: true,
      canViewPhotos: true,
      canViewVideos: false,
      canPurchaseMedia: false,
      canReceiveAlerts: true,
      canViewLocation: true,
      canViewReports: false,
      canManageFamily: false,
      canMakePayments: false,
      photoAccess: 'RECENT_ONLY',
      videoAccess: 'NO_ACCESS',
      emergencyContact: true,
      emergencyContactOrder: 3,
      notificationFrequency: 'REAL_TIME'
    },
    RELATIVE: {
      canViewAllChildren: false,
      canEditChildren: false,
      canCheckInOut: false,
      canViewPhotos: true,
      canViewVideos: true,
      canPurchaseMedia: false,
      canReceiveAlerts: true,
      canViewLocation: true,
      canViewReports: false,
      canManageFamily: false,
      canMakePayments: false,
      photoAccess: 'APPROVED_ONLY',
      videoAccess: 'APPROVED_ONLY',
      emergencyContact: false,
      notificationFrequency: 'WEEKLY'
    },
    EMERGENCY_CONTACT: {
      canViewAllChildren: false,
      canEditChildren: false,
      canCheckInOut: false,
      canViewPhotos: false,
      canViewVideos: false,
      canPurchaseMedia: false,
      canReceiveAlerts: true,
      canViewLocation: true,
      canViewReports: false,
      canManageFamily: false,
      canMakePayments: false,
      photoAccess: 'NO_ACCESS',
      videoAccess: 'NO_ACCESS',
      emergencyContact: true,
      emergencyContactOrder: 4,
      notificationFrequency: 'EMERGENCY_ONLY'
    }
  }

  return permissionSets[role as keyof typeof permissionSets] || permissionSets.RELATIVE
}

function getChildAccessPermissions(role: string) {
  const accessLevels = {
    SPOUSE: {
      accessLevel: 'FULL',
      permissions: {
        canViewProfile: true,
        canEditProfile: true,
        canViewLocation: true,
        canTrackLocation: true,
        canViewPhotos: true,
        canViewVideos: true,
        canDownloadMedia: true,
        canPurchaseMedia: true,
        canReceiveAlerts: true,
        canCheckInOut: true,
        canAuthorizePickup: true,
        canViewReports: true,
        canViewAnalytics: false,
        canManageEmergencyContacts: false,
        emergencyAlerts: true,
        routineAlerts: true,
        photoAlerts: true
      }
    },
    GRANDPARENT: {
      accessLevel: 'BASIC',
      permissions: {
        canViewProfile: true,
        canEditProfile: false,
        canViewLocation: true,
        canTrackLocation: false,
        canViewPhotos: true,
        canViewVideos: true,
        canDownloadMedia: false,
        canPurchaseMedia: false,
        canReceiveAlerts: true,
        canCheckInOut: false,
        canAuthorizePickup: false,
        canViewReports: false,
        canViewAnalytics: false,
        canManageEmergencyContacts: false,
        emergencyAlerts: true,
        routineAlerts: true,
        photoAlerts: true
      }
    },
    NANNY: {
      accessLevel: 'RESTRICTED',
      permissions: {
        canViewProfile: true,
        canEditProfile: false,
        canViewLocation: true,
        canTrackLocation: true,
        canViewPhotos: true,
        canViewVideos: false,
        canDownloadMedia: false,
        canPurchaseMedia: false,
        canReceiveAlerts: true,
        canCheckInOut: true,
        canAuthorizePickup: false,
        canViewReports: false,
        canViewAnalytics: false,
        canManageEmergencyContacts: false,
        emergencyAlerts: true,
        routineAlerts: true,
        photoAlerts: false
      }
    },
    RELATIVE: {
      accessLevel: 'BASIC',
      permissions: {
        canViewProfile: true,
        canEditProfile: false,
        canViewLocation: false,
        canTrackLocation: false,
        canViewPhotos: true,
        canViewVideos: true,
        canDownloadMedia: false,
        canPurchaseMedia: false,
        canReceiveAlerts: false,
        canCheckInOut: false,
        canAuthorizePickup: false,
        canViewReports: false,
        canViewAnalytics: false,
        canManageEmergencyContacts: false,
        emergencyAlerts: false,
        routineAlerts: false,
        photoAlerts: true
      }
    },
    EMERGENCY_CONTACT: {
      accessLevel: 'EMERGENCY_ONLY',
      permissions: {
        canViewProfile: true,
        canEditProfile: false,
        canViewLocation: true,
        canTrackLocation: false,
        canViewPhotos: false,
        canViewVideos: false,
        canDownloadMedia: false,
        canPurchaseMedia: false,
        canReceiveAlerts: true,
        canCheckInOut: false,
        canAuthorizePickup: false,
        canViewReports: false,
        canViewAnalytics: false,
        canManageEmergencyContacts: false,
        emergencyAlerts: true,
        routineAlerts: false,
        photoAlerts: false
      }
    }
  }

  return accessLevels[role as keyof typeof accessLevels] || accessLevels.RELATIVE
}

function getFamilyRelationship(role: string) {
  const relationships = {
    SPOUSE: 'Spouse',
    GRANDPARENT: 'Grandmother',
    NANNY: 'Nanny',
    RELATIVE: 'Uncle',
    EMERGENCY_CONTACT: 'Family Doctor'
  }
  return relationships[role as keyof typeof relationships] || 'Family Member'
}

async function createSampleInvitations(parentUserId: string) {
  // Create a pending invitation
  const pendingInvitation = await prisma.familyInvitation.create({
    data: {
      inviterUserId: parentUserId,
      inviteeEmail: 'friend@example.com',
      inviteeName: 'Jennifer Smith',
      familyRole: 'FRIEND',
      invitationMessage: 'Would love to have you as part of our SafePlay family network!',
      invitationToken: crypto.randomBytes(32).toString('hex'),
      status: 'PENDING',
      linkedChildrenIds: [], // Will be filled with actual child IDs
      permissionSet: {
        canViewAllChildren: false,
        canEditChildren: false,
        canCheckInOut: false,
        canViewPhotos: true,
        canViewVideos: false,
        canPurchaseMedia: false,
        canReceiveAlerts: false,
        canViewLocation: false,
        canViewReports: false,
        canManageFamily: false,
        canMakePayments: false,
        photoAccess: 'APPROVED_ONLY',
        videoAccess: 'NO_ACCESS',
        emergencyContact: false,
        notificationFrequency: 'DISABLED'
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      sentAt: new Date(),
      remindersSent: 1,
      lastReminderAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  })

  // Create an expired invitation
  await prisma.familyInvitation.create({
    data: {
      inviterUserId: parentUserId,
      inviteeEmail: 'expired@example.com',
      inviteeName: 'John Doe',
      familyRole: 'BABYSITTER',
      invitationMessage: 'Invitation for babysitting services',
      invitationToken: crypto.randomBytes(32).toString('hex'),
      status: 'EXPIRED',
      linkedChildrenIds: [],
      permissionSet: {},
      expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      sentAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
      remindersSent: 3
    }
  })

  console.log('✅ Created sample invitations')
}

async function createSampleActivityLogs(parentUserId: string, familyUsers: any[]) {
  const actionTypes = [
    'INVITE_MEMBER',
    'ACCEPT_INVITATION', 
    'UPDATE_PERMISSIONS',
    'GRANT_CHILD_ACCESS',
    'CHANGE_ROLE'
  ]

  const activities = []
  
  // Create activities for each family member
  for (let i = 0; i < familyUsers.length; i++) {
    const user = familyUsers[i]
    const actionsCount = Math.floor(Math.random() * 3) + 2 // 2-4 actions per user
    
    for (let j = 0; j < actionsCount; j++) {
      const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)]
      const daysAgo = Math.floor(Math.random() * 30) + 1 // 1-30 days ago
      
      activities.push({
        familyOwnerId: parentUserId,
        actorId: parentUserId,
        targetId: user.id,
        actionType,
        resourceType: getResourceTypeForAction(actionType),
        resourceId: crypto.randomUUID(),
        actionDescription: getActionDescription(actionType, user.name),
        actionData: {
          familyRole: user.familyRole,
          memberEmail: user.email,
          timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        },
        impactLevel: getImpactLevel(actionType),
        status: 'COMPLETED',
        timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      })
    }
  }

  // Sort by timestamp (newest first) and create in database
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  
  for (const activity of activities) {
    await prisma.familyActivityLog.create({ data: activity })
  }

  console.log(`✅ Created ${activities.length} sample activity log entries`)
}

function getResourceTypeForAction(actionType: string) {
  const resourceMap = {
    'INVITE_MEMBER': 'INVITATION',
    'ACCEPT_INVITATION': 'INVITATION',
    'UPDATE_PERMISSIONS': 'PERMISSION',
    'GRANT_CHILD_ACCESS': 'CHILD_ACCESS',
    'CHANGE_ROLE': 'ROLE'
  }
  return resourceMap[actionType as keyof typeof resourceMap] || 'FAMILY_MEMBER'
}

function getActionDescription(actionType: string, userName: string) {
  const descriptions = {
    'INVITE_MEMBER': `Invited ${userName} to join the family`,
    'ACCEPT_INVITATION': `${userName} accepted the family invitation`,
    'UPDATE_PERMISSIONS': `Updated permissions for ${userName}`,
    'GRANT_CHILD_ACCESS': `Granted ${userName} access to children`,
    'CHANGE_ROLE': `Changed role for ${userName}`
  }
  return descriptions[actionType as keyof typeof descriptions] || `Family action for ${userName}`
}

function getImpactLevel(actionType: string) {
  const impactMap = {
    'INVITE_MEMBER': 'MEDIUM',
    'ACCEPT_INVITATION': 'MEDIUM',
    'UPDATE_PERMISSIONS': 'HIGH',
    'GRANT_CHILD_ACCESS': 'HIGH',
    'CHANGE_ROLE': 'HIGH'
  }
  return impactMap[actionType as keyof typeof impactMap] || 'LOW'
}

// Run the seeding function
if (require.main === module) {
  seedFamilyManagement()
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export default seedFamilyManagement
