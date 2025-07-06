
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function fixJohnRole() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Fixing john@doe.com role assignment...\n');
    
    // First, check current role
    const johnBefore = await prisma.user.findUnique({
      where: { email: 'john@doe.com' },
      select: { id: true, email: true, role: true, name: true }
    });
    
    if (!johnBefore) {
      console.log('❌ john@doe.com not found in database');
      return;
    }
    
    console.log('BEFORE UPDATE:');
    console.log(`Email: ${johnBefore.email}`);
    console.log(`Name: ${johnBefore.name}`);
    console.log(`Current Role: ${johnBefore.role}`);
    console.log(`Should be: PARENT\n`);
    
    if (johnBefore.role === 'PARENT') {
      console.log('✅ john@doe.com already has correct PARENT role. No update needed.');
      return;
    }
    
    // Update the role
    console.log('Updating role from SUPER_ADMIN to PARENT...');
    
    const johnAfter = await prisma.user.update({
      where: { email: 'john@doe.com' },
      data: { role: 'PARENT' },
      select: { id: true, email: true, role: true, name: true }
    });
    
    console.log('\nAFTER UPDATE:');
    console.log(`Email: ${johnAfter.email}`);
    console.log(`Name: ${johnAfter.name}`);
    console.log(`New Role: ${johnAfter.role}`);
    
    if (johnAfter.role === 'PARENT') {
      console.log('\n✅ SUCCESS: john@doe.com role updated to PARENT');
    } else {
      console.log('\n❌ ERROR: Role update failed');
    }
    
  } catch (error) {
    console.error('Error fixing john role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixJohnRole();
