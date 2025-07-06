
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createNewAdmin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Creating New Admin Account...\n');
    
    // Create a completely fresh admin account
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin2@mysafeplay.ai',
        password: hashedPassword,
        name: 'Admin Two',
        role: 'SUPER_ADMIN'
      }
    });
    
    console.log('✅ Created new admin account:', {
      email: newAdmin.email,
      role: newAdmin.role,
      id: newAdmin.id
    });
    
    // Also create a backup simple admin
    const hashedPassword2 = await bcrypt.hash('test123', 10);
    
    const simpleAdmin = await prisma.user.create({
      data: {
        email: 'test@admin.com',
        password: hashedPassword2,
        name: 'Test Admin',
        role: 'SUPER_ADMIN'
      }
    });
    
    console.log('✅ Created backup admin account:', {
      email: simpleAdmin.email,
      role: simpleAdmin.role,
      id: simpleAdmin.id
    });
    
    // List all admin accounts now
    const allAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { email: true, role: true, name: true }
    });
    
    console.log('\n👑 All Admin Accounts:');
    allAdmins.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.email} (${admin.name}) - ${admin.role}`);
    });
    
    console.log('\n🎯 Test Accounts:');
    console.log('1. admin2@mysafeplay.ai / admin123');
    console.log('2. test@admin.com / test123');
    console.log('3. john@doe.com / johndoe123 (modified to admin)');
    console.log('4. admin@mysafeplay.ai / password123 (original)');
    
    console.log('\n📝 Next Steps:');
    console.log('1. Try logging in manually through browser with each account');
    console.log('2. Test admin dashboard access');
    console.log('3. Identify which account(s) work');
    
  } catch (error) {
    console.error('❌ Error creating admin accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNewAdmin();
