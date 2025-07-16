const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updatePasswords() {
  console.log('🔐 Updating passwords to standardized ones...');
  
  try {
    // Hash the new passwords
    const password123Hash = await bcrypt.hash('password123', 12);
    const johndoe123Hash = await bcrypt.hash('johndoe123', 12);
    
    console.log('✅ Password hashes generated successfully');
    
    // Update admin@mysafeplay.ai password to 'password123'
    const adminUpdate = await prisma.user.update({
      where: { email: 'admin@mysafeplay.ai' },
      data: { 
        password: password123Hash,
        isActive: true,
        lastLoginAt: null // Reset login time
      }
    });
    console.log('✅ Updated admin@mysafeplay.ai password to "password123"');
    
    // Update venue@mysafeplay.ai password to 'password123'
    const venueUpdate = await prisma.user.update({
      where: { email: 'venue@mysafeplay.ai' },
      data: { 
        password: password123Hash,
        isActive: true,
        lastLoginAt: null // Reset login time
      }
    });
    console.log('✅ Updated venue@mysafeplay.ai password to "password123"');
    
    // Update john@doe.com password to 'johndoe123'
    const johnUpdate = await prisma.user.update({
      where: { email: 'john@doe.com' },
      data: { 
        password: johndoe123Hash,
        isActive: true,
        lastLoginAt: null // Reset login time
      }
    });
    console.log('✅ Updated john@doe.com password to "johndoe123"');
    
    // Verify updates
    console.log('\n🔍 Verifying password updates...');
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['admin@mysafeplay.ai', 'venue@mysafeplay.ai', 'john@doe.com']
        }
      },
      select: {
        email: true,
        role: true,
        isActive: true,
        password: true
      }
    });
    
    console.log('\n📊 Updated user credentials:');
    for (const user of users) {
      console.log(`✅ ${user.email} - Role: ${user.role} - Active: ${user.isActive}`);
      console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
      
      // Test password verification
      let testPassword;
      if (user.email === 'john@doe.com') {
        testPassword = 'johndoe123';
      } else {
        testPassword = 'password123';
      }
      
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`   Password verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }
    
    console.log('\n🎉 Password standardization complete!');
    console.log('\n📋 CREDENTIALS FOR SAM:');
    console.log('   Admin: admin@mysafeplay.ai / password123');
    console.log('   Venue Admin: venue@mysafeplay.ai / password123');
    console.log('   Test User: john@doe.com / johndoe123');
    console.log('\n⚠️  REMEMBER: Production requires stakeholder auth first!');
    console.log('   Staging Password: SafePlay2025Beta!');
    
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePasswords();
