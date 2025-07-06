
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyAccounts() {
  console.log('🔍 COMPREHENSIVE ACCOUNT VERIFICATION');
  console.log('=' .repeat(50));

  try {
    // Get all users
    const users = await prisma.user.findMany({
      orderBy: { email: 'asc' }
    });

    console.log(`\n📊 Total users in database: ${users.length}\n`);

    // Test credentials for key accounts
    const testAccounts = [
      { email: 'admin@mysafeplay.ai', password: 'password123', expectedRole: 'SUPER_ADMIN' },
      { email: 'john@doe.com', password: 'johndoe123', expectedRole: 'PARENT' },
      { email: 'venue@mysafeplay.ai', password: 'password123', expectedRole: 'VENUE_ADMIN' },
      { email: 'parent@mysafeplay.ai', password: 'password123', expectedRole: 'PARENT' }
    ];

    console.log('🔑 CREDENTIAL VERIFICATION RESULTS:');
    console.log('-'.repeat(50));

    for (const testAccount of testAccounts) {
      const user = users.find(u => u.email === testAccount.email);
      
      if (!user) {
        console.log(`❌ ${testAccount.email}: ACCOUNT NOT FOUND`);
        continue;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(testAccount.password, user.password);
      
      // Check role
      const roleMatch = user.role === testAccount.expectedRole;
      
      console.log(`${isPasswordValid && roleMatch ? '✅' : '❌'} ${testAccount.email}:`);
      console.log(`   Password: ${isPasswordValid ? 'VALID' : 'INVALID'}`);
      console.log(`   Role: ${user.role} ${roleMatch ? '(CORRECT)' : `(EXPECTED: ${testAccount.expectedRole})`}`);
      console.log(`   User ID: ${user.id}`);
      console.log('');
    }

    console.log('\n👥 ALL USER ACCOUNTS:');
    console.log('-'.repeat(50));
    
    for (const user of users) {
      console.log(`📧 ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log(`   Updated: ${user.updatedAt.toISOString()}`);
      console.log('');
    }

    // Check if password hashes look correct (should be bcrypt format)
    console.log('\n🔐 PASSWORD HASH ANALYSIS:');
    console.log('-'.repeat(50));
    
    for (const user of users) {
      const hashFormat = user.password.startsWith('$2b$') || user.password.startsWith('$2a$') ? 'BCRYPT' : 'UNKNOWN';
      const hashLength = user.password.length;
      console.log(`${user.email}: ${hashFormat} (${hashLength} chars)`);
    }

    // Environment variables check
    console.log('\n🌍 ENVIRONMENT CHECK:');
    console.log('-'.repeat(50));
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
    console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'NOT SET'}`);
    console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET'}`);

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAccounts();
