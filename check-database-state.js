
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkDatabaseState() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking Database State...\n');
    
    // Check all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { email: 'asc' }
    });
    
    console.log('👥 All Users in Database:');
    users.forEach(user => {
      console.log(`  - Email: ${user.email}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    ID: ${user.id}`);
      console.log(`    Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Check specifically for admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN'
      }
    });
    
    console.log('👑 Admin Users (SUPER_ADMIN role):');
    adminUsers.forEach(admin => {
      console.log(`  - Email: ${admin.email}`);
      console.log(`    ID: ${admin.id}`);
      console.log(`    Password Hash Length: ${admin.password?.length || 0}`);
      console.log('');
    });
    
    // Check for the specific problematic admin
    const specificAdmin = await prisma.user.findUnique({
      where: { email: 'admin@mysafeplay.ai' }
    });
    
    console.log('🎯 Specific Admin (admin@mysafeplay.ai):');
    if (specificAdmin) {
      console.log(`  - ID: ${specificAdmin.id}`);
      console.log(`  - Role: ${specificAdmin.role}`);
      console.log(`  - Password Hash: ${specificAdmin.password ? 'EXISTS' : 'MISSING'}`);
      console.log(`  - Password Hash Length: ${specificAdmin.password?.length || 0}`);
      console.log(`  - Created: ${specificAdmin.createdAt}`);
    } else {
      console.log('  - NOT FOUND!');
    }
    
    // Check working john@doe.com account
    const johnAccount = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });
    
    console.log('✅ Working Account (john@doe.com):');
    if (johnAccount) {
      console.log(`  - ID: ${johnAccount.id}`);
      console.log(`  - Role: ${johnAccount.role}`);
      console.log(`  - Password Hash: ${johnAccount.password ? 'EXISTS' : 'MISSING'}`);
      console.log(`  - Password Hash Length: ${johnAccount.password?.length || 0}`);
    } else {
      console.log('  - NOT FOUND!');
    }
    
  } catch (error) {
    console.error('❌ Database check error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState();
