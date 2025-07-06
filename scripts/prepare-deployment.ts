// @ts-nocheck

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Extended deployment data including all necessary demo data
const DEPLOYMENT_DATA = {
  users: [
    {
      email: 'admin@mysafeplay.ai',
      password: 'password123',
      name: 'Sarah Mitchell',
      role: 'SUPER_ADMIN' as const,
      phone: '+1 (555) 001-0001',
    },
    {
      email: 'john@doe.com',
      password: 'johndoe123',
      name: 'John Doe',
      role: 'PARENT' as const,
      phone: '+1 (555) 001-0002',
    },
    {
      email: 'venue@mysafeplay.ai',
      password: 'password123',
      name: 'John Smith',
      role: 'VENUE_ADMIN' as const,
      phone: '+1 (555) 002-0001',
    },
    {
      email: 'parent@mysafeplay.ai',
      password: 'password123',
      name: 'Emily Johnson',
      role: 'PARENT' as const,
      phone: '+1 (555) 003-0001',
    },
    {
      email: 'sarah@happykids.com',
      password: 'password123',
      name: 'Sarah Johnson',
      role: 'VENUE_ADMIN' as const,
      phone: '+1 (555) 002-0002',
    },
    {
      email: 'mike@funcity.com',
      password: 'password123',
      name: 'Mike Wilson',
      role: 'VENUE_ADMIN' as const,
      phone: '+1 (555) 002-0003',
    },
    {
      email: 'david@email.com',
      password: 'password123',
      name: 'David Chen',
      role: 'PARENT' as const,
      phone: '+1 (555) 003-0002',
    },
    {
      email: 'maria@email.com',
      password: 'password123',
      name: 'Maria Martinez',
      role: 'PARENT' as const,
      phone: '+1 (555) 003-0003',
    },
    {
      email: 'robert@email.com',
      password: 'password123',
      name: 'Robert Anderson',
      role: 'PARENT' as const,
      phone: '+1 (555) 003-0004',
    },
  ]
};

async function checkDatabaseState() {
  console.log('🔍 CHECKING CURRENT DATABASE STATE...');
  
  try {
    const userCount = await prisma.user.count();
    const venueCount = await prisma.venue.count();
    const childCount = await prisma.child.count();
    const alertCount = await prisma.alert.count();
    
    console.log(`Current state: ${userCount} users, ${venueCount} venues, ${childCount} children, ${alertCount} alerts`);
    
    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@mysafeplay.ai' }
    });
    
    console.log(`Admin account: ${admin ? 'EXISTS' : 'MISSING'}`);
    
    return {
      userCount,
      venueCount,
      childCount,
      alertCount,
      hasAdmin: !!admin
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error checking database state:', errorMessage);
    return null;
  }
}

async function resetDatabase() {
  console.log('🧹 RESETTING DATABASE (CLEARING ALL DATA)...');
  
  try {
    // Clear all data in dependency order
    await prisma.venueAnalytics.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.memory.deleteMany();
    await prisma.trackingEvent.deleteMany();
    await prisma.faceRecognitionEvent.deleteMany();
    await prisma.faceRecord.deleteMany();
    await prisma.faceCollection.deleteMany();
    await prisma.child.deleteMany();
    await prisma.venue.deleteMany();
    await prisma.contactMessage.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ Database cleared successfully');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error resetting database:', errorMessage);
    return false;
  }
}

async function seedMinimalData() {
  console.log('🌱 SEEDING MINIMAL DEPLOYMENT DATA...');
  
  try {
    // Create users with hashed passwords
    const createdUsers = [];
    
    for (const userData of DEPLOYMENT_DATA.users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
        }
      });
      
      createdUsers.push(user);
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    }
    
    // Create minimal venues for venue admins
    const venueAdmins = createdUsers.filter(u => u.role === 'VENUE_ADMIN');
    
    if (venueAdmins.length > 0) {
      const venue = await prisma.venue.create({
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
            ],
          },
          alertSettings: {
            exitProximityThreshold: 5,
            unauthorizedZoneAlert: true,
            confidenceThreshold: 85,
            responseTimeTarget: 120,
          },
        },
      });
      
      console.log(`✅ Created venue: ${venue.name}`);
    }
    
    console.log(`✅ Successfully seeded ${createdUsers.length} users and minimal venue data`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error seeding data:', errorMessage);
    return false;
  }
}

