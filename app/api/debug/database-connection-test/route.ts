
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface ConnectionTestResult {
  status: 'success' | 'error';
  timestamp: string;
  environment: string;
  databaseUrl: string;
  prismaVersion: string;
  tests: {
    basicConnection: { success: boolean; error?: string; duration?: number };
    simpleQuery: { success: boolean; error?: string; duration?: number; count?: number };
    modelAccess: { success: boolean; error?: string; duration?: number };
  };
  networkInfo?: {
    dnsResolution?: boolean;
    portReachable?: boolean;
    sslHandshake?: boolean;
  };
  recommendations: string[];
}

export async function GET() {
  const startTime = Date.now();
  const result: ConnectionTestResult = {
    status: 'error',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    databaseUrl: process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@') : 'NOT_SET',
    prismaVersion: require('@prisma/client/package.json').version,
    tests: {
      basicConnection: { success: false },
      simpleQuery: { success: false },
      modelAccess: { success: false }
    },
    recommendations: []
  };

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    result.recommendations.push('DATABASE_URL environment variable is not set');
    return NextResponse.json(result, { status: 500 });
  }

  // Parse database URL for validation
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    result.networkInfo = {
      dnsResolution: false,
      portReachable: false,
      sslHandshake: false
    };

    // Check database URL format
    if (dbUrl.protocol !== 'postgresql:') {
      result.recommendations.push(`Invalid database protocol: ${dbUrl.protocol}. Expected: postgresql:`);
    }

    if (!dbUrl.hostname) {
      result.recommendations.push('Database hostname is missing from DATABASE_URL');
    } else if (dbUrl.hostname.includes('supabase.co')) {
      result.recommendations.push('Detected Supabase database - ensure IP whitelisting allows 0.0.0.0/0 for Vercel');
    }

    if (!dbUrl.port || dbUrl.port === '80' || dbUrl.port === '443') {
      result.recommendations.push(`Unusual database port: ${dbUrl.port || 'default'}. PostgreSQL typically uses port 5432`);
    }

  } catch (urlError) {
    result.recommendations.push(`Invalid DATABASE_URL format: ${(urlError as Error).message}`);
    return NextResponse.json(result, { status: 500 });
  }

  let prisma: PrismaClient | null = null;

  try {
    // Test 1: Basic Prisma Connection
    const connectionStart = Date.now();
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    await prisma.$connect();
    result.tests.basicConnection = { 
      success: true, 
      duration: Date.now() - connectionStart 
    };

    // Test 2: Simple Raw Query
    const queryStart = Date.now();
    const rawResult = await prisma.$queryRaw`SELECT 1 as test`;
    result.tests.simpleQuery = { 
      success: true, 
      duration: Date.now() - queryStart,
      count: Array.isArray(rawResult) ? rawResult.length : 1
    };

    // Test 3: Model Access Test
    const modelStart = Date.now();
    const userCount = await prisma.user.count();
    result.tests.modelAccess = { 
      success: true, 
      duration: Date.now() - modelStart
    };

    result.status = 'success';
    result.recommendations.push('All database connection tests passed successfully');

    if (result.tests.basicConnection.duration && result.tests.basicConnection.duration > 5000) {
      result.recommendations.push('Connection time is slow (>5s) - check network latency');
    }

    if (userCount === 0) {
      result.recommendations.push('No users found in database - may need to run seed script');
    }

  } catch (error) {
    const err = error as Error;
    
    // Categorize different types of errors
    if (err.message.includes("Can't reach database server")) {
      result.tests.basicConnection.error = `Network connectivity issue: ${err.message}`;
      result.recommendations.push('Database server is unreachable - check firewall, IP whitelisting, and network connectivity');
      
      if (err.message.includes('supabase.co')) {
        result.recommendations.push('For Supabase: Go to Project Settings > Database > Network Restrictions and ensure "Restrict to project" is disabled or add 0.0.0.0/0 to allowed IPs');
      }
    } else if (err.message.includes('password authentication failed')) {
      result.tests.basicConnection.error = `Authentication failed: ${err.message}`;
      result.recommendations.push('Database credentials are incorrect - verify username and password in DATABASE_URL');
    } else if (err.message.includes('database') && err.message.includes('does not exist')) {
      result.tests.basicConnection.error = `Database not found: ${err.message}`;
      result.recommendations.push('Database does not exist - create the database or check DATABASE_URL database name');
    } else if (err.message.includes('SSL')) {
      result.tests.basicConnection.error = `SSL/TLS issue: ${err.message}`;
      result.recommendations.push('SSL connection failed - check if database requires SSL and if certificates are valid');
    } else if (err.message.includes('timeout')) {
      result.tests.basicConnection.error = `Connection timeout: ${err.message}`;
      result.recommendations.push('Connection timed out - check network latency and database server responsiveness');
    } else if (err.message.includes('ENOTFOUND')) {
      result.tests.basicConnection.error = `DNS resolution failed: ${err.message}`;
      result.recommendations.push('Cannot resolve database hostname - check DNS settings and hostname in DATABASE_URL');
    } else if (err.message.includes('ECONNREFUSED')) {
      result.tests.basicConnection.error = `Connection refused: ${err.message}`;
      result.recommendations.push('Database server refused connection - check if database is running and port is correct');
    } else {
      result.tests.basicConnection.error = `Unknown error: ${err.message}`;
      result.recommendations.push('Unknown database error - check logs for more details');
    }

    result.recommendations.push(`Full error details: ${err.stack || err.message}`);

  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }
  }

  const statusCode = result.status === 'success' ? 200 : 500;
  return NextResponse.json(result, { status: statusCode });
}
