

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 USER API: Fetching user data...');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('❌ USER API: Unauthorized - no session user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ USER API: User authenticated:', {
      userId: session.user.id,
      userEmail: session.user.email
    });

    // Fetch user with subscription data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true
      }
    });

    if (!user) {
      console.log('❌ USER API: User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ USER API: User data fetched:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasSubscription: !!user.subscription,
      subscriptionStatus: user.subscription?.status,
      planType: user.subscription?.planType
    });

    // 🔧 CRITICAL FIX: Enhanced subscription detection for proper hasActiveSubscription logic
    let subscriptionData = null;
    
    if (user.subscription) {
      // Check if subscription is actually active
      const isActive = user.subscription.status === 'ACTIVE' || 
                       user.subscription.status === 'TRIALING';
      
      console.log('🔍 USER API: Subscription status analysis:', {
        rawStatus: user.subscription.status,
        isActive,
        planType: user.subscription.planType,
        hasStripeSubscription: !!user.subscription.stripeSubscriptionId
      });
      
      subscriptionData = {
        id: user.subscription.id,
        status: user.subscription.status,
        planType: user.subscription.planType,
        stripeCustomerId: user.subscription.stripeCustomerId,
        stripeSubscriptionId: user.subscription.stripeSubscriptionId,
        currentPeriodStart: user.subscription.currentPeriodStart,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        autoRenew: user.subscription.autoRenew,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        planId: user.subscription.planType?.toLowerCase() || 'free', // Add planId for frontend compatibility
        // Additional computed fields for better frontend logic
        isActive,
        isPaid: user.subscription.planType !== 'FREE',
        isFree: user.subscription.planType === 'FREE'
      };
    }

    // Return user data with enhanced subscription information
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscription: subscriptionData
    };

    console.log('✅ USER API: Returning user data with subscription:', {
      hasSubscription: !!subscriptionData,
      subscriptionIsActive: subscriptionData?.isActive,
      subscriptionPlan: subscriptionData?.planType
    });

    return NextResponse.json(userData);
  } catch (error) {
    console.error('❌ USER API: Error fetching user data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user data',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
