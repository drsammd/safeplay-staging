
const http = require('http');

console.log('=== FINAL SUBSCRIPTION VERIFICATION TEST ===');
console.log('🎯 Testing subscription creation step by step');
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
    console.log(`🍪 Using cookies: ${cookies || 'None'}`);
    
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
            console.log(`🍪 Updated cookies: ${cookies}`);
          }
        }
        
        let responseData;
        try {
          responseData = JSON.parse(data);
        } catch (e) {
          responseData = data;
        }
        
        console.log(`📊 Response: ${res.statusCode} - ${JSON.stringify(responseData)}`);
        
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
      console.log(`📤 Request body: ${postData}`);
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
  return response.data?.csrfToken;
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
  return response.statusCode === 200;
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
  return response.data?.user || null;
}

// Step 4: Get subscription plans 
async function getPlans() {
  console.log('\n📋 STEP 4: Getting subscription plans...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/stripe/subscription/plans',
    method: 'GET',
    headers: {
      'Cookie': cookies
    }
  };
  
  const response = await makeRequest(options);
  if (response.statusCode === 200 && Array.isArray(response.data)) {
    const basicPlan = response.data.find(plan => plan.planType === 'BASIC');
    return basicPlan;
  }
  return null;
}

// Step 5: Create subscription (THE CRITICAL TEST)
async function createSubscription(plan) {
  console.log('\n💳 STEP 5: Creating subscription...');
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
  
  const response = await makeRequest(options, subscriptionData);
  return response;
}

// Main test execution
async function runFinalTest() {
  console.log('🎬 Starting final verification test...\n');
  
  try {
    // Step 1: Get CSRF token
    const csrfToken = await getCSRFToken();
    if (!csrfToken) {
      console.log('❌ Failed to get CSRF token');
      return;
    }
    console.log('✅ CSRF token obtained');
    
    // Step 2: Sign in
    const signedIn = await signIn(csrfToken);
    if (!signedIn) {
      console.log('❌ Sign-in failed');
      return;
    }
    console.log('✅ Sign-in successful');
    
    // Wait a moment for session to be established
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Verify session
    const user = await verifySession();
    if (!user) {
      console.log('❌ No user session found');
      return;
    }
    console.log('✅ User session verified:', user.email);
    
    // Step 4: Get plans
    const plan = await getPlans();
    if (!plan) {
      console.log('❌ No subscription plans found');
      return;
    }
    console.log('✅ Subscription plan found:', plan.name);
    
    // Step 5: Create subscription (CRITICAL TEST)
    console.log('\n🚨 CRITICAL TEST: Creating subscription...');
    const subscriptionResponse = await createSubscription(plan);
    
    // Analyze results
    console.log('\n=== FINAL TEST RESULTS ===');
    
    if (subscriptionResponse.statusCode === 200) {
      console.log('🎉 SUCCESS: Subscription created successfully!');
      console.log('📋 Subscription ID:', subscriptionResponse.data.subscription?.id);
      console.log('📋 Status:', subscriptionResponse.data.subscription?.status);
      console.log('📋 Customer:', subscriptionResponse.data.subscription?.customer);
    } else if (subscriptionResponse.statusCode === 401) {
      console.log('❌ FAILURE: Authentication failed during subscription creation');
      console.log('🔍 This suggests the session was not properly maintained');
    } else {
      console.log('❌ FAILURE: Subscription creation failed');
      console.log('📋 Status Code:', subscriptionResponse.statusCode);
      console.log('📋 Error:', subscriptionResponse.data);
    }
    
  } catch (error) {
    console.error('💥 TEST ERROR:', error.message);
  }
}

// Run the test and exit
runFinalTest().then(() => {
  console.log('\n🏁 Final verification test completed.');
  console.log('📋 Check server logs for backend details: tail -f dev.log');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
