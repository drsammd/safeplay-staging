
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionService } from '@/lib/stripe/subscription-service';
import { stripe } from '@/lib/stripe/config';

export const dynamic = 'force-dynamic';

const subscriptionService = new SubscriptionService();

export async function POST(request: NextRequest) {
  const debugId = `subscription_real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔍 REAL SUBSCRIPTION DEBUG [${debugId}]: API endpoint called at ${new Date().toISOString()}`);
    
    const session = await getServerSession(authOptions);
    console.log(`🔍 REAL SUBSCRIPTION DEBUG [${debugId}]: Session check:`, {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name
    });

    const requestBody = await request.json();
    const { priceId, paymentMethodId, isSignupFlow, email, name, clientDebugId, isFreePlan } = requestBody;
    
    console.log(`🔍 REAL SUBSCRIPTION DEBUG [${debugId}]: Request body:`, {
      priceId,
      paymentMethodId,
      isSignupFlow,
      email,
      name,
      clientDebugId,
      isFreePlan,
      fullRequestBody: requestBody
    });

    // Handle FREE plan creation/downgrade (v1.5.1) - No payment required
    if (isFreePlan) {
      console.log(`🆓 REAL SUBSCRIPTION DEBUG [${debugId}]: Handling FREE plan creation/downgrade`);
      
      if (!session?.user?.id) {
        console.error(`🚨 REAL SUBSCRIPTION DEBUG [${debugId}]: Authentication required for FREE plan`);
        return NextResponse.json(
          { error: 'Authentication required', debugId },
          { status: 401 }
        );
      }

      try {
        // Check if user already has a subscription (downgrade case)
        const { prisma } = await import('@/lib/db');
        const existingSubscription = await prisma.userSubscription.findUnique({
          where: { userId: session.user.id }
        });

        if (existingSubscription && existingSubscription.status === 'ACTIVE' && existingSubscription.planType !== 'FREE') {
          // This is a downgrade case
          console.log(`🔽 REAL SUBSCRIPTION DEBUG [${debugId}]: Downgrading existing subscription to FREE plan`);
          
          const result = await subscriptionService.downgradeToFreePlan(session.user.id);
          
          console.log(`✅ REAL SUBSCRIPTION DEBUG [${debugId}]: Downgrade to FREE plan successful:`, result);

          const response = {
            success: true,
            planType: 'FREE',
            subscription: result,
            message: 'Successfully downgraded to FREE plan!',
            isDowngrade: true,
            debugId
          };

          console.log(`🎉 REAL SUBSCRIPTION DEBUG [${debugId}]: Returning downgrade response`);
          return NextResponse.json(response);
        } else {
          // This is a new FREE plan signup
          console.log(`🆓 REAL SUBSCRIPTION DEBUG [${debugId}]: Creating new FREE plan subscription...`);
          
          const result = await subscriptionService.createFreePlanSubscription(
            session.user.id,
            session.user.email || '',
            session.user.name || ''
          );

          console.log(`✅ REAL SUBSCRIPTION DEBUG [${debugId}]: FREE plan created successfully:`, result);

          const response = {
            success: true,
            planType: 'FREE',
            customer: result.customer,
            message: 'FREE plan activated successfully!',
            isDowngrade: false,
            debugId
          };

          console.log(`🎉 REAL SUBSCRIPTION DEBUG [${debugId}]: Returning FREE plan response`);
          return NextResponse.json(response);
        }
        
      } catch (freePlanError) {
        console.error(`🚨 REAL SUBSCRIPTION DEBUG [${debugId}]: FREE plan creation/downgrade error:`, {
          errorMessage: freePlanError?.message,
          errorStack: freePlanError?.stack,
          errorName: freePlanError?.name,
          fullError: freePlanError
        });
        
        return NextResponse.json(
          { 
            error: freePlanError?.message || 'Failed to process FREE plan request',
            debugId,
            errorDetails: {
              service: 'SubscriptionService',
              method: 'createFreePlanSubscription or downgradeToFreePlan',
              userId: session.user.id
            }
          },
          { status: 500 }
        );
      }
    }

    if (!priceId && !isFreePlan) {
      console.error(`🚨 REAL SUBSCRIPTION DEBUG [${debugId}]: Missing priceId for paid plan`);
      return NextResponse.json(
        { error: 'Price ID is required for paid plans', debugId },
        { status: 400 }
      );
    }

    // Handle signup flow (no authentication required)
    if (!session?.user?.id && isSignupFlow) {
      console.log(`🚀 REAL SUBSCRIPTION DEBUG [${debugId}]: Handling signup flow - creating customer first`);
      
      if (!email || !name) {
        console.error(`🚨 REAL SUBSCRIPTION DEBUG [${debugId}]: Missing email or name for signup`);
        return NextResponse.json(
          { error: 'Email and name are required for signup', debugId },
          { status: 400 }
        );
      }

      try {
        console.log(`🏪 REAL SUBSCRIPTION DEBUG [${debugId}]: Creating Stripe customer for signup...`);
        
        // Create Stripe customer first
        const customer = await stripe.customers.create({
          email,
          name,
          metadata: {
            signupFlow: 'true',
            platform: 'safeplay'
          }
        });

        console.log(`✅ REAL SUBSCRIPTION DEBUG [${debugId}]: Stripe customer created:`, {
          customerId: customer.id,
          email: customer.email,
          name: customer.name
        });

        // Attach payment method to customer if provided
        if (paymentMethodId) {
          console.log(`💳 REAL SUBSCRIPTION DEBUG [${debugId}]: Attaching payment method to customer...`);
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id,
          });
          
          // Set as default payment method
          await stripe.customers.update(customer.id, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
          console.log(`✅ REAL SUBSCRIPTION DEBUG [${debugId}]: Payment method attached and set as default`);
        }

        // Create subscription
        console.log(`📞 REAL SUBSCRIPTION DEBUG [${debugId}]: Creating Stripe subscription...`);
        const subscriptionParams: any = {
          customer: customer.id,
          items: [{ price: priceId }],
          metadata: {
            signupFlow: 'true',
            platform: 'safeplay',
            debugId: debugId
          },
          expand: ['latest_invoice.payment_intent'],
        };

        if (paymentMethodId) {
          subscriptionParams.default_payment_method = paymentMethodId;
        }

        // Add trial period
        subscriptionParams.trial_period_days = 7;

        const subscription = await stripe.subscriptions.create(subscriptionParams);

        console.log(`✅ REAL SUBSCRIPTION DEBUG [${debugId}]: Stripe subscription created:`, {
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
          hasLatestInvoice: !!subscription.latest_invoice
        });

        const response = {
          success: true,
          subscription,
          customer,
          isSignupFlow: true,
          message: 'Subscription created successfully for signup!',
          debugId
        };

        console.log(`🎉 REAL SUBSCRIPTION DEBUG [${debugId}]: Returning successful signup response`);
        return NextResponse.json(response);
        
      } catch (signupError) {
        console.error(`🚨 REAL SUBSCRIPTION DEBUG [${debugId}]: Signup subscription error:`, {
          errorMessage: signupError?.message,
          errorStack: signupError?.stack,
          errorName: signupError?.name,
          fullError: signupError
        });
        
        return NextResponse.json(
          { 
            error: signupError?.message || 'Failed to create subscription for signup',
            debugId,
            errorDetails: {
              service: 'SubscriptionService',
              method: 'signup_flow',
              priceId,
              email,
              name
            }
          },
          { status: 500 }
        );
      }
    }

    // Handle authenticated user flow
    if (!session?.user?.id) {
      console.error(`🚨 REAL SUBSCRIPTION DEBUG [${debugId}]: No authentication and not signup flow`);
      return NextResponse.json(
        { error: 'Authentication required', debugId },
        { status: 401 }
      );
    }

    console.log(`🎭 REAL SUBSCRIPTION DEBUG [${debugId}]: Creating subscription for authenticated user:`, session.user.id, 'Price:', priceId);

    try {
      console.log(`📞 REAL SUBSCRIPTION DEBUG [${debugId}]: Calling SubscriptionService.createSubscription...`);
      
      // Create subscription using real service
      const subscription = await subscriptionService.createSubscription(
        session.user.id,
        priceId,
        paymentMethodId
      );

      console.log(`✅ REAL SUBSCRIPTION DEBUG [${debugId}]: Authenticated subscription created:`, subscription);

      const response = {
        success: true,
        subscription,
        message: 'Subscription created successfully!',
        debugId
      };

      console.log(`🎉 REAL SUBSCRIPTION DEBUG [${debugId}]: Returning authenticated response`);
      return NextResponse.json(response);
      
    } catch (authServiceError) {
      console.error(`🚨 REAL SUBSCRIPTION DEBUG [${debugId}]: Authenticated subscription service error:`, {
        errorMessage: authServiceError?.message,
        errorStack: authServiceError?.stack,
        errorName: authServiceError?.name,
        fullError: authServiceError
      });
      
      return NextResponse.json(
        { 
          error: authServiceError?.message || 'Failed to create authenticated subscription',
          debugId,
          errorDetails: {
            service: 'SubscriptionService',
            method: 'createSubscription',
            userId: session.user.id,
            priceId,
            paymentMethodId
          }
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error(`🚨 REAL SUBSCRIPTION DEBUG [${debugId}]: General API error:`, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorName: error?.name,
      fullError: error
    });
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to create subscription',
        debugId,
        errorDetails: {
          location: 'subscription API root catch block'
        }
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const debugId = `subscription_change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔄 REAL SUBSCRIPTION CHANGE DEBUG [${debugId}]: API endpoint called at ${new Date().toISOString()}`);
    
    const session = await getServerSession(authOptions);
    console.log(`🔄 REAL SUBSCRIPTION CHANGE DEBUG [${debugId}]: Session check:`, {
      hasSession: !!session,
      userId: session?.user?.id
    });

    if (!session?.user?.id) {
      console.error(`🚨 REAL SUBSCRIPTION CHANGE DEBUG [${debugId}]: No authentication for subscription change`);
      return NextResponse.json(
        { error: 'Authentication required', debugId },
        { status: 401 }
      );
    }

    const requestBody = await request.json();
    const { newPriceId } = requestBody;
    
    console.log(`🔄 REAL SUBSCRIPTION CHANGE DEBUG [${debugId}]: Request body:`, {
      newPriceId,
      userId: session.user.id
    });

    if (!newPriceId) {
      console.error(`🚨 REAL SUBSCRIPTION CHANGE DEBUG [${debugId}]: Missing newPriceId`);
      return NextResponse.json(
        { error: 'New price ID is required', debugId },
        { status: 400 }
      );
    }

    console.log(`📞 REAL SUBSCRIPTION CHANGE DEBUG [${debugId}]: Calling SubscriptionService.changeSubscription...`);
    
    const updatedSubscription = await subscriptionService.changeSubscription(
      session.user.id,
      newPriceId
    );

    console.log(`✅ REAL SUBSCRIPTION CHANGE DEBUG [${debugId}]: Subscription changed successfully:`, {
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status
    });

    const response = {
      success: true,
      subscription: updatedSubscription,
      message: 'Subscription updated successfully!',
      debugId
    };

    console.log(`🎉 REAL SUBSCRIPTION CHANGE DEBUG [${debugId}]: Returning successful change response`);
    return NextResponse.json(response);

  } catch (error) {
    console.error(`🚨 REAL SUBSCRIPTION CHANGE DEBUG [${debugId}]: Subscription change error:`, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorName: error?.name,
      fullError: error
    });
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to change subscription',
        debugId,
        errorDetails: {
          location: 'subscription change API catch block'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const debugId = `subscription_status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔍 REAL SUBSCRIPTION STATUS DEBUG [${debugId}]: Status check called`);
    
    const session = await getServerSession(authOptions);
    console.log(`🔍 REAL SUBSCRIPTION STATUS DEBUG [${debugId}]: Session check:`, {
      hasSession: !!session,
      userId: session?.user?.id
    });
    
    if (!session?.user?.id) {
      console.log(`❌ REAL SUBSCRIPTION STATUS DEBUG [${debugId}]: No authentication for status check`);
      return NextResponse.json(
        { error: 'Authentication required', debugId },
        { status: 401 }
      );
    }

    console.log(`📞 REAL SUBSCRIPTION STATUS DEBUG [${debugId}]: Getting subscription status...`);
    
    // Get subscription status from database
    const { prisma } = await import('@/lib/db');
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id }
    });

    console.log(`✅ REAL SUBSCRIPTION STATUS DEBUG [${debugId}]: Status retrieved:`, {
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
    console.error(`🚨 REAL SUBSCRIPTION STATUS DEBUG [${debugId}]: Status API error:`, error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to get subscription status',
        debugId 
      },
      { status: 500 }
    );
  }
}
