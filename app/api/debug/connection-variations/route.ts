
import { NextRequest, NextResponse } from 'next/server';

// Test different database connection variations
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test different URL variations
  const variations = [
    {
      name: 'Current Local (.env)',
      url: 'postgresql://postgres:SafePlay2025Beta!@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres'
    },
    {
      name: 'Current Vercel (with pgbouncer)',
      url: 'postgresql://postgres:SafePlay2025Beta!@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1'
    },
    {
      name: 'URL Encoded Password',
      url: 'postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres'
    },
    {
      name: 'URL Encoded with pgbouncer',
      url: 'postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1'
    },
    {
      name: 'Direct Connection (no pgbouncer)',
      url: 'postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres?sslmode=require'
    },
    {
      name: 'Alternative SSL Mode',
      url: 'postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres?sslmode=prefer'
    }
  ];

  for (const variation of variations) {
    const testResult: any = {
      name: variation.name,
      url: variation.url.replace(/SafePlay2025Beta[!%21]/, 'SafePlay2025Beta***'),
      tests: {}
    };

    try {
      // Test URL parsing
      testResult.tests.urlParsing = {
        success: true,
        parsedUrl: new URL(variation.url.replace('postgresql://', 'http://'))
      };
    } catch (error: any) {
      testResult.tests.urlParsing = {
        success: false,
        error: error.message
      };
    }

    // Test DNS resolution for the hostname
    try {
      const hostname = 'db.gjkhbzedenvvwgqivkcf.supabase.co';
      const dnsStart = Date.now();
      
      // Use fetch to test DNS resolution (will fail but we can catch DNS errors)
      try {
        await fetch(`https://${hostname}:5432`, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
      } catch (fetchError: any) {
        testResult.tests.dnsResolution = {
          hostname,
          durationMs: Date.now() - dnsStart,
          reachable: !fetchError.message.includes('getaddrinfo ENOTFOUND'),
          error: fetchError.message
        };
      }
    } catch (error: any) {
      testResult.tests.dnsResolution = {
        error: error.message
      };
    }

    // Test connection string format validation
    try {
      const { PrismaClient } = await import('@prisma/client');
      
      // Create a temporary Prisma client with this URL
      const tempClient = new PrismaClient({
        datasources: {
          db: {
            url: variation.url
          }
        }
      });

      testResult.tests.prismaValidation = {
        success: true,
        message: 'Prisma client created successfully'
      };

      // Try to connect (this will likely fail but we can see the specific error)
      try {
        await tempClient.$connect();
        testResult.tests.connection = {
          success: true,
          message: 'Connection successful'
        };
        await tempClient.$disconnect();
      } catch (connError: any) {
        testResult.tests.connection = {
          success: false,
          error: connError.message,
          code: connError.code
        };
        await tempClient.$disconnect();
      }

    } catch (prismaError: any) {
      testResult.tests.prismaValidation = {
        success: false,
        error: prismaError.message
      };
    }

    results.tests.push(testResult);
  }

  return NextResponse.json(results, { status: 200 });
}

export const dynamic = 'force-dynamic';
