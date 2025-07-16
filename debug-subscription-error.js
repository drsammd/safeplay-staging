// Debug script to identify the subscription modification issue

const { PrismaClient } = require('@prisma/client');

async function debugSubscriptionIssue() {
  console.log('🔍 Debugging subscription modification issue...');
  
  const prisma = new PrismaClient();
  
  try {
    // Check for any users with subscriptions
    const usersWithSubs = await prisma.userSubscription.findMany({
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    console.log('📊 Found', usersWithSubs.length, 'users with subscriptions');
    
    if (usersWithSubs.length > 0) {
      const testUser = usersWithSubs[0];
      console.log('🧪 Testing with user:', testUser.user.email);
      console.log('📋 Subscription details:', {
        userId: testUser.userId,
        planType: testUser.planType,
        status: testUser.status,
        hasStripeSubscriptionId: !!testUser.stripeSubscriptionId,
        stripeSubscriptionId: testUser.stripeSubscriptionId
      });
      
      // Check if Stripe subscription ID exists and is valid format
      if (!testUser.stripeSubscriptionId) {
        console.log('❌ ISSUE FOUND: No Stripe subscription ID in database');
        console.log('🔧 This would cause "No active subscription found" error');
      } else if (!testUser.stripeSubscriptionId.startsWith('sub_')) {
        console.log('❌ ISSUE FOUND: Invalid Stripe subscription ID format:', testUser.stripeSubscriptionId);
        console.log('🔧 This would cause Stripe API errors');
      } else {
        console.log('✅ Stripe subscription ID looks valid');
      }
    } else {
      console.log('❌ ISSUE FOUND: No users with subscriptions found');
      console.log('🔧 Users trying to upgrade may not have initial subscription records');
    }
    
    // Check environment variables for Stripe configuration
    console.log('\n🔑 Checking Stripe configuration...');
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.log('❌ ISSUE FOUND: STRIPE_SECRET_KEY not set');
    } else if (!stripeKey.startsWith('sk_')) {
      console.log('❌ ISSUE FOUND: Invalid STRIPE_SECRET_KEY format');
    } else {
      console.log('✅ STRIPE_SECRET_KEY looks valid');
    }
    
    // Check price ID environment variables
    console.log('\n💰 Checking price ID configuration...');
    const priceIds = {
      basic: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
      premium: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      family: process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID
    };
    
    for (const [plan, priceId] of Object.entries(priceIds)) {
      if (!priceId) {
        console.log(`❌ ISSUE FOUND: STRIPE_${plan.toUpperCase()}_MONTHLY_PRICE_ID not set`);
      } else if (!priceId.startsWith('price_')) {
        console.log(`❌ ISSUE FOUND: Invalid price ID format for ${plan}:`, priceId);
      } else {
        console.log(`✅ ${plan} price ID looks valid:`, priceId);
      }
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('🔧 This could be the root cause of the 500 error');
  } finally {
    await prisma.$disconnect();
  }
}

debugSubscriptionIssue().catch(console.error);
