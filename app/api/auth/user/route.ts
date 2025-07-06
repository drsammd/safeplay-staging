
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching user data...');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', {
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
      console.log('❌ User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ User data fetched:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasSubscription: !!user.subscription,
      subscriptionStatus: user.subscription?.status,
      planType: user.subscription?.planType
    });

    // Return user data with subscription information
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscription: user.subscription ? {
        id: user.subscription.id,
        status: user.subscription.status,
        planType: user.subscription.planType,
        stripeCustomerId: user.subscription.stripeCustomerId,
        stripeSubscriptionId: user.subscription.stripeSubscriptionId,
        currentPeriodStart: user.subscription.currentPeriodStart,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        autoRenew: user.subscription.autoRenew,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd
      } : null
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user data',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
