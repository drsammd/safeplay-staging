
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe/config';
import { prisma } from '@/lib/db';
import { unifiedCustomerService } from '@/lib/stripe/unified-customer-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const debugId = `setup_intent_unified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔧 UNIFIED SETUP INTENT [${debugId}]: Setup intent creation called`);
    
    // CRITICAL v1.5.40-alpha.9 FIX: Use unified customer service session validation (existing user operation)
    const sessionValidation = await unifiedCustomerService.validateSessionSecurity({
      isSignupFlow: false,
      operation: 'setup_intent_creation'
    });
    
    if (!sessionValidation.isValid) {
      console.error(`🚨 UNIFIED SETUP INTENT [${debugId}]: Session validation failed`);
      return NextResponse.json({
        error: 'Authentication required',
        details: sessionValidation.errors,
        debugId
      }, { status: 401 });
    }

    console.log(`✅ UNIFIED SETUP INTENT [${debugId}]: Session validation successful`, {
      userId: sessionValidation.userId,
      userEmail: sessionValidation.userEmail
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: sessionValidation.userId! },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      console.error(`🚨 UNIFIED SETUP INTENT [${debugId}]: User not found in database`);
      return NextResponse.json({ 
        error: 'User not found',
        debugId 
      }, { status: 404 });
    }

    console.log(`👤 UNIFIED SETUP INTENT [${debugId}]: User found: ${user.email}`);

    // CRITICAL v1.5.40-alpha.9 FIX: Use unified customer service to get or create customer
    const customerResult = await unifiedCustomerService.getOrCreateCustomer(
      user.email,
      user.name || user.email.split('@')[0],
      user.id,
      false // Not a free plan
    );

    if (customerResult.errors.length > 0) {
      console.error(`🚨 UNIFIED SETUP INTENT [${debugId}]: Customer creation/retrieval failed:`, customerResult.errors);
      return NextResponse.json({
        error: 'Failed to get or create customer',
        details: customerResult.errors,
        debugId
      }, { status: 500 });
    }

    console.log(`✅ UNIFIED SETUP INTENT [${debugId}]: Customer ready:`, {
      customerId: customerResult.customer.id,
      isNewCustomer: customerResult.isNewCustomer,
      source: customerResult.source
    });

    // Create setup intent with the unified customer
    console.log(`🔧 UNIFIED SETUP INTENT [${debugId}]: Creating setup intent...`);
    
    const setupIntent = await stripe.setupIntents.create({
      customer: customerResult.customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        userId: user.id,
        platform: 'safeplay',
        source: 'unified_customer_service',
        debugId
      }
    });

    console.log(`✅ UNIFIED SETUP INTENT [${debugId}]: Setup intent created successfully:`, {
      setupIntentId: setupIntent.id,
      customerId: setupIntent.customer,
      status: setupIntent.status
    });

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId: customerResult.customer.id,
      customerInfo: {
        isNewCustomer: customerResult.isNewCustomer,
        source: customerResult.source,
        warnings: customerResult.warnings
      },
      debugId
    });

  } catch (error) {
    console.error(`🚨 UNIFIED SETUP INTENT [${debugId}]: Setup intent creation error:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to create setup intent',
        details: error instanceof Error ? error.message : 'Unknown error',
        debugId,
        errorDetails: {
          location: 'unified setup intent API'
        }
      },
      { status: 500 }
    );
  }
}


