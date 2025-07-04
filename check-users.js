const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking database for test users...');
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
        createdAt: true
      }
    });
    
    console.log('Found users:');
    users.forEach(user => {
      console.log(`- ${user.email}: ${user.role} (created: ${user.createdAt})`);
    });
    
    if (users.length === 0) {
      console.log('❌ No test users found in database!');
    } else {
      console.log(`✅ Found ${users.length} test users`);
    }
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
