
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSubscriptionIssue() {
  try {
    console.log('=== SUBSCRIPTION ISSUE DEBUG ===');
    
    // Check subscription plans
    console.log('\n📋 Checking subscription plans...');
    const plans = await prisma.subscriptionPlan.findMany();
    console.log(`Found ${plans.length} subscription plans:`);
    
    plans.forEach((plan, index) => {
      console.log(`\n${index + 1}. ${plan.name} (${plan.planType})`);
      console.log(`   Monthly Price ID: ${plan.stripePriceId || 'MISSING'}`);
      console.log(`   Yearly Price ID: ${plan.stripeYearlyPriceId || 'MISSING'}`);
      console.log(`   Lifetime Price ID: ${plan.stripeLifetimePriceId || 'MISSING'}`);
      console.log(`   Price: $${plan.price || 0}`);
      console.log(`   Yearly Price: $${plan.yearlyPrice || 0}`);
      console.log(`   Lifetime Price: $${plan.lifetimePrice || 0}`);
    });
    
    // Check environment variables
    console.log('\n🔧 Checking environment variables...');
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_BASIC_MONTHLY_PRICE_ID',
      'STRIPE_BASIC_YEARLY_PRICE_ID',
      'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
      'STRIPE_PREMIUM_YEARLY_PRICE_ID',
      'STRIPE_FAMILY_MONTHLY_PRICE_ID',
      'STRIPE_FAMILY_YEARLY_PRICE_ID',
      'STRIPE_LIFETIME_PRICE_ID'
    ];
    
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      console.log(`${envVar}: ${value ? 'SET' : 'MISSING'}`);
    });
    
    // Check user subscriptions
    console.log('\n👤 Checking user subscriptions...');
    const subscriptions = await prisma.userSubscription.findMany({
      include: {
        user: true,
        plan: true
      }
    });
    
    console.log(`Found ${subscriptions.length} user subscriptions:`);
    subscriptions.forEach((sub, index) => {
      console.log(`\n${index + 1}. User: ${sub.user.email}`);
      console.log(`   Plan: ${sub.plan?.name || 'Unknown'}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Stripe Customer ID: ${sub.stripeCustomerId || 'MISSING'}`);
      console.log(`   Stripe Subscription ID: ${sub.stripeSubscriptionId || 'MISSING'}`);
    });
    
    console.log('\n=== DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('Error in debugSubscriptionIssue:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSubscriptionIssue();
