
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixAuthIssues() {
  try {
    console.log('🔧 FIXING AUTHENTICATION ISSUES:');
    console.log('=================================');
    
    // Step 1: Fix admin@mysafeplay.ai password
    console.log('\n1. Fixing admin@mysafeplay.ai password...');
    
    const adminPassword = 'admin123'; // Set a known password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const updatedAdmin = await prisma.user.update({
      where: { email: 'admin@mysafeplay.ai' },
      data: { password: hashedPassword },
      select: { email: true, role: true }
    });
    
    console.log(`✅ Updated password for ${updatedAdmin.email} (${updatedAdmin.role})`);
    console.log(`   New password: "${adminPassword}"`);
    
    // Step 2: Check if we need to add database fields for user status tracking
    console.log('\n2. Checking database schema for missing fields...');
    
    // Check if lastLoginAt field exists by trying to update it
    try {
      await prisma.user.updateMany({
        where: { email: 'test@nonexistent.com' }, // Non-existent user to avoid actual changes
        data: { lastLoginAt: new Date() }
      });
      console.log('✅ lastLoginAt field exists in database');
    } catch (error) {
      if (error.message.includes('Unknown field')) {
        console.log('❌ lastLoginAt field missing from database schema');
        console.log('   This explains "Last Login: Never" issue');
      }
    }
    
    // Check if isActive field exists
    try {
      await prisma.user.updateMany({
        where: { email: 'test@nonexistent.com' }, // Non-existent user
        data: { isActive: true }
      });
      console.log('✅ isActive field exists in database');
    } catch (error) {
      if (error.message.includes('Unknown field')) {
        console.log('❌ isActive field missing from database schema');
        console.log('   This explains "Status: Inactive" issue');
      }
    }
    
    // Step 3: Test login for key users
    console.log('\n3. Testing login credentials after fix...');
    
    const testUsers = [
      { email: 'john@doe.com', password: 'johndoe123' },
      { email: 'admin@mysafeplay.ai', password: 'admin123' },
      { email: 'john@mysafeplay.ai', password: 'johndoe123' }
    ];
    
    for (const testUser of testUsers) {
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: { email: true, password: true, role: true }
      });
      
      if (user) {
        const isValid = await bcrypt.compare(testUser.password, user.password);
        console.log(`${isValid ? '✅' : '❌'} ${testUser.email}: password "${testUser.password}" ${isValid ? 'WORKS' : 'FAILS'}`);
      }
    }
    
    // Step 4: Create a summary of the current state
    console.log('\n4. Summary of authentication state:');
    console.log('=====================================');
    
    const keyUsers = await prisma.user.findMany({
      where: {
        email: { in: ['john@doe.com', 'admin@mysafeplay.ai'] }
      },
      select: {
        email: true,
        role: true,
        createdAt: true,
        phoneVerified: true,
        identityVerified: true
      }
    });
    
    keyUsers.forEach(user => {
      console.log(`📋 ${user.email}:`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Phone Verified: ${user.phoneVerified}`);
      console.log(`   Identity Verified: ${user.identityVerified}`);
      console.log(`   Created: ${user.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing auth issues:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAuthIssues();
