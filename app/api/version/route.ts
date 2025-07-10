
import { NextResponse } from 'next/server';

export async function GET() {
  // Use hardcoded version since package.json cannot be modified
  const versionInfo = {
    version: '1.2.17-staging',
    buildTimestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'staging',
    commit: 'enhanced-race-condition-fix-500ms-delay-10-retries',
    branch: 'main'
  };
  
  return NextResponse.json(versionInfo);
}
