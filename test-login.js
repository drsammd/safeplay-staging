const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_M6gknpGef8Fz@ep-tight-fog-adn7uvk9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function testLogin() {
  try {
    console.log('🧪 TESTING ACCOUNT LOGIN FUNCTIONALITY');
    console.log('=' .repeat(50));
    
    // Test accounts that were failing in BrowserStack log
    const testAccounts = [
      'drsam+103@outlook.com',
      'drsam+138@outlook.com', 
      'drsam+165@outlook.com',
      'drsam+168@outlook.com'
    ];
    
    for (const email of testAccounts) {
      console.log(`\n🔍 Testing: ${email}`);
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        console.log(`❌ User not found`);
        continue;
      }
      
      // Test password
      const isPasswordValid = await bcrypt.compare('password123', user.password);
      
      if (isPasswordValid && user.isActive) {
        console.log(`✅ LOGIN SUCCESS - Role: ${user.role}, Active: ${user.isActive}`);
      } else {
        console.log(`❌ LOGIN FAILED - Password: ${isPasswordValid}, Active: ${user.isActive}`);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    const totalDrsamUsers = await prisma.user.count({
      where: { email: { startsWith: 'drsam+' } }
    });
    console.log(`Total drsam accounts available: ${totalDrsamUsers}`);
    
    console.log('\n✅ LOGIN TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
