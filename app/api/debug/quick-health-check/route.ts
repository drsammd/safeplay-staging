
import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/enhanced-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const healthCheck = {
    status: 'unknown',
    timestamp: new Date().toISOString(),
    checks: {
      environment: {
        status: 'unknown' as 'ok' | 'warning' | 'error',
        details: {}
      },
      database: {
        status: 'unknown' as 'ok' | 'warning' | 'error',
        details: {}
      },
      configuration: {
        status: 'unknown' as 'ok' | 'warning' | 'error', 
        details: {}
      }
    }
  };

  // Environment Check
  try {
    const missingEnvVars = [];
    if (!process.env.DATABASE_URL) missingEnvVars.push('DATABASE_URL');
    if (!process.env.NEXTAUTH_SECRET) missingEnvVars.push('NEXTAUTH_SECRET');
    
    if (missingEnvVars.length === 0) {
      healthCheck.checks.environment.status = 'ok';
      healthCheck.checks.environment.details = { message: 'All required environment variables are set' };
    } else {
      healthCheck.checks.environment.status = 'error';
      healthCheck.checks.environment.details = { 
        message: 'Missing required environment variables',
        missing: missingEnvVars
      };
    }
  } catch (error) {
    healthCheck.checks.environment.status = 'error';
    healthCheck.checks.environment.details = { 
      error: (error as Error).message 
    };
  }

  // Database Check
  try {
    const dbResult = await testDatabaseConnection();
    if (dbResult.connected) {
      healthCheck.checks.database.status = 'ok';
      healthCheck.checks.database.details = { 
        message: 'Database connection successful',
        latency: dbResult.latency
      };
    } else {
      healthCheck.checks.database.status = 'error';
      healthCheck.checks.database.details = { 
        message: 'Database connection failed',
        error: dbResult.error
      };
    }
  } catch (error) {
    healthCheck.checks.database.status = 'error';
    healthCheck.checks.database.details = { 
      error: (error as Error).message 
    };
  }

  // Configuration Check
  try {
    const warnings = [];
    
    // Check NEXTAUTH_URL
    if (process.env.NEXTAUTH_URL === 'http://localhost:3000' && process.env.VERCEL_URL) {
      warnings.push('NEXTAUTH_URL is set to localhost but running on Vercel');
    }
    
    // Check database URL format
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('supabase.co')) {
      warnings.push('Database URL does not appear to be Supabase - ensure it supports Vercel serverless');
    }

    if (warnings.length === 0) {
      healthCheck.checks.configuration.status = 'ok';
      healthCheck.checks.configuration.details = { message: 'Configuration looks good' };
    } else {
      healthCheck.checks.configuration.status = 'warning';
      healthCheck.checks.configuration.details = { 
        message: 'Configuration warnings detected',
        warnings
      };
    }
  } catch (error) {
    healthCheck.checks.configuration.status = 'error';
    healthCheck.checks.configuration.details = { 
      error: (error as Error).message 
    };
  }

  // Overall Status
  const hasErrors = Object.values(healthCheck.checks).some(check => check.status === 'error');
  const hasWarnings = Object.values(healthCheck.checks).some(check => check.status === 'warning');
  
  if (hasErrors) {
    healthCheck.status = 'error';
  } else if (hasWarnings) {
    healthCheck.status = 'warning';
  } else {
    healthCheck.status = 'ok';
  }

  const statusCode = healthCheck.status === 'error' ? 500 : 200;
  return NextResponse.json(healthCheck, { status: statusCode });
}
