
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe, stripeConfig } from '@/lib/stripe/config';
import { connectService } from '@/lib/stripe/connect-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !stripeConfig.connectWebhookSecret) {
      console.error('Missing Stripe Connect signature or webhook secret');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeConfig.connectWebhookSecret);
    } catch (err: any) {
      console.error('Connect webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received Stripe Connect webhook:', event.type);

    // Handle different Connect event types
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;

      case 'transfer.updated':
        await handleTransferUpdated(event.data.object);
        break;

      case 'payout.created':
        await handlePayoutCreated(event.data.object);
        break;

      case 'payout.paid':
        await handlePayoutPaid(event.data.object);
        break;

      case 'payout.failed':
        await handlePayoutFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled Connect event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Connect webhook error:', error);
    return NextResponse.json(
      { error: 'Connect webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleAccountUpdated(account: any) {
  try {
    const venueId = account.metadata?.venueId;
    if (!venueId) {
      console.log('No venueId found in account metadata');
      return;
    }

    const status = mapStripeAccountStatus(account);
    
    await prisma.venuePaymentSettings.update({
      where: { venueId },
      data: {
        stripeAccountStatus: status,
        stripeOnboardingComplete: account.details_submitted && account.charges_enabled,
        stripeRequirements: account.requirements,
        taxIdProvided: !account.requirements?.currently_due?.includes('business_tax_id'),
        businessVerified: account.business_profile?.support_email ? true : false,
        identityVerified: account.individual?.verification?.status === 'verified',
        isActive: account.charges_enabled,
      }
    });

    console.log(`Account updated for venue ${venueId}: ${status}`);
  } catch (error) {
    console.error('Error handling account updated:', error);
  }
}

async function handleAccountDeauthorized(application: any) {
  try {
    const accountId = application.account;
    
    await prisma.venuePaymentSettings.update({
      where: { stripeConnectAccountId: accountId },
      data: {
        stripeAccountStatus: 'DISABLED',
        isActive: false,
      }
    });

    console.log(`Account deauthorized: ${accountId}`);
  } catch (error) {
    console.error('Error handling account deauthorized:', error);
  }
}

async function handleTransferCreated(transfer: any) {
  try {
    const venueId = transfer.metadata?.venueId;
    if (!venueId) return;

    await prisma.revenueTransaction.updateMany({
      where: {
        venueId,
        stripeTransferId: transfer.id,
      },
      data: {
        status: 'PROCESSING',
        processedAt: new Date(),
      }
    });

    console.log(`Transfer created for venue ${venueId}: ${transfer.id}`);
  } catch (error) {
    console.error('Error handling transfer created:', error);
  }
}

async function handleTransferUpdated(transfer: any) {
  try {
    const venueId = transfer.metadata?.venueId;
    if (!venueId) return;

    const status = transfer.status === 'failed' ? 'FAILED' : 'COMPLETED';
    const updateData: any = { status };
    
    if (transfer.status === 'failed') {
      updateData.failureReason = transfer.failure_message || 'Transfer failed';
    } else if (transfer.status === 'paid') {
      updateData.transferredAt = new Date();
    }

    await prisma.revenueTransaction.updateMany({
      where: {
        venueId,
        stripeTransferId: transfer.id,
      },
      data: updateData
    });

    console.log(`Transfer updated for venue ${venueId}: ${transfer.id} - ${transfer.status}`);
  } catch (error) {
    console.error('Error handling transfer updated:', error);
  }
}

async function handlePayoutCreated(payout: any) {
  try {
    const accountId = payout.destination;
    
    const paymentSettings = await prisma.venuePaymentSettings.findFirst({
      where: { stripeConnectAccountId: accountId }
    });

    if (paymentSettings) {
      await prisma.payoutHistory.create({
        data: {
          venueId: paymentSettings.venueId,
          amount: payout.amount / 100, // Convert from cents
          currency: payout.currency.toUpperCase(),
          description: `Payout to ${payout.method}`,
          payoutPeriodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          payoutPeriodEnd: new Date(),
          stripePayoutId: payout.id,
          status: 'PENDING',
        }
      });
    }

    console.log(`Payout created: ${payout.id}`);
  } catch (error) {
    console.error('Error handling payout created:', error);
  }
}

async function handlePayoutPaid(payout: any) {
  try {
    await prisma.payoutHistory.update({
      where: { stripePayoutId: payout.id },
      data: {
        status: 'PAID',
        completedAt: new Date(payout.arrival_date * 1000),
      }
    });

    console.log(`Payout paid: ${payout.id}`);
  } catch (error) {
    console.error('Error handling payout paid:', error);
  }
}

async function handlePayoutFailed(payout: any) {
  try {
    await prisma.payoutHistory.update({
      where: { stripePayoutId: payout.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: payout.failure_message || 'Payout failed',
      }
    });

    console.log(`Payout failed: ${payout.id}`);
  } catch (error) {
    console.error('Error handling payout failed:', error);
  }
}

function mapStripeAccountStatus(account: any) {
  if (account.charges_enabled && account.payouts_enabled) {
    return 'ENABLED';
  } else if (account.requirements?.disabled_reason) {
    return 'DISABLED';
  } else if (account.requirements?.currently_due?.length > 0) {
    return 'RESTRICTED';
  } else {
    return 'PENDING';
  }
}
