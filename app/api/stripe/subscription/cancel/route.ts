
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscriptionService } from '@/lib/stripe/subscription-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { immediately = false } = await request.json();

    const canceledSubscription = await subscriptionService.cancelSubscription(
      session.user.id, 
      immediately
    );

    return NextResponse.json({
      subscription: canceledSubscription,
      message: immediately 
        ? 'Subscription canceled immediately' 
        : 'Subscription will cancel at the end of the current period',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
