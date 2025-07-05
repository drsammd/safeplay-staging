
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

interface DiagnosticResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export async function GET() {
  const results: DiagnosticResult[] = [];
  const recommendations: string[] = [];
  
  try {
    console.log('🔍 Starting complete authentication diagnostic...');

    // 1. Database Connection Tests
    try {
      await prisma.$queryRaw`SELECT 1`;
      results.push({
        category: 'Database',
        test: 'Connection',
        status: 'pass',
        message: 'Database connection successful'
      });

      // Test basic queries
      const userCount = await prisma.user.count();
      results.push({
        category: 'Database',
        test: 'Query Operations',
        status: 'pass',
        message: `Database queries working (${userCount} users found)`,
        details: { userCount }
      });

    } catch (dbError) {
      results.push({
        category: 'Database',
        test: 'Connection',
        status: 'fail',
        message: `Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
        details: { error: dbError }
      });
      recommendations.push('Check database connection and configuration');
    }

    // 2. Configuration Tests
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const databaseUrl = process.env.DATABASE_URL;

    results.push({
      category: 'Configuration',
      test: 'NEXTAUTH_SECRET',
      status: nextAuthSecret ? 'pass' : 'fail',
      message: nextAuthSecret ? 'NextAuth secret configured' : 'NextAuth secret missing',
      details: { hasSecret: !!nextAuthSecret, length: nextAuthSecret?.length }
    });

    results.push({
      category: 'Configuration',
      test: 'NEXTAUTH_URL',
      status: nextAuthUrl ? 'pass' : 'warning',
      message: nextAuthUrl ? `NextAuth URL: ${nextAuthUrl}` : 'NextAuth URL not set (may cause issues)',
      details: { url: nextAuthUrl }
    });

    results.push({
      category: 'Configuration',
      test: 'DATABASE_URL',
      status: databaseUrl ? 'pass' : 'fail',
      message: databaseUrl ? 'Database URL configured' : 'Database URL missing',
      details: { hasDatabaseUrl: !!databaseUrl }
    });

    if (!nextAuthSecret) {
      recommendations.push('Set NEXTAUTH_SECRET environment variable');
    }
    if (!nextAuthUrl) {
      recommendations.push('Set NEXTAUTH_URL environment variable for production');
    }

    // 3. Demo Accounts Tests
    const demoEmailPatterns = [
      'admin@mysafeplay.ai',
      'venue@mysafeplay.ai', 
      'parent@mysafeplay.ai',
      'john@mysafeplay.ai'
    ];

    const demoUsers = await prisma.user.findMany({
      where: {
        email: {
          in: demoEmailPatterns
        }
      },
      select: {
        email: true,
        name: true,
        role: true,
        password: true,
        twoFactorEnabled: true,
        createdAt: true
      }
    });

    if (demoUsers.length === 0) {
      results.push({
        category: 'Demo Accounts',
        test: 'Account Existence',
        status: 'fail',
        message: 'No demo accounts found',
        details: { expectedEmails: demoEmailPatterns, foundCount: 0 }
      });
      recommendations.push('Create demo accounts using the Force Create Demo tool');
    } else {
      results.push({
        category: 'Demo Accounts',
        test: 'Account Existence',
        status: demoUsers.length === demoEmailPatterns.length ? 'pass' : 'warning',
        message: `Found ${demoUsers.length}/${demoEmailPatterns.length} demo accounts`,
        details: { 
          found: demoUsers.map(u => ({ email: u.email, role: u.role })),
          expected: demoEmailPatterns 
        }
      });

      if (demoUsers.length < demoEmailPatterns.length) {
        recommendations.push('Some demo accounts are missing - consider recreating them');
      }
    }

    // Test password hashing for demo accounts
    for (const user of demoUsers) {
      if (!user.password) {
        results.push({
          category: 'Demo Accounts',
          test: `Password Hash - ${user.email}`,
          status: 'fail',
          message: `${user.email} has no password set`,
          details: { email: user.email }
        });
        recommendations.push(`Set password for ${user.email}`);
      } else if (!user.password.startsWith('$2')) {
        results.push({
          category: 'Demo Accounts',
          test: `Password Hash - ${user.email}`,
          status: 'fail',
          message: `${user.email} password is not properly hashed`,
          details: { email: user.email, hashPrefix: user.password.substring(0, 10) }
        });
        recommendations.push(`Re-hash password for ${user.email}`);
      } else {
        results.push({
          category: 'Demo Accounts',
          test: `Password Hash - ${user.email}`,
          status: 'pass',
          message: `${user.email} has properly hashed password`,
          details: { email: user.email, hashPrefix: user.password.substring(0, 10) }
        });
      }
    }

    // 4. Authentication Flow Tests
    if (demoUsers.length > 0) {
      const testUser = demoUsers[0];
      const testPasswords = ['password123', 'johndoe123'];
      
      let passwordWorked = false;
      for (const testPassword of testPasswords) {
        try {
          if (testUser.password) {
            const isValid = await bcrypt.compare(testPassword, testUser.password);
            if (isValid) {
              passwordWorked = true;
              results.push({
                category: 'Authentication',
                test: 'Password Verification',
                status: 'pass',
                message: `Password verification working for ${testUser.email}`,
                details: { email: testUser.email, testedPassword: testPassword }
              });
              break;
            }
          }
        } catch (error) {
          results.push({
            category: 'Authentication',
            test: 'Password Verification',
            status: 'fail',
            message: `Password verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: { email: testUser.email, error }
          });
        }
      }

