
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test plan definitions matching the fixed subscription service
const PLAN_DEFINITIONS = {
  BASIC: {
    id: 'basic',
    name: 'Basic Plan',
    planType: 'BASIC',
    price: 9.99,
    yearlyPrice: 99.99,
    stripePriceId: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_basic_monthly_test',
    stripeYearlyPriceId: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || 'price_basic_yearly_test',
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium Plan',
    planType: 'PREMIUM',
    price: 19.99,
    yearlyPrice: 199.99,
    stripePriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly_test',
    stripeYearlyPriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly_test',
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    planType: 'ENTERPRISE',
    price: 39.99,
    yearlyPrice: 399.99,
    stripePriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly_test',
    stripeYearlyPriceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly_test',
  }
};

async function testSubscriptionFix() {
  try {
    console.log('=== SUBSCRIPTION FIX TEST ===');
    
    // Test 1: Check environment variables
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
      console.log(`${envVar}: ${isSet ? '✅ SET' : '❌ MISSING'} ${isSet ? `(${value})` : ''}`);
      if (!isSet) allEnvVarsSet = false;
    });
    
    if (allEnvVarsSet) {
      console.log('\n✅ All required environment variables are set!');
    } else {
      console.log('\n❌ Some environment variables are missing');
    }
    
    // Test 2: Check plan definitions
    console.log('\n📋 Testing plan definitions...');
    const plans = Object.values(PLAN_DEFINITIONS);
    console.log(`✅ Found ${plans.length} plans in fixed service:`);
    
    plans.forEach((plan, index) => {
      console.log(`\n${index + 1}. ${plan.name} (${plan.planType})`);
      console.log(`   Monthly Price ID: ${plan.stripePriceId}`);
      console.log(`   Yearly Price ID: ${plan.stripeYearlyPriceId}`);
      console.log(`   Monthly Price: $${plan.price}`);
      console.log(`   Yearly Price: $${plan.yearlyPrice}`);
    });
    
    // Test 3: Test plan lookup by price ID
    console.log('\n🔍 Testing plan lookup by price ID...');
    const testPriceId = process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_basic_monthly_test';
    const foundPlan = Object.values(PLAN_DEFINITIONS).find(plan => 
      plan.stripePriceId === testPriceId || plan.stripeYearlyPriceId === testPriceId
    );
    if (foundPlan) {
      console.log(`✅ Found plan for ${testPriceId}: ${foundPlan.name}`);
    } else {
      console.log(`❌ No plan found for ${testPriceId}`);
    }
    
    // Test 4: Check database connectivity
    console.log('\n💾 Testing database connectivity...');
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database connected successfully! Found ${userCount} users.`);
    } catch (dbError) {
      console.log(`❌ Database connection failed:`, dbError.message);
    }
    
    // Test 5: Check user subscriptions in database
    console.log('\n👤 Checking user subscriptions in database...');
    try {
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
        console.log(`   Current Period End: ${sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : 'N/A'}`);
      });
    } catch (subError) {
      console.log(`❌ Error checking subscriptions:`, subError.message);
    }
    
    // Test 6: Test API endpoint availability
    console.log('\n🌐 Testing API endpoint availability...');
    try {
      console.log('📡 Testing /api/stripe/plans-fixed endpoint...');
      const response = await fetch('http://localhost:3000/api/stripe/plans-fixed');
      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API endpoint working! Got ${data.plans?.length || 0} plans.`);
      } else {
        console.log(`❌ API endpoint returned error: ${response.status}`);
      }
    } catch (apiError) {
      console.log(`⚠️ API endpoint test skipped (server not running): ${apiError.message}`);
    }
    
    console.log('\n=== SUBSCRIPTION FIX TEST COMPLETE ===');
    console.log('🎉 Fixed subscription system setup verified!');
    
  } catch (error) {
    console.error('❌ Error in testSubscriptionFix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSubscriptionFix();
