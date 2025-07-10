
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { demoSubscriptionService } from '@/lib/stripe/demo-subscription-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    console.log('✅ DEMO API: Confirming payment for:', paymentIntentId);

    const confirmedPayment = await demoSubscriptionService.confirmPayment(paymentIntentId);

    return NextResponse.json({
      success: true,
      payment: confirmedPayment,
      message: 'Demo payment confirmed successfully - this is a test environment'
    });

  } catch (error) {
    console.error('Demo payment confirmation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
