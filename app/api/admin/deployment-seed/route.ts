
import { NextRequest, NextResponse } from 'next/server';
import { ensureCriticalAccounts, verifyAccounts } from '@/scripts/deployment-seed';

export const dynamic = 'force-dynamic';

// Public endpoint for deployment seeding - NO AUTH REQUIRED (for emergency use)
export async function POST(request: NextRequest) {
  try {
    console.log('🌱 DEPLOYMENT-SEED: Starting deployment seeding...');

    // Run the deployment seed script
    const results = await ensureCriticalAccounts();
    
    console.log('🔍 DEPLOYMENT-SEED: Verifying accounts...');
    await verifyAccounts();

    const response = {
      success: true,
      message: 'Deployment seeding completed successfully',
      timestamp: new Date().toISOString(),
      results,
      summary: results.reduce((acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      credentials: [
        { email: 'admin@mysafeplay.ai', password: 'password123', role: 'SUPER_ADMIN' },
        { email: 'venue@mysafeplay.ai', password: 'password123', role: 'VENUE_ADMIN' },
        { email: 'parent@mysafeplay.ai', password: 'password123', role: 'PARENT' },
        { email: 'john@mysafeplay.ai', password: 'johndoe123', role: 'PARENT' }
      ]
    };

    console.log('✅ DEPLOYMENT-SEED: Completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ DEPLOYMENT-SEED: Failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Deployment seeding failed',
      timestamp: new Date().toISOString(),
      details: 'Check server logs for more information'
    }, { status: 500 });
  }
}

// GET endpoint to check seeding status
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEPLOYMENT-SEED: Checking seeding status...');
    
    // This will run the verification without making changes
    await verifyAccounts();

    const response = {
      success: true,
      message: 'Deployment seed status checked',
      timestamp: new Date().toISOString(),
      note: 'Check server logs for detailed verification results'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ DEPLOYMENT-SEED: Status check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
