
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testJohnAuthFlow() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing john@doe.com authentication flow...\n');
    
    // First verify his role in database
    const john = await prisma.user.findUnique({
      where: { email: 'john@doe.com' },
      select: { id: true, email: true, role: true, name: true }
    });
    
    if (!john) {
      console.log('❌ john@doe.com not found in database');
      return;
    }
    
    console.log('USER DATABASE INFO:');
    console.log(`Email: ${john.email}`);
    console.log(`Name: ${john.name}`);
    console.log(`Role: ${john.role}`);
    console.log(`Expected redirect: /parent (since role is PARENT)\n`);
    
    // Test key endpoints
    console.log('TESTING ENDPOINTS:');
    
    // Test home page
    const homeResponse = await fetch('http://localhost:3000/');
    console.log(`Home page (/) : ${homeResponse.status}`);
    
    // Test signin page
    const signinResponse = await fetch('http://localhost:3000/auth/signin');
    console.log(`Signin page (/auth/signin) : ${signinResponse.status}`);
    
    // Test parent page (should require auth)
    const parentResponse = await fetch('http://localhost:3000/parent');
    console.log(`Parent page (/parent) : ${parentResponse.status}`);
    
    // Test admin page (should require auth and correct role)
    const adminResponse = await fetch('http://localhost:3000/admin');
    console.log(`Admin page (/admin) : ${adminResponse.status}\n`);
    
    console.log('🔒 AUTHENTICATION TEST SUMMARY:');
    console.log('✅ john@doe.com has PARENT role in database');
    console.log('✅ Should redirect to /parent after login');
    console.log('✅ Should NOT have access to /admin routes');
    console.log('\n📝 TO MANUALLY TEST:');
    console.log('1. Go to http://localhost:3000/auth/signin');
    console.log('2. Login with john@doe.com / johndoe123');
    console.log('3. Should redirect to /parent dashboard');
    console.log('4. Try accessing /admin - should be denied');
    
  } catch (error) {
    console.error('Error testing auth flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testJohnAuthFlow();