async function verifyDeploymentData() {
  console.log('🔍 VERIFYING DEPLOYMENT DATA...');
  
  try {
    // Verify all critical accounts
    for (const userData of DEPLOYMENT_DATA.users) {
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (!user) {
        console.log(`❌ ${userData.email}: NOT FOUND`);
        continue;
      }
      
      const isPasswordValid = await bcrypt.compare(userData.password, user.password);
      const isRoleCorrect = user.role === userData.role;
      
      if (isPasswordValid && isRoleCorrect) {
        console.log(`✅ ${userData.email}: ${userData.role}, Password=VALID`);
      } else {
        console.log(`❌ ${userData.email}: ${user.role}, Password=${isPasswordValid ? 'VALID' : 'INVALID'}`);
      }
    }
    
    // Verify admin specifically
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@mysafeplay.ai' }
    });
    
    return admin && admin.role === 'SUPER_ADMIN';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error verifying data:', errorMessage);
    return false;
  }
}

async function main() {
  const startTime = Date.now();
  
  console.log('🚀 DEPLOYMENT PREPARATION SCRIPT');
  console.log('=' .repeat(70));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'NOT CONFIGURED'}`);
  console.log('');
  
  // Step 1: Check current state
  const initialState = await checkDatabaseState();
  
  if (!initialState) {
    console.log('❌ Cannot proceed - database connection failed');
    process.exit(1);
  }
  
  // Step 2: Reset database (clear all data)
  console.log('\n⚠️  WARNING: This will CLEAR ALL existing data!');
  console.log('This is intended for deployment preparation only.');
  
  const resetSuccess = await resetDatabase();
  if (!resetSuccess) {
    console.log('❌ Database reset failed');
    process.exit(1);
  }
  
  // Step 3: Seed minimal deployment data
  const seedSuccess = await seedMinimalData();
  if (!seedSuccess) {
    console.log('❌ Data seeding failed');
    process.exit(1);
  }
  
  // Step 4: Verify everything is correct
  const verifySuccess = await verifyDeploymentData();
  if (!verifySuccess) {
    console.log('❌ Data verification failed');
    process.exit(1);
  }
  
  // Step 5: Final state check
  const finalState = await checkDatabaseState();
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n📊 DEPLOYMENT PREPARATION SUMMARY');
  console.log('=' .repeat(70));
  console.log(`Execution time: ${elapsed} seconds`);
  console.log(`Final state: ${finalState?.userCount} users, ${finalState?.venueCount} venues`);
  console.log(`Admin account: ${finalState?.hasAdmin ? '✅ READY' : '❌ MISSING'}`);
  
  if (finalState?.hasAdmin) {
    console.log('\n🎉 DEPLOYMENT PREPARATION COMPLETED SUCCESSFULLY!');
    console.log('\n🔑 ADMIN CREDENTIALS FOR DEPLOYMENT:');
    console.log('=' .repeat(50));
    console.log('Email: admin@mysafeplay.ai');
    console.log('Password: password123');
    console.log('Role: SUPER_ADMIN');
    console.log('Access URL: /admin');
    console.log('=' .repeat(50));
    console.log('\nThe database is now ready for deployment!');
  } else {
    console.log('\n❌ DEPLOYMENT PREPARATION FAILED!');
    console.log('Admin account is missing or incorrect.');
  }
  
  await prisma.$disconnect();
  process.exit(finalState?.hasAdmin ? 0 : 1);
}

main().catch((error) => {
  console.error('💥 DEPLOYMENT PREPARATION CRASHED:', error);
  process.exit(1);
});
