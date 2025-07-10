
import { NextRequest, NextResponse } from 'next/server';
import { demoSubscriptionService } from '@/lib/stripe/demo-subscription-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const plans = demoSubscriptionService.getAvailablePlans();

    return NextResponse.json({
      success: true,
      plans,
      message: 'Demo plans loaded - this is a test environment'
    });

  } catch (error) {
    console.error('Demo plans API error:', error);
    return NextResponse.json(
      { error: 'Failed to load plans' },
      { status: 500 }
    );
  }
}
