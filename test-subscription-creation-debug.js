
const fetch = require('node-fetch');

async function testSubscriptionCreation() {
  console.log('🧪 TESTING: Starting subscription creation debug test');
  
  try {
    // Use existing test user to avoid signup issues
    const testEmail = 'drsam+18@outlook.com';  // User Sam reported having issues with
    const testPassword = 'password123';
    
    console.log(`\n🔑 TESTING: Using existing test user: ${testEmail}`);
    
    // Step 1: Sign in with existing user
    const signinResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        email: testEmail,
        password: testPassword,
        csrfToken: 'test-token',
        callbackUrl: 'http://localhost:3000/parent',
        json: 'true'
      })
    });
    
    console.log('🔑 TESTING: Signin response status:', signinResponse.status);
    
    // Try alternative approach - direct API call
    if (!signinResponse.ok) {
      console.log('🔑 TESTING: Trying alternative signin approach...');
      
      // Let's try with cookies approach instead
      const cookieJar = [];
      
      // First get CSRF token
      const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
      const csrfData = await csrfResponse.json();
      console.log('🔑 TESTING: CSRF token obtained:', !!csrfData.csrfToken);
      
      // Get cookies from response
      const setCookieHeaders = csrfResponse.headers.raw()['set-cookie'];
      if (setCookieHeaders) {
        cookieJar.push(...setCookieHeaders);
      }
      
      // Now try signin with proper CSRF
      const signinResponse2 = await fetch('http://localhost:3000/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieJar.join('; ')
        },
        body: new URLSearchParams({
          email: testEmail,
          password: testPassword,
          csrfToken: csrfData.csrfToken,
          callbackUrl: 'http://localhost:3000/parent',
          json: 'true'
        })
      });
      
      console.log('🔑 TESTING: Second signin attempt status:', signinResponse2.status);
    }
    
    // For testing purposes, let's skip authentication and test the subscription API directly
    // We'll call it as if we have a valid session
    console.log('\n⚠️ TESTING: Proceeding with direct API testing (simulating authenticated user)');
    
    // Step 3: Get available subscription plans
    console.log('\n📋 TESTING: Getting subscription plans...');
    const plansResponse = await fetch('http://localhost:3000/api/stripe/plans', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Cookie': `next-auth.session-token=${sessionToken}`
      }
    });
    
    const plansData = await plansResponse.json();
    console.log('📋 TESTING: Plans response:', {
      status: plansResponse.status,
      plansCount: plansData.plans?.length || 0,
      firstPlan: plansData.plans?.[0]?.name
    });
    
    if (!plansResponse.ok || !plansData.plans?.length) {
      throw new Error(`No plans available: ${JSON.stringify(plansData)}`);
    }
    
    // Use the first available plan
    const plan = plansData.plans[0];
    const priceId = plan.stripePriceId; // Use monthly price
    
    console.log('📋 TESTING: Selected plan:', {
      name: plan.name,
      priceId: priceId,
      planType: plan.planType
    });
    
    // Step 4: Create a test payment method (simulated)
    console.log('\n💳 TESTING: Creating test payment method...');
    // In a real scenario, this would be done with Stripe Elements
    // For testing, we'll simulate it
    const paymentMethodId = 'pm_test_fake_payment_method';
    
    // Step 5: Attempt subscription creation (THIS IS WHERE THE ERROR SHOULD OCCUR)
    console.log('\n🎯 TESTING: Attempting subscription creation...');
    console.log('🎯 TESTING: Request details:', {
      url: 'http://localhost:3000/api/stripe/subscription/create',
      priceId,
      paymentMethodId,
      userEmail: testEmail
    });
    
    const subscriptionResponse = await fetch('http://localhost:3000/api/stripe/subscription/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
        'Cookie': `next-auth.session-token=${sessionToken}`
      },
      body: JSON.stringify({
        priceId: priceId,
        paymentMethodId: paymentMethodId
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
    
    if (!subscriptionResponse.ok) {
      console.log('❌ TESTING: Subscription creation failed as expected!');
      console.log('❌ TESTING: Full error response:', subscriptionData);
      console.log('\n📝 TESTING: This is the error Sam reported. Check the server logs above for detailed debugging info.');
    } else {
      console.log('✅ TESTING: Subscription creation succeeded unexpectedly!');
      console.log('✅ TESTING: Success response:', subscriptionData);
    }
    
  } catch (error) {
    console.error('💥 TESTING: Test script error:', error);
    console.error('💥 TESTING: Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
  
  console.log('\n🏁 TESTING: Test completed. Check server logs for detailed debugging information.');
}

// Run the test
testSubscriptionCreation();
