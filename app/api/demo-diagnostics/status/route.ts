
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test database connection
    let databaseConnected = false;
    let totalUsers = 0;
    let demoAccounts: any[] = [];

    try {
      // Test database connection with a simple query
      await prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;

      // Get total user count
      totalUsers = await prisma.user.count();

      // Get demo accounts (predefined email patterns)
      const demoEmailPatterns = [
        'admin@mysafeplay.ai',
        'venue@mysafeplay.ai', 
        'parent@mysafeplay.ai',
        'john@mysafeplay.ai',
        'john@doe.com'
      ];

      demoAccounts = await prisma.user.findMany({
        where: {
          email: {
            in: demoEmailPatterns
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          twoFactorEnabled: true,
          phoneVerified: true,
          identityVerified: true,
          password: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Safely show password hash info
      demoAccounts = demoAccounts.map(account => ({
        ...account,
        passwordHash: account.password || 'No password set'
      }));

    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      databaseConnected = false;
    }

    // Check auth configuration
    const authConfigured = !!(process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL);

    const statusData = {
      totalUsers,
      demoAccounts,
      databaseConnected,
      authConfigured,
      lastCheck: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: statusData
    });

  } catch (error) {
    console.error('Status check error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        totalUsers: 0,
        demoAccounts: [],
        databaseConnected: false,
        authConfigured: false,
        lastCheck: new Date().toISOString()
      }
    });
  }
}
