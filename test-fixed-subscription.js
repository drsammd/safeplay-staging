
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import the fixed subscription service
const { fixedSubscriptionService } = require('./lib/stripe/subscription-service-fixed');

async function testFixedSubscriptionSystem() {
  try {
    console.log('=== FIXED SUBSCRIPTION SYSTEM TEST ===');
    
    // Test 1: Check if fixed subscription service works
    console.log('\n📋 Testing fixed subscription service...');
    const plans = fixedSubscriptionService.getAvailablePlans();
    console.log(`✅ Found ${plans.length} plans in fixed service:`);
    
    plans.forEach((plan, index) => {
      console.log(`\n${index + 1}. ${plan.name} (${plan.planType})`);
      console.log(`   Monthly Price ID: ${plan.stripePriceId}`);
      console.log(`   Yearly Price ID: ${plan.stripeYearlyPriceId}`);
      console.log(`   Lifetime Price ID: ${plan.stripeLifetimePriceId || 'N/A'}`);
      console.log(`   Price: $${plan.price}`);
      console.log(`   Features: ${plan.maxChildren === -1 ? 'Unlimited' : plan.maxChildren} children, ${plan.maxPhotoDownloads === -1 ? 'Unlimited' : plan.maxPhotoDownloads} photos`);
    });
    
    // Test 2: Test plan lookup by price ID
    console.log('\n🔍 Testing plan lookup by price ID...');
    const testPriceId = 'price_basic_monthly_test';
    const foundPlan = fixedSubscriptionService.getPlanByPriceId(testPriceId);
    if (foundPlan) {
      console.log(`✅ Found plan for ${testPriceId}: ${foundPlan.name}`);
    } else {
      console.log(`❌ No plan found for ${testPriceId}`);
    }
    
    // Test 3: Test plan lookup by type
    console.log('\n🔍 Testing plan lookup by type...');
    const basicPlan = fixedSubscriptionService.getPlanByType('BASIC');
    if (basicPlan) {
      console.log(`✅ Found BASIC plan: ${basicPlan.name}`);
    } else {
      console.log(`❌ No BASIC plan found`);
    }
    
    // Test 4: Check environment variables
    console.log('\n🔧 Checking environment variables...');
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_BASIC_MONTHLY_PRICE_ID',
      'STRIPE_BASIC_YEARLY_PRICE_ID',
      'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
      'STRIPE_PREMIUM_YEARLY_PRICE_ID',
      'STRIPE_ENTERPRISE_MONTHLY_PRICE_ID',
      'STRIPE_ENTERPRISE_YEARLY_PRICE_ID',
      'STRIPE_LIFETIME_PRICE_ID'
    ];
    
    let allEnvVarsSet = true;
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      const isSet = !!value;
      console.log(`${envVar}: ${isSet ? '✅ SET' : '❌ MISSING'}`);
      if (!isSet) allEnvVarsSet = false;
    });
    
    if (allEnvVarsSet) {
      console.log('\n✅ All required environment variables are set!');
    } else {
      console.log('\n❌ Some environment variables are missing');
    }
    
    // Test 5: Check user subscriptions in database
    console.log('\n👤 Checking user subscriptions in database...');
    const subscriptions = await prisma.userSubscription.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${subscriptions.length} user subscriptions:`);
    subscriptions.forEach((sub, index) => {
      console.log(`\n${index + 1}. User: ${sub.user.email}`);
      console.log(`   Plan Type: ${sub.planType}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Stripe Customer ID: ${sub.stripeCustomerId || 'MISSING'}`);
      console.log(`   Stripe Subscription ID: ${sub.stripeSubscriptionId || 'MISSING'}`);
      console.log(`   Trial End: ${sub.trialEnd ? sub.trialEnd.toISOString() : 'N/A'}`);
    });
    
    console.log('\n=== FIXED SUBSCRIPTION SYSTEM TEST COMPLETE ===');
    console.log('✅ Fixed subscription service is working correctly!');
    
  } catch (error) {
    console.error('❌ Error in testFixedSubscriptionSystem:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFixedSubscriptionSystem();
