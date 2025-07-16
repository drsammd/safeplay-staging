
// Test script to verify Stripe price IDs work correctly
// Run with: node test-stripe-price-ids.js

const dotenv = require('dotenv');
dotenv.config();

async function testStripePriceIds() {
  console.log('🔍 Testing Stripe Price IDs Configuration');
  console.log('=========================================');
  
  // Check if Stripe is available
  let stripe;
  try {
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe SDK loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load Stripe SDK:', error.message);
    return;
  }

  // Test price IDs from environment
  const priceIds = {
    'Basic Monthly': process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
    'Premium Monthly': process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    'Enterprise Monthly': process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    'Lifetime': process.env.STRIPE_LIFETIME_PRICE_ID,
  };

  console.log('\n📋 Price IDs from Environment:');
  Object.entries(priceIds).forEach(([name, id]) => {
    console.log(`   ${name}: ${id || 'NOT SET'}`);
  });

  console.log('\n🔍 Testing Price IDs with Stripe API...');
  
  let allValid = true;
  
  for (const [planName, priceId] of Object.entries(priceIds)) {
    if (!priceId || priceId.includes('_test') || priceId === 'price_basic_monthly') {
      console.log(`⚠️  ${planName}: PLACEHOLDER ID - needs real Stripe price ID`);
      allValid = false;
      continue;
    }

    try {
      console.log(`🔍 Testing ${planName} (${priceId})...`);
      const price = await stripe.prices.retrieve(priceId);
      console.log(`✅ ${planName}: VALID - $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
    } catch (error) {
      console.log(`❌ ${planName}: INVALID - ${error.message}`);
      allValid = false;
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  if (allValid) {
    console.log('🎉 ALL PRICE IDs ARE VALID!');
    console.log('✅ Your Stripe configuration is ready');
    console.log('✅ Subscription creation should work');
    console.log('✅ Ready for testing and deployment');
  } else {
    console.log('⚠️  SOME PRICE IDs NEED ATTENTION');
    console.log('❌ Placeholder or invalid price IDs detected');
    console.log('🔧 Please update .env with real Stripe price IDs');
    console.log('📖 See STRIPE_PRICE_ID_DISCOVERY_GUIDE.md for instructions');
  }

  console.log('\n🚀 Next Steps:');
  if (allValid) {
    console.log('1. Start development server: yarn dev');
    console.log('2. Test subscription creation in the app');
    console.log('3. Create a checkpoint when working');
  } else {
    console.log('1. Get real price IDs from Stripe dashboard');
    console.log('2. Update .env file with real price IDs');
    console.log('3. Run this test again: node test-stripe-price-ids.js');
    console.log('4. Start development server when all tests pass');
  }
}

// Run the test
testStripePriceIds().catch(error => {
  console.error('💥 Test script error:', error);
  console.log('\n🔧 Troubleshooting:');
  console.log('- Make sure .env file exists');
  console.log('- Verify STRIPE_SECRET_KEY is set');
  console.log('- Check internet connection');
  console.log('- Ensure Stripe package is installed: yarn add stripe');
});
