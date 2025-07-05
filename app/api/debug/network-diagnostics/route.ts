
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    networkTests: {}
  };

  const hostname = 'db.gjkhbzedenvvwgqivkcf.supabase.co';
  const port = 5432;

  // Test 1: Basic DNS resolution via fetch
  try {
    const dnsStart = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      await fetch(`https://${hostname}`, { 
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      results.networkTests.dnsViaFetch = {
        success: true,
        durationMs: Date.now() - dnsStart,
        hostname
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      results.networkTests.dnsViaFetch = {
        success: false,
        durationMs: Date.now() - dnsStart,
        hostname,
        error: fetchError.message,
        isTimeout: fetchError.name === 'AbortError',
        isDnsFailure: fetchError.message.includes('getaddrinfo ENOTFOUND') || 
                     fetchError.message.includes('ENOTFOUND')
      };
    }
  } catch (error: any) {
    results.networkTests.dnsViaFetch = {
      success: false,
      error: error.message
    };
  }

  // Test 2: Alternative Supabase endpoints
  const subaseTests = [
    'supabase.co',
    'api.supabase.co',
    'app.supabase.com'
  ];

  results.networkTests.supabaseEndpoints = {};

  for (const endpoint of subaseTests) {
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(`https://${endpoint}`, { 
          method: 'HEAD',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        results.networkTests.supabaseEndpoints[endpoint] = {
          success: true,
          durationMs: Date.now() - start,
          status: response.status,
          statusText: response.statusText
        };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        results.networkTests.supabaseEndpoints[endpoint] = {
          success: false,
          durationMs: Date.now() - start,
          error: fetchError.message,
          isTimeout: fetchError.name === 'AbortError'
        };
      }
    } catch (error: any) {
      results.networkTests.supabaseEndpoints[endpoint] = {
        success: false,
        error: error.message
      };
    }
  }

  // Test 3: Check if we can resolve common public DNS
  const publicDnsTests = [
    'google.com',
    'cloudflare.com',
    'github.com'
  ];

  results.networkTests.publicDnsTests = {};

  for (const domain of publicDnsTests) {
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        await fetch(`https://${domain}`, { 
          method: 'HEAD',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        results.networkTests.publicDnsTests[domain] = {
          success: true,
          durationMs: Date.now() - start
        };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        results.networkTests.publicDnsTests[domain] = {
          success: false,
          durationMs: Date.now() - start,
          error: fetchError.message
        };
      }
    } catch (error: any) {
      results.networkTests.publicDnsTests[domain] = {
        success: false,
        error: error.message
      };
    }
  }

  // Test 4: Environment variable inspection
  results.networkTests.environmentCheck = {
    databaseUrl: process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@') : 'NOT_SET',
    nextauthUrl: process.env.NEXTAUTH_URL || 'NOT_SET',
    nodeEnv: process.env.NODE_ENV || 'NOT_SET',
    vercelUrl: process.env.VERCEL_URL || 'NOT_SET',
    vercelEnv: process.env.VERCEL_ENV || 'NOT_SET'
  };

  return NextResponse.json(results, { status: 200 });
}

export const dynamic = 'force-dynamic';
