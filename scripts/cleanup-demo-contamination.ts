
/**
 * SafePlay Demo Data Contamination Cleanup Script
 * Removes demo data from non-demo accounts
 * 
 * This script addresses the critical issue where demo data
 * is being injected into regular user accounts
 */

import { PrismaClient } from '@prisma/client';
import { demoAccountProtection } from '../lib/demo-account-protection';

const prisma = new PrismaClient();

async function cleanupDemoContamination() {
  const cleanupId = `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🧹 DEMO CONTAMINATION CLEANUP [${cleanupId}]: Starting cleanup process`);
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    console.log(`🔍 DEMO CONTAMINATION CLEANUP [${cleanupId}]: Found ${users.length} users to check`);

    let cleanedAccounts = 0;
    let contaminatedAccounts = 0;
    let skippedDemoAccounts = 0;

    for (const user of users) {
      const isDemoAccount = demoAccountProtection.isDemoAccount(user.email);
      
      if (isDemoAccount) {
        console.log(`⏭️  DEMO CONTAMINATION CLEANUP [${cleanupId}]: Skipping demo account: ${user.email}`);
        skippedDemoAccounts++;
        continue;
      }

      // Check for contamination
      const childrenCount = await prisma.child.count({
        where: { parentId: user.id }
      });
      
      const familyMembersCount = await prisma.familyMember.count({
        where: { familyId: user.id }
      });
      
      const memoriesCount = await prisma.memory.count({
        where: { purchaserId: user.id }
      });
      
      const venuesCount = await prisma.venue.count({
        where: { adminId: user.id }
      });

      const hasContamination = childrenCount > 0 || familyMembersCount > 0 || memoriesCount > 0 || venuesCount > 0;

      if (hasContamination) {
        console.log(`🚨 DEMO CONTAMINATION CLEANUP [${cleanupId}]: CONTAMINATION DETECTED in ${user.email}`);
        console.log(`🚨 DEMO CONTAMINATION CLEANUP [${cleanupId}]: Children: ${childrenCount}, Family: ${familyMembersCount}, Memories: ${memoriesCount}, Venues: ${venuesCount}`);
        
        // Clean up the contamination
        await cleanupContaminatedAccount(user.id, user.email, cleanupId);
        
        contaminatedAccounts++;
      } else {
        console.log(`✅ DEMO CONTAMINATION CLEANUP [${cleanupId}]: Account is clean: ${user.email}`);
        cleanedAccounts++;
      }
    }

    console.log(`🎉 DEMO CONTAMINATION CLEANUP [${cleanupId}]: Cleanup complete!`);
    console.log(`📊 DEMO CONTAMINATION CLEANUP [${cleanupId}]: Summary:`);
    console.log(`   - Total users: ${users.length}`);
    console.log(`   - Clean accounts: ${cleanedAccounts}`);
    console.log(`   - Contaminated accounts cleaned: ${contaminatedAccounts}`);
    console.log(`   - Demo accounts skipped: ${skippedDemoAccounts}`);

  } catch (error) {
    console.error(`❌ DEMO CONTAMINATION CLEANUP [${cleanupId}]: Cleanup failed:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupContaminatedAccount(userId: string, email: string, cleanupId: string) {
  console.log(`🧹 DEMO CONTAMINATION CLEANUP [${cleanupId}]: Cleaning account: ${email}`);
  
  try {
    // Delete in correct order to avoid foreign key constraint issues
    
    // 1. Delete child access permissions
    const childAccessDeleted = await prisma.childAccess.deleteMany({
      where: { granterId: userId }
    });
    console.log(`🗑️  DEMO CONTAMINATION CLEANUP [${cleanupId}]: Deleted ${childAccessDeleted.count} child access records`);

    // 2. Delete family permissions
    const familyPermissionsDeleted = await prisma.familyPermission.deleteMany({
      where: { granterId: userId }
    });
    console.log(`🗑️  DEMO CONTAMINATION CLEANUP [${cleanupId}]: Deleted ${familyPermissionsDeleted.count} family permissions`);

    // 3. Delete family members
    const familyMembersDeleted = await prisma.familyMember.deleteMany({
      where: { familyId: userId }
    });
    console.log(`🗑️  DEMO CONTAMINATION CLEANUP [${cleanupId}]: Deleted ${familyMembersDeleted.count} family members`);

    // 4. Delete memories
    const memoriesDeleted = await prisma.memory.deleteMany({
      where: { purchaserId: userId }
    });
    console.log(`🗑️  DEMO CONTAMINATION CLEANUP [${cleanupId}]: Deleted ${memoriesDeleted.count} memories`);

    // 5. Delete children
    const childrenDeleted = await prisma.child.deleteMany({
      where: { parentId: userId }
    });
    console.log(`🗑️  DEMO CONTAMINATION CLEANUP [${cleanupId}]: Deleted ${childrenDeleted.count} children`);

    // 6. Delete venues (for venue admins)
    const venuesDeleted = await prisma.venue.deleteMany({
      where: { adminId: userId }
    });
    console.log(`🗑️  DEMO CONTAMINATION CLEANUP [${cleanupId}]: Deleted ${venuesDeleted.count} venues`);

    // 7. Delete tracking events
    const trackingEventsDeleted = await prisma.trackingEvent.deleteMany({
      where: { userId: userId }
    });
    console.log(`🗑️  DEMO CONTAMINATION CLEANUP [${cleanupId}]: Deleted ${trackingEventsDeleted.count} tracking events`);

    console.log(`✅ DEMO CONTAMINATION CLEANUP [${cleanupId}]: Account cleaned successfully: ${email}`);

  } catch (error) {
    console.error(`❌ DEMO CONTAMINATION CLEANUP [${cleanupId}]: Failed to clean account ${email}:`, error);
    throw error;
  }
}

// Run the cleanup
cleanupDemoContamination()
  .then(() => {
    console.log('🎉 Demo contamination cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Demo contamination cleanup failed:', error);
    process.exit(1);
  });
