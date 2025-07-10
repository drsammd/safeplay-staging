
import { NextResponse } from 'next/server';

export async function GET() {
  // Use hardcoded version since package.json cannot be modified
  const versionInfo = {
    version: '1.2.18-staging',
    buildTimestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'staging',
    commit: 'comprehensive-debugging-user-not-found-geoapify-multiple-suggestions',
    branch: 'main'
  };
  
  return NextResponse.json(versionInfo);
}
