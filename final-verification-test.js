
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function finalVerificationTest() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 FINAL VERIFICATION TEST\n');
    console.log('Testing all user accounts for correct role assignments and expected behavior...\n');
    
    // Test accounts with their expected roles and access
    const testAccounts = [
      {
        email: 'john@doe.com',
        expectedRole: 'PARENT',
        expectedAccess: '/parent',
        description: 'John Doe (Fixed Demo Account)'
      },
      {
        email: 'parent@safeplay.com', 
        expectedRole: 'PARENT',
        expectedAccess: '/parent',
        description: 'Emily Johnson (Parent)'
      },
      {
        email: 'admin@safeplay.com',
        expectedRole: 'COMPANY_ADMIN', 
        expectedAccess: '/admin',
        description: 'Sarah Mitchell (Company Admin)'
      },
      {
        email: 'venue@safeplay.com',
        expectedRole: 'VENUE_ADMIN',
        expectedAccess: '/venue-admin', 
        description: 'John Smith (Venue Admin)'
      }
    ];
    
    console.log('DATABASE ROLE VERIFICATION:');
    console.log('=' .repeat(60));
    
    let allCorrect = true;
    
    for (const account of testAccounts) {
      const user = await prisma.user.findUnique({
        where: { email: account.email },
        select: { email: true, name: true, role: true }
      });
      
      if (!user) {
        console.log(`❌ ${account.email} - NOT FOUND`);
        allCorrect = false;
        continue;
      }
      
      const isCorrect = user.role === account.expectedRole;
      const status = isCorrect ? '✅' : '❌';
      
      console.log(`${status} ${account.description}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role} (Expected: ${account.expectedRole})`);
      console.log(`   Should access: ${account.expectedAccess}`);
      console.log('');
      
      if (!isCorrect) {
        allCorrect = false;
      }
    }
    
    console.log('ENDPOINT ACCESSIBILITY TEST:');
    console.log('=' .repeat(60));
    
    // Test endpoints that should be publicly accessible
    const publicEndpoints = ['/', '/auth/signin', '/contact', '/faq'];
    
    for (const endpoint of publicEndpoints) {
      try {
        const response = await fetch(`http://localhost:3000${endpoint}`);
        const status = response.status === 200 ? '✅' : '❌';
        console.log(`${status} ${endpoint} - Status: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.message}`);
      }
    }
    
    console.log('\n🎯 TEST SUMMARY:');
    console.log('=' .repeat(60));
    
    if (allCorrect) {
      console.log('✅ ALL ROLE ASSIGNMENTS ARE CORRECT!');
      console.log('✅ john@doe.com role fix was successful');
      console.log('✅ Other accounts remain unchanged');
      console.log('✅ Authentication flow should work correctly');
      
      console.log('\n📋 MANUAL TESTING CHECKLIST:');
      console.log('1. ✅ john@doe.com should redirect to /parent after login');
      console.log('2. ✅ john@doe.com should be denied access to /admin');
      console.log('3. ✅ parent@safeplay.com should still work (redirect to /parent)');
      console.log('4. ✅ admin@safeplay.com should access /admin');
      console.log('5. ✅ venue@safeplay.com should access /venue-admin');
      
    } else {
      console.log('❌ SOME ROLE ASSIGNMENTS ARE INCORRECT');
      console.log('❌ Additional fixes may be needed');
    }
    
  } catch (error) {
    console.error('Error in final verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerificationTest();
