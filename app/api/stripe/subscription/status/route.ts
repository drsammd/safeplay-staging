
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

    // Get user subscription (v1.5.4 - Fixed: No plan relationship needed)
    const userSubscription = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true
      }
    });

    if (!userSubscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Define plan details based on planType (v1.5.4 - No database plan relationship needed)
    const getPlanDetails = (planType: string) => {
      switch (planType) {
        case 'FREE':
          return {
            name: 'Free Plan',
            price: 0,
            maxPhotoDownloads: 1,
            maxVideoDownloads: 1,
            maxAlerts: 10,
            unlimitedDownloads: false,
            premiumAlerts: false,
            aiInsights: false
          };
        case 'BASIC':
          return {
            name: 'Basic Plan',
            price: 9.99,
            maxPhotoDownloads: 5,
            maxVideoDownloads: 3,
            maxAlerts: 50,
            unlimitedDownloads: false,
            premiumAlerts: false,
            aiInsights: false
          };
        case 'PREMIUM':
          return {
            name: 'Premium Plan',
            price: 19.99,
            maxPhotoDownloads: 10,
            maxVideoDownloads: 6,
            maxAlerts: 100,
            unlimitedDownloads: false,
            premiumAlerts: true,
            aiInsights: true
          };
        case 'FAMILY':
          return {
            name: 'Family Plan',
            price: 29.99,
            maxPhotoDownloads: -1, // unlimited
            maxVideoDownloads: -1, // unlimited
            maxAlerts: -1, // unlimited
            unlimitedDownloads: true,
            premiumAlerts: true,
            aiInsights: true
          };
        default:
          return {
            name: 'Unknown Plan',
            price: 0,
            maxPhotoDownloads: 0,
            maxVideoDownloads: 0,
            maxAlerts: 0,
            unlimitedDownloads: false,
            premiumAlerts: false,
            aiInsights: false
          };
      }
    };

    const planDetails = getPlanDetails(userSubscription.planType);

    // Get payment methods (fetch from Stripe if available, otherwise mock)
    let paymentMethods = [];
    
    if (userSubscription.stripeCustomerId) {
      try {
        // In the future, we can fetch real payment methods from Stripe
        // For now, provide realistic mock data
        paymentMethods = [
          {
            id: '1',
            last4: '4242',
            brand: 'Visa',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
          }
        ];
      } catch (error) {
        console.log('Failed to fetch payment methods from Stripe:', error);
        paymentMethods = [];
      }
    }

    // Get recent transactions (mock for now, can be enhanced with real Stripe data)
    const mockTransactions = [
      {
        id: '1',
        amount: planDetails.price,
        status: 'SUCCEEDED',
        description: `${planDetails.name} - Monthly`,
        createdAt: new Date().toISOString(),
      }
    ];

    const billingData = {
      subscription: {
        planName: planDetails.name,
        status: userSubscription.status,
        currentPeriodStart: userSubscription.currentPeriodStart?.toISOString(),
        currentPeriodEnd: userSubscription.currentPeriodEnd?.toISOString(),
        cancelAtPeriodEnd: userSubscription.cancelAtPeriodEnd || false,
        trialEnd: userSubscription.trialEnd?.toISOString() || null,
        nextBillingAmount: planDetails.price,
        monthlyPhotoDownloads: userSubscription.monthlyPhotoDownloads || 0,
        monthlyVideoDownloads: userSubscription.monthlyVideoDownloads || 0,
        monthlyAlerts: userSubscription.monthlyAlerts || 0,
      },
      plan: {
        maxPhotoDownloads: planDetails.maxPhotoDownloads,
        maxVideoDownloads: planDetails.maxVideoDownloads,
        maxAlerts: planDetails.maxAlerts,
        unlimitedDownloads: planDetails.unlimitedDownloads,
        premiumAlerts: planDetails.premiumAlerts,
        aiInsights: planDetails.aiInsights,
      },
      paymentMethods,
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
