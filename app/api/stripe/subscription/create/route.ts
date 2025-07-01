
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscriptionService } from '@/lib/stripe/subscription-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SUBSCRIPTION DEBUG START ===');
    console.log('🚀 SUBSCRIPTION API: Starting subscription creation');
    console.log('🚀 SUBSCRIPTION API: Timestamp:', new Date().toISOString());
    console.log('🚀 SUBSCRIPTION API: Request headers:', Object.fromEntries(request.headers.entries()));
    
    const session = await getServerSession(authOptions);
    console.log('👤 SUBSCRIPTION API: Session check:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    });
    
    if (!session?.user?.id) {
      console.log('❌ SUBSCRIPTION API: Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();

    console.log('📥 SUBSCRIPTION API: Request data:', requestData);
    
    const { priceId, paymentMethodId, discountCodeId } = requestData;

    if (!priceId) {
      console.log('❌ SUBSCRIPTION API: Missing price ID');
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    console.log('🔍 SUBSCRIPTION API: Checking for existing subscription...');
    // Check if user already has a subscription
    const existingSubscription = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true }
    });

    console.log('📋 SUBSCRIPTION API: Existing subscription check:', {
      hasExisting: !!existingSubscription,
      hasStripeSubId: !!existingSubscription?.stripeSubscriptionId,
      hasStripeCustomerId: !!existingSubscription?.stripeCustomerId,
      currentPlan: existingSubscription?.plan?.name
    });

    let subscription;

    if (existingSubscription?.stripeSubscriptionId) {
      console.log('🔄 SUBSCRIPTION API: User has existing subscription, upgrading...');
      // User has existing subscription, handle upgrade/downgrade
      subscription = await subscriptionService.changeSubscription(session.user.id, priceId);
    } else {
      console.log('🆕 SUBSCRIPTION API: Creating new subscription...');
      
      // Create new customer if needed
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      });

      console.log('👤 SUBSCRIPTION API: User lookup:', {
        userFound: !!user,
        userEmail: user?.email,
        userName: user?.name
      });

      if (!user) {
        console.log('❌ SUBSCRIPTION API: User not found in database');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Ensure customer exists
      if (!existingSubscription?.stripeCustomerId) {
        console.log('🏪 SUBSCRIPTION API: Creating Stripe customer...');
        await subscriptionService.createCustomer(session.user.id, user.email, user.name);
        console.log('✅ SUBSCRIPTION API: Stripe customer created');
      } else {
        console.log('✅ SUBSCRIPTION API: Stripe customer already exists:', existingSubscription.stripeCustomerId);
      }

      // Create new subscription
      console.log('🎯 SUBSCRIPTION API: Creating new subscription with params:', {
        userId: session.user.id,
        priceId,
        hasPaymentMethod: !!paymentMethodId,
        hasDiscountCode: !!discountCodeId
      });
      
      subscription = await subscriptionService.createSubscription(
        session.user.id, 
        priceId, 
        paymentMethodId,
        discountCodeId
      );
      
      console.log('✅ SUBSCRIPTION API: Subscription created successfully:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        hasClientSecret: !!(subscription.latest_invoice as any)?.payment_intent?.client_secret
      });
    }

    const response = {
      subscription,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      status: subscription.status,
    };
    
    console.log('📤 SUBSCRIPTION API: Sending successful response:', {
      hasSubscription: !!response.subscription,
      hasClientSecret: !!response.clientSecret,
      status: response.status
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ SUBSCRIPTION API: Fatal error:', error);
    console.error('❌ SUBSCRIPTION API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { error: 'Failed to create subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
