
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionService } from '@/lib/stripe/subscription-service';

export const dynamic = 'force-dynamic';

const subscriptionService = new SubscriptionService();

export async function POST(request: NextRequest) {
  const debugId = `individual_purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`💰 INDIVIDUAL PURCHASE DEBUG [${debugId}]: API endpoint called at ${new Date().toISOString()}`);
    
    const session = await getServerSession(authOptions);
    console.log(`💰 INDIVIDUAL PURCHASE DEBUG [${debugId}]: Session check:`, {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name
    });

    if (!session?.user?.id) {
      console.error(`🚨 INDIVIDUAL PURCHASE DEBUG [${debugId}]: No authentication`);
      return NextResponse.json(
        { error: 'Authentication required', debugId },
        { status: 401 }
      );
    }

    const requestBody = await request.json();
    const { purchaseType, memoryId, paymentMethodId } = requestBody;
    
    console.log(`💰 INDIVIDUAL PURCHASE DEBUG [${debugId}]: Request body:`, {
      purchaseType,
      memoryId,
      hasPaymentMethod: !!paymentMethodId,
      fullRequestBody: requestBody
    });

    if (!purchaseType || !['PHOTO', 'VIDEO_MONTAGE'].includes(purchaseType)) {
      console.error(`🚨 INDIVIDUAL PURCHASE DEBUG [${debugId}]: Invalid purchase type`);
      return NextResponse.json(
        { error: 'Valid purchase type is required (PHOTO or VIDEO_MONTAGE)', debugId },
        { status: 400 }
      );
    }

    console.log(`📞 INDIVIDUAL PURCHASE DEBUG [${debugId}]: Creating individual purchase...`);
    
    const result = await subscriptionService.createIndividualPurchase(
      session.user.id,
      purchaseType,
      memoryId,
      paymentMethodId
    );

    console.log(`✅ INDIVIDUAL PURCHASE DEBUG [${debugId}]: Purchase created:`, {
      purchaseId: result.purchase.id,
      amount: result.purchase.amount,
      type: result.purchase.purchaseType,
      hasCheckoutUrl: !!result.checkoutUrl
    });

    const response = {
      success: true,
      purchase: result.purchase,
      checkoutUrl: result.checkoutUrl,
      message: `${purchaseType === 'PHOTO' ? 'Photo' : 'Video'} purchase created successfully!`,
      debugId
    };

    console.log(`🎉 INDIVIDUAL PURCHASE DEBUG [${debugId}]: Returning successful response`);
    return NextResponse.json(response);

  } catch (error) {
    console.error(`🚨 INDIVIDUAL PURCHASE DEBUG [${debugId}]: API error:`, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorName: error?.name,
      fullError: error
    });
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to create individual purchase',
        debugId,
        errorDetails: {
          location: 'individual purchase API catch block'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const debugId = `individual_purchase_history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`💰 INDIVIDUAL PURCHASE HISTORY DEBUG [${debugId}]: API endpoint called`);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required', debugId },
        { status: 401 }
      );
    }

    // Get user's individual purchase history
    const { prisma } = await import('@/lib/db');
    const purchases = await prisma.individualPurchase.findMany({
      where: { userId: session.user.id },
      include: {
        memory: {
          include: {
            child: true,
            venue: true
          }
        }
      },
      orderBy: { purchasedAt: 'desc' }
    });

    console.log(`✅ INDIVIDUAL PURCHASE HISTORY DEBUG [${debugId}]: Found ${purchases.length} purchases`);

    return NextResponse.json({
      success: true,
      purchases,
      debugId
    });

  } catch (error) {
    console.error(`🚨 INDIVIDUAL PURCHASE HISTORY DEBUG [${debugId}]: API error:`, error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to get purchase history',
        debugId 
      },
      { status: 500 }
    );
  }
}
