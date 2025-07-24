
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-fixed';
import { SubscriptionService } from '@/lib/stripe/subscription-service';
import { unifiedCustomerService } from '@/lib/stripe/unified-customer-service';
import { stripe } from '@/lib/stripe/config';

export const dynamic = 'force-dynamic';

const subscriptionService = new SubscriptionService();

export async function POST(request: NextRequest) {
  const debugId = `subscription_unified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔍 UNIFIED SUBSCRIPTION [${debugId}]: API endpoint called at ${new Date().toISOString()}`);
    
    const requestBody = await request.json();
    const { priceId, paymentMethodId, isSignupFlow, email, name, clientDebugId, isFreePlan } = requestBody;
    
    console.log(`🔍 UNIFIED SUBSCRIPTION [${debugId}]: Request body:`, {
      priceId,
      paymentMethodId,
      isSignupFlow,
      email,
      name,
      clientDebugId,
      isFreePlan
    });

    // CRITICAL v1.5.40-alpha.11 FIX: Handle FREE plan creation with Stripe customer
    if (isFreePlan) {
      console.log(`🆓 UNIFIED SUBSCRIPTION [${debugId}]: Handling FREE plan with unified customer service`);
      
      // CRITICAL FIX: For FREE plans during signup, always skip database checks
      // During signup flow, user hasn't been created in database yet
      const isActualSignupFlow = isSignupFlow || email; // If email is provided, it's likely a signup
      
      console.log(`🔍 UNIFIED SUBSCRIPTION [${debugId}]: FREE plan context detection:`, {
        isSignupFlow,
        hasEmail: !!email,
        isActualSignupFlow,
        operation: 'free_plan_request'
      });
      
      // Validate session for FREE plan requests with proper signup context
      const sessionValidation = await unifiedCustomerService.validateSessionSecurity({
        isSignupFlow: isActualSignupFlow,
        skipDatabaseChecks: isActualSignupFlow, // Explicitly skip DB checks for signup
        operation: 'free_plan_request'
      });
      
      if (!sessionValidation.isValid) {
        console.error(`🚨 UNIFIED SUBSCRIPTION [${debugId}]: Session validation failed for FREE plan`);
        return NextResponse.json(
          { 
            error: 'Authentication required for FREE plan',
            details: sessionValidation.errors,
            debugId 
          },
          { status: 401 }
        );
      }

      try {
        // Use unified customer service to create FREE plan with customer
        const freePlanResult = await unifiedCustomerService.createFreePlanWithCustomer(
          sessionValidation.userId!,
          sessionValidation.userEmail!,
          sessionValidation.userEmail!.split('@')[0] // Use email prefix as name fallback
        );

        if (!freePlanResult.success) {
          return NextResponse.json(
            { 
              error: 'Failed to create FREE plan',
              details: freePlanResult.errors,
              debugId 
            },
            { status: 500 }
          );
        }

        console.log(`✅ UNIFIED SUBSCRIPTION [${debugId}]: FREE plan with customer created successfully`);

        const response = {
          success: true,
          planType: 'FREE',
          customer: freePlanResult.customer,
          subscription: freePlanResult.subscription,
          message: 'FREE plan activated successfully with upgrade path!',
          debugId
        };

        return NextResponse.json(response);
        
      } catch (freePlanError) {
        console.error(`🚨 UNIFIED SUBSCRIPTION [${debugId}]: FREE plan creation error:`, freePlanError);
        
        return NextResponse.json(
          { 
            error: freePlanError?.message || 'Failed to process FREE plan request',
            debugId,
            errorDetails: {
              service: 'UnifiedCustomerService',
              method: 'createFreePlanWithCustomer'
            }
          },
          { status: 500 }
        );
      }
    }

    // Handle signup flow (no authentication required) - LEGACY SUPPORT
    if (!isFreePlan && isSignupFlow && email && name) {
      console.log(`🚀 UNIFIED SUBSCRIPTION [${debugId}]: Handling legacy signup flow - will be deprecated`);
      
      if (!priceId) {
        console.error(`🚨 UNIFIED SUBSCRIPTION [${debugId}]: Missing priceId for paid signup`);
        return NextResponse.json(
          { error: 'Price ID is required for paid plans', debugId },
          { status: 400 }
        );
      }

      try {
        // For signup flow, we still need to create a temporary customer
        // This will be associated with the user account when created
        console.log(`🏪 UNIFIED SUBSCRIPTION [${debugId}]: Creating customer for signup flow...`);
        
        const customer = await stripe.customers.create({
          email,
          name,
          metadata: {
            signupFlow: 'true',
            platform: 'safeplay',
            debugId
          }
        });

        console.log(`✅ UNIFIED SUBSCRIPTION [${debugId}]: Signup customer created: ${customer.id}`);

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
          
          console.log(`✅ UNIFIED SUBSCRIPTION [${debugId}]: Payment method attached for signup`);
        }

        // Create subscription for signup
        const subscriptionParams: any = {
          customer: customer.id,
          items: [{ price: priceId }],
          metadata: {
            signupFlow: 'true',
            platform: 'safeplay',
            debugId
          },
          expand: ['latest_invoice.payment_intent'],
          trial_period_days: 7
        };

        if (paymentMethodId) {
          subscriptionParams.default_payment_method = paymentMethodId;
        }

        const subscription = await stripe.subscriptions.create(subscriptionParams);

        console.log(`✅ UNIFIED SUBSCRIPTION [${debugId}]: Signup subscription created: ${subscription.id}`);

        const response = {
          success: true,
          subscription,
          customer,
          isSignupFlow: true,
          message: 'Subscription created successfully for signup!',
          debugId
        };

        return NextResponse.json(response);
        
      } catch (signupError) {
        console.error(`🚨 UNIFIED SUBSCRIPTION [${debugId}]: Signup error:`, signupError);
        
        return NextResponse.json(
          { 
            error: signupError?.message || 'Failed to create subscription for signup',
            debugId,
            errorDetails: {
              service: 'UnifiedCustomerService',
              method: 'signup_flow'
            }
          },
          { status: 500 }
        );
      }
    }

    // CRITICAL v1.5.40-alpha.11 FIX: Handle authenticated paid subscriptions
    if (!isFreePlan && !isSignupFlow) {
      console.log(`💳 UNIFIED SUBSCRIPTION [${debugId}]: Handling authenticated paid subscription`);
      
      // CRITICAL FIX: Detect if this is actually a signup flow even if not explicitly marked
      const isActualSignupFlow = isSignupFlow || email; // If email is provided, it's likely a signup
      
      console.log(`🔍 UNIFIED SUBSCRIPTION [${debugId}]: Paid subscription context detection:`, {
        isSignupFlow,
        hasEmail: !!email,
        isActualSignupFlow,
        operation: 'authenticated_paid_subscription'
      });
      
      // Validate session for authenticated requests with proper context detection
      const sessionValidation = await unifiedCustomerService.validateSessionSecurity({
        isSignupFlow: isActualSignupFlow,
        skipDatabaseChecks: isActualSignupFlow, // Skip DB checks if it's actually a signup
        operation: 'authenticated_paid_subscription'
      });
      
      if (!sessionValidation.isValid) {
        console.error(`🚨 UNIFIED SUBSCRIPTION [${debugId}]: Session validation failed for paid subscription`);
        return NextResponse.json({ 
          error: 'Session validation failed. Please sign in again.',
          details: sessionValidation.errors,
          action: 'SIGN_IN_REQUIRED',
          debugId
        }, { status: 401 });
      }

      if (!priceId) {
        console.error(`🚨 UNIFIED SUBSCRIPTION [${debugId}]: Missing priceId for paid plan`);
        return NextResponse.json(
          { error: 'Price ID is required for paid plans', debugId },
          { status: 400 }
        );
      }

      try {
        console.log(`📞 UNIFIED SUBSCRIPTION [${debugId}]: Creating paid subscription with unified service...`);
        
        // Use unified customer service for paid subscription
        const paidSubResult = await unifiedCustomerService.createPaidSubscription(
          sessionValidation.userId!,
          sessionValidation.userEmail!,
          sessionValidation.userEmail!.split('@')[0], // Use email prefix as name fallback
          priceId,
          paymentMethodId
        );

        if (!paidSubResult.success) {
          return NextResponse.json(
            { 
              error: 'Failed to create paid subscription',
              details: paidSubResult.errors,
              debugId 
            },
            { status: 500 }
          );
        }

        console.log(`✅ UNIFIED SUBSCRIPTION [${debugId}]: Paid subscription created successfully`);

        const response = {
          success: true,
          subscription: paidSubResult.subscription.stripe,
          customer: paidSubResult.customer,
          message: 'Subscription created successfully!',
          debugId
        };

        return NextResponse.json(response);
        
      } catch (paidSubError) {
        console.error(`🚨 UNIFIED SUBSCRIPTION [${debugId}]: Paid subscription error:`, paidSubError);
        
        return NextResponse.json(
          { 
            error: paidSubError?.message || 'Failed to create paid subscription',
            debugId,
            errorDetails: {
              service: 'UnifiedCustomerService',
              method: 'createPaidSubscription'
            }
          },
          { status: 500 }
        );
      }
    }

    // If we get here, invalid request
    console.error(`🚨 UNIFIED SUBSCRIPTION [${debugId}]: Invalid request parameters`);
    return NextResponse.json(
      { 
        error: 'Invalid request parameters',
        debugId,
        received: { isFreePlan, isSignupFlow, hasEmail: !!email, hasPriceId: !!priceId }
      },
      { status: 400 }
    );

  } catch (error) {
    console.error(`🚨 UNIFIED SUBSCRIPTION [${debugId}]: General API error:`, error);
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to create subscription',
        debugId,
        errorDetails: {
          location: 'unified subscription API root catch block'
        }
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const debugId = `subscription_change_unified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔄 UNIFIED SUBSCRIPTION CHANGE [${debugId}]: API endpoint called at ${new Date().toISOString()}`);
    
    // CRITICAL v1.5.40-alpha.11 FIX: Use unified customer service session validation (existing user operation)
    const sessionValidation = await unifiedCustomerService.validateSessionSecurity({
      isSignupFlow: false,
      skipDatabaseChecks: false, // For subscription changes, always validate existing user
      operation: 'subscription_change'
    });
    
    if (!sessionValidation.isValid) {
      console.error(`🚨 UNIFIED SUBSCRIPTION CHANGE [${debugId}]: Session validation failed`);
      return NextResponse.json({ 
        error: 'Session validation failed. Please sign in again.',
        details: sessionValidation.errors,
        action: 'SIGN_IN_REQUIRED',
        debugId
      }, { status: 401 });
    }

    console.log(`✅ UNIFIED SUBSCRIPTION CHANGE [${debugId}]: Session validation successful`, {
      userId: sessionValidation.userId,
      userEmail: sessionValidation.userEmail
    });

    const requestBody = await request.json();
    const { newPriceId } = requestBody;
    
    console.log(`🔄 UNIFIED SUBSCRIPTION CHANGE [${debugId}]: Request body:`, {
      newPriceId,
      userId: sessionValidation.userId
    });

    if (!newPriceId) {
      console.error(`🚨 UNIFIED SUBSCRIPTION CHANGE [${debugId}]: Missing newPriceId`);
      return NextResponse.json(
        { error: 'New price ID is required', debugId },
        { status: 400 }
      );
    }

    console.log(`📞 UNIFIED SUBSCRIPTION CHANGE [${debugId}]: Calling SubscriptionService.changeSubscription...`);
    
    // Use existing subscription service for changes (it will be updated to use unified service later)
    const updatedSubscription = await subscriptionService.changeSubscription(
      sessionValidation.userId!,
      newPriceId
    );

    console.log(`✅ UNIFIED SUBSCRIPTION CHANGE [${debugId}]: Subscription changed successfully:`, {
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status
    });

    const response = {
      success: true,
      subscription: updatedSubscription,
      message: 'Subscription updated successfully!',
      debugId
    };

    console.log(`🎉 UNIFIED SUBSCRIPTION CHANGE [${debugId}]: Returning successful change response`);
    return NextResponse.json(response);

  } catch (error) {
    console.error(`🚨 UNIFIED SUBSCRIPTION CHANGE [${debugId}]: Subscription change error:`, error);
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to change subscription',
        debugId,
        errorDetails: {
          service: 'SubscriptionService',
          method: 'changeSubscription',
          location: 'unified subscription change API'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const debugId = `subscription_status_unified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔍 UNIFIED SUBSCRIPTION STATUS [${debugId}]: Status check called`);
    
    // CRITICAL v1.5.40-alpha.11 FIX: Use unified customer service session validation (existing user operation)
    const sessionValidation = await unifiedCustomerService.validateSessionSecurity({
      isSignupFlow: false,
      skipDatabaseChecks: false, // For status checks, always validate existing user
      operation: 'subscription_status_check'
    });
    
    if (!sessionValidation.isValid) {
      console.log(`❌ UNIFIED SUBSCRIPTION STATUS [${debugId}]: Session validation failed`);
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          details: sessionValidation.errors,
          debugId 
        },
        { status: 401 }
      );
    }

    console.log(`✅ UNIFIED SUBSCRIPTION STATUS [${debugId}]: Session validation successful`, {
      userId: sessionValidation.userId,
      userEmail: sessionValidation.userEmail
    });

    console.log(`📞 UNIFIED SUBSCRIPTION STATUS [${debugId}]: Getting subscription status...`);
    
    // Get subscription status from database
    const { prisma } = await import('@/lib/db');
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: sessionValidation.userId! }
    });

    console.log(`✅ UNIFIED SUBSCRIPTION STATUS [${debugId}]: Status retrieved:`, {
      hasSubscription: !!subscription,
      status: subscription?.status,
      planType: subscription?.planType,
      hasStripeCustomerId: !!subscription?.stripeCustomerId
    });

    // Get customer audit information for debugging if needed
    const customerAudit = await unifiedCustomerService.getCustomerAudit(sessionValidation.userId!);
    
    if (customerAudit.issues.length > 0) {
      console.log(`⚠️ UNIFIED SUBSCRIPTION STATUS [${debugId}]: Customer audit issues:`, customerAudit.issues);
    }

    return NextResponse.json({
      success: true,
      debugId,
      hasSubscription: !!subscription,
      subscription: subscription || null,
      isActive: subscription ? ['ACTIVE', 'TRIALING'].includes(subscription.status) : false,
      isTrialing: subscription?.status === 'TRIALING',
      customerInfo: {
        hasStripeCustomer: !!subscription?.stripeCustomerId,
        customerId: subscription?.stripeCustomerId || null,
        auditIssues: customerAudit.issues
      }
    });

  } catch (error) {
    console.error(`🚨 UNIFIED SUBSCRIPTION STATUS [${debugId}]: Status API error:`, error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to get subscription status',
        debugId,
        errorDetails: {
          location: 'unified subscription status API'
        }
      },
      { status: 500 }
    );
  }
}
