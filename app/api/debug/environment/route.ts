
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Public endpoint to check environment and configuration - NO AUTH REQUIRED
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 DEBUG: Checking environment configuration...');

    // Safe environment checks (don't expose sensitive values)
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'NOT_SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
      VERCEL: process.env.VERCEL ? 'YES' : 'NO',
      VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_SET',
    };

    // NextAuth configuration check
    const nextAuthCheck = {
      url: process.env.NEXTAUTH_URL || 'NOT_CONFIGURED',
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      environment: process.env.NODE_ENV || 'development'
    };

    // Request information
    const requestInfo = {
      host: request.headers.get('host'),
      origin: request.headers.get('origin'),
      userAgent: request.headers.get('user-agent'),
      protocol: request.headers.get('x-forwarded-proto') || 'http',
      timestamp: new Date().toISOString()
    };

    const response = {
      success: true,
      message: 'Environment check completed',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      nextAuth: nextAuthCheck,
      request: requestInfo,
      deployment: {
        platform: process.env.VERCEL ? 'Vercel' : 'Other',
        region: process.env.VERCEL_REGION || 'Unknown',
        buildTime: process.env.BUILD_TIME || 'Unknown'
      }
    };

    console.log('✅ DEBUG: Environment check completed');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ DEBUG: Environment check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Environment check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
