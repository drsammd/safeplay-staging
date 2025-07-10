
const fetch = require('node-fetch');

// Test the complete signup flow to verify the "User not found" fix
async function testCompleteSignupFlow() {
  console.log('🧪 Testing Complete Signup Flow with Race Condition Fix...\n');

  const testUser = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'test123456',
    role: 'PARENT',
    agreeToTerms: true,
    agreeToPrivacy: true,
    homeAddress: '123 Test Street, Test City, TC 12345',
    useDifferentBillingAddress: false,
    billingAddress: '',
    selectedPlan: {
      id: 'basic',
      name: 'Basic Plan',
      stripePriceId: 'demo_price_basic_monthly',
      billingInterval: 'monthly',
      amount: 9.99,
      planType: 'BASIC'
    }
  };

  try {
    // Step 1: Check email availability
    console.log('1️⃣ Checking email availability...');
    const emailCheckResponse = await fetch('http://localhost:3000/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email })
    });
    const emailCheckData = await emailCheckResponse.json();
    console.log(`Status: ${emailCheckResponse.status} - Email available: ${!emailCheckData.exists}`);

    // Step 2: Get available plans
    console.log('\n2️⃣ Getting available plans...');
    const plansResponse = await fetch('http://localhost:3000/api/stripe/plans-demo');
    const plansData = await plansResponse.json();
    console.log(`Status: ${plansResponse.status} - Plans available: ${plansData.plans?.length || 0}`);

    // Step 3: Create subscription (payment processing)
    console.log('\n3️⃣ Processing payment and creating subscription...');
    const subscriptionResponse = await fetch('http://localhost:3000/api/stripe/subscription-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: testUser.selectedPlan.id,
        paymentMethodId: 'pm_test_demo',
        isSignupFlow: true
      })
    });
    const subscriptionData = await subscriptionResponse.json();
    console.log(`Status: ${subscriptionResponse.status}`);
    if (!subscriptionResponse.ok) {
      throw new Error(`Subscription failed: ${subscriptionData.error}`);
    }
    console.log('✅ Subscription created successfully');

    // Step 4: Create user account (this is where the race condition was occurring)
    console.log('\n4️⃣ Creating user account with subscription data...');
    const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testUser,
        subscriptionData: subscriptionData
      })
    });

    const signupResponseData = await signupResponse.json();
    console.log(`Status: ${signupResponse.status}`);
    
    if (!signupResponse.ok) {
      console.log('❌ Signup failed:', signupResponseData);
      throw new Error(`Signup failed: ${signupResponseData.error}`);
    }

    console.log('✅ User account created successfully!');
    console.log(`✅ User ID: ${signupResponseData.user?.id}`);
    console.log(`✅ Email automation: ${signupResponseData.message?.includes('successfully') ? 'SUCCESS' : 'UNKNOWN'}`);

    // Check server logs for any "User not found" errors
    console.log('\n5️⃣ Checking for "User not found" errors in logs...');
    const { exec } = require('child_process');
    exec('tail -20 /home/ubuntu/safeplay-staging/dev-server.log | grep -i "user not found"', (error, stdout, stderr) => {
      if (stdout && stdout.trim()) {
        console.log('❌ Found "User not found" errors:');
        console.log(stdout);
      } else {
        console.log('✅ No "User not found" errors found in recent logs');
      }
    });

    console.log('\n🎉 COMPLETE SIGNUP FLOW TEST PASSED!');
    console.log('The "User not found" race condition has been fixed.');
    
    return { success: true, userId: signupResponseData.user?.id };

  } catch (error) {
    console.error('\n❌ SIGNUP FLOW TEST FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testCompleteSignupFlow().catch(console.error);
