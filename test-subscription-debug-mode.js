
const fetch = require('node-fetch');

async function testSubscriptionWithDebugMode() {
  console.log('🧪 TESTING: Subscription creation with debug mode');
  
  try {
    // Step 1: Get available subscription plans
    console.log('\n📋 TESTING: Getting subscription plans...');
    const plansResponse = await fetch('http://localhost:3001/api/stripe/plans');
    
    if (!plansResponse.ok) {
      throw new Error(`Failed to get plans: ${plansResponse.status}`);
    }
    
    const plansData = await plansResponse.json();
    console.log('📋 TESTING: Plans available:', {
      count: plansData.plans?.length || 0,
      firstPlan: plansData.plans?.[0]?.name,
      priceId: plansData.plans?.[0]?.stripePriceId
    });
    
    if (!plansData.plans?.length) {
      throw new Error('No subscription plans available');
    }
    
    // Use the first available plan
    const plan = plansData.plans[0];
    const priceId = plan.stripePriceId;
    
    console.log('📋 TESTING: Selected plan for testing:', {
      name: plan.name,
      priceId: priceId,
      planType: plan.planType
    });
    
    // Step 2: Test subscription creation with debug mode
    console.log('\n🎯 TESTING: Testing subscription creation with debug mode...');
    console.log('🎯 TESTING: This will use drsam+18@outlook.com as test user');
    console.log('🎯 TESTING: Request details:', {
      url: 'http://localhost:3001/api/stripe/subscription/create',
      priceId,
      debugMode: true,
      paymentMethodId: 'pm_test_visa' // Test payment method
    });
    
    const subscriptionResponse = await fetch('http://localhost:3001/api/stripe/subscription/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        priceId: priceId,
        paymentMethodId: 'pm_test_visa', // Stripe test payment method
        debugMode: true // This bypasses authentication
      })
    });
    
    const subscriptionData = await subscriptionResponse.json();
    
    console.log('\n📤 TESTING: Subscription API Response:', {
      status: subscriptionResponse.status,
      statusText: subscriptionResponse.statusText,
      hasSubscription: !!subscriptionData.subscription,
      hasClientSecret: !!subscriptionData.clientSecret,
      error: subscriptionData.error,
      details: subscriptionData.details
    });
    
    if (subscriptionResponse.ok) {
      console.log('✅ TESTING: Subscription creation succeeded!');
      console.log('✅ TESTING: Response data:', subscriptionData);
    } else {
      console.log('❌ TESTING: Subscription creation failed as expected!');
      console.log('❌ TESTING: Error response:', subscriptionData);
      console.log('\n📝 TESTING: Check the server logs above for detailed debugging information');
      console.log('📝 TESTING: This should show exactly where the failure occurs in the subscription creation process');
    }
    
  } catch (error) {
    console.error('💥 TESTING: Test script error:', error);
    console.error('💥 TESTING: Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
  
  console.log('\n🏁 TESTING: Debug test completed');
  console.log('🔍 TESTING: Check server logs for detailed debugging trace');
  console.log('📋 TESTING: Look for the emoji logs showing the exact failure point');
}

// Run the test
testSubscriptionWithDebugMode();
