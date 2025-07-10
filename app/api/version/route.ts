
import { NextResponse } from 'next/server';

export async function GET() {
  // Use hardcoded version since package.json cannot be modified
  const versionInfo = {
    version: '1.2.14-staging',
    buildTimestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'staging',
    commit: 'critical-fixes-v1.2.13',
    branch: 'main'
  };
  
  return NextResponse.json(versionInfo);
}
