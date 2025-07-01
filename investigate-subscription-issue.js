
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateSubscriptionIssue() {
  console.log('=== INVESTIGATING SUBSCRIPTION ISSUE ===\n');

  try {
    // 1. Check the specific reported user
    console.log('1. Checking drsam+18@outlook.com user:');
    const reportedUser = await prisma.user.findUnique({
      where: { email: 'drsam+18@outlook.com' },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    if (reportedUser) {
      console.log('User found:', {
        id: reportedUser.id,
        email: reportedUser.email,
        createdAt: reportedUser.createdAt,
        role: reportedUser.role
      });
      console.log('Subscription:', reportedUser.subscription ? {
        id: reportedUser.subscription.id,
        status: reportedUser.subscription.status,
        planName: reportedUser.subscription.plan?.name,
        planPrice: reportedUser.subscription.plan?.price,
        currentPeriodEnd: reportedUser.subscription.currentPeriodEnd,
        createdAt: reportedUser.subscription.createdAt,
        stripeSubscriptionId: reportedUser.subscription.stripeSubscriptionId,
        stripeCustomerId: reportedUser.subscription.stripeCustomerId
      } : 'NO SUBSCRIPTION');
    } else {
      console.log('User not found');
    }

    console.log('\n2. Checking all recent users (last 24 hours):');
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${recentUsers.length} recent users:`);
    recentUsers.forEach(user => {
      console.log(`- ${user.email} (${user.createdAt.toISOString()}): ${user.subscription ? 'HAS SUBSCRIPTION' : 'NO SUBSCRIPTION'}`);
      if (user.subscription) {
        console.log(`  * ${user.subscription.plan?.name} - ${user.subscription.status} (${user.subscription.createdAt.toISOString()})`);
      }
    });

    console.log('\n3. Checking all subscription plans:');
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: {
        price: 'asc'
      }
    });
    
    console.log('Available plans:');
    plans.forEach(plan => {
      console.log(`- ${plan.name}: $${plan.price}/${plan.interval} (ID: ${plan.id})`);
    });

    console.log('\n4. Checking for suspicious subscription patterns:');
    const allSubscriptions = await prisma.userSubscription.findMany({
      include: {
        user: true,
        plan: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${allSubscriptions.length} subscriptions created in last 7 days:`);
    allSubscriptions.forEach(sub => {
      console.log(`- User: ${sub.user.email}, Plan: ${sub.plan.name}, Status: ${sub.status}, Stripe ID: ${sub.stripeSubscriptionId || 'NONE'}`);
    });

    console.log('\n5. Checking for subscriptions without Stripe IDs (potential defaults):');
    const subsWithoutStripe = await prisma.userSubscription.findMany({
      where: {
        OR: [
          { stripeSubscriptionId: null },
          { stripeSubscriptionId: '' }
        ]
      },
      include: {
        user: true,
        plan: true
      }
    });

    console.log(`Found ${subsWithoutStripe.length} subscriptions without Stripe IDs:`);
    subsWithoutStripe.forEach(sub => {
      console.log(`- User: ${sub.user.email}, Plan: ${sub.plan.name}, Status: ${sub.status}, Created: ${sub.createdAt.toISOString()}`);
    });

  } catch (error) {
    console.error('Investigation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateSubscriptionIssue();
