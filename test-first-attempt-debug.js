
/**
 * Comprehensive test script to debug the first attempt vs retry attempt issue
 * This script simulates the exact signup flow that the frontend uses
 */

const https = require('http');

// Test data that would typically come from a real signup form
const testSignupData = {
  name: "Debug Test User",
  email: `debug-test-${Date.now()}@example.com`,
  password: "TestPassword123!",
  role: "PARENT",
  agreeToTerms: true,
  agreeToPrivacy: true,
  homeAddress: "123 Test Street, Test City, Test State 12345",
  homeAddressValidation: {
    isValid: true,
    confidence: 0.95,
    standardizedAddress: "123 Test Street, Test City, Test State 12345"
  },
  useDifferentBillingAddress: false,
  billingAddress: "",
  billingAddressValidation: null,
  selectedPlan: {
    id: "free",
    name: "Free Plan",
    stripePriceId: null,
    billingInterval: "free",
    amount: 0,
    planType: "FREE"
  },
  subscriptionData: null,
  homeAddressFields: {
    street: "123 Test Street",
    city: "Test City", 
    state: "Test State",
    zipCode: "12345",
    fullAddress: "123 Test Street, Test City, Test State 12345"
  },
  billingAddressFields: {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    fullAddress: ""
  }
};

async function makeSignupRequest(attemptType, previousError = "") {
  return new Promise((resolve, reject) => {
    const attemptId = `test_signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare request data exactly like the frontend does
    const requestData = {
      ...testSignupData,
      // Add debug metadata like the frontend
      debugMetadata: {
        attemptId,
        attemptType,
        attemptTimestamp: new Date().toISOString(),
        frontendVersion: "1.5.7",
        previousError,
        formStateSnapshot: JSON.stringify(testSignupData)
      }
    };

    const postData = JSON.stringify(requestData);
    
    console.log(`\n🧪 TEST [${attemptId}]: === STARTING ${attemptType} ===`);
    console.log(`🧪 TEST [${attemptId}]: Email: ${requestData.email}`);
    console.log(`🧪 TEST [${attemptId}]: Previous error: "${previousError}"`);
    console.log(`🧪 TEST [${attemptId}]: Request data prepared, size: ${postData.length} bytes`);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/signup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      console.log(`🧪 TEST [${attemptId}]: Response status: ${res.statusCode}`);
      console.log(`🧪 TEST [${attemptId}]: Response headers:`, res.headers);
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedResponse = JSON.parse(responseData);
          console.log(`🧪 TEST [${attemptId}]: === ${attemptType} RESPONSE ===`);
          console.log(`🧪 TEST [${attemptId}]: Status: ${res.statusCode}`);
          console.log(`🧪 TEST [${attemptId}]: Response:`, JSON.stringify(parsedResponse, null, 2));
          
          resolve({
            statusCode: res.statusCode,
            data: parsedResponse,
            success: res.statusCode >= 200 && res.statusCode < 300,
            attemptType,
            attemptId
          });
        } catch (error) {
          console.error(`🧪 TEST [${attemptId}]: Failed to parse response:`, error);
          console.error(`🧪 TEST [${attemptId}]: Raw response:`, responseData);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`🧪 TEST [${attemptId}]: Request failed:`, error);
      reject(error);
    });

    console.log(`🧪 TEST [${attemptId}]: Sending request to http://localhost:3000/api/auth/signup`);
    req.write(postData);
    req.end();
  });
}

async function runComprehensiveTest() {
  console.log('🚀 === COMPREHENSIVE FIRST ATTEMPT DEBUG TEST ===');
  console.log(`🚀 Test started at: ${new Date().toISOString()}`);
  console.log(`🚀 Test email: ${testSignupData.email}`);
  
  try {
    // Step 1: Test First Attempt
    console.log('\n📋 STEP 1: Testing FIRST ATTEMPT...');
    const firstAttempt = await makeSignupRequest('FIRST_ATTEMPT');
    
    if (firstAttempt.success) {
      console.log('\n✅ === FIRST ATTEMPT SUCCESSFUL ===');
      console.log('✅ The first attempt worked! This means the issue might be resolved.');
      console.log('✅ No need to test retry since first attempt succeeded.');
      return;
    }
    
    console.log('\n❌ === FIRST ATTEMPT FAILED ===');
    console.log('❌ First attempt failed as expected. Now testing retry...');
    
    // Step 2: Test Retry Attempt (using same email should trigger the validation issue)
    console.log('\n📋 STEP 2: Testing RETRY ATTEMPT...');
    
    // Extract error message from first attempt
    const firstAttemptError = firstAttempt.data?.error?.message || 
                            firstAttempt.data?.error || 
                            "Account Creation Failed - Invalid signup data";
    
    // Wait a moment between attempts to simulate real user behavior
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const retryAttempt = await makeSignupRequest('RETRY_ATTEMPT', firstAttemptError);
    
    if (retryAttempt.success) {
      console.log('\n🔍 === RETRY ATTEMPT SUCCESSFUL ===');
      console.log('🔍 This confirms the issue: First attempt fails, retry succeeds!');
      console.log('🔍 Check the server logs above to identify the differences.');
    } else {
      console.log('\n❌ === RETRY ATTEMPT ALSO FAILED ===');
      console.log('❌ Both attempts failed. This might indicate a different issue.');
    }
    
    // Step 3: Summary
    console.log('\n📊 === TEST SUMMARY ===');
    console.log(`📊 First attempt: ${firstAttempt.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📊 Retry attempt: ${retryAttempt.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📊 Issue confirmed: ${!firstAttempt.success && retryAttempt.success ? 'YES' : 'NO'}`);
    
    if (!firstAttempt.success && retryAttempt.success) {
      console.log('\n🔍 === ROOT CAUSE ANALYSIS ===');
      console.log('🔍 The issue is confirmed. Check the server logs above for:');
      console.log('🔍 1. Validation differences between first and retry attempts');
      console.log('🔍 2. Boolean field preprocessing differences');
      console.log('🔍 3. Form state differences');
      console.log('🔍 4. Any timing or initialization issues');
    }
    
  } catch (error) {
    console.error('🚨 === TEST FAILED ===');
    console.error('🚨 Error during test execution:', error);
    console.error('🚨 Make sure the dev server is running on http://localhost:3000');
  }
}

// Check if server is accessible first
async function checkServerHealth() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      console.log(`✅ Server is accessible (Status: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.error('❌ Server is not accessible:', error.message);
      console.error('❌ Make sure to start the dev server: npm run dev');
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('❌ Server health check timed out');
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('🔧 Checking server health...');
  const serverHealthy = await checkServerHealth();
  
  if (!serverHealthy) {
    console.log('\n🚨 Server is not accessible. Please start the development server:');
    console.log('🚨 cd /home/ubuntu/safeplay-staging && npm run dev');
    process.exit(1);
  }
  
  await runComprehensiveTest();
}

// Run the test
main().catch(console.error);
