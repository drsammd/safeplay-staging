
const https = require('https');
const http = require('http');

// Test configuration using existing seeded user
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'john@doe.com',
  password: 'johndoe123'
};

let sessionCookie = '';

console.log('=== DIRECT SUBSCRIPTION API TEST ===');
console.log('🎯 Testing subscription creation with existing user');
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
          console.log('🍪 Response cookies:', cookies);
          
          // Extract NextAuth session cookie
          const sessionCookies = cookies.filter(cookie => 
            cookie.includes('next-auth.session-token') || 
            cookie.includes('__Secure-next-auth.session-token')
          );
          
          if (sessionCookies.length > 0) {
            sessionCookie = sessionCookies.map(cookie => cookie.split(';')[0]).join('; ');
            console.log('✅ Session cookie extracted:', sessionCookie);
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

// Get CSRF token first
async function getCSRFToken() {
  console.log('\n🔐 Getting CSRF token...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/csrf',
    method: 'GET'
  };
  
  try {
    const response = await makeRequest(options);
    console.log('🔑 CSRF response:', response.data);
    return response.data.csrfToken;
  } catch (error) {
    console.error('❌ CSRF token error:', error.message);
    return null;
  }
}

// Sign in with NextAuth
async function signInWithNextAuth() {
  console.log('\n🔐 Signing in with NextAuth...');
  
  // First get CSRF token
  const csrfToken = await getCSRFToken();
  if (!csrfToken) {
    console.log('❌ Failed to get CSRF token');
    return false;
  }
  
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
    csrfToken: csrfToken,
    email: TEST_USER.email,
    password: TEST_USER.password,
    redirect: 'false',
    json: 'true'
  }).toString();
  
  try {
    const response = await makeRequest(options, loginData);
    console.log('🔑 NextAuth sign-in response:', {
      status: response.statusCode,
      data: response.data,
      hasCookies: !!response.headers['set-cookie']
    });
    
    return response.statusCode === 200;
  } catch (error) {
    console.error('❌ NextAuth sign-in error:', error.message);
    return false;
  }
}

// Check session to verify authentication
async function checkSession() {
  console.log('\n👤 Checking authentication session...');
  
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
    console.log('🔍 Session response:', {
      status: response.statusCode,
      data: response.data
    });
    
    if (response.statusCode === 200 && response.data?.user) {
      console.log('✅ User authenticated:', {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role
      });
      return response.data.user;
    } else {
      console.log('❌ No authenticated session found');
      return null;
    }
  } catch (error) {
    console.error('❌ Session check error:', error.message);
    return null;
  }
}

// Test subscription creation directly
async function testSubscriptionCreation() {
  console.log('\n💳 TESTING SUBSCRIPTION CREATION...');
  
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
  
  // Use a known test price ID (this should be seeded in the database)
  const subscriptionData = JSON.stringify({
    priceId: 'price_1QVdm5EjxZBbXGOx0uRZEfRF', // Basic monthly from seeded data
    paymentMethodId: 'pm_card_visa' // Stripe test payment method
  });
  
  console.log('📤 Subscription request data:', JSON.parse(subscriptionData));
  console.log('🍪 Using session cookie:', sessionCookie ? 'Present' : 'Missing');
  
  try {
    console.log('🚀 Making subscription API call...');
    const response = await makeRequest(options, subscriptionData);
    
    console.log('\n📋 SUBSCRIPTION API RESPONSE:');
    console.log('Status Code:', response.statusCode);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✅ SUBSCRIPTION CREATION SUCCESSFUL!');
      return true;
    } else if (response.statusCode === 401) {
      console.log('❌ UNAUTHORIZED - Authentication issue');
      return false;
    } else {
      console.log('❌ SUBSCRIPTION CREATION FAILED!');
      console.log('❌ Error:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ SUBSCRIPTION API ERROR:', error.message);
    return false;
  }
}

// Test without authentication (should fail with 401)
async function testWithoutAuth() {
  console.log('\n🚫 Testing subscription without authentication (should fail)...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/stripe/subscription/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // No cookie header
    }
  };
  
  const subscriptionData = JSON.stringify({
    priceId: 'price_1QVdm5EjxZBbXGOx0uRZEfRF',
    paymentMethodId: 'pm_card_visa'
  });
  
  try {
    const response = await makeRequest(options, subscriptionData);
    console.log('🚫 No-auth response:', {
      status: response.statusCode,
      data: response.data
    });
    
    if (response.statusCode === 401) {
      console.log('✅ Correctly rejected unauthorized request');
      return true;
    } else {
      console.log('⚠️ Should have been rejected with 401');
      return false;
    }
  } catch (error) {
    console.error('❌ No-auth test error:', error.message);
    return false;
  }
}

// Main test execution
async function runDirectTest() {
  try {
    console.log('🎬 Starting direct subscription API test...\n');
    
    // Test 1: No authentication (should fail)
    const noAuthTest = await testWithoutAuth();
    
    // Test 2: Sign in
    const signedIn = await signInWithNextAuth();
    if (!signedIn) {
      console.log('❌ Sign-in failed, cannot continue');
      return;
    }
    
    // Test 3: Check session
    const user = await checkSession();
    if (!user) {
      console.log('❌ No authenticated session, cannot continue');
      return;
    }
    
    // Test 4: Create subscription (MAIN TEST)
    console.log('\n🚨 MAIN TEST: Creating subscription with authenticated user...');
    const subscriptionSuccess = await testSubscriptionCreation();
    
    // Final results
    console.log('\n=== DIRECT API TEST RESULTS ===');
    console.log('✅ No-auth rejection:', noAuthTest ? 'PASSED' : 'FAILED');
    console.log('✅ Sign-in:', signedIn ? 'PASSED' : 'FAILED');
    console.log('✅ Authentication:', user ? 'PASSED' : 'FAILED');
    console.log('🚨 Subscription creation:', subscriptionSuccess ? 'PASSED' : 'FAILED');
    
    if (subscriptionSuccess) {
      console.log('🎉 DIRECT API TEST PASSED!');
    } else {
      console.log('❌ DIRECT API TEST FAILED - Check server logs for details');
    }
    
  } catch (error) {
    console.error('❌ DIRECT TEST ERROR:', error);
  }
}

// Run the test
runDirectTest().then(() => {
  console.log('\n🏁 Direct API test completed.');
  console.log('📋 Check server logs (tail -f dev.log) for detailed backend debugging information.');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test execution error:', error);
  process.exit(1);
});
