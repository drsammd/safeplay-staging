
import { NextResponse } from 'next/server';

export async function GET() {
  // Use hardcoded version since package.json cannot be modified
  const versionInfo = {
    version: '1.2.28-staging',
    buildTimestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'staging',
    commit: 'address-autocomplete-ui-fixes-and-user-auth-sync-fixed',
    branch: 'main'
  };
  
  return NextResponse.json(versionInfo);
}