      if (!passwordWorked && testUser.password) {
        results.push({
          category: 'Authentication',
          test: 'Password Verification',
          status: 'fail',
          message: `No demo passwords work for ${testUser.email}`,
          details: { email: testUser.email, testedPasswords: testPasswords }
        });
        recommendations.push('Demo account passwords may be incorrect - recreate demo accounts');
      }
    }

    // Check 2FA status
    const users2FAEnabled = demoUsers.filter(u => u.twoFactorEnabled);
    if (users2FAEnabled.length > 0) {
      results.push({
        category: 'Authentication',
        test: 'Two-Factor Authentication',
        status: 'warning',
        message: `${users2FAEnabled.length} demo accounts have 2FA enabled (may complicate testing)`,
        details: { users2FA: users2FAEnabled.map(u => u.email) }
      });
      recommendations.push('Consider disabling 2FA for demo accounts to simplify testing');
    } else {
      results.push({
        category: 'Authentication',
        test: 'Two-Factor Authentication',
        status: 'pass',
        message: 'No demo accounts have 2FA enabled (good for testing)',
        details: { users2FA: [] }
      });
    }

    // 5. Determine Overall Status
    const hasFailures = results.some(r => r.status === 'fail');
    const hasWarnings = results.some(r => r.status === 'warning');
    
    let overallStatus: 'healthy' | 'issues' | 'critical';
    let summary: string;

    if (hasFailures) {
      overallStatus = 'critical';
      summary = 'Critical issues found that prevent authentication from working';
    } else if (hasWarnings) {
      overallStatus = 'issues';
      summary = 'Minor issues detected that may affect authentication reliability';
    } else {
      overallStatus = 'healthy';
      summary = 'All authentication components are working correctly';
    }

    console.log(`✅ Diagnostic complete: ${overallStatus} (${results.length} tests run)`);

    return NextResponse.json({
      overallStatus,
      summary,
      results,
      recommendations,
      timestamp: new Date().toISOString(),
      testsRun: results.length
    });

  } catch (error) {
    console.error('❌ Complete diagnostic error:', error);
    
    return NextResponse.json({
      overallStatus: 'critical',
      summary: 'Diagnostic system failure',
      results: [{
        category: 'System',
        test: 'Diagnostic Execution',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown diagnostic error',
        details: { error }
      }],
      recommendations: ['Check system logs', 'Verify API endpoints', 'Check database connectivity'],
      timestamp: new Date().toISOString(),
      testsRun: 0
    });
  }
}
