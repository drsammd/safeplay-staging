
/**
 * SafePlay Account Cleanliness Validation Script
 * Validates that non-demo accounts are clean and reports contamination
 */

import { PrismaClient } from '@prisma/client';
import { demoAccountProtection } from '../lib/demo-account-protection';

const prisma = new PrismaClient();

async function validateAccountCleanliness() {
  const validationId = `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔍 ACCOUNT CLEANLINESS VALIDATION [${validationId}]: Starting validation process`);
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    console.log(`📊 ACCOUNT CLEANLINESS VALIDATION [${validationId}]: Found ${users.length} users to validate`);

    const results = {
      totalUsers: users.length,
      demoAccounts: 0,
      cleanAccounts: 0,
      contaminatedAccounts: 0,
      contaminations: [] as Array<{
        email: string;
        name: string;
        role: string;
        createdAt: Date;
        children: number;
        familyMembers: number;
        memories: number;
        venues: number;

      }>
    };

    for (const user of users) {
      const isDemoAccount = demoAccountProtection.isDemoAccount(user.email);
      
      if (isDemoAccount) {
        console.log(`✅ ACCOUNT CLEANLINESS VALIDATION [${validationId}]: Demo account: ${user.email}`);
        results.demoAccounts++;
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
        console.log(`🚨 ACCOUNT CLEANLINESS VALIDATION [${validationId}]: CONTAMINATION DETECTED in ${user.email}`);
        console.log(`🚨 ACCOUNT CLEANLINESS VALIDATION [${validationId}]: Children: ${childrenCount}, Family: ${familyMembersCount}, Memories: ${memoriesCount}, Venues: ${venuesCount}`);
        
        results.contaminatedAccounts++;
        results.contaminations.push({
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          children: childrenCount,
          familyMembers: familyMembersCount,
          memories: memoriesCount,
          venues: venuesCount
        });

        // Log specific contamination details
        if (childrenCount > 0) {
          const children = await prisma.child.findMany({
            where: { parentId: user.id },
            select: { firstName: true, lastName: true }
          });
          console.log(`   👶 Children: ${children.map(c => `${c.firstName} ${c.lastName}`).join(', ')}`);
        }

        if (familyMembersCount > 0) {
          const familyMembers = await prisma.familyMember.findMany({
            where: { familyId: user.id },
            include: { member: { select: { name: true } } }
          });
          console.log(`   👨‍👩‍👧‍👦 Family Members: ${familyMembers.map(f => f.member.name).join(', ')}`);
        }

      } else {
        console.log(`✅ ACCOUNT CLEANLINESS VALIDATION [${validationId}]: Account is clean: ${user.email}`);
        results.cleanAccounts++;
      }
    }

    console.log(`\n📊 ACCOUNT CLEANLINESS VALIDATION [${validationId}]: FINAL REPORT`);
    console.log(`════════════════════════════════════════════════════════════════`);
    console.log(`📈 Total users: ${results.totalUsers}`);
    console.log(`🎭 Demo accounts: ${results.demoAccounts}`);
    console.log(`✅ Clean accounts: ${results.cleanAccounts}`);
    console.log(`🚨 Contaminated accounts: ${results.contaminatedAccounts}`);
    console.log(`════════════════════════════════════════════════════════════════`);

    if (results.contaminatedAccounts > 0) {
      console.log(`\n🚨 CONTAMINATED ACCOUNTS DETAILS:`);
      results.contaminations.forEach((contamination, index) => {
        console.log(`\n${index + 1}. ${contamination.email} (${contamination.name})`);
        console.log(`   Role: ${contamination.role}`);
        console.log(`   Created: ${contamination.createdAt.toISOString()}`);
        console.log(`   Children: ${contamination.children}`);
        console.log(`   Family Members: ${contamination.familyMembers}`);
        console.log(`   Memories: ${contamination.memories}`);
        console.log(`   Venues: ${contamination.venues}`);
      });
    }

    console.log(`\n🎉 ACCOUNT CLEANLINESS VALIDATION [${validationId}]: Validation complete!`);
    
    return results;

  } catch (error) {
    console.error(`❌ ACCOUNT CLEANLINESS VALIDATION [${validationId}]: Validation failed:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the validation
validateAccountCleanliness()
  .then((results) => {
    console.log('🎉 Account cleanliness validation completed successfully!');
    if (results.contaminatedAccounts > 0) {
      console.log(`\n⚠️  WARNING: ${results.contaminatedAccounts} contaminated accounts found!`);
      console.log(`💡 Run the cleanup script to remove demo data from these accounts.`);
      process.exit(1);
    } else {
      console.log(`✅ All accounts are clean!`);
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('❌ Account cleanliness validation failed:', error);
    process.exit(1);
  });
