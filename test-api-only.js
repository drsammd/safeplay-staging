
/**
 * Simple API-only test to reproduce the "User not found" error
 * Uses existing running dev server
 */

const fetch = require('node-fetch');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testEmail: `test-debug-${Date.now()}@example.com`,
  testPassword: 'TestPassword123!',
  testName: 'Debug Test User',
  testPlan: {
    id: 'premium',
    stripePriceId: 'demo_price_premium_monthly',
    billingInterval: 'monthly',
    amount: 19.99,
    planType: 'PREMIUM'
  }
};

/**
 * Test Step 1: Check email availability
 */
async function testEmailCheck() {
  console.log('\n📧 Step 1: Testing email availability check...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_CONFIG.testEmail })
    });

    const data = await response.json();
    console.log('✅ Email check response:', response.status, data);
    
    if (!response.ok) {
      throw new Error(`Email check failed: ${data.error || data.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Email check failed:', error);
    throw error;
  }
}

/**
 * Test Step 2: Get subscription plans
 */
async function testGetPlans() {
  console.log('\n📋 Step 2: Testing subscription plans API...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/stripe/plans-demo`);
    const data = await response.json();
    
    console.log('✅ Plans response:', response.status, data);
    
    if (!response.ok) {
      throw new Error(`Plans API failed: ${data.error || data.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Plans API failed:', error);
    throw error;
  }
}

/**
 * Test Step 3: Create subscription (payment step)
 */
async function testCreateSubscription() {
  console.log('\n💳 Step 3: Testing subscription creation (payment step)...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/stripe/subscription-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: TEST_CONFIG.testPlan.id,
        paymentMethodId: 'demo_pm_test_card',
        isSignupFlow: true
      })
    });

    const data = await response.json();
    console.log('✅ Subscription creation response:', response.status, data);
    
    if (!response.ok) {
      throw new Error(`Subscription creation failed: ${data.error || data.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Subscription creation failed:', error);
    throw error;
  }
}

/**
 * Test Step 4: Create user account (signup step)
 */
async function testCreateAccount(subscriptionData) {
  console.log('\n👤 Step 4: Testing user account creation (signup step)...');
  console.log('🔍 THIS IS WHERE THE "USER NOT FOUND" ERROR LIKELY OCCURS!');
  
  try {
    const signupData = {
      email: TEST_CONFIG.testEmail,
      password: TEST_CONFIG.testPassword,
      name: TEST_CONFIG.testName,
      role: 'PARENT',
      agreeToTerms: true,
      agreeToPrivacy: true,
      homeAddress: '123 Test Street, Test City, TS 12345',
      homeAddressValidation: {
        isValid: true,
        confidence: 0.95,
        originalInput: '123 Test Street, Test City, TS 12345'
      },
      useDifferentBillingAddress: false,
      selectedPlan: TEST_CONFIG.testPlan,
      subscriptionData: subscriptionData
    };

    console.log('📝 Signup request data:');
    console.log('  - Email:', signupData.email);
    console.log('  - Name:', signupData.name);
    console.log('  - Plan:', signupData.selectedPlan.planType);
    console.log('  - Has subscription data:', !!signupData.subscriptionData);
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });

    const data = await response.json();
    console.log('📤 Signup response status:', response.status);
    console.log('📤 Signup response data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('🚨 SIGNUP FAILED - This is likely where "User not found" error occurs!');
      console.error('🚨 Error details:', data);
      
      // If this is the "User not found" error, we've found it!
      if (data.error && data.error.includes('User not found')) {
        console.error('🎯 FOUND IT! This is the "User not found" error!');
        console.error('🎯 Error message:', data.error);
        console.error('🎯 Full error details:', JSON.stringify(data, null, 2));
      }
      
      throw new Error(`Signup failed: ${data.error || data.message || 'Unknown error'}`);
    }
    
    console.log('✅ User account created successfully!');
    return data;
  } catch (error) {
    console.error('❌ Account creation failed:', error);
    throw error;
  }
}

/**
 * Wait a bit for server logs to appear
 */
function waitForLogs(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main test function
 */
async function runSignupTest() {
  console.log('🎯 DEBUGGING: API-Only Signup Flow Test');
  console.log('🎯 Goal: Reproduce and capture the "User not found" error');
  console.log('🎯 Using existing dev server on localhost:3000');
  console.log('=' + '='.repeat(60));
  
  try {
    // Test server connectivity first
    console.log('\n🔍 Testing server connectivity...');
    const healthResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);
    if (!healthResponse.ok) {
      throw new Error('Server is not responding to health check');
    }
    console.log('✅ Server is responding');
    
    // Run the complete signup flow
    console.log('\n🔍 Starting complete signup flow test...');
    
    // Step 1: Email check
    const emailResult = await testEmailCheck();
    await waitForLogs(500);
    
    // Step 2: Get plans
    const plansResult = await testGetPlans();
    await waitForLogs(500);
    
    // Step 3: Create subscription (payment)
    const subscriptionResult = await testCreateSubscription();
    await waitForLogs(500);
    
    // Step 4: Create account (this is where error likely happens)
    console.log('\n🚨 CRITICAL: About to test user account creation...');
    console.log('🚨 Watch the console logs for debugging information!');
    console.log('🚨 The "User not found" error should occur in the next step...');
    await waitForLogs(1000);
    
    const accountResult = await testCreateAccount(subscriptionResult);
    
    console.log('\n🎉 SUCCESS: Complete signup flow completed without errors!');
    console.log('🎉 If this succeeded, the "User not found" error might be environment-specific.');
    
    return {
      success: true,
      results: {
        email: emailResult,
        plans: plansResult,
        subscription: subscriptionResult,
        account: accountResult
      }
    };
    
  } catch (error) {
    console.error('\n🚨 FAILURE: Signup flow failed!');
    console.error('🚨 Error:', error.message);
    
    // Check if this is the "User not found" error we're looking for
    if (error.message.includes('User not found')) {
      console.error('\n🎯 SUCCESS: We reproduced the "User not found" error!');
      console.error('🎯 This confirms the error source during local testing');
    }
    
    return {
      success: false,
      error: error.message,
      reproduced: error.message.includes('User not found')
    };
  }
}

// Run the test
if (require.main === module) {
  runSignupTest()
    .then(result => {
      console.log('\n📊 FINAL RESULT:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.reproduced) {
        console.log('\n🎯 MISSION ACCOMPLISHED: "User not found" error reproduced!');
        console.log('🎯 Check the server logs above for debugging details');
      }
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 FATAL ERROR:', error);
      process.exit(1);
    });
}

module.exports = {
  runSignupTest,
  TEST_CONFIG
};
