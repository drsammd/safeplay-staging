const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkPasswords() {
  try {
    console.log('Checking user accounts and password setup...');
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['john@doe.com', 'parent@mysafeplay.ai']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true
      }
    });
    
    console.log('Found users:');
    users.forEach(user => {
      console.log(`- ${user.email}: ${user.role}`);
      console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
    });
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswords();
