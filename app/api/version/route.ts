
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '1.5.16',
    environment: process.env.NODE_ENV || 'development',
    buildTime: new Date().toISOString(),
    commit: 'authentication-fixes-v1.5.16',
    branch: 'main'
  });
}
