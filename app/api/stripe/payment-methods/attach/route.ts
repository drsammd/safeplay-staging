
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe/config';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { setupIntentId, setAsDefault = false } = await request.json();

    if (!setupIntentId) {
      return NextResponse.json({ error: 'Setup intent ID required' }, { status: 400 });
    }

    // Retrieve the setup intent to get the payment method
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    
    if (!setupIntent.payment_method) {
      return NextResponse.json({ error: 'No payment method found' }, { status: 400 });
    }

    const paymentMethodId = setupIntent.payment_method as string;

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Get user's customer ID
    const userSub = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id }
    });

    if (!userSub?.stripeCustomerId) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 });
    }

    // If setting as default, update others first
    if (setAsDefault) {
      await prisma.userPaymentMethod.updateMany({
        where: { 
          userId: session.user.id,
          isDefault: true 
        },
        data: { isDefault: false }
      });

      // Also set as default in Stripe
      await stripe.customers.update(userSub.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }

    // Save to database
    const savedPaymentMethod = await prisma.userPaymentMethod.create({
      data: {
        userId: session.user.id,
        stripePaymentMethodId: paymentMethodId,
        type: 'CARD',
        last4: paymentMethod.card?.last4 || '',
        brand: paymentMethod.card?.brand || '',
        expiryMonth: paymentMethod.card?.exp_month || 1,
        expiryYear: paymentMethod.card?.exp_year || 2025,
        isDefault: setAsDefault,
      }
    });

    return NextResponse.json({ 
      paymentMethod: savedPaymentMethod,
      message: 'Payment method added successfully'
    });
  } catch (error) {
    console.error('Error attaching payment method:', error);
    return NextResponse.json(
      { error: 'Failed to attach payment method' },
      { status: 500 }
    );
  }
}
