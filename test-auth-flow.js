const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function testAuth() {
  console.log('🔍 Testing authentication flow...');
  
  try {
    // Test credentials
    const testCreds = [
      { email: 'john@doe.com', password: 'johndoe123', expectedRole: 'COMPANY_ADMIN' },
      { email: 'parent@safeplay.com', password: 'password123', expectedRole: 'PARENT' }
    ];

    for (const { email, password, expectedRole } of testCreds) {
      console.log(`\n🧪 Testing ${email}:`);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        console.log(`❌ User ${email} not found in database`);
        continue;
      }

      console.log(`✅ User found: ${user.name} (${user.role})`);
      
      // Test password
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`🔐 Password valid: ${isValid}`);
      
      // Check role
      const roleMatch = user.role === expectedRole;
      console.log(`👤 Role matches expected (${expectedRole}): ${roleMatch}`);
      
      if (!roleMatch) {
        console.log(`⚠️  Expected role: ${expectedRole}, Got: ${user.role}`);
      }
      
      console.log(`📊 Overall auth test: ${isValid && roleMatch ? '✅ PASS' : '❌ FAIL'}`);
    }
    
  } catch (error) {
    console.error('❌ Auth test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
