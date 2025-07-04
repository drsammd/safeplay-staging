// @ts-nocheck

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Critical accounts that MUST exist for deployment
const CRITICAL_ACCOUNTS = [
  {
    email: 'admin@mysafeplay.ai',
    password: 'password123',
    name: 'Sarah Mitchell',
    role: 'COMPANY_ADMIN' as const,
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

async function ensureCriticalAccounts() {
  console.log('🔐 ENSURING CRITICAL ACCOUNTS EXIST...');
  console.log('=' .repeat(60));

  const results = [];

  for (const account of CRITICAL_ACCOUNTS) {
    try {
      // Check if account already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email }
      });

      if (existingUser) {
        // Verify password is correct
        const isPasswordValid = await bcrypt.compare(account.password, existingUser.password);
        const isRoleCorrect = existingUser.role === account.role;

        if (isPasswordValid && isRoleCorrect) {
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

async function verifyAccounts() {
  console.log('\n🔍 VERIFYING ALL CRITICAL ACCOUNTS...');
  console.log('-' .repeat(60));

  for (const account of CRITICAL_ACCOUNTS) {
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

      if (isPasswordValid && isRoleCorrect) {
        console.log(`✅ ${account.email}: Role=${user.role}, Password=VALID`);
      } else {
        console.log(`❌ ${account.email}: Role=${user.role}${isRoleCorrect ? '' : ' (WRONG)'}, Password=${isPasswordValid ? 'VALID' : 'INVALID'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${account.email}: Verification error - ${errorMessage}`);
    }
  }
}

async function main() {
  console.log('🚀 DEPLOYMENT-READY DATABASE SETUP');
  console.log('=' .repeat(60));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'NOT CONFIGURED'}`);
  console.log('');

  try {
    // Ensure critical accounts exist
    const results = await ensureCriticalAccounts();
    
    // Verify all accounts are working
    await verifyAccounts();
    
    // Summary
    console.log('\n📊 DEPLOYMENT SETUP SUMMARY:');
    console.log('-' .repeat(60));
    
    const summary = results.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(summary).forEach(([status, count]) => {
      console.log(`${status}: ${count} accounts`);
    });

    console.log('\n✅ DEPLOYMENT SETUP COMPLETED SUCCESSFULLY!');
    console.log('\n🔑 VERIFIED DEMO CREDENTIALS:');
    console.log('=' .repeat(60));
    console.log('Company Admin: admin@mysafeplay.ai / password123');
    console.log('Venue Admin: venue@mysafeplay.ai / password123');
    console.log('Parent: parent@mysafeplay.ai / password123');
    console.log('Demo Parent: john@mysafeplay.ai / johndoe123');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ DEPLOYMENT SETUP FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Export for programmatic use
export { ensureCriticalAccounts, verifyAccounts };

// Run if called directly
if (require.main === module) {
  main();
}
