
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionService } from '@/lib/stripe/subscription-service';

export const dynamic = 'force-dynamic';

const subscriptionService = new SubscriptionService();

export async function POST(request: NextRequest) {
  const debugId = `pack_purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`📦 PACK PURCHASE DEBUG [${debugId}]: API endpoint called at ${new Date().toISOString()}`);
    
    const session = await getServerSession(authOptions);
    console.log(`📦 PACK PURCHASE DEBUG [${debugId}]: Session check:`, {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name
    });

    if (!session?.user?.id) {
      console.error(`🚨 PACK PURCHASE DEBUG [${debugId}]: No authentication`);
      return NextResponse.json(
        { error: 'Authentication required', debugId },
        { status: 401 }
      );
    }

    const requestBody = await request.json();
    const { packType, paymentMethodId } = requestBody;
    
    console.log(`📦 PACK PURCHASE DEBUG [${debugId}]: Request body:`, {
      packType,
      hasPaymentMethod: !!paymentMethodId,
      fullRequestBody: requestBody
    });

    if (!packType || !['PACK_1', 'PACK_2', 'PACK_3'].includes(packType)) {
      console.error(`🚨 PACK PURCHASE DEBUG [${debugId}]: Invalid pack type`);
      return NextResponse.json(
        { error: 'Valid pack type is required (PACK_1, PACK_2, or PACK_3)', debugId },
        { status: 400 }
      );
    }

    console.log(`📞 PACK PURCHASE DEBUG [${debugId}]: Creating photo/video pack purchase...`);
    
    const result = await subscriptionService.createPhotoVideoPackPurchase(
      session.user.id,
      packType,
      paymentMethodId
    );

    console.log(`✅ PACK PURCHASE DEBUG [${debugId}]: Pack purchase created:`, {
      packPurchaseId: result.packPurchase.id,
      amount: result.packPurchase.amount,
      packType: result.packPurchase.packType,
      photoCredits: result.packPurchase.photoCredits,
      videoCredits: result.packPurchase.videoCredits,
      hasCheckoutUrl: !!result.checkoutUrl
    });

    const response = {
      success: true,
      packPurchase: result.packPurchase,
      checkoutUrl: result.checkoutUrl,
      message: `${packType} pack purchase created successfully!`,
      debugId
    };

    console.log(`🎉 PACK PURCHASE DEBUG [${debugId}]: Returning successful response`);
    return NextResponse.json(response);

  } catch (error) {
    console.error(`🚨 PACK PURCHASE DEBUG [${debugId}]: API error:`, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorName: error?.name,
      fullError: error
    });
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to create pack purchase',
        debugId,
        errorDetails: {
          location: 'pack purchase API catch block'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const debugId = `pack_purchase_history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`📦 PACK PURCHASE HISTORY DEBUG [${debugId}]: API endpoint called`);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required', debugId },
        { status: 401 }
      );
    }

    // Get user's pack purchase history and remaining credits
    const { prisma } = await import('@/lib/db');
    
    const packPurchases = await prisma.photoVideoPackPurchase.findMany({
      where: { userId: session.user.id },
      include: {
        credits: {
          where: { isUsed: false }, // Only unused credits
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { purchasedAt: 'desc' }
    });

    // Calculate remaining credits
    const remainingCredits = {
      photos: 0,
      videos: 0
    };

    packPurchases.forEach(pack => {
      pack.credits.forEach(credit => {
        if (!credit.isUsed) {
          if (credit.creditType === 'PHOTO') {
            remainingCredits.photos++;
          } else if (credit.creditType === 'VIDEO_MONTAGE') {
            remainingCredits.videos++;
          }
        }
      });
    });

    console.log(`✅ PACK PURCHASE HISTORY DEBUG [${debugId}]: Found ${packPurchases.length} pack purchases`);
    console.log(`✅ PACK PURCHASE HISTORY DEBUG [${debugId}]: Remaining credits:`, remainingCredits);

    return NextResponse.json({
      success: true,
      packPurchases,
      remainingCredits,
      debugId
    });

  } catch (error) {
    console.error(`🚨 PACK PURCHASE HISTORY DEBUG [${debugId}]: API error:`, error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to get pack purchase history',
        debugId 
      },
      { status: 500 }
    );
  }
}
