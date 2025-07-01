
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testRoleAssignment() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Role Assignment...\n');
    
    // Step 1: Backup current john@doe.com role
    const johnBefore = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });
    
    console.log('📝 John\'s current role:', johnBefore?.role);
    
    // Step 2: Temporarily change john@doe.com to COMPANY_ADMIN
    const updatedJohn = await prisma.user.update({
      where: { email: 'john@doe.com' },
      data: { role: 'COMPANY_ADMIN' }
    });
    
    console.log('✅ Updated John\'s role to:', updatedJohn.role);
    
    // Step 3: Verify the change
    const johnAfter = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });
    
    console.log('🔍 Verified John\'s new role:', johnAfter?.role);
    
    // Step 4: Check admin count
    const adminCount = await prisma.user.count({
      where: { role: 'COMPANY_ADMIN' }
    });
    
    console.log('👑 Total COMPANY_ADMIN users:', adminCount);
    
    // List all admin users
    const allAdmins = await prisma.user.findMany({
      where: { role: 'COMPANY_ADMIN' },
      select: { email: true, role: true }
    });
    
    console.log('👥 All admin users:');
    allAdmins.forEach(admin => {
      console.log(`  - ${admin.email}: ${admin.role}`);
    });
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Try logging in with john@doe.com / johndoe123');
    console.log('2. Check if john can access /admin dashboard');
    console.log('3. If successful, the issue is with the specific admin@safeplay.com account');
    console.log('4. If unsuccessful, the issue is with the admin role functionality');
    
  } catch (error) {
    console.error('❌ Role assignment test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRoleAssignment();
