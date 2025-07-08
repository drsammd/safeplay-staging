
import { NextRequest, NextResponse } from 'next/server';
import { fixedSubscriptionService } from '@/lib/stripe/subscription-service-fixed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 FIXED PLANS API: Getting available plans');
    
    const plans = fixedSubscriptionService.getAvailablePlans();
    
    console.log('📋 FIXED PLANS API: Found plans:', plans.length);
    
    return NextResponse.json({ 
      plans: plans,
      success: true 
    });
  } catch (error) {
    console.error('❌ FIXED PLANS API ERROR:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get plans', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
