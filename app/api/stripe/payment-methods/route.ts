
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe/config';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentMethods = await prisma.userPaymentMethod.findMany({
      where: { 
        userId: session.user.id,
        isActive: true 
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentMethodId, setAsDefault } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 });
    }

    // Get user's subscription to find customer ID
    const userSub = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id }
    });

    if (!userSub?.stripeCustomerId) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: userSub.stripeCustomerId,
    });

    // Get payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // If setting as default, update others first
    if (setAsDefault) {
      await prisma.userPaymentMethod.updateMany({
        where: { 
          userId: session.user.id,
          isDefault: true 
        },
        data: { isDefault: false }
      });
    }

    // Save to database
    const savedPaymentMethod = await prisma.userPaymentMethod.create({
      data: {
        userId: session.user.id,
        stripePaymentMethodId: paymentMethodId,
        type: mapPaymentMethodType(paymentMethod.type),
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year,
        isDefault: setAsDefault || false,
      }
    });

    return NextResponse.json({ paymentMethod: savedPaymentMethod });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return NextResponse.json(
      { error: 'Failed to add payment method' },
      { status: 500 }
    );
  }
}

function mapPaymentMethodType(stripeType: string) {
  const typeMap: Record<string, any> = {
    'card': 'CARD',
    'us_bank_account': 'BANK_ACCOUNT',
    'paypal': 'PAYPAL',
  };
  return typeMap[stripeType] || 'CARD';
}
