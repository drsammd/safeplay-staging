// @ts-nocheck

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data in correct order to avoid foreign key constraints
  await prisma.venueAnalytics.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.trackingEvent.deleteMany();
  
  // Delete family-related data first
  try {
    await prisma.familyMember.deleteMany();
    await prisma.family.deleteMany();
  } catch (error) {
    console.log('⚠️ Family tables may not exist yet:', error.message);
  }
  
  // Delete other dependent data
  await prisma.child.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  
  // Finally delete users
  await prisma.user.deleteMany();

  console.log('🧹 Cleared existing data');

  // Hash passwords for demo accounts
  const hashedPassword = await bcrypt.hash('password123', 12);
  const hashedJohnPassword = await bcrypt.hash('johndoe123', 12);

  // Create Company Admin
  const companyAdmin = await prisma.user.create({
    data: {
      email: 'admin@mysafeplay.ai',
      password: hashedPassword,
      name: 'Sarah Mitchell',
      role: 'SUPER_ADMIN',
      phone: '+1 (555) 001-0001',
    },
  });

  // Create John Doe demo account
  const johnDoe = await prisma.user.create({
    data: {
      email: 'john@mysafeplay.ai',
      password: hashedJohnPassword,
      name: 'John Doe',
      role: 'PARENT',
      phone: '+1 (555) 001-0002',
    },
  });

  console.log('👨‍💼 Created company admin');

  // Create Venue Admins
  const venueAdmins = await Promise.all([
    prisma.user.create({
      data: {
        email: 'venue@mysafeplay.ai',
        password: hashedPassword,
        name: 'John Smith',
        role: 'VENUE_ADMIN',
        phone: '+1 (555) 002-0001',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah@happykids.com',
        password: hashedPassword,
        name: 'Sarah Johnson',
        role: 'VENUE_ADMIN',
        phone: '+1 (555) 002-0002',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike@funcity.com',
        password: hashedPassword,
        name: 'Mike Wilson',
        role: 'VENUE_ADMIN',
        phone: '+1 (555) 002-0003',
      },
    }),
  ]);

  console.log('🏢 Created venue admins');

  // Create Parents
  const parents = await Promise.all([
    prisma.user.create({
      data: {
        email: 'parent@mysafeplay.ai',
        password: hashedPassword,
        name: 'Emily Johnson',
        role: 'PARENT',
        phone: '+1 (555) 003-0001',
      },
    }),
    prisma.user.create({
      data: {
        email: 'david@email.com',
        password: hashedPassword,
        name: 'David Chen',
        role: 'PARENT',
        phone: '+1 (555) 003-0002',
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria@email.com',
        password: hashedPassword,
        name: 'Maria Martinez',
        role: 'PARENT',
        phone: '+1 (555) 003-0003',
      },
    }),
    prisma.user.create({
      data: {
        email: 'robert@email.com',
        password: hashedPassword,
        name: 'Robert Anderson',
        role: 'PARENT',
        phone: '+1 (555) 003-0004',
      },
    }),
  ]);

  console.log('👨‍👩‍👧‍👦 Created parents');

  // Create Venues
  const venues = await Promise.all([
    prisma.venue.create({
      data: {
        name: 'Adventure Playground',
        address: '123 Fun Street',
        city: 'Denver',
        state: 'CO',
        zipCode: '80202',
        phone: '+1 (555) 100-0001',
        email: 'info@adventureplayground.com',
        adminId: venueAdmins[0].id,
        capacity: 150,
        ageGroups: ['3-6', '7-10', '11-14'],
        operatingHours: {
          monday: { open: '09:00', close: '19:00' },
          tuesday: { open: '09:00', close: '19:00' },
          wednesday: { open: '09:00', close: '19:00' },
          thursday: { open: '09:00', close: '19:00' },
          friday: { open: '09:00', close: '21:00' },
          saturday: { open: '08:00', close: '21:00' },
          sunday: { open: '10:00', close: '18:00' },
        },
        cameraConfig: {
          cameras: [
            { id: 1, name: 'Main Entrance', zone: 'entrance', active: true },
            { id: 2, name: 'Play Area A', zone: 'play_area_a', active: true },
            { id: 3, name: 'Climbing Zone', zone: 'climbing', active: true },
            { id: 4, name: 'Ball Pit', zone: 'ball_pit', active: true },
            { id: 5, name: 'Exit Monitor', zone: 'exit', active: false },
          ],
        },
        alertSettings: {
          exitProximityThreshold: 5, // meters
          unauthorizedZoneAlert: true,
          confidenceThreshold: 85,
          responseTimeTarget: 120, // seconds
        },
      },
    }),
    prisma.venue.create({
      data: {
        name: 'Happy Kids Zone',
        address: '456 Play Avenue',
        city: 'Boulder',
        state: 'CO',
        zipCode: '80301',
        phone: '+1 (555) 100-0002',
        email: 'info@happykidszone.com',
        adminId: venueAdmins[1].id,
        capacity: 200,
        ageGroups: ['2-5', '6-9', '10-13'],
        operatingHours: {
          monday: { open: '08:00', close: '20:00' },
          tuesday: { open: '08:00', close: '20:00' },
          wednesday: { open: '08:00', close: '20:00' },
          thursday: { open: '08:00', close: '20:00' },
          friday: { open: '08:00', close: '22:00' },
          saturday: { open: '07:00', close: '22:00' },
          sunday: { open: '09:00', close: '19:00' },
        },
        cameraConfig: {
          cameras: [
            { id: 1, name: 'Front Desk', zone: 'entrance', active: true },
            { id: 2, name: 'Toddler Area', zone: 'toddler', active: true },
            { id: 3, name: 'Main Play', zone: 'main_play', active: true },
            { id: 4, name: 'Party Rooms', zone: 'party', active: true },
          ],
        },
        alertSettings: {
          exitProximityThreshold: 3,
          unauthorizedZoneAlert: true,
          confidenceThreshold: 90,
          responseTimeTarget: 90,
        },
      },
    }),
    prisma.venue.create({
      data: {
        name: 'Fun City',
        address: '789 Joy Boulevard',
        city: 'Colorado Springs',
        state: 'CO',
        zipCode: '80903',
        phone: '+1 (555) 100-0003',
        email: 'info@funcity.com',
        adminId: venueAdmins[2].id,
        capacity: 120,
        ageGroups: ['4-8', '9-12'],
        active: false, // This venue is currently inactive
        operatingHours: {
          monday: { open: '10:00', close: '18:00' },
          tuesday: { open: '10:00', close: '18:00' },
          wednesday: { open: '10:00', close: '18:00' },
          thursday: { open: '10:00', close: '18:00' },
          friday: { open: '10:00', close: '20:00' },
          saturday: { open: '09:00', close: '20:00' },
          sunday: { open: '11:00', close: '17:00' },
        },
        cameraConfig: {
          cameras: [
            { id: 1, name: 'Main Gate', zone: 'entrance', active: true },
            { id: 2, name: 'Activity Center', zone: 'activities', active: true },
            { id: 3, name: 'Snack Bar', zone: 'snack', active: true },
          ],
        },
        alertSettings: {
          exitProximityThreshold: 4,
          unauthorizedZoneAlert: false,
          confidenceThreshold: 80,
          responseTimeTarget: 150,
        },
      },
    }),
  ]);

  console.log('🏟️ Created venues');

  // Create Children
  const children = await Promise.all([
    // Emily Johnson's children
    prisma.child.create({
      data: {
        firstName: 'Emma',
        lastName: 'Johnson',
        dateOfBirth: new Date('2017-03-15'),
        profilePhoto: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        parentId: parents[0].id,
        status: 'ACTIVE',
        currentVenueId: venues[0].id,
        biometricId: 'bio_emma_001',
      },
    }),
    prisma.child.create({
      data: {
        firstName: 'Lucas',
        lastName: 'Johnson',
        dateOfBirth: new Date('2019-07-22'),
        profilePhoto: 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        parentId: parents[0].id,
        status: 'ACTIVE',
        biometricId: 'bio_lucas_001',
      },
    }),
    // David Chen's children
    prisma.child.create({
      data: {
        firstName: 'Michael',
        lastName: 'Chen',
        dateOfBirth: new Date('2018-01-10'),
        profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        parentId: parents[1].id,
        status: 'ACTIVE',
        currentVenueId: venues[0].id,
        biometricId: 'bio_michael_001',
      },
    }),
    // Maria Martinez's children
    prisma.child.create({
      data: {
        firstName: 'Sofia',
        lastName: 'Martinez',
        dateOfBirth: new Date('2016-11-05'),
        profilePhoto: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        parentId: parents[2].id,
        status: 'ACTIVE',
        currentVenueId: venues[1].id,
        biometricId: 'bio_sofia_001',
      },
    }),
    // Robert Anderson's children
    prisma.child.create({
      data: {
        firstName: 'Noah',
        lastName: 'Anderson',
        dateOfBirth: new Date('2017-09-18'),
        profilePhoto: 'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        parentId: parents[3].id,
        status: 'ACTIVE',
        biometricId: 'bio_noah_001',
      },
    }),
    // John Doe's children (john@mysafeplay.ai)
    prisma.child.create({
      data: {
        firstName: 'Olivia',
        lastName: 'Doe',
        dateOfBirth: new Date('2016-05-12'),
        profilePhoto: 'https://c8.alamy.com/comp/2K2B53C/serious-about-looking-ahead-profile-portrait-of-a-young-girl-against-a-white-background-2K2B53C.jpg',
        parentId: johnDoe.id,
        status: 'ACTIVE',
        currentVenueId: venues[0].id,
        biometricId: 'bio_olivia_001'
      },
    }),
    prisma.child.create({
      data: {
        firstName: 'Ethan',
        lastName: 'Doe',
        dateOfBirth: new Date('2018-11-08'),
        profilePhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        parentId: johnDoe.id,
        status: 'ACTIVE',
        currentVenueId: venues[0].id,
        biometricId: 'bio_ethan_001'
      },
    }),
    prisma.child.create({
      data: {
        firstName: 'Ava',
        lastName: 'Doe',
        dateOfBirth: new Date('2020-02-14'),
        profilePhoto: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        parentId: johnDoe.id,
        status: 'ACTIVE',
        biometricId: 'bio_ava_001'
      },
    }),
  ]);

  console.log('👶 Created children');

  // Create Family Members
  console.log('👨‍👩‍👧‍👦 Creating comprehensive family member data...');

  // Create additional users for family members
  const familyUsers = await Promise.all([
    // John Doe's family members
    prisma.user.create({
      data: {
        email: 'sarah.doe@email.com',
        password: hashedPassword,
        name: 'Sarah Doe',
        role: 'PARENT',
        phone: '+1 (555) 004-0001',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mary.doe@email.com',
        password: hashedPassword,
        name: 'Mary Doe',
        role: 'PARENT',
        phone: '+1 (555) 004-0002',
      },
    }),
    prisma.user.create({
      data: {
        email: 'michael.doe@email.com',
        password: hashedPassword,
        name: 'Michael Doe',
        role: 'PARENT',
        phone: '+1 (555) 004-0003',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jennifer.smith@email.com',
        password: hashedPassword,
        name: 'Jennifer Smith',
        role: 'PARENT',
        phone: '+1 (555) 004-0004',
      },
    }),
    prisma.user.create({
      data: {
        email: 'david.wilson@email.com',
        password: hashedPassword,
        name: 'David Wilson',
        role: 'PARENT',
        phone: '+1 (555) 004-0005',
      },
    }),
    // Emily Johnson's family members
    prisma.user.create({
      data: {
        email: 'alex.johnson@email.com',
        password: hashedPassword,
        name: 'Alex Johnson',
        role: 'PARENT',
        phone: '+1 (555) 004-0006',
      },
    }),
    prisma.user.create({
      data: {
        email: 'linda.johnson@email.com',
        password: hashedPassword,
        name: 'Linda Johnson',
        role: 'PARENT',
        phone: '+1 (555) 004-0007',
      },
    }),
    prisma.user.create({
      data: {
        email: 'robert.johnson@email.com',
        password: hashedPassword,
        name: 'Robert Johnson',
        role: 'PARENT',
        phone: '+1 (555) 004-0008',
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria.garcia@email.com',
        password: hashedPassword,
        name: 'Maria Garcia',
        role: 'PARENT',
        phone: '+1 (555) 004-0009',
      },
    }),
    prisma.user.create({
      data: {
        email: 'susan.brown@email.com',
        password: hashedPassword,
        name: 'Susan Brown',
        role: 'PARENT',
        phone: '+1 (555) 004-0010',
      },
    }),
  ]);

  console.log('👥 Created family member user accounts');

  // Map family users for easier reference
  const [sarahDoe, maryDoe, michaelDoe, jenniferSmith, davidWilson, 
         alexJohnson, lindaJohnson, robertJohnson, mariaGarcia, susanBrown] = familyUsers;

  // Create Family Member relationships
  const familyMembers = await Promise.all([
    // John Doe's family
    prisma.familyMember.create({
      data: {
        familyId: johnDoe.id,
        memberId: sarahDoe.id,
        relationship: 'SPOUSE',
        status: 'ACTIVE',
        notes: 'Wife and co-parent, full access to all children',
      },
    }),
    prisma.familyMember.create({
      data: {
        familyId: johnDoe.id,
        memberId: maryDoe.id,
        relationship: 'GRANDPARENT',
        status: 'ACTIVE',
        notes: 'Grandmother (John\'s mother), trusted caregiver',
      },
    }),
    prisma.familyMember.create({
      data: {
        familyId: johnDoe.id,
        memberId: michaelDoe.id,
        relationship: 'AUNT_UNCLE',
        status: 'ACTIVE',
        notes: 'Uncle (John\'s brother), emergency contact',
      },
    }),
    prisma.familyMember.create({
      data: {
        familyId: johnDoe.id,
        memberId: jenniferSmith.id,
        relationship: 'CAREGIVER',
        status: 'ACTIVE',
        notes: 'Trusted babysitter, authorized for pickup',
      },
    }),
    prisma.familyMember.create({
      data: {
        familyId: johnDoe.id,
        memberId: davidWilson.id,
        relationship: 'OTHER',
        status: 'ACTIVE',
        notes: 'Close family friend, emergency contact only',
      },
    }),

    // Emily Johnson's family (parent@mysafeplay.ai)
    prisma.familyMember.create({
      data: {
        familyId: parents[0].id,
        memberId: alexJohnson.id,
        relationship: 'SPOUSE',
        status: 'ACTIVE',
        notes: 'Spouse, full access to Emma and Lucas',
      },
    }),
    prisma.familyMember.create({
      data: {
        familyId: parents[0].id,
        memberId: lindaJohnson.id,
        relationship: 'GRANDPARENT',
        status: 'ACTIVE',
        notes: 'Grandmother, trusted caregiver',
      },
    }),
    prisma.familyMember.create({
      data: {
        familyId: parents[0].id,
        memberId: robertJohnson.id,
        relationship: 'GRANDPARENT',
        status: 'ACTIVE',
        notes: 'Grandfather, emergency contact',
      },
    }),
    prisma.familyMember.create({
      data: {
        familyId: parents[0].id,
        memberId: mariaGarcia.id,
        relationship: 'CAREGIVER',
        status: 'ACTIVE',
        notes: 'Professional nanny, authorized pickup',
      },
    }),
    prisma.familyMember.create({
      data: {
        familyId: parents[0].id,
        memberId: susanBrown.id,
        relationship: 'OTHER',
        status: 'ACTIVE',
        notes: 'Neighbor and family friend, emergency contact',
      },
    }),
  ]);

  console.log('👨‍👩‍👧‍👦 Created family member relationships');

  // Create Family Permissions
  const familyPermissions = await Promise.all([
    // John Doe's family permissions
    // Sarah Doe (spouse) - Full permissions
    prisma.familyPermission.create({
      data: {
        granterId: johnDoe.id,
        granteeId: sarahDoe.id,
        familyMemberId: familyMembers[0].id,
        permissionType: 'FULL_ACCESS',
        resourceType: 'ALL',
        isActive: true,
      },
    }),
    prisma.familyPermission.create({
      data: {
        granterId: johnDoe.id,
        granteeId: sarahDoe.id,
        familyMemberId: familyMembers[0].id,
        permissionType: 'PICKUP_AUTHORIZATION',
        resourceType: 'ALL',
        isActive: true,
      },
    }),
    prisma.familyPermission.create({
      data: {
        granterId: johnDoe.id,
        granteeId: sarahDoe.id,
        familyMemberId: familyMembers[0].id,
        permissionType: 'EMERGENCY_CONTACT',
        resourceType: 'ALL',
        isActive: true,
      },
    }),

    // Mary Doe (grandmother) - Limited permissions
    prisma.familyPermission.create({
      data: {
        granterId: johnDoe.id,
        granteeId: maryDoe.id,
        familyMemberId: familyMembers[1].id,
        permissionType: 'PICKUP_AUTHORIZATION',
        resourceType: 'CHILD',
        isActive: true,
      },
    }),
    prisma.familyPermission.create({
      data: {
        granterId: johnDoe.id,
        granteeId: maryDoe.id,
        familyMemberId: familyMembers[1].id,
        permissionType: 'VIEW_CHILD_INFO',
        resourceType: 'CHILD',
        isActive: true,
      },
    }),
    prisma.familyPermission.create({
      data: {
        granterId: johnDoe.id,
        granteeId: maryDoe.id,
        familyMemberId: familyMembers[1].id,
        permissionType: 'RECEIVE_ALERTS',
        resourceType: 'CHILD',
        isActive: true,
      },
    }),

    // Michael Doe (uncle) - Emergency contact only
    prisma.familyPermission.create({
      data: {
        granterId: johnDoe.id,
        granteeId: michaelDoe.id,
        familyMemberId: familyMembers[2].id,
        permissionType: 'EMERGENCY_CONTACT',
        resourceType: 'ALL',
        isActive: true,
      },
    }),
    prisma.familyPermission.create({
      data: {
        granterId: johnDoe.id,
        granteeId: michaelDoe.id,
        familyMemberId: familyMembers[2].id,
        permissionType: 'RECEIVE_ALERTS',
        resourceType: 'ALL',
        isActive: true,
      },
    }),

    // Jennifer Smith (babysitter) - Pickup and basic permissions
    prisma.familyPermission.create({
      data: {
        granterId: johnDoe.id,
        granteeId: jenniferSmith.id,
        familyMemberId: familyMembers[3].id,
        permissionType: 'PICKUP_AUTHORIZATION',
        resourceType: 'ALL',
        isActive: true,
      },
    }),
    prisma.familyPermission.create({
      data: {
        granterId: johnDoe.id,
        granteeId: jenniferSmith.id,
        familyMemberId: familyMembers[3].id,
        permissionType: 'VIEW_CHILD_INFO',
        resourceType: 'ALL',
        isActive: true,
      },
    }),

    // David Wilson (family friend) - Emergency contact only
    prisma.familyPermission.create({
      data: {
        granterId: johnDoe.id,
        granteeId: davidWilson.id,
        familyMemberId: familyMembers[4].id,
        permissionType: 'EMERGENCY_CONTACT',
        resourceType: 'ALL',
        isActive: true,
      },
    }),

    // Emily Johnson's family permissions
    // Alex Johnson (spouse) - Full permissions  
    prisma.familyPermission.create({
      data: {
        granterId: parents[0].id,
        granteeId: alexJohnson.id,
        familyMemberId: familyMembers[5].id,
        permissionType: 'FULL_ACCESS',
        resourceType: 'ALL',
        isActive: true,
      },
    }),
    prisma.familyPermission.create({
      data: {
        granterId: parents[0].id,
        granteeId: alexJohnson.id,
        familyMemberId: familyMembers[5].id,
        permissionType: 'PICKUP_AUTHORIZATION',
        resourceType: 'ALL',
        isActive: true,
      },
    }),

    // Linda Johnson (grandmother) - Pickup and view permissions
    prisma.familyPermission.create({
      data: {
        granterId: parents[0].id,
        granteeId: lindaJohnson.id,
        familyMemberId: familyMembers[6].id,
        permissionType: 'PICKUP_AUTHORIZATION',
        resourceType: 'ALL',
        isActive: true,
      },
    }),
    prisma.familyPermission.create({
      data: {
        granterId: parents[0].id,
        granteeId: lindaJohnson.id,
        familyMemberId: familyMembers[6].id,
        permissionType: 'VIEW_CHILD_INFO',
        resourceType: 'ALL',
        isActive: true,
      },
    }),

    // Robert Johnson (grandfather) - Emergency contact
    prisma.familyPermission.create({
      data: {
        granterId: parents[0].id,
        granteeId: robertJohnson.id,
        familyMemberId: familyMembers[7].id,
        permissionType: 'EMERGENCY_CONTACT',
        resourceType: 'ALL',
        isActive: true,
      },
    }),

    // Maria Garcia (nanny) - Full caregiver permissions
    prisma.familyPermission.create({
      data: {
        granterId: parents[0].id,
        granteeId: mariaGarcia.id,
        familyMemberId: familyMembers[8].id,
        permissionType: 'PICKUP_AUTHORIZATION',
        resourceType: 'ALL',
        isActive: true,
      },
    }),
    prisma.familyPermission.create({
      data: {
        granterId: parents[0].id,
        granteeId: mariaGarcia.id,
        familyMemberId: familyMembers[8].id,
        permissionType: 'VIEW_CHILD_INFO',
        resourceType: 'ALL',
        isActive: true,
      },
    }),
    prisma.familyPermission.create({
      data: {
        granterId: parents[0].id,
        granteeId: mariaGarcia.id,
        familyMemberId: familyMembers[8].id,
        permissionType: 'RECEIVE_ALERTS',
        resourceType: 'ALL',
        isActive: true,
      },
    }),

    // Susan Brown (neighbor) - Emergency contact only
    prisma.familyPermission.create({
      data: {
        granterId: parents[0].id,
        granteeId: susanBrown.id,
        familyMemberId: familyMembers[9].id,
        permissionType: 'EMERGENCY_CONTACT',
        resourceType: 'ALL',
        isActive: true,
      },
    }),
  ]);

  console.log('🔐 Created family permissions');

  // Create Child Access permissions
  const childAccess = await Promise.all([
    // John Doe's children access
    // Sarah Doe (spouse) - Full access to all children
    prisma.childAccess.create({
      data: {
        childId: children[5].id, // Olivia Doe
        granterId: johnDoe.id,
        granteeId: sarahDoe.id,
        familyMemberId: familyMembers[0].id,
        accessLevel: 'FULL_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: true,
          canReceiveAlerts: true,
          emergencyContact: true,
        },
        isActive: true,
      },
    }),
    prisma.childAccess.create({
      data: {
        childId: children[6].id, // Ethan Doe
        granterId: johnDoe.id,
        granteeId: sarahDoe.id,
        familyMemberId: familyMembers[0].id,
        accessLevel: 'FULL_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: true,
          canReceiveAlerts: true,
          emergencyContact: true,
        },
        isActive: true,
      },
    }),
    prisma.childAccess.create({
      data: {
        childId: children[7].id, // Ava Doe
        granterId: johnDoe.id,
        granteeId: sarahDoe.id,
        familyMemberId: familyMembers[0].id,
        accessLevel: 'FULL_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: true,
          canReceiveAlerts: true,
          emergencyContact: true,
        },
        isActive: true,
      },
    }),

    // Mary Doe (grandmother) - Limited access to Olivia and Ethan
    prisma.childAccess.create({
      data: {
        childId: children[5].id, // Olivia Doe
        granterId: johnDoe.id,
        granteeId: maryDoe.id,
        familyMemberId: familyMembers[1].id,
        accessLevel: 'LIMITED_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: false,
          canReceiveAlerts: true,
          emergencyContact: false,
        },
        isActive: true,
      },
    }),
    prisma.childAccess.create({
      data: {
        childId: children[6].id, // Ethan Doe
        granterId: johnDoe.id,
        granteeId: maryDoe.id,
        familyMemberId: familyMembers[1].id,
        accessLevel: 'LIMITED_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: false,
          canReceiveAlerts: true,
          emergencyContact: false,
        },
        isActive: true,
      },
    }),

    // Michael Doe (uncle) - Emergency access to Ava
    prisma.childAccess.create({
      data: {
        childId: children[7].id, // Ava Doe
        granterId: johnDoe.id,
        granteeId: michaelDoe.id,
        familyMemberId: familyMembers[2].id,
        accessLevel: 'EMERGENCY_ONLY',
        permissions: {
          canPickup: true,
          canViewLocation: false,
          canViewPhotos: false,
          canReceiveAlerts: true,
          emergencyContact: true,
        },
        isActive: true,
      },
    }),

    // Jennifer Smith (babysitter) - Full access to all children
    prisma.childAccess.create({
      data: {
        childId: children[5].id, // Olivia Doe
        granterId: johnDoe.id,
        granteeId: jenniferSmith.id,
        familyMemberId: familyMembers[3].id,
        accessLevel: 'FULL_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: false,
          canReceiveAlerts: true,
          emergencyContact: false,
        },
        isActive: true,
      },
    }),
    prisma.childAccess.create({
      data: {
        childId: children[6].id, // Ethan Doe
        granterId: johnDoe.id,
        granteeId: jenniferSmith.id,
        familyMemberId: familyMembers[3].id,
        accessLevel: 'FULL_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: false,
          canReceiveAlerts: true,
          emergencyContact: false,
        },
        isActive: true,
      },
    }),
    prisma.childAccess.create({
      data: {
        childId: children[7].id, // Ava Doe
        granterId: johnDoe.id,
        granteeId: jenniferSmith.id,
        familyMemberId: familyMembers[3].id,
        accessLevel: 'FULL_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: false,
          canReceiveAlerts: true,
          emergencyContact: false,
        },
        isActive: true,
      },
    }),

    // Emily Johnson's children access
    // Alex Johnson (spouse) - Full access to Emma and Lucas
    prisma.childAccess.create({
      data: {
        childId: children[0].id, // Emma Johnson
        granterId: parents[0].id,
        granteeId: alexJohnson.id,
        familyMemberId: familyMembers[5].id,
        accessLevel: 'FULL_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: true,
          canReceiveAlerts: true,
          emergencyContact: true,
        },
        isActive: true,
      },
    }),
    prisma.childAccess.create({
      data: {
        childId: children[1].id, // Lucas Johnson
        granterId: parents[0].id,
        granteeId: alexJohnson.id,
        familyMemberId: familyMembers[5].id,
        accessLevel: 'FULL_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: true,
          canReceiveAlerts: true,
          emergencyContact: true,
        },
        isActive: true,
      },
    }),

    // Linda Johnson (grandmother) - Limited access to both children
    prisma.childAccess.create({
      data: {
        childId: children[0].id, // Emma Johnson
        granterId: parents[0].id,
        granteeId: lindaJohnson.id,
        familyMemberId: familyMembers[6].id,
        accessLevel: 'LIMITED_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: true,
          canReceiveAlerts: true,
          emergencyContact: false,
        },
        isActive: true,
      },
    }),
    prisma.childAccess.create({
      data: {
        childId: children[1].id, // Lucas Johnson
        granterId: parents[0].id,
        granteeId: lindaJohnson.id,
        familyMemberId: familyMembers[6].id,
        accessLevel: 'LIMITED_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: true,
          canReceiveAlerts: true,
          emergencyContact: false,
        },
        isActive: true,
      },
    }),

    // Maria Garcia (nanny) - Full access to both children
    prisma.childAccess.create({
      data: {
        childId: children[0].id, // Emma Johnson
        granterId: parents[0].id,
        granteeId: mariaGarcia.id,
        familyMemberId: familyMembers[8].id,
        accessLevel: 'FULL_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: false,
          canReceiveAlerts: true,
          emergencyContact: false,
        },
        isActive: true,
      },
    }),
    prisma.childAccess.create({
      data: {
        childId: children[1].id, // Lucas Johnson
        granterId: parents[0].id,
        granteeId: mariaGarcia.id,
        familyMemberId: familyMembers[8].id,
        accessLevel: 'FULL_ACCESS',
        permissions: {
          canPickup: true,
          canViewLocation: true,
          canViewPhotos: false,
          canReceiveAlerts: true,
          emergencyContact: false,
        },
        isActive: true,
      },
    }),
  ]);

  console.log('👶 Created child access permissions');
  console.log('✅ Family member data creation complete!');
  console.log(`   👥 Family members created: ${familyMembers.length}`);
  console.log(`   🔐 Family permissions created: ${familyPermissions.length}`);
  console.log(`   👶 Child access records created: ${childAccess.length}`);

  // Create Tracking Events
  const now = new Date();
  const trackingEvents = [];

  for (const child of children) {
    // Create check-in events for children who are currently checked in (have currentVenueId)
    if (child.currentVenueId) {
      trackingEvents.push(
        prisma.trackingEvent.create({
          data: {
            type: 'ENTRY',
            timestamp: new Date(now.getTime() - Math.random() * 4 * 60 * 60 * 1000), // Random time in last 4 hours
            location: { x: 10, y: 15, zone: 'entrance' },
            confidence: 95 + Math.random() * 5,
            cameraId: 'camera_001',
            childId: child.id,
            venueId: child.currentVenueId!,
            metadata: { entryMethod: 'facial_recognition', parentNotified: true },
          },
        }),
      );

      // Add some movement events
      for (let i = 0; i < 3; i++) {
        trackingEvents.push(
          prisma.trackingEvent.create({
            data: {
              type: 'MOVEMENT',
              timestamp: new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000),
              location: {
                x: Math.floor(Math.random() * 100),
                y: Math.floor(Math.random() * 100),
                zone: ['play_area_a', 'climbing', 'ball_pit'][Math.floor(Math.random() * 3)],
              },
              confidence: 85 + Math.random() * 15,
              cameraId: `camera_00${Math.floor(Math.random() * 3) + 1}`,
              childId: child.id,
              venueId: child.currentVenueId!,
            },
          }),
        );
      }
    }

    // Add historical check-out events
    trackingEvents.push(
      prisma.trackingEvent.create({
        data: {
          type: 'EXIT',
          timestamp: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
          location: { x: 10, y: 15, zone: 'exit' },
          confidence: 98,
          cameraId: 'camera_exit',
          childId: child.id,
          venueId: venues[Math.floor(Math.random() * venues.length)].id,
          metadata: { exitMethod: 'facial_recognition', parentNotified: true },
        },
      }),
    );
  }

  await Promise.all(trackingEvents);
  console.log('📍 Created tracking events');

  // Create Memories
  const memories = await Promise.all([
    // Emma's memories
    prisma.memory.create({
      data: {
        type: 'PHOTO',
        fileName: 'emma_playground_001.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        originalUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=100',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        capturedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        price: 2.99,
        status: 'AVAILABLE',
        childId: children[0].id,
        venueId: venues[0].id,
      },
    }),
    prisma.memory.create({
      data: {
        type: 'VIDEO',
        fileName: 'emma_swing_video.mp4',
        fileUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        originalUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        capturedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        price: 9.99,
        status: 'AVAILABLE',
        childId: children[0].id,
        venueId: venues[0].id,
      },
    }),
    // Lucas's memories (purchased)
    prisma.memory.create({
      data: {
        type: 'PHOTO',
        fileName: 'lucas_ballpit_002.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        originalUrl: 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=100',
        thumbnailUrl: 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        capturedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        price: 2.99,
        status: 'PURCHASED',
        childId: children[1].id,
        venueId: venues[1].id,
        purchaserId: parents[0].id,
        purchasedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      },
    }),
    // Michael's memories
    prisma.memory.create({
      data: {
        type: 'PHOTO',
        fileName: 'michael_climbing_003.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        originalUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=100',
        thumbnailUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        capturedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
        price: 2.99,
        status: 'PURCHASED',
        childId: children[2].id,
        venueId: venues[0].id,
        purchaserId: parents[1].id,
        purchasedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    }),
    // Sofia's memories
    prisma.memory.create({
      data: {
        type: 'VIDEO',
        fileName: 'sofia_party_dance.mp4',
        fileUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        originalUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        capturedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        price: 9.99,
        status: 'AVAILABLE',
        childId: children[3].id,
        venueId: venues[1].id,
      },
    }),
    // John Doe's children memories
    // Olivia's memories
    prisma.memory.create({
      data: {
        type: 'PHOTO',
        fileName: 'olivia_climbing_adventure.jpg',
        fileUrl: 'https://i.pinimg.com/originals/b1/97/41/b197412fa22de84f8c55d5a0cd0aeee2.jpg',
        originalUrl: 'https://i.ytimg.com/vi/Jpnmwk4K36s/maxresdefault.jpg?sqp=-oaymwEmCIAKENAF8quKqQMa8AEB-AH-CYAC0AWKAgwIABABGFkgZSgsMA8=&rs=AOn4CLB2jsdvR1A81cK6w2saDjVTTquIHA',
        thumbnailUrl: 'https://i.pinimg.com/736x/24/37/d3/2437d36c8732fb95061be94fe6c9a804.jpg',
        capturedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        price: 2.99,
        status: 'PURCHASED',
        childId: children[5].id, // Olivia
        venueId: venues[0].id,
        purchaserId: johnDoe.id,
        purchasedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      },
    }),
    prisma.memory.create({
      data: {
        type: 'VIDEO',
        fileName: 'olivia_playground_fun.mp4',
        fileUrl: 'https://media.gettyimages.com/id/158990601/vector/children-playing-on-playground.jpg?s=1024x1024&w=gi&k=20&c=kq19P7kx0JMb_5HxuvQAK11nFGzGMxC6BMzREdZGbTA=',
        originalUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        thumbnailUrl: 'https://i.pinimg.com/736x/ca/06/2a/ca062a0bcd1387cb9083613c67e54512.jpg',
        capturedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        price: 9.99,
        status: 'AVAILABLE',
        childId: children[5].id, // Olivia
        venueId: venues[0].id,
      },
    }),
    // Ethan's memories
    prisma.memory.create({
      data: {
        type: 'PHOTO',
        fileName: 'ethan_ballpit_joy.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        originalUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=100',
        thumbnailUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        capturedAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
        price: 2.99,
        status: 'AVAILABLE',
        childId: children[6].id, // Ethan
        venueId: venues[0].id,
      },
    }),
    prisma.memory.create({
      data: {
        type: 'PHOTO',
        fileName: 'ethan_interactive_game.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        originalUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=100',
        thumbnailUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        capturedAt: new Date(now.getTime() - 90 * 60 * 1000), // 90 minutes ago
        price: 2.99,
        status: 'PURCHASED',
        childId: children[6].id, // Ethan
        venueId: venues[0].id,
        purchaserId: johnDoe.id,
        purchasedAt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
      },
    }),
    // Ava's memories (from previous visit)
    prisma.memory.create({
      data: {
        type: 'PHOTO',
        fileName: 'ava_toddler_play.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        originalUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=100',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        capturedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        price: 2.99,
        status: 'PURCHASED',
        childId: children[7].id, // Ava
        venueId: venues[1].id,
        purchaserId: johnDoe.id,
        purchasedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 2 days ago + 1 hour
      },
    }),
  ]);

  console.log('📸 Created memories');

  // Create Alerts
  const alerts = await Promise.all([
    // Active alert for Sofia (near exit)
    prisma.alert.create({
      data: {
        type: 'CHILD_MISSING',
        title: 'Child Near Exit Zone',
        description: 'Sofia Martinez detected near unsupervised exit area',
        severity: 3,
        status: 'ACTIVE',
        childId: children[3].id,
        venueId: venues[1].id,
      },
    }),
    // Active alert for Noah (exit detection)
    prisma.alert.create({
      data: {
        type: 'CHILD_MISSING',
        title: 'Exit Zone Detection',
        description: 'Noah Anderson detected at main entrance without parent',
        severity: 2,
        status: 'ACTIVE',
        childId: children[4].id,
        venueId: venues[0].id,
      },
    }),
    // Resolved alert
    prisma.alert.create({
      data: {
        type: 'UNAUTHORIZED_PERSON',
        title: 'Unauthorized Zone Access',
        description: 'Emma Johnson detected in restricted staff area',
        severity: 4,
        status: 'RESOLVED',
        childId: children[0].id,
        venueId: venues[0].id,
        resolvedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        resolvedBy: venueAdmins[0].id,
        resolution: 'Child safely escorted back to play area. Parent notified.',
      },
    }),
  ]);

  console.log('🚨 Created alerts');

  // Create Analytics Data
  const analyticsData = [];
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  for (const venue of venues) {
    for (const date of last30Days) {
      analyticsData.push(
        prisma.venueAnalytics.create({
          data: {
            date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            venueId: venue.id,
            totalCheckIns: Math.floor(Math.random() * 50) + 10,
            totalCheckOuts: Math.floor(Math.random() * 50) + 8,
            peakOccupancy: Math.floor(Math.random() * venue.capacity * 0.8) + 10,
            averageStayTime: Math.floor(Math.random() * 180) + 60, // 60-240 minutes
            memoryRevenue: Math.floor(Math.random() * 200) + 50,
            photosSold: Math.floor(Math.random() * 20) + 5,
            videosSold: Math.floor(Math.random() * 8) + 1,
            alertsGenerated: Math.floor(Math.random() * 5),
            emergencyAlerts: Math.random() > 0.9 ? 1 : 0,
            avgResponseTime: Math.floor(Math.random() * 120) + 30, // 30-150 seconds
          },
        }),
      );
    }
  }

  await Promise.all(analyticsData);
  console.log('📊 Created analytics data');

  // Initialize Email Automation System
  try {
    console.log('📧 Initializing Email Automation System...');
    const { emailAutomationInit } = await import('../lib/services/email-automation-init');
    
    const initResult = await emailAutomationInit.initializeEmailAutomation(companyAdmin.id);
    
    if (initResult.success) {
      console.log(`✅ Email Automation System initialized successfully!`);
      console.log(`   📧 Templates created: ${initResult.templatesCreated}`);
      console.log(`   🤖 Automation rules created: ${initResult.rulesCreated}`);
    } else {
      console.log('⚠️ Email Automation System initialization completed with warnings:');
      initResult.errors.forEach(error => console.log(`   - ${error}`));
    }
  } catch (error) {
    console.error('❌ Failed to initialize Email Automation System:', error);
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n🔑 Demo Account Credentials:');
  console.log('Company Admin: admin@mysafeplay.ai / password123');
  console.log('Venue Admin: venue@mysafeplay.ai / password123');
  console.log('Parent: parent@mysafeplay.ai / password123');
  console.log('John Doe (Parent): john@mysafeplay.ai / johndoe123');
  console.log('\n🎯 Most accounts use password: password123');
  console.log('🎯 John Doe account uses password: johndoe123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
