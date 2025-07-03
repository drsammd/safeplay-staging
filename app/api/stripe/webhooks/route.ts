
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe, stripeConfig } from '@/lib/stripe/config';
import { subscriptionService } from '@/lib/stripe/subscription-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !stripeConfig.webhookSecret) {
      console.error('Missing Stripe signature or webhook secret');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeConfig.webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received Stripe webhook:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionEvent(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log the billing event
    await logBillingEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionEvent(subscription: any) {
  try {
    await subscriptionService.updateSubscriptionFromStripe(subscription);
    console.log('Subscription updated:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription event:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const userId = subscription.metadata?.userId;
    if (userId) {
      await prisma.userSubscription.update({
        where: { userId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        }
      });
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const userId = invoice.customer_metadata?.userId || invoice.subscription_metadata?.userId;
    if (userId) {
      // Reset payment failure count
      await prisma.userSubscription.update({
        where: { userId },
        data: {
          paymentFailures: 0,
          lastPaymentFailure: null,
        }
      });

      // Create payment transaction record
      await prisma.paymentTransaction.create({
        data: {
          userId,
          type: 'SUBSCRIPTION',
          status: 'SUCCEEDED',
          amount: invoice.amount_paid / 100, // Convert from cents
          currency: invoice.currency.toUpperCase(),
          description: `Subscription payment - ${invoice.period_start ? new Date(invoice.period_start * 1000).toDateString() : 'N/A'}`,
          stripePaymentIntentId: invoice.payment_intent,
          stripeChargeId: invoice.charge,
          billingPeriodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
          billingPeriodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
          metadata: invoice,
        }
      });
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    const userId = invoice.customer_metadata?.userId || invoice.subscription_metadata?.userId;
    if (userId) {
      // Increment payment failure count
      await prisma.userSubscription.update({
        where: { userId },
        data: {
          paymentFailures: { increment: 1 },
          lastPaymentFailure: new Date(),
        }
      });

      // Create failed payment transaction record
      await prisma.paymentTransaction.create({
        data: {
          userId,
          type: 'SUBSCRIPTION',
          status: 'FAILED',
          amount: invoice.amount_due / 100,
          currency: invoice.currency.toUpperCase(),
          description: `Failed subscription payment - ${invoice.period_start ? new Date(invoice.period_start * 1000).toDateString() : 'N/A'}`,
          failureReason: invoice.last_finalization_error?.message || 'Payment failed',
          metadata: invoice,
        }
      });
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleCustomerCreated(customer: any) {
  try {
    const userId = customer.metadata?.userId;
    if (userId) {
      await prisma.userSubscription.upsert({
        where: { userId },
        create: {
          userId,
          planId: await getBasicPlanId(),
          status: 'INCOMPLETE',
          stripeCustomerId: customer.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          billingInterval: 'MONTHLY',
        },
        update: {
          stripeCustomerId: customer.id,
        }
      });
    }
  } catch (error) {
    console.error('Error handling customer created:', error);
  }
}

async function handlePaymentMethodAttached(paymentMethod: any) {
  try {
    const customerId = paymentMethod.customer;
    if (customerId) {
      const userSub = await prisma.userSubscription.findFirst({
        where: { stripeCustomerId: customerId }
      });

      if (userSub) {
        await prisma.userPaymentMethod.create({
          data: {
            userId: userSub.userId,
            stripePaymentMethodId: paymentMethod.id,
            type: mapPaymentMethodType(paymentMethod.type),
            last4: paymentMethod.card?.last4,
            brand: paymentMethod.card?.brand,
            expiryMonth: paymentMethod.card?.exp_month,
            expiryYear: paymentMethod.card?.exp_year,
            isDefault: false,
          }
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment method attached:', error);
  }
}

async function logBillingEvent(event: any) {
  try {
    const userId = event.data.object.metadata?.userId || 
                   event.data.object.customer_metadata?.userId ||
                   event.data.object.subscription_metadata?.userId;

    if (userId) {
      await prisma.billingEvent.create({
        data: {
          userId,
          eventType: mapEventTypeToBillingEvent(event.type),
          status: 'COMPLETED',
          description: `Stripe webhook: ${event.type}`,
          stripeEventId: event.id,
          stripeEventType: event.type,
          stripeObjectId: event.data.object.id,
          processedAt: new Date(),
          metadata: event.data.object,
        }
      });
    }
  } catch (error) {
    console.error('Error logging billing event:', error);
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

function mapEventTypeToBillingEvent(eventType: string) {
  const eventMap: Record<string, any> = {
    'customer.subscription.created': 'SUBSCRIPTION_CREATED',
    'customer.subscription.updated': 'SUBSCRIPTION_UPDATED',
    'customer.subscription.deleted': 'SUBSCRIPTION_CANCELED',
    'invoice.payment_succeeded': 'PAYMENT_SUCCEEDED',
    'invoice.payment_failed': 'PAYMENT_FAILED',
    'customer.created': 'CUSTOMER_CREATED',
  };
  return eventMap[eventType] || 'PAYMENT_SUCCEEDED';
}

async function getBasicPlanId(): Promise<string> {
  const basicPlan = await prisma.subscriptionPlan.findFirst({
    where: { planType: 'BASIC' }
  });
  
  if (!basicPlan) {
    throw new Error('Basic plan not found');
  }
  
  return basicPlan.id;
}
