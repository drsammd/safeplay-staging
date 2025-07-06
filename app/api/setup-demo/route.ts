
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Demo accounts that must exist
const DEMO_ACCOUNTS = [
  {
    email: 'admin@mysafeplay.ai',
    password: 'password123',
    name: 'Sarah Mitchell',
    role: 'SUPER_ADMIN' as const,
    phone: '+1 (555) 001-0001',
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
  {
    email: 'john@mysafeplay.ai',
    password: 'johndoe123',
    name: 'John Doe',
    role: 'PARENT' as const,
    phone: '+1 (555) 001-0002',
  },
];

// Public endpoint to create demo accounts - NO AUTH REQUIRED
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 SETUP-DEMO: Starting demo account setup...');

    const results = [];
    let created = 0;
    let updated = 0;
    let verified = 0;
    let errors = 0;

    for (const account of DEMO_ACCOUNTS) {
      try {
        console.log(`Processing ${account.email}...`);

        // Normalize email to lowercase for consistency
        const normalizedEmail = account.email.toLowerCase().trim();

        // Check if account exists
        const existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });

        if (existingUser) {
          // Verify password and role
          const isPasswordValid = await bcrypt.compare(account.password, existingUser.password);
          const isRoleCorrect = existingUser.role === account.role;

          if (isPasswordValid && isRoleCorrect) {
            console.log(`✅ ${account.email}: Already exists with correct credentials`);
            results.push({ 
              email: account.email, 
              status: 'VERIFIED', 
              id: existingUser.id,
              role: existingUser.role 
            });
            verified++;
          } else {
            // Update account with correct credentials
            console.log(`🔄 ${account.email}: Updating with correct credentials`);
            
            const hashedPassword = await bcrypt.hash(account.password, 12);
            const updatedUser = await prisma.user.update({
              where: { email: normalizedEmail },
              data: {
                password: hashedPassword,
                name: account.name,
                role: account.role,
                phone: account.phone,
              }
            });

            console.log(`✅ ${account.email}: Updated successfully`);
            results.push({ 
              email: account.email, 
              status: 'UPDATED', 
              id: updatedUser.id,
              role: updatedUser.role 
            });
            updated++;
          }
        } else {
          // Create new account
          console.log(`➕ ${account.email}: Creating new account`);
          
          const hashedPassword = await bcrypt.hash(account.password, 12);
          const newUser = await prisma.user.create({
            data: {
              email: normalizedEmail,
              password: hashedPassword,
              name: account.name,
              role: account.role,
              phone: account.phone,
            }
          });

          console.log(`✅ ${account.email}: Created successfully`);
          results.push({ 
            email: account.email, 
            status: 'CREATED', 
            id: newUser.id,
            role: newUser.role 
          });
          created++;
        }
      } catch (accountError) {
        const errorMessage = accountError instanceof Error ? accountError.message : String(accountError);
        console.error(`❌ ${account.email}: Error - ${errorMessage}`);
        results.push({ 
          email: account.email, 
          status: 'ERROR', 
          error: errorMessage 
        });
        errors++;
      }
    }

    // Final verification - test password hashing for each account
    console.log('🔍 Performing final verification...');
    const verificationResults = [];

    for (const account of DEMO_ACCOUNTS) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: account.email.toLowerCase() }
        });

        if (user) {
          const isPasswordValid = await bcrypt.compare(account.password, user.password);
          verificationResults.push({
            email: account.email,
            exists: true,
            passwordValid: isPasswordValid,
            role: user.role,
            expectedRole: account.role,
            roleCorrect: user.role === account.role
          });
        } else {
          verificationResults.push({
            email: account.email,
            exists: false,
            passwordValid: false,
            roleCorrect: false
          });
        }
      } catch (verifyError) {
        verificationResults.push({
          email: account.email,
          error: verifyError instanceof Error ? verifyError.message : String(verifyError)
        });
      }
    }

    const response = {
      success: true,
      message: 'Demo account setup completed',
      timestamp: new Date().toISOString(),
      summary: {
        total: DEMO_ACCOUNTS.length,
        created,
        updated,
        verified,
        errors
      },
      results,
      verification: verificationResults,
      credentials: DEMO_ACCOUNTS.map(acc => ({
        email: acc.email,
        password: acc.password,
        role: acc.role
      }))
    };

    console.log('✅ SETUP-DEMO: Demo account setup completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ SETUP-DEMO: Setup failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Demo setup failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Also allow GET to check demo account status
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 SETUP-DEMO: Checking demo account status...');

    const statusResults = [];

    for (const account of DEMO_ACCOUNTS) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: account.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            createdAt: true
          }
        });

        if (user) {
          // Test password without exposing it
          const userWithPassword = await prisma.user.findUnique({
            where: { email: account.email.toLowerCase() }
          });
          
          const isPasswordValid = userWithPassword ? 
            await bcrypt.compare(account.password, userWithPassword.password) : false;

          statusResults.push({
            email: account.email,
            exists: true,
            passwordValid: isPasswordValid,
            roleCorrect: user.role === account.role,
            user: {
              id: user.id,
              name: user.name,
              role: user.role,
              phone: user.phone,
              created: user.createdAt
            }
          });
        } else {
          statusResults.push({
            email: account.email,
            exists: false,
            passwordValid: false,
            roleCorrect: false
          });
        }
      } catch (error) {
        statusResults.push({
          email: account.email,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const response = {
      success: true,
      message: 'Demo account status check completed',
      timestamp: new Date().toISOString(),
      accounts: statusResults,
      credentials: DEMO_ACCOUNTS.map(acc => ({
        email: acc.email,
        password: acc.password,
        role: acc.role
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ SETUP-DEMO: Status check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
