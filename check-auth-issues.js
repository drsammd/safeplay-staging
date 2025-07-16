
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAuthIssues() {
  try {
    console.log('🔍 CHECKING ALL USERS IN DATABASE:');
    console.log('=====================================');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        password: true, // Check if password exists
        phoneVerified: true,
        identityVerified: true,
        verificationLevel: true,
        twoFactorEnabled: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(``);
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log(`  Updated: ${user.updatedAt}`);
      console.log(`  Phone Verified: ${user.phoneVerified}`);
      console.log(`  Identity Verified: ${user.identityVerified}`);
      console.log(`  Verification Level: ${user.verificationLevel}`);
      console.log(`  2FA Enabled: ${user.twoFactorEnabled}`);
      console.log(`  Has Password: ${user.password ? 'Yes (' + user.password.substring(0, 10) + '...)' : 'No'}`);
    });
    
    // Check specific users mentioned in the issue
    console.log(``);
    console.log('🎯 CHECKING SPECIFIC MENTIONED USERS:');
    console.log('====================================');
    
    const specificEmails = ['john@doe.com', 'admin@mysafeplay.ai', 'john@mysafeplay.ai'];
    
    for (const email of specificEmails) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      
      console.log(``);
      console.log(`${email}: ${user ? 'EXISTS' : 'NOT FOUND'}`);
      if (user) {
        console.log(`  Role: ${user.role}`);
        console.log(`  Verification Level: ${user.verificationLevel}`);
        console.log(`  Has Password: ${user.password ? 'Yes' : 'No'}`);
      }
    }
    
    // Check database schema for user table
    console.log(``);
    console.log('📋 CHECKING USER TABLE SCHEMA:');
    console.log('==============================');
    
    // This will show us what fields are available
    const sampleUser = users[0];
    if (sampleUser) {
      console.log('Available fields in User table:');
      Object.keys(sampleUser).forEach(key => {
        console.log(`  - ${key}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuthIssues();
