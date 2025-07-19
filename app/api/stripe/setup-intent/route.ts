
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

    // Get or create customer
    let userSub = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    });

    let customerId = userSub?.stripeCustomerId;

    if (!customerId) {
      // Get user info first
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // CRITICAL v1.5.31 FIX: Check for existing customer before creating to prevent duplicates
      console.log('🔍 SETUP INTENT: Checking for existing Stripe customer by email...');
      
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      let customer;
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('✅ SETUP INTENT: Found existing Stripe customer:', customer.id);
      } else {
        console.log('🏪 SETUP INTENT: Creating new Stripe customer...');
        customer = await stripe.customers.create({
          email: user.email,
          name: user.name || '',
          metadata: {
            userId: session.user.id
          }
        });
        console.log('✅ SETUP INTENT: New Stripe customer created:', customer.id);
      }

      customerId = customer.id;

      // Update or create user subscription with customer ID
      await prisma.userSubscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          planId: userSub?.planId || await getBasicPlanId(),
          status: 'INCOMPLETE',
          stripeCustomerId: customerId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          billingInterval: 'MONTHLY',
        },
        update: {
          stripeCustomerId: customerId,
        }
      });
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        userId: session.user.id
      }
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
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
