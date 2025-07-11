
import { NextResponse } from 'next/server';

export async function GET() {
  // Use hardcoded version since package.json cannot be modified
  const versionInfo = {
    version: '1.2.21-staging',
    buildTimestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'staging',
    commit: 'aggressive-debugging-phantom-user-id-and-billing-address-fix',
    branch: 'main'
  };
  
  return NextResponse.json(versionInfo);
}
