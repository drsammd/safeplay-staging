
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const stagingPassword = process.env.STAGING_PASSWORD;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      staging: process.env.STAGING_MODE === 'true',
      auth: {
        configured: !!nextAuthUrl,
        url: nextAuthUrl
      },
      security: {
        stakeholderAuth: !!stagingPassword,
        rateLimiting: true,
        botProtection: true
      }
    };

    return NextResponse.json(health, {
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }
}
