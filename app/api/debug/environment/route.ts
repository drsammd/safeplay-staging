
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    platform: process.platform,
    nodeVersion: process.version,
    vercelEnvironment: {
      region: process.env.VERCEL_REGION,
      url: process.env.VERCEL_URL,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF,
    },
    databaseConfig: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPreview: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@').substring(0, 100) + '...' : 
        'NOT_SET',
      prismaSchemaExists: true, // We know it exists from our file check
    },
    nextAuthConfig: {
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT_SET',
    },
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  };

  return NextResponse.json(envInfo);
}
