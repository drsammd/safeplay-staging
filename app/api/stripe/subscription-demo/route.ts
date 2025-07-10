
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { demoSubscriptionService } from '@/lib/stripe/demo-subscription-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // COMPREHENSIVE DEBUGGING - START
  const debugId = `subscription_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔍 SUBSCRIPTION DEMO DEBUG [${debugId}]: API endpoint called at ${new Date().toISOString()}`);
    
    const session = await getServerSession(authOptions);
    console.log(`🔍 SUBSCRIPTION DEMO DEBUG [${debugId}]: Session check:`, {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name
    });

    const requestBody = await request.json();
    const { planId, paymentMethodId, isSignupFlow, debugId: clientDebugId } = requestBody;
    
    console.log(`🔍 SUBSCRIPTION DEMO DEBUG [${debugId}]: Request body:`, {
      planId,
      paymentMethodId,
      isSignupFlow,
      clientDebugId,
      fullRequestBody: requestBody
    });

    if (!planId) {
      console.error(`🚨 SUBSCRIPTION DEMO DEBUG [${debugId}]: Missing planId`);
      return NextResponse.json(
        { error: 'Plan ID is required', debugId },
        { status: 400 }
      );
    }

    // Handle signup flow (no authentication required)
    if (!session?.user?.id) {
      console.log(`🚀 SUBSCRIPTION DEMO DEBUG [${debugId}]: Handling signup flow - no authentication required`);
      console.log(`🚀 SUBSCRIPTION DEMO DEBUG [${debugId}]: Creating temporary subscription for signup with plan:`, planId);

      try {
        console.log(`📞 SUBSCRIPTION DEMO DEBUG [${debugId}]: Calling demoSubscriptionService.createSignupSubscription...`);
        
        // Create a temporary subscription for signup flow
        const tempSubscription = await demoSubscriptionService.createSignupSubscription(
          planId,
          paymentMethodId
        );

        console.log(`✅ SUBSCRIPTION DEMO DEBUG [${debugId}]: Demo subscription service returned:`, tempSubscription);

        const response = {
          success: true,
          subscription: tempSubscription,
          customer: tempSubscription.customer,
          isSignupFlow: true,
          message: 'Demo subscription prepared for signup! This is a test environment.',
          debugId
        };

        console.log(`🎉 SUBSCRIPTION DEMO DEBUG [${debugId}]: Returning successful response:`, response);
        return NextResponse.json(response);
        
      } catch (demoServiceError) {
        console.error(`🚨 SUBSCRIPTION DEMO DEBUG [${debugId}]: Demo subscription service error:`, {
          errorMessage: demoServiceError?.message,
          errorStack: demoServiceError?.stack,
          errorName: demoServiceError?.name,
          fullError: demoServiceError
        });
        
        return NextResponse.json(
          { 
            error: demoServiceError?.message || 'Failed to create demo subscription',
            debugId,
            errorDetails: {
              service: 'demoSubscriptionService',
              method: 'createSignupSubscription',
              planId,
              paymentMethodId
            }
          },
          { status: 500 }
        );
      }
    }

    // Handle authenticated user flow (existing logic)
    console.log(`🎭 SUBSCRIPTION DEMO DEBUG [${debugId}]: Creating subscription for authenticated user:`, session.user.id, 'Plan:', planId);

    try {
      console.log(`📞 SUBSCRIPTION DEMO DEBUG [${debugId}]: Calling demoSubscriptionService.createSubscription...`);
      
      // Create subscription using demo service
      const subscription = await demoSubscriptionService.createSubscription(
        session.user.id,
        planId,
        paymentMethodId
      );

      console.log(`✅ SUBSCRIPTION DEMO DEBUG [${debugId}]: Authenticated subscription created:`, subscription);

      const response = {
        success: true,
        subscription,
        message: 'Demo subscription created successfully! This is a test environment.',
        debugId
      };

      console.log(`🎉 SUBSCRIPTION DEMO DEBUG [${debugId}]: Returning authenticated response:`, response);
      return NextResponse.json(response);
      
    } catch (authServiceError) {
      console.error(`🚨 SUBSCRIPTION DEMO DEBUG [${debugId}]: Authenticated subscription service error:`, {
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
            service: 'demoSubscriptionService',
            method: 'createSubscription',
            userId: session.user.id,
            planId,
            paymentMethodId
          }
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error(`🚨 SUBSCRIPTION DEMO DEBUG [${debugId}]: General API error:`, {
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
          location: 'subscription-demo API root catch block'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const debugId = `subscription_demo_get_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔍 SUBSCRIPTION DEMO GET DEBUG [${debugId}]: Status check called`);
    
    const session = await getServerSession(authOptions);
    console.log(`🔍 SUBSCRIPTION DEMO GET DEBUG [${debugId}]: Session check:`, {
      hasSession: !!session,
      userId: session?.user?.id
    });
    
    if (!session?.user?.id) {
      console.log(`❌ SUBSCRIPTION DEMO GET DEBUG [${debugId}]: No authentication for status check`);
      return NextResponse.json(
        { error: 'Authentication required', debugId },
        { status: 401 }
      );
    }

    console.log(`📞 SUBSCRIPTION DEMO GET DEBUG [${debugId}]: Calling getSubscriptionStatus...`);
    const status = await demoSubscriptionService.getSubscriptionStatus(session.user.id);
    console.log(`✅ SUBSCRIPTION DEMO GET DEBUG [${debugId}]: Status retrieved:`, status);

    return NextResponse.json({
      success: true,
      debugId,
      ...status
    });

  } catch (error) {
    console.error(`🚨 SUBSCRIPTION DEMO GET DEBUG [${debugId}]: Status API error:`, error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to get subscription status',
        debugId 
      },
      { status: 500 }
    );
  }
}
