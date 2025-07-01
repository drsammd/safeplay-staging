
const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'drsam+21@outlook.com',
  password: 'testpass123',
  name: 'Dr Sam Test'
};

// Test card details (Stripe test card)
const TEST_PAYMENT = {
  priceId: 'price_1QVdm5EjxZBbXGOx0uRZEfRF', // Basic monthly plan
  cardNumber: '4242424242424242',
  expMonth: '12',
  expYear: '2025',
  cvc: '123'
};

let sessionCookie = '';

console.log('=== COMPREHENSIVE SUBSCRIPTION DEBUGGING TEST ===');
console.log('🚀 Starting comprehensive subscription test...');
console.log('📅 Timestamp:', new Date().toISOString());

// Utility function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Extract cookies for session management
        if (res.headers['set-cookie']) {
          const cookies = res.headers['set-cookie'];
          console.log('🍪 Cookies received:', cookies);
          
          // Extract NextAuth session cookie
          const sessionCookies = cookies.filter(cookie => 
            cookie.includes('next-auth.session-token') || 
            cookie.includes('__Secure-next-auth.session-token')
          );
          
          if (sessionCookies.length > 0) {
            sessionCookie = sessionCookies.map(cookie => cookie.split(';')[0]).join('; ');
            console.log('✅ Session cookie updated:', sessionCookie);
          }
        }
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Step 1: Register user if needed
async function registerUser() {
  console.log('\n🔐 STEP 1: Registering test user...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/signup',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  const userData = JSON.stringify({
    name: TEST_USER.name,
    email: TEST_USER.email,
    password: TEST_USER.password,
    role: 'PARENT'
  });
  
  try {
    const response = await makeRequest(options, userData);
    console.log('📝 Registration response:', {
      status: response.statusCode,
      data: response.data
    });
    
    if (response.statusCode === 201 || response.statusCode === 409) {
      console.log('✅ User registration successful or already exists');
      return true;
    } else {
      console.log('⚠️ Registration status:', response.statusCode);
      return true; // Continue anyway, user might already exist
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return true; // Continue anyway
  }
}

// Step 2: Sign in user
async function signInUser() {
  console.log('\n🔐 STEP 2: Signing in user...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/callback/credentials',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  };
  
  const loginData = new URLSearchParams({
    email: TEST_USER.email,
    password: TEST_USER.password,
    redirect: 'false',
    json: 'true'
  }).toString();
  
  try {
    const response = await makeRequest(options, loginData);
    console.log('🔑 Sign-in response:', {
      status: response.statusCode,
      data: response.data,
      hasCookies: !!response.headers['set-cookie']
    });
    
    if (response.statusCode === 200 && sessionCookie) {
      console.log('✅ Sign-in successful');
      return true;
    } else {
      console.log('❌ Sign-in failed or no session cookie');
      return false;
    }
  } catch (error) {
    console.error('❌ Sign-in error:', error.message);
    return false;
  }
}

// Step 3: Check authentication
async function checkAuthentication() {
  console.log('\n👤 STEP 3: Checking authentication...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/session',
    method: 'GET',
    headers: {
      'Cookie': sessionCookie
    }
  };
  
  try {
    const response = await makeRequest(options);
    console.log('🔍 Session check response:', {
      status: response.statusCode,
      data: response.data
    });
    
    if (response.statusCode === 200 && response.data?.user) {
      console.log('✅ User authenticated:', response.data.user);
      return response.data.user;
    } else {
      console.log('❌ Authentication check failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Authentication check error:', error.message);
    return null;
  }
}

// Step 4: Get subscription plans
async function getSubscriptionPlans() {
  console.log('\n📋 STEP 4: Getting subscription plans...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/stripe/subscription/plans',
    method: 'GET',
    headers: {
      'Cookie': sessionCookie
    }
  };
  
  try {
    const response = await makeRequest(options);
    console.log('📋 Plans response:', {
      status: response.statusCode,
      plansCount: Array.isArray(response.data) ? response.data.length : 0,
      data: response.data
    });
    
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      const basicPlan = response.data.find(plan => plan.planType === 'BASIC');
      if (basicPlan) {
        console.log('✅ Found basic plan:', {
          id: basicPlan.id,
          name: basicPlan.name,
          stripePriceId: basicPlan.stripePriceId,
          price: basicPlan.monthlyPrice
        });
        return basicPlan;
      }
    }
    
    console.log('❌ No basic plan found');
    return null;
  } catch (error) {
    console.error('❌ Plans fetch error:', error.message);
    return null;
  }
}

// Step 5: Create subscription (the critical test)
async function createSubscription(plan) {
  console.log('\n💳 STEP 5: Creating subscription...');
  console.log('🎯 Using plan:', {
    id: plan.id,
    name: plan.name,
    stripePriceId: plan.stripePriceId
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/stripe/subscription/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    }
  };
  
  const subscriptionData = JSON.stringify({
    priceId: plan.stripePriceId,
    paymentMethodId: 'pm_card_visa', // Test payment method
    // Note: In real scenario, paymentMethodId would come from Stripe Elements
  });
  
  console.log('📤 Sending subscription request:', {
    url: `${BASE_URL}${options.path}`,
    method: options.method,
    data: JSON.parse(subscriptionData),
    hasCookie: !!sessionCookie
  });
  
  try {
    const response = await makeRequest(options, subscriptionData);
    console.log('💳 Subscription creation response:', {
      status: response.statusCode,
      success: response.statusCode === 200,
      data: response.data
    });
    
    if (response.statusCode === 200) {
      console.log('✅ Subscription created successfully!');
      console.log('📋 Subscription details:', {
        id: response.data.subscription?.id,
        status: response.data.subscription?.status,
        customerId: response.data.subscription?.customer
      });
      return true;
    } else {
      console.log('❌ Subscription creation failed!');
      console.log('❌ Error details:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Subscription creation error:', error.message);
    return false;
  }
}

// Step 6: Check database state
async function checkDatabaseState() {
  console.log('\n🗄️ STEP 6: Checking database state...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/session',
    method: 'GET',
    headers: {
      'Cookie': sessionCookie
    }
  };
  
  try {
    const sessionResponse = await makeRequest(options);
    if (sessionResponse.data?.user?.id) {
      console.log('📊 User ID for database check:', sessionResponse.data.user.id);
      // In a real app, we'd have an API to check subscription status
    }
  } catch (error) {
    console.error('❌ Database check error:', error.message);
  }
}

// Main test execution
async function runComprehensiveTest() {
  try {
    console.log('🎬 Starting comprehensive subscription test...\n');
    
    // Step 1: Register user
    const registered = await registerUser();
    if (!registered) {
      console.log('❌ Registration failed, stopping test');
      return;
    }
    
    // Step 2: Sign in
    const signedIn = await signInUser();
    if (!signedIn) {
      console.log('❌ Sign-in failed, stopping test');
      return;
    }
    
    // Step 3: Check authentication
    const user = await checkAuthentication();
    if (!user) {
      console.log('❌ Authentication failed, stopping test');
      return;
    }
    
    // Step 4: Get plans
    const plan = await getSubscriptionPlans();
    if (!plan) {
      console.log('❌ Failed to get subscription plans, stopping test');
      return;
    }
    
    // Step 5: Create subscription (CRITICAL TEST)
    console.log('\n🚨 CRITICAL TEST: Creating subscription...');
    const subscriptionCreated = await createSubscription(plan);
    
    // Step 6: Check final state
    await checkDatabaseState();
    
    // Final results
    console.log('\n=== TEST RESULTS ===');
    console.log('✅ Registration:', registered ? 'PASSED' : 'FAILED');
    console.log('✅ Sign-in:', signedIn ? 'PASSED' : 'FAILED');
    console.log('✅ Authentication:', user ? 'PASSED' : 'FAILED');
    console.log('✅ Plans fetch:', plan ? 'PASSED' : 'FAILED');
    console.log('🚨 Subscription creation:', subscriptionCreated ? 'PASSED' : 'FAILED');
    
    if (subscriptionCreated) {
      console.log('🎉 COMPREHENSIVE TEST PASSED!');
    } else {
      console.log('❌ COMPREHENSIVE TEST FAILED - Subscription creation error detected');
    }
    
  } catch (error) {
    console.error('❌ COMPREHENSIVE TEST ERROR:', error);
  }
}

// Run the test
runComprehensiveTest().then(() => {
  console.log('\n🏁 Test completed. Check server logs for detailed debugging information.');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test execution error:', error);
  process.exit(1);
});
