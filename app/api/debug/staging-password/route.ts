import { NextResponse } from 'next/server';
import { STAGING_PASSWORD } from '@/lib/staging-auth';

export async function GET() {
  return NextResponse.json({
    envValue: process.env.STAGING_PASSWORD,
    constantValue: STAGING_PASSWORD,
    envLength: process.env.STAGING_PASSWORD?.length,
    constantLength: STAGING_PASSWORD.length,
    envCharCodes: process.env.STAGING_PASSWORD?.split('').map(c => c.charCodeAt(0)),
    constantCharCodes: STAGING_PASSWORD.split('').map(c => c.charCodeAt(0)),
    areEqual: process.env.STAGING_PASSWORD === STAGING_PASSWORD,
    testPassword: 'SafePlay2025Beta!',
    testEqual: STAGING_PASSWORD === 'SafePlay2025Beta!'
  });
}
