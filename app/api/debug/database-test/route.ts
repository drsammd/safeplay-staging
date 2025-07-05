
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test basic database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Test a simple query to verify the database is working
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: 'success',
      database: 'connected',
      provider: 'postgresql',
      test_query: result,
      user_count: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      database: 'connection_failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
