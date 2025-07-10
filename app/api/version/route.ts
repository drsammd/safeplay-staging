
import { NextResponse } from 'next/server';

export async function GET() {
  // Use hardcoded version since package.json cannot be modified
  const versionInfo = {
    version: '1.2.20-staging',
    buildTimestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'staging',
    commit: 'fixed-billing-address-population-and-enhanced-user-not-found-error-handling',
    branch: 'main'
  };
  
  return NextResponse.json(versionInfo);
}
