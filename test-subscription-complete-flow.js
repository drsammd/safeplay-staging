
const http = require('http');

console.log('=== COMPLETE SUBSCRIPTION FLOW TEST ===');
console.log('🎯 Testing the complete subscription creation flow');
console.log('📅 Timestamp:', new Date().toISOString());

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'john@doe.com',
  password: 'johndoe123'
};

let cookies = '';

// Utility function to make HTTP requests with detailed logging
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    console.log(`🌐 Making ${options.method} request to ${options.path}`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Collect all cookies
        if (res.headers['set-cookie']) {
          const newCookies = res.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
          if (newCookies) {
            cookies = cookies ? `${cookies}; ${newCookies}` : newCookies;
          }
        }
        
        let responseData;
        try {
          responseData = JSON.parse(data);
        } catch (e) {
          responseData = data;
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });
    
    req.on('error', (err) => {
      console.error(`❌ Request error: ${err.message}`);
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Step 1: Get CSRF token
async function getCSRFToken() {
  console.log('\n🔐 STEP 1: Getting CSRF token...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/csrf',
    method: 'GET'
  };
  
  const response = await makeRequest(options);
  if (response.statusCode === 200) {
    console.log('✅ CSRF token obtained');
    return response.data?.csrfToken;
  } else {
    console.log('❌ Failed to get CSRF token');
    return null;
  }
}

// Step 2: Sign in
async function signIn(csrfToken) {
  console.log('\n🔑 STEP 2: Signing in...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/callback/credentials',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies
    }
  };
  
  const loginData = new URLSearchParams({
    csrfToken: csrfToken,
    email: TEST_USER.email,
    password: TEST_USER.password,
    redirect: 'false',
    json: 'true'
  }).toString();
  
  const response = await makeRequest(options, loginData);
  if (response.statusCode === 200) {
    console.log('✅ Sign-in successful');
    return true;
  } else {
    console.log('❌ Sign-in failed');
    return false;
  }
}

// Step 3: Verify session
async function verifySession() {
  console.log('\n👤 STEP 3: Verifying session...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/session',
    method: 'GET',
    headers: {
      'Cookie': cookies
    }
  };
  
  const response = await makeRequest(options);
  if (response.statusCode === 200 && response.data?.user) {
    console.log('✅ User session verified:', response.data.user.email);
    return response.data.user;
  } else {
    console.log('❌ No user session found');
    return null;
  }
}

// Step 4: Get subscription plans (CORRECTED ENDPOINT)
async function getPlans() {
  console.log('\n📋 STEP 4: Getting subscription plans...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/stripe/plans',  // CORRECTED: was /api/stripe/subscription/plans
    method: 'GET',
    headers: {
      'Cookie': cookies
    }
  };
  
  const response = await makeRequest(options);
  console.log('📋 Plans API response:', {
    status: response.statusCode,
    dataType: typeof response.data,
    isArray: Array.isArray(response.data),
    length: Array.isArray(response.data) ? response.data.length : 'N/A'
  });
  
  if (response.statusCode === 200 && Array.isArray(response.data)) {
    console.log('✅ Subscription plans retrieved');
    const basicPlan = response.data.find(plan => plan.planType === 'BASIC');
    if (basicPlan) {
      console.log('✅ Basic plan found:', {
        id: basicPlan.id,
        name: basicPlan.name,
        stripePriceId: basicPlan.stripePriceId,
        price: basicPlan.monthlyPrice
      });
      return basicPlan;
    } else {
      console.log('❌ No basic plan found in plans:', response.data.map(p => ({name: p.name, type: p.planType})));
      return null;
    }
  } else {
    console.log('❌ Failed to get subscription plans');
    return null;
  }
}

// Step 5: Create subscription (THE ULTIMATE TEST)
async function createSubscription(plan) {
  console.log('\n💳 STEP 5: Creating subscription (THE CRITICAL TEST)...');
  console.log(`🎯 Plan: ${plan.name} (${plan.stripePriceId})`);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/stripe/subscription/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    }
  };
  
  const subscriptionData = JSON.stringify({
    priceId: plan.stripePriceId,
    paymentMethodId: 'pm_card_visa' // Stripe test payment method
  });
  
  console.log('📤 Sending subscription request...');
  const response = await makeRequest(options, subscriptionData);
  
  console.log('\n🚨 SUBSCRIPTION CREATION RESULT:');
  console.log('Status Code:', response.statusCode);
  console.log('Response Data:', JSON.stringify(response.data, null, 2));
  
  return response;
}

// Main test execution
async function runCompleteFlowTest() {
  console.log('🎬 Starting complete subscription flow test...\n');
  
  try {
    // Step 1: Get CSRF token
    const csrfToken = await getCSRFToken();
    if (!csrfToken) {
      console.log('❌ TEST FAILED: Could not get CSRF token');
      return;
    }
    
    // Step 2: Sign in
    const signedIn = await signIn(csrfToken);
    if (!signedIn) {
      console.log('❌ TEST FAILED: Could not sign in');
      return;
    }
    
    // Step 3: Verify session
    const user = await verifySession();
    if (!user) {
      console.log('❌ TEST FAILED: No authenticated session');
      return;
    }
    
    // Step 4: Get plans
    const plan = await getPlans();
    if (!plan) {
      console.log('❌ TEST FAILED: Could not get subscription plans');
      return;
    }
    
    // Step 5: Create subscription (ULTIMATE TEST)
    console.log('\n🚨 ULTIMATE TEST: Creating subscription...');
    const subscriptionResponse = await createSubscription(plan);
    
    // Final analysis
    console.log('\n=== COMPLETE FLOW TEST RESULTS ===');
    
    if (subscriptionResponse.statusCode === 200) {
      console.log('🎉 SUCCESS: SUBSCRIPTION CREATION SUCCESSFUL!');
      console.log('📋 Subscription details:');
      console.log('   - ID:', subscriptionResponse.data.subscription?.id);
      console.log('   - Status:', subscriptionResponse.data.subscription?.status);
      console.log('   - Customer:', subscriptionResponse.data.subscription?.customer);
      console.log('   - Client Secret:', subscriptionResponse.data.clientSecret ? 'Present' : 'Not needed');
      
      console.log('\n🎯 THE SUBSCRIPTION ERROR HAS BEEN RESOLVED!');
      console.log('✅ Users can now successfully create subscriptions');
      
    } else if (subscriptionResponse.statusCode === 401) {
      console.log('❌ FAILURE: Authentication issue during subscription creation');
      console.log('🔍 Session was lost between plans fetch and subscription creation');
      
    } else {
      console.log('❌ FAILURE: Subscription creation failed');
      console.log('📋 Status Code:', subscriptionResponse.statusCode);
      console.log('📋 Error Details:', subscriptionResponse.data);
      
      if (subscriptionResponse.data?.error) {
        console.log('🔍 Error Message:', subscriptionResponse.data.error);
        if (subscriptionResponse.data.details) {
          console.log('🔍 Error Details:', subscriptionResponse.data.details);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 COMPLETE FLOW TEST ERROR:', error.message);
  }
}

// Run the complete test
runCompleteFlowTest().then(() => {
  console.log('\n🏁 Complete flow test finished.');
  console.log('📋 Check server logs for backend details: tail -f dev.log');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
