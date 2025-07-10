
/**
 * Comprehensive Signup Flow Debug Test
 * 
 * This script simulates the exact signup flow that Sam is experiencing
 * to capture the real "User not found" error and identify its source.
 */

const { spawn } = require('child_process');
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

let devServer = null;

/**
 * Start the development server
 */
async function startDevServer() {
  console.log('🚀 Starting development server...');
  
  return new Promise((resolve, reject) => {
    devServer = spawn('npm', ['run', 'dev'], {
      cwd: '/home/ubuntu/safeplay-staging/app',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let serverReady = false;

    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('SERVER:', output.trim());
      
      if (output.includes('Ready') || output.includes('localhost:3000')) {
        if (!serverReady) {
          serverReady = true;
          console.log('✅ Development server is ready!');
          resolve();
        }
      }
    });

    devServer.stderr.on('data', (data) => {
      const output = data.toString();
      console.error('SERVER ERROR:', output.trim());
    });

    devServer.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    // Timeout after 120 seconds
    setTimeout(() => {
      if (!serverReady) {
        reject(new Error('Server failed to start within 120 seconds'));
      }
    }, 120000);
  });
}

/**
 * Stop the development server
 */
function stopDevServer() {
  if (devServer) {
    console.log('🛑 Stopping development server...');
    devServer.kill('SIGTERM');
    devServer = null;
  }
}

/**
 * Wait for server to be ready
 */
async function waitForServer() {
  console.log('⏳ Waiting for server to be ready...');
  
  for (let i = 0; i < 30; i++) {
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`, {
        timeout: 5000
      });
      
      if (response.ok) {
        console.log('✅ Server is responding!');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Server failed to become ready');
}

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
  console.log('🔍 This is where the "User not found" error likely occurs!');
  
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

    console.log('📝 Signup request data:', JSON.stringify(signupData, null, 2));
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });

    const data = await response.json();
    console.log('📤 Signup response status:', response.status);
    console.log('📤 Signup response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('🚨 SIGNUP FAILED - This is likely where "User not found" error occurs!');
      console.error('🚨 Error details:', data);
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
 * Main test function
 */
async function runCompleteSignupTest() {
  console.log('🎯 DEBUGGING: Complete Signup Flow Test');
  console.log('🎯 Goal: Reproduce and capture the "User not found" error');
  console.log('=' + '='.repeat(60));
  
  try {
    // Start development server
    await startDevServer();
    await waitForServer();
    
    // Enable log monitoring
    monitorServerLogs();
    
    // Run the complete signup flow
    console.log('\n🔍 Starting complete signup flow test...');
    
    // Step 1: Email check
    const emailResult = await testEmailCheck();
    
    // Step 2: Get plans
    const plansResult = await testGetPlans();
    
    // Step 3: Create subscription (payment)
    const subscriptionResult = await testCreateSubscription();
    
    // Step 4: Create account (this is where error likely happens)
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
    console.error('🚨 Stack:', error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  } finally {
    stopDevServer();
  }
}

/**
 * Monitor server logs for debugging patterns
 */
function monitorServerLogs() {
  console.log('👁️ Monitoring server logs for debugging patterns...');
  
  if (devServer) {
    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Look for our debug patterns
      if (output.includes('🔍 DEBUG:') || 
          output.includes('🚨 DEBUG:') || 
          output.includes('✅ DEBUG:') ||
          output.includes('❌ DEBUG:') ||
          output.includes('SIGNUP DEBUG:') ||
          output.includes('ONBOARDING DEBUG:') ||
          output.includes('TRIGGER DEBUG:') ||
          output.includes('EVAL DEBUG:')) {
        console.log('🔍 DEBUG LOG:', output.trim());
      }
      
      // Look for error patterns
      if (output.includes('User not found') ||
          output.includes('error') ||
          output.includes('Error') ||
          output.includes('failed') ||
          output.includes('Failed')) {
        console.log('🚨 ERROR LOG:', output.trim());
      }
    });

    devServer.stderr.on('data', (data) => {
      const output = data.toString();
      console.log('🚨 SERVER ERROR:', output.trim());
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  stopDevServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  stopDevServer();
  process.exit(0);
});

// Start monitoring when server starts
if (require.main === module) {
  runCompleteSignupTest()
    .then(result => {
      console.log('\n📊 FINAL RESULT:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 FATAL ERROR:', error);
      process.exit(1);
    });
}

module.exports = {
  runCompleteSignupTest,
  TEST_CONFIG
};
