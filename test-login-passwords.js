
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLoginPasswords() {
  try {
    console.log('🔍 TESTING LOGIN PASSWORDS:');
    console.log('===========================');
    
    // Get specific users mentioned in the issue
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['john@doe.com', 'admin@mysafeplay.ai', 'john@mysafeplay.ai']
        }
      },
      select: {
        email: true,
        password: true,
        role: true
      }
    });
    
    console.log(`Found ${users.length} target users`);
    
    // Test passwords for each user
    const testPasswords = [
      'johndoe123',      // Mentioned in the issue
      'demo-password',   // Used for demo accounts
      'password',        // Common default
      'admin123',        // Common admin password
      'mysafeplay123',   // App-specific
      'admin',           // Simple admin
      'john123',         // Simple variation
      'safeplay123'      // App name
    ];
    
    for (const user of users) {
      console.log(`\n🎯 Testing passwords for: ${user.email} (${user.role})`);
      console.log('--------------------------------------------------');
      
      let passwordFound = false;
      
      for (const testPassword of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(testPassword, user.password);
          
          if (isMatch) {
            console.log(`✅ FOUND PASSWORD: "${testPassword}" works for ${user.email}`);
            passwordFound = true;
          } else {
            console.log(`❌ "${testPassword}" - no match`);
          }
        } catch (error) {
          console.log(`❌ "${testPassword}" - error: ${error.message}`);
        }
      }
      
      if (!passwordFound) {
        console.log(`🔴 NO MATCHING PASSWORD FOUND for ${user.email}`);
        console.log(`   Password hash: ${user.password.substring(0, 30)}...`);
      }
    }
    
    // Also check what password hash pattern is used for other users
    console.log(`\n📋 CHECKING PASSWORD HASH PATTERNS:`);
    console.log('=====================================');
    
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        password: true
      },
      take: 5
    });
    
    const hashGroups = {};
    allUsers.forEach(user => {
      const hashPrefix = user.password.substring(0, 20);
      if (!hashGroups[hashPrefix]) {
        hashGroups[hashPrefix] = [];
      }
      hashGroups[hashPrefix].push(user.email);
    });
    
    console.log('Hash patterns found:');
    Object.entries(hashGroups).forEach(([prefix, emails]) => {
      console.log(`  ${prefix}... used by: ${emails.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginPasswords();
