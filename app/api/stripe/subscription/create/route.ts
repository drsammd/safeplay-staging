
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-fixed';
import { subscriptionService } from '@/lib/stripe/subscription-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SUBSCRIPTION DEBUG START ===');
    console.log('🚀 SUBSCRIPTION API: Starting subscription creation');
    console.log('🚀 SUBSCRIPTION API: Timestamp:', new Date().toISOString());
    console.log('🚀 SUBSCRIPTION API: Request headers:', Object.fromEntries(request.headers.entries()));
    
    // 🔒 v1.5.40-alpha.6 SIMPLE SESSION FIX: Use standard NextAuth pattern
    console.log('🔒 SUBSCRIPTION API: Using simple NextAuth session validation');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('❌ SUBSCRIPTION API: No valid session found');
      return NextResponse.json({ 
        error: 'Session validation failed. Please sign in again.',
        action: 'SIGN_IN_REQUIRED'
      }, { status: 401 });
    }
    
    console.log('✅ SUBSCRIPTION API: Session validation successful', {
      userId: session.user.id,
      userEmail: session.user.email
    });
    
    // Use session data directly
    const validatedUser = session.user;

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
      include: { user: true, paymentMethod: true }
    });

    console.log('📋 SUBSCRIPTION API: Existing subscription check:', {
      hasExisting: !!existingSubscription,
      hasStripeSubId: !!existingSubscription?.stripeSubscriptionId,
      hasStripeCustomerId: !!existingSubscription?.stripeCustomerId,
      currentPlanType: existingSubscription?.planType
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
