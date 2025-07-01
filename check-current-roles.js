
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function checkCurrentRoles() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking current user roles in database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        createdAt: true
      },
      orderBy: {
        email: 'asc'
      }
    });
    
    console.log('Current Users and Their Roles:');
    console.log('===================================');
    
    users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name || 'N/A'}`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.createdAt.toISOString()}`);
      console.log('---');
    });
    
    console.log(`\nTotal users found: ${users.length}`);
    
    // Check specifically for john@doe.com
    const john = users.find(u => u.email === 'john@doe.com');
    if (john) {
      console.log(`\n⚠️ ISSUE DETECTED:`);
      console.log(`john@doe.com has role: ${john.role}`);
      console.log(`Should have role: PARENT`);
      console.log(`Current role is: ${john.role === 'PARENT' ? 'CORRECT' : 'INCORRECT'}`);
    } else {
      console.log('\n❌ john@doe.com not found in database');
    }
    
  } catch (error) {
    console.error('Error checking roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentRoles();
