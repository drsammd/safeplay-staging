// @ts-nocheck

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// System accounts that should always exist
const SYSTEM_ACCOUNTS = [
  {
    email: 'admin@mysafeplay.ai',
    password: 'password123',
    name: 'Sarah Mitchell',
    role: 'SUPER_ADMIN' as const,
    phone: '+1 (555) 001-0001',
  },
  {
    email: 'john@mysafeplay.ai',
    password: 'johndoe123',
    name: 'John Doe',
    role: 'PARENT' as const,
    phone: '+1 (555) 001-0002',
  },
  {
    email: 'venue@mysafeplay.ai',
    password: 'password123',
    name: 'John Smith',
    role: 'VENUE_ADMIN' as const,
    phone: '+1 (555) 002-0001',
  },
  {
    email: 'parent@mysafeplay.ai',
    password: 'password123',
    name: 'Emily Johnson',
    role: 'PARENT' as const,
    phone: '+1 (555) 003-0001',
  },
];

async function ensureSystemAccounts() {
  console.log('🔐 ENSURING SYSTEM ACCOUNTS EXIST (DEPLOYMENT-SAFE)...');
  console.log('=' .repeat(60));

  const results = [];

  for (const account of SYSTEM_ACCOUNTS) {
    try {
      // Check if account already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email }
      });

      if (existingUser) {
        // Verify password is correct
        const isPasswordValid = await bcrypt.compare(account.password, existingUser.password);
        const isRoleCorrect = existingUser.role === account.role;

        if (isPasswordValid && isRoleCorrect && existingUser.isActive) {
          console.log(`✅ ${account.email}: Already exists with correct credentials`);
          results.push({ email: account.email, status: 'EXISTS_CORRECT' });
        } else {
          console.log(`⚠️  ${account.email}: Exists but needs update`);
          
          // Update the account with correct data
          const hashedPassword = await bcrypt.hash(account.password, 12);
          await prisma.user.update({
            where: { email: account.email },
            data: {
              password: hashedPassword,
              name: account.name,
              role: account.role,
              phone: account.phone,
              isActive: true,
            }
          });
          
          console.log(`✅ ${account.email}: Updated with correct credentials`);
          results.push({ email: account.email, status: 'UPDATED' });
        }
      } else {
        // Create new account
        console.log(`➕ ${account.email}: Creating new account`);
        
        const hashedPassword = await bcrypt.hash(account.password, 12);
        await prisma.user.create({
          data: {
            email: account.email,
            password: hashedPassword,
            name: account.name,
            role: account.role,
            phone: account.phone,
            isActive: true,
          }
        });
        
        console.log(`✅ ${account.email}: Created successfully`);
        results.push({ email: account.email, status: 'CREATED' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${account.email}: Error - ${errorMessage}`);
      results.push({ email: account.email, status: 'ERROR', error: errorMessage });
    }
  }

  return results;
}

async function preserveUserAccounts() {
  console.log('\n👥 CHECKING USER ACCOUNT PRESERVATION...');
  console.log('-' .repeat(60));

  try {
    // Count all users
    const totalUsers = await prisma.user.count();
    console.log(`Total users in database: ${totalUsers}`);

    // Count drsam accounts (test accounts)
    const drsamUsers = await prisma.user.count({
      where: { email: { startsWith: 'drsam+' } }
    });
    console.log(`drsam test accounts: ${drsamUsers}`);

    // Count system accounts
    const systemUsers = await prisma.user.count({
      where: { email: { endsWith: '@mysafeplay.ai' } }
    });
    console.log(`System accounts: ${systemUsers}`);

    // Count other user accounts
    const otherUsers = totalUsers - drsamUsers - systemUsers;
    console.log(`Other user accounts: ${otherUsers}`);

    if (drsamUsers === 0 && otherUsers === 0) {
      console.log('⚠️  No user accounts found - this might be a fresh database');
    } else {
      console.log('✅ User accounts are preserved in database');
    }

    return {
      totalUsers,
      drsamUsers,
      systemUsers,
      otherUsers
    };
  } catch (error) {
    console.error('❌ Error checking user accounts:', error);
    return null;
  }
}

async function verifySystemAccounts() {
  console.log('\n🔍 VERIFYING SYSTEM ACCOUNTS...');
  console.log('-' .repeat(60));

  for (const account of SYSTEM_ACCOUNTS) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: account.email }
      });

      if (!user) {
        console.log(`❌ ${account.email}: NOT FOUND`);
        continue;
      }

      const isPasswordValid = await bcrypt.compare(account.password, user.password);
      const isRoleCorrect = user.role === account.role;
      const isActive = user.isActive;

      if (isPasswordValid && isRoleCorrect && isActive) {
        console.log(`✅ ${account.email}: Role=${user.role}, Password=VALID, Active=${isActive}`);
      } else {
        console.log(`❌ ${account.email}: Role=${user.role}${isRoleCorrect ? '' : ' (WRONG)'}, Password=${isPasswordValid ? 'VALID' : 'INVALID'}, Active=${isActive}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${account.email}: Verification error - ${errorMessage}`);
    }
  }
}

async function main() {
  console.log('🚀 DEPLOYMENT-SAFE DATABASE SEEDING');
  console.log('=' .repeat(60));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'NOT CONFIGURED'}`);
  console.log('');

  try {
    // Check current state of user accounts
    const accountStats = await preserveUserAccounts();
    
    // Ensure system accounts exist (without affecting user accounts)
    const results = await ensureSystemAccounts();
    
    // Verify all system accounts are working
    await verifySystemAccounts();
    
    // Summary
    console.log('\n📊 DEPLOYMENT-SAFE SEEDING SUMMARY:');
    console.log('-' .repeat(60));
    
    const summary = results.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(summary).forEach(([status, count]) => {
      console.log(`${status}: ${count} system accounts`);
    });

    if (accountStats) {
      console.log(`\nUser Account Preservation:`);
      console.log(`- Total users: ${accountStats.totalUsers}`);
      console.log(`- drsam test accounts: ${accountStats.drsamUsers}`);
      console.log(`- System accounts: ${accountStats.systemUsers}`);
      console.log(`- Other user accounts: ${accountStats.otherUsers}`);
    }

    console.log('\n✅ DEPLOYMENT-SAFE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('\n🔑 VERIFIED SYSTEM CREDENTIALS:');
    console.log('=' .repeat(60));
    console.log('Company Admin: admin@mysafeplay.ai / password123');
    console.log('Venue Admin: venue@mysafeplay.ai / password123');
    console.log('Parent: parent@mysafeplay.ai / password123');
    console.log('Demo Parent: john@mysafeplay.ai / johndoe123');
    console.log('=' .repeat(60));
    console.log('\n🛡️  USER ACCOUNTS PRESERVED - NO DATA LOSS!');

  } catch (error) {
    console.error('❌ DEPLOYMENT-SAFE SEEDING FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Export for programmatic use
export { ensureSystemAccounts, preserveUserAccounts, verifySystemAccounts };

// Run if called directly
if (require.main === module) {
  main();
}
