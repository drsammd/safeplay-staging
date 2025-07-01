
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

    const { feature, quantity = 1, metadata } = await request.json();

    if (!feature) {
      return NextResponse.json({ error: 'Feature type is required' }, { status: 400 });
    }

    // Check if user has access to this feature
    const hasAccess = await subscriptionService.checkSubscriptionAccess(session.user.id, feature);
    
    if (!hasAccess && feature !== 'PHOTO_DOWNLOAD' && feature !== 'VIDEO_DOWNLOAD') {
      return NextResponse.json({ error: 'Feature not available in current plan' }, { status: 403 });
    }

    // Track the usage
    await subscriptionService.trackUsage(session.user.id, feature, quantity, metadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}
