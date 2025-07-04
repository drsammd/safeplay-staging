
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Database Users ===');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('Total users:', users.length);
    users.forEach(user => {
      console.log(`- Email: ${user.email}, Role: ${user.role}, Name: ${user.name}`);
    });
    
    console.log('\n=== Checking Admin User ===');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@mysafeplay.ai' }
    });
    
    if (adminUser) {
      console.log('Admin user found:');
      console.log(`- ID: ${adminUser.id}`);
      console.log(`- Email: ${adminUser.email}`);
      console.log(`- Name: ${adminUser.name}`);
      console.log(`- Role: ${adminUser.role}`);
      console.log(`- Role type: ${typeof adminUser.role}`);
      console.log(`- Created: ${adminUser.createdAt}`);
    } else {
      console.log('Admin user NOT found!');
    }
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
