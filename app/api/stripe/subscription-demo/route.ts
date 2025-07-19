
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionService } from '@/lib/stripe/subscription-service';
import { stripe } from '@/lib/stripe/config';

export const dynamic = 'force-dynamic';

const subscriptionService = new SubscriptionService();

export async function POST(request: NextRequest) {
  // Forward to real subscription endpoint with compatibility layer
  const debugId = `subscription_demo_compat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔍 SUBSCRIPTION DEMO COMPAT [${debugId}]: API endpoint called (forwarding to real Stripe)`);
    
    const session = await getServerSession(authOptions);
    const requestBody = await request.json();
    const { planId, paymentMethodId, isSignupFlow, email, name, debugId: clientDebugId } = requestBody;
    
    console.log(`🔍 SUBSCRIPTION DEMO COMPAT [${debugId}]: Request body:`, {
      planId,
      paymentMethodId,
      isSignupFlow,
      email,
      name,
      clientDebugId
    });

    // Convert planId to priceId using environment variables
    let priceId: string | null = null;
    switch (planId) {
      case 'basic':
        priceId = process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || null;
        break;
      case 'premium':
        priceId = process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || null;
        break;
      case 'family':
        priceId = process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || null;
        break;
      default:
        // If planId is already a price ID, use it directly
        if (planId?.startsWith('price_')) {
          priceId = planId;
        }
    }

    if (!priceId) {
      console.error(`🚨 SUBSCRIPTION DEMO COMPAT [${debugId}]: Unable to resolve price ID for plan:`, planId);
      return NextResponse.json(
        { error: `Unable to resolve price ID for plan: ${planId}`, debugId },
        { status: 400 }
      );
    }

    console.log(`✅ SUBSCRIPTION DEMO COMPAT [${debugId}]: Resolved price ID:`, { planId, priceId });

    // Handle signup flow (no authentication required)
    if (!session?.user?.id && isSignupFlow) {
      if (!email || !name) {
        console.error(`🚨 SUBSCRIPTION DEMO COMPAT [${debugId}]: Missing email or name for signup`);
        return NextResponse.json(
          { error: 'Email and name are required for signup', debugId },
          { status: 400 }
        );
      }

      try {
        console.log(`🏪 SUBSCRIPTION DEMO COMPAT [${debugId}]: Creating real Stripe customer for signup...`);
        
        // CRITICAL v1.5.31 FIX: Check for existing customer before creating to prevent duplicates
        console.log(`🔍 SUBSCRIPTION DEMO COMPAT [${debugId}]: Checking for existing Stripe customer by email...`);
        
        const existingCustomers = await stripe.customers.list({
          email: email,
          limit: 1
        });
        
        let customer;
        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
          console.log(`✅ SUBSCRIPTION DEMO COMPAT [${debugId}]: Found existing Stripe customer:`, {
            customerId: customer.id,
            email: customer.email
          });
        } else {
          console.log(`🏪 SUBSCRIPTION DEMO COMPAT [${debugId}]: Creating new Stripe customer...`);
          customer = await stripe.customers.create({
            email,
            name,
            metadata: {
              signupFlow: 'true',
              platform: 'safeplay',
              compatibilityMode: 'demo'
            }
          });
          console.log(`✅ SUBSCRIPTION DEMO COMPAT [${debugId}]: New Stripe customer created:`, {
            customerId: customer.id,
            email: customer.email
          });
        }

        // Attach payment method if provided
        if (paymentMethodId) {
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id,
          });
          
          await stripe.customers.update(customer.id, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
        }

        // Create subscription
        const subscriptionParams: any = {
          customer: customer.id,
          items: [{ price: priceId }],
          metadata: {
            signupFlow: 'true',
            platform: 'safeplay',
            compatibilityMode: 'demo',
            debugId: debugId
          },
          expand: ['latest_invoice.payment_intent'],
        };

        if (paymentMethodId) {
          subscriptionParams.default_payment_method = paymentMethodId;
        }

        subscriptionParams.trial_period_days = 7;

        const subscription = await stripe.subscriptions.create(subscriptionParams);

        console.log(`✅ SUBSCRIPTION DEMO COMPAT [${debugId}]: Real Stripe subscription created:`, {
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer
        });

        const response = {
          success: true,
          subscription,
          customer,
          isSignupFlow: true,
          message: 'Real Stripe subscription created successfully!',
          debugId
        };

        return NextResponse.json(response);
        
      } catch (signupError) {
        console.error(`🚨 SUBSCRIPTION DEMO COMPAT [${debugId}]: Signup error:`, signupError);
        return NextResponse.json(
          { 
            error: signupError?.message || 'Failed to create subscription for signup',
            debugId
          },
          { status: 500 }
        );
      }
    }

    // Handle authenticated user flow
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required', debugId },
        { status: 401 }
      );
    }

    try {
      console.log(`📞 SUBSCRIPTION DEMO COMPAT [${debugId}]: Using real SubscriptionService...`);
      
      const subscription = await subscriptionService.createSubscription(
        session.user.id,
        priceId,
        paymentMethodId
      );

      const response = {
        success: true,
        subscription,
        message: 'Real Stripe subscription created successfully!',
        debugId
      };

      return NextResponse.json(response);
      
    } catch (serviceError) {
      console.error(`🚨 SUBSCRIPTION DEMO COMPAT [${debugId}]: Service error:`, serviceError);
      return NextResponse.json(
        { 
          error: serviceError?.message || 'Failed to create subscription',
          debugId
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error(`🚨 SUBSCRIPTION DEMO COMPAT [${debugId}]: General error:`, error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to create subscription',
        debugId
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const debugId = `subscription_demo_get_compat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔍 SUBSCRIPTION DEMO GET COMPAT [${debugId}]: Status check called (using real database)`);
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required', debugId },
        { status: 401 }
      );
    }

    // Get subscription status from real database
    const { prisma } = await import('@/lib/db');
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id }
    });

    console.log(`✅ SUBSCRIPTION DEMO GET COMPAT [${debugId}]: Real subscription status:`, {
      hasSubscription: !!subscription,
      status: subscription?.status,
      planType: subscription?.planType
    });

    return NextResponse.json({
      success: true,
      debugId,
      hasSubscription: !!subscription,
      subscription: subscription || null,
      isActive: subscription ? ['ACTIVE', 'TRIALING'].includes(subscription.status) : false,
      isTrialing: subscription?.status === 'TRIALING'
    });

  } catch (error) {
    console.error(`🚨 SUBSCRIPTION DEMO GET COMPAT [${debugId}]: Status API error:`, error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to get subscription status',
        debugId 
      },
      { status: 500 }
    );
  }
}
