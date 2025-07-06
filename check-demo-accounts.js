
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkDemoAccounts() {
  console.log('🔍 CHECKING DEMO ACCOUNT STATUS...');
  console.log('=' .repeat(60));

  const expectedAccounts = [
    { email: 'john@doe.com', password: 'johndoe123', role: 'PARENT', label: 'Demo Parent (John)' },
    { email: 'venue@mysafeplay.ai', password: 'password123', role: 'VENUE_ADMIN', label: 'Venue Admin' },
    { email: 'admin@mysafeplay.ai', password: 'password123', role: 'SUPER_ADMIN', label: 'Company Admin' },
    { email: 'parent@mysafeplay.ai', password: 'password123', role: 'PARENT', label: 'Demo Parent' },
  ];

  // Also check the case-sensitive versions the user tried
  const userTriedAccounts = [
    { email: 'venue@SafePlay.com', password: 'password123', role: 'VENUE_ADMIN', label: 'User Tried: Venue (wrong case)' },
    { email: 'Admin@SafePlay.com', password: 'Password123', role: 'SUPER_ADMIN', label: 'User Tried: Admin (wrong case)' },
  ];

  console.log('📋 EXPECTED ACCOUNTS STATUS:');
  console.log('-' .repeat(40));

  for (const account of expectedAccounts) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: account.email }
      });

      if (!user) {
        console.log(`❌ ${account.label}: NOT FOUND - ${account.email}`);
        continue;
      }

      const isPasswordValid = await bcrypt.compare(account.password, user.password);
      const isRoleCorrect = user.role === account.role;

      if (isPasswordValid && isRoleCorrect) {
        console.log(`✅ ${account.label}: WORKING - ${account.email} / ${account.password}`);
      } else {
        console.log(`⚠️  ${account.label}: EXISTS but BROKEN - ${account.email}`);
        console.log(`   Role: Expected ${account.role}, Got ${user.role} ${isRoleCorrect ? '✅' : '❌'}`);
        console.log(`   Password: ${isPasswordValid ? 'Valid ✅' : 'Invalid ❌'}`);
      }
    } catch (error) {
      console.log(`💥 ${account.label}: ERROR - ${error.message}`);
    }
  }

  console.log('\n🚫 USER TRIED (WRONG CASE):');
  console.log('-' .repeat(40));

  for (const account of userTriedAccounts) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: account.email }
      });

      if (!user) {
        console.log(`❌ ${account.label}: NOT FOUND - ${account.email}`);
      } else {
        console.log(`❓ ${account.label}: EXISTS - ${account.email}`);
      }
    } catch (error) {
      console.log(`💥 ${account.label}: ERROR - ${error.message}`);
    }
  }

  // Get all users to see what actually exists
  console.log('\n📊 ALL USERS IN DATABASE:');
  console.log('-' .repeat(40));

  try {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { role: 'asc' }
    });

    if (allUsers.length === 0) {
      console.log('❌ NO USERS FOUND - Database may not be seeded');
    } else {
      allUsers.forEach(user => {
        console.log(`${user.role.padEnd(15)} | ${user.email.padEnd(25)} | ${user.name}`);
      });
    }
  } catch (error) {
    console.log(`💥 ERROR fetching users: ${error.message}`);
  }

  console.log('\n' .repeat(2));
  console.log('🎯 CORRECT DEMO CREDENTIALS:');
  console.log('=' .repeat(60));
  console.log('✅ Parent (John): john@doe.com / johndoe123');
  console.log('✅ Venue Admin: venue@mysafeplay.ai / password123');
  console.log('✅ Company Admin: admin@mysafeplay.ai / password123');
  console.log('✅ Parent Demo: parent@mysafeplay.ai / password123');
  console.log('=' .repeat(60));
}

checkDemoAccounts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
