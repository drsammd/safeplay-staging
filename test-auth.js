
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testAdminAuth() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing Admin Authentication...');
    
    // Test 1: Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@mysafeplay.ai' }
    });
    
    if (!adminUser) {
      console.log('❌ ISSUE: Admin user not found!');
      return;
    }
    
    console.log('✅ Admin user found:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      hasPassword: !!adminUser.password
    });
    
    // Test 2: Verify password
    const testPassword = 'password123';
    const isValidPassword = await bcrypt.compare(testPassword, adminUser.password);
    
    console.log('🔐 Password test:', {
      testPassword,
      isValid: isValidPassword,
      storedHashLength: adminUser.password.length
    });
    
    if (!isValidPassword) {
      console.log('❌ ISSUE: Admin password does not match!');
      
      // Try with alternative password
      const altPassword = 'johndoe123';
      const isAltValid = await bcrypt.compare(altPassword, adminUser.password);
      console.log('🔐 Alternative password test:', {
        altPassword,
        isValid: isAltValid
      });
      
      if (!isAltValid) {
        console.log('💡 SOLUTION: Need to update admin password');
        // Reset admin password
        const newHash = await bcrypt.hash('password123', 12);
        await prisma.user.update({
          where: { email: 'admin@mysafeplay.ai' },
          data: { password: newHash }
        });
        console.log('✅ Admin password reset to: password123');
      }
    } else {
      console.log('✅ Admin password is correct!');
    }
    
    // Test 3: Verify role exactly
    console.log('🎭 Role verification:', {
      role: adminUser.role,
      roleType: typeof adminUser.role,
      isCompanyAdmin: adminUser.role === 'SUPER_ADMIN',
      trimmedRole: adminUser.role.trim(),
      roleLength: adminUser.role.length
    });
    
    // Test 4: Check for any hidden characters
    const roleBytes = Buffer.from(adminUser.role, 'utf8');
    console.log('🔍 Role bytes analysis:', {
      expectedBytes: Buffer.from('SUPER_ADMIN', 'utf8'),
      actualBytes: roleBytes,
      match: roleBytes.equals(Buffer.from('SUPER_ADMIN', 'utf8'))
    });
    
  } catch (error) {
    console.error('💥 Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminAuth();
