
import { NextRequest, NextResponse } from 'next/server';
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
  const results = [];

  for (const account of CRITICAL_ACCOUNTS) {
    try {
      // Check if account already exists (case-insensitive)
      const existingUser = await prisma.user.findFirst({
        where: { 
          email: {
            equals: account.email,
            mode: 'insensitive'
          }
        }
      });

      if (existingUser) {
        // Verify password is correct
        const isPasswordValid = await bcrypt.compare(account.password, existingUser.password);
        const isRoleCorrect = existingUser.role === account.role;

        if (isPasswordValid && isRoleCorrect) {
          results.push({ email: account.email, status: 'EXISTS_CORRECT' });
        } else {
          // Update the account with correct data
          const hashedPassword = await bcrypt.hash(account.password, 12);
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              email: account.email.toLowerCase(), // Normalize to lowercase
              password: hashedPassword,
              name: account.name,
              role: account.role,
              phone: account.phone,
            }
          });
          
          results.push({ email: account.email, status: 'UPDATED' });
        }
      } else {
        // Create new account
        const hashedPassword = await bcrypt.hash(account.password, 12);
        await prisma.user.create({
          data: {
            email: account.email.toLowerCase(), // Normalize to lowercase
            password: hashedPassword,
            name: account.name,
            role: account.role,
            phone: account.phone,
          }
        });
        
        results.push({ email: account.email, status: 'CREATED' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({ email: account.email, status: 'ERROR', error: errorMessage });
    }
  }

  return results;
}

async function verifyAccounts() {
  const verificationResults = [];

  for (const account of CRITICAL_ACCOUNTS) {
    try {
      const user = await prisma.user.findFirst({
        where: { 
          email: {
            equals: account.email,
            mode: 'insensitive'
          }
        }
      });

      if (!user) {
        verificationResults.push({ 
          email: account.email, 
          status: 'NOT_FOUND' 
        });
        continue;
      }

      const isPasswordValid = await bcrypt.compare(account.password, user.password);
      const isRoleCorrect = user.role === account.role;

      verificationResults.push({
        email: account.email,
        status: isPasswordValid && isRoleCorrect ? 'VERIFIED' : 'INVALID',
        role: user.role,
        passwordValid: isPasswordValid,
        roleCorrect: isRoleCorrect
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      verificationResults.push({ 
        email: account.email, 
        status: 'ERROR', 
        error: errorMessage 
      });
    }
  }

  return verificationResults;
}

export async function POST(request: NextRequest) {
  try {
    // Basic authorization check - require a specific header or query param
    const authHeader = request.headers.get('authorization');
    const seedToken = new URL(request.url).searchParams.get('token');
    
    // Allow seeding with either Bearer token or query param (for easy manual triggering)
    const isAuthorized = authHeader === 'Bearer SafePlay-Deploy-2024' || 
                        seedToken === 'SafePlay-Deploy-2024';
    
    if (!isAuthorized) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized. Use ?token=SafePlay-Deploy-2024 or Authorization: Bearer SafePlay-Deploy-2024' 
        },
        { status: 401 }
      );
    }

    // Check database connection
    await prisma.$connect();

    // Ensure critical accounts exist
    const setupResults = await ensureCriticalAccounts();
    
    // Verify all accounts are working
    const verificationResults = await verifyAccounts();
    
    // Generate summary
    const summary = setupResults.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allVerified = verificationResults.every(r => r.status === 'VERIFIED');

    return NextResponse.json({
      success: allVerified,
      message: allVerified ? 'All demo accounts verified successfully!' : 'Some accounts need attention',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      setupResults,
      verificationResults,
      summary,
      credentials: {
        'Company Admin': 'admin@mysafeplay.ai / password123',
        'Venue Admin': 'venue@mysafeplay.ai / password123', 
        'Parent': 'parent@mysafeplay.ai / password123',
        'Demo Parent': 'john@mysafeplay.ai / johndoe123'
      }
    });

  } catch (error) {
    console.error('❌ Deployment seeding failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if accounts exist without modifying them
    const verificationResults = await verifyAccounts();
    
    const allVerified = verificationResults.every(r => r.status === 'VERIFIED');
    
    return NextResponse.json({
      success: allVerified,
      message: allVerified ? 'All demo accounts are properly configured' : 'Some accounts missing or invalid',
      timestamp: new Date().toISOString(),
      verificationResults,
      credentials: {
        'Company Admin': 'admin@mysafeplay.ai / password123',
        'Venue Admin': 'venue@mysafeplay.ai / password123',
        'Parent': 'parent@mysafeplay.ai / password123', 
        'Demo Parent': 'john@mysafeplay.ai / johndoe123'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
