
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Public endpoint to check database state - NO AUTH REQUIRED
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Checking database users...');

    // Get all users with basic info
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Count by role
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Check for demo accounts specifically
    const demoEmails = [
      'admin@mysafeplay.ai',
      'venue@mysafeplay.ai', 
      'parent@mysafeplay.ai',
      'john@mysafeplay.ai'
    ];

    const demoAccountsStatus = demoEmails.map(email => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return {
        email,
        exists: !!user,
        role: user?.role || null,
        name: user?.name || null,
        id: user?.id || null
      };
    });

    // Check database connection
    const dbHealth = await prisma.$queryRaw`SELECT 1 as test`;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        connected: !!dbHealth,
        totalUsers: users.length,
        roleStats,
      },
      demoAccounts: demoAccountsStatus,
      allUsers: users.map(user => ({
        email: user.email,
        role: user.role,
        name: user.name,
        created: user.createdAt,
        verified: {
          email: user.emailVerified,
          phone: user.phoneVerified,
          twoFactor: user.twoFactorEnabled
        }
      }))
    };

    console.log('✅ DEBUG: Database check completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ DEBUG: Database check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: 'Database connection failed'
      }
    }, { status: 500 });
  }
}
