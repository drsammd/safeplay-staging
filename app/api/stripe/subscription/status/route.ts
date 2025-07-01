
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user subscription with plan details
    const userSubscription = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id },
      include: {
        plan: true,
        user: true
      }
    });

    if (!userSubscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Get payment methods (mock for now since we don't have real Stripe data)
    const mockPaymentMethods = [
      {
        id: '1',
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
      }
    ];

    // Get recent transactions (mock for now)
    const mockTransactions = [
      {
        id: '1',
        amount: userSubscription.plan?.price || 0,
        status: 'SUCCEEDED',
        description: `${userSubscription.plan?.name} - Monthly`,
        createdAt: new Date().toISOString(),
      }
    ];

    const billingData = {
      subscription: {
        planName: userSubscription.plan?.name || 'Unknown Plan',
        status: userSubscription.status,
        currentPeriodStart: userSubscription.currentPeriodStart?.toISOString(),
        currentPeriodEnd: userSubscription.currentPeriodEnd?.toISOString(),
        cancelAtPeriodEnd: userSubscription.cancelAtPeriodEnd || false,
        trialEnd: userSubscription.trialEnd?.toISOString() || null,
        nextBillingAmount: userSubscription.plan?.price || 0,
        monthlyPhotoDownloads: userSubscription.monthlyPhotoDownloads || 0,
        monthlyVideoDownloads: userSubscription.monthlyVideoDownloads || 0,
        monthlyAlerts: userSubscription.monthlyAlerts || 0,
      },
      plan: {
        maxPhotoDownloads: userSubscription.plan?.maxPhotoDownloads || 0,
        maxVideoDownloads: userSubscription.plan?.maxVideoDownloads || 0,
        maxAlerts: userSubscription.plan?.maxAlerts || 1000, // Default if not set
        unlimitedDownloads: userSubscription.plan?.unlimitedDownloads || false,
        premiumAlerts: userSubscription.plan?.premiumAlerts || false,
        aiInsights: userSubscription.plan?.aiInsights || false,
      },
      paymentMethods: mockPaymentMethods,
      transactions: mockTransactions
    };

    return NextResponse.json(billingData);
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
