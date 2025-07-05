
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Test credentials to verify
const TEST_CREDENTIALS = [
  { email: 'admin@mysafeplay.ai', password: 'password123' },
  { email: 'venue@mysafeplay.ai', password: 'password123' },
  { email: 'parent@mysafeplay.ai', password: 'password123' },
  { email: 'john@mysafeplay.ai', password: 'johndoe123' },
  // Test case variations
  { email: 'ADMIN@MYSAFEPLAY.AI', password: 'password123' },
  { email: 'Admin@MySafePlay.ai', password: 'password123' },
];

// Public endpoint to test authentication flow - NO AUTH REQUIRED
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST-AUTH: Starting authentication tests...');

    const results = [];

    for (const cred of TEST_CREDENTIALS) {
      try {
        console.log(`Testing ${cred.email}...`);

        // Simulate the exact auth flow from lib/auth.ts
        const normalizedEmail = cred.email.toLowerCase().trim();
        
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });

        let testResult = {
          email: cred.email,
          normalizedEmail,
          userFound: !!user,
          passwordValid: false,
          userDetails: null as any,
          authFlow: 'FAILED'
        };

        if (user) {
          const isPasswordValid = await bcrypt.compare(cred.password, user.password);
          
          testResult.passwordValid = isPasswordValid;
          testResult.userDetails = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            twoFactorEnabled: user.twoFactorEnabled
          };

          if (isPasswordValid) {
            if (user.twoFactorEnabled) {
              testResult.authFlow = '2FA_REQUIRED';
            } else {
              testResult.authFlow = 'SUCCESS';
            }
          } else {
            testResult.authFlow = 'INVALID_PASSWORD';
          }
        } else {
          testResult.authFlow = 'USER_NOT_FOUND';
        }

        results.push(testResult);
        console.log(`${cred.email}: ${testResult.authFlow}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ ${cred.email}: Test error - ${errorMessage}`);
        results.push({
          email: cred.email,
          error: errorMessage,
          authFlow: 'ERROR'
        });
      }
    }

    // Summary
    const summary = results.reduce((acc, result) => {
      const status = result.authFlow || 'ERROR';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Test database connectivity
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    
    const response = {
      success: true,
      message: 'Authentication tests completed',
      timestamp: new Date().toISOString(),
      database: {
        connected: !!dbTest,
        connectionTest: dbTest
      },
      summary,
      results,
      caseInsensitiveTest: {
        tested: results.filter(r => r.email !== r.normalizedEmail).length > 0,
        description: 'Email case normalization is working if uppercase emails succeed'
      }
    };

    console.log('✅ TEST-AUTH: Authentication tests completed');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ TEST-AUTH: Tests failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication tests failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint for simple auth test
export async function GET(request: NextRequest) {
  try {
    // Simple connectivity and user count test
    const userCount = await prisma.user.count();
    const demoCount = await prisma.user.count({
      where: {
        email: {
          in: [
            'admin@mysafeplay.ai',
            'venue@mysafeplay.ai', 
            'parent@mysafeplay.ai',
            'john@mysafeplay.ai'
          ]
        }
      }
    });

    const response = {
      success: true,
      message: 'Auth system connectivity test',
      timestamp: new Date().toISOString(),
      database: {
        totalUsers: userCount,
        demoAccountsFound: demoCount,
        expectedDemoAccounts: 4
      },
      ready: demoCount === 4
    };

    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Connectivity test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
