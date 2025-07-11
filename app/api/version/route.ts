
import { NextResponse } from 'next/server';

export async function GET() {
  // Use hardcoded version since package.json cannot be modified
  const versionInfo = {
    version: '1.2.24-staging',
    buildTimestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'staging',
    commit: 'address-flow-and-signup-api-fixes',
    branch: 'main'
  };
  
  return NextResponse.json(versionInfo);
}
