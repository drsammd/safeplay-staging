
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    originalPassword: 'SafePlay2025Beta!',
    encodingTests: {}
  };

  const password = 'SafePlay2025Beta!';
  const hostname = 'db.gjkhbzedenvvwgqivkcf.supabase.co';
  
  // Test different encoding approaches
  const encodingVariations = [
    {
      name: 'No Encoding',
      password: password,
      encoded: false
    },
    {
      name: 'URL Encode Exclamation',
      password: password.replace('!', '%21'),
      encoded: true
    },
    {
      name: 'Full URL Encoding',
      password: encodeURIComponent(password),
      encoded: true
    },
    {
      name: 'Manual Exclamation Encoding',
      password: 'SafePlay2025Beta%21',
      encoded: true
    }
  ];

  for (const variation of encodingVariations) {
    const testResult: any = {
      name: variation.name,
      password: variation.password,
      encoded: variation.encoded,
      tests: {}
    };

    // Test URL construction
    try {
      const dbUrl = `postgresql://postgres:${variation.password}@${hostname}:5432/postgres`;
      testResult.tests.urlConstruction = {
        success: true,
        url: dbUrl.replace(variation.password, '***'),
        length: dbUrl.length
      };

      // Test URL parsing
      try {
        const httpUrl = dbUrl.replace('postgresql://', 'http://');
        const parsedUrl = new URL(httpUrl);
        testResult.tests.urlParsing = {
          success: true,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          username: parsedUrl.username,
          passwordLength: parsedUrl.password.length,
          pathname: parsedUrl.pathname
        };
      } catch (parseError: any) {
        testResult.tests.urlParsing = {
          success: false,
          error: parseError.message
        };
      }

      // Test Prisma URL validation
      try {
        const { PrismaClient } = await import('@prisma/client');
        
        const tempClient = new PrismaClient({
          datasources: {
            db: {
              url: dbUrl
            }
          }
        });

        testResult.tests.prismaClientCreation = {
          success: true,
          message: 'Prisma client created without URL format errors'
        };

        await tempClient.$disconnect();
      } catch (prismaError: any) {
        testResult.tests.prismaClientCreation = {
          success: false,
          error: prismaError.message,
          isParsing: prismaError.message.includes('invalid') || 
                    prismaError.message.includes('format') ||
                    prismaError.message.includes('parse')
        };
      }

    } catch (error: any) {
      testResult.tests.urlConstruction = {
        success: false,
        error: error.message
      };
    }

    results.encodingTests[variation.name] = testResult;
  }

  // Additional character encoding tests
  results.characterTests = {
    originalChar: '!',
    charCode: '!'.charCodeAt(0),
    urlEncoded: encodeURIComponent('!'),
    manualEncoded: '%21',
    decodeTest: {
      '%21': decodeURIComponent('%21'),
      'encoded!': encodeURIComponent('SafePlay2025Beta!')
    }
  };

  return NextResponse.json(results, { status: 200 });
}

export const dynamic = 'force-dynamic';
