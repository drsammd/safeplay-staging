
const fetch = require('node-fetch');

// Test authenticated subscription creation scenario
async function testAuthenticatedSubscriptionError() {
  console.log('🔍 Testing Authenticated Subscription Creation (where Sam\'s error occurs)...\n');
  
  try {
    // Step 1: Create a user first
    console.log('👤 Step 1: Creating user account...');
    const timestamp = Date.now();
    const testUser = {
      email: `auth.test.${timestamp}@example.com`,
      password: 'SecurePass123!',
      name: `Auth Test ${timestamp}`,
      role: 'PARENT',
      agreeToTerms: true,
      agreeToPrivacy: true,
      homeAddress: '123 Auth Test St, Test City, CA 90210',
      homeAddressValidation: {
        isValid: true,
        confidence: 0.95,
        originalInput: '123 Auth Test St, Test City, CA 90210'
      },
      useDifferentBillingAddress: false
    };
    
    const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (!signupResponse.ok) {
      const error = await signupResponse.json();
      console.log(`❌ User creation failed: ${error.error}`);
      return false;
    }
    
    const signupResult = await signupResponse.json();
    const userId = signupResult.data?.user?.id;
    console.log(`✅ User created: ${userId}`);
    
    if (!userId) {
      console.log(`❌ No user ID returned`);
      return false;
    }
    
    // Step 2: Simulate authenticated subscription creation
    // This is where the "User not found" error would occur
    console.log('\n💳 Step 2: Testing authenticated subscription creation...');
    
    // Wait a bit to ensure user is committed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test direct call to subscription service with the user ID
    // We'll call the subscription demo API in a way that triggers the authenticated flow
    console.log(`🔍 Testing subscription creation for user: ${userId}`);
    
    // Create a session cookie or header to simulate authenticated request
    // Since we can't easily create a NextAuth session, let's test the direct database lookup
    
    // Let's create a custom test endpoint call that directly tests the user lookup
    const testResponse = await fetch('http://localhost:3000/api/stripe/subscription-demo', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-test-user-id': userId,  // Custom header to force user lookup test
        'x-test-authenticated': 'true'  // Force authenticated flow
      },
      body: JSON.stringify({
        planId: 'premium',
        paymentMethodId: 'demo_pm_card_visa',
        isSignupFlow: false,  // This should trigger authenticated flow
        forceUserId: userId   // Force using this specific user ID
      })
    });
    
    const testResult = await testResponse.json();
    
    if (testResult.error && testResult.error.includes('User not found for ID:')) {
      console.log(`🎯 REPRODUCED THE ERROR: ${testResult.error}`);
      console.log(`🆔 Failed User ID: ${userId}`);
      console.log(`📊 Error details: ${JSON.stringify(testResult, null, 2)}`);
      return false;
    } else if (testResponse.status === 401) {
      console.log(`✅ Expected auth requirement (user lookup not tested)`);
    } else if (testResponse.ok) {
      console.log(`✅ Subscription creation successful`);
    } else {
      console.log(`⚠️  Unexpected response: ${testResult.error || 'Unknown'}`);
    }
    
    // Step 3: Test with Sam's exact user ID to see if there's something special about it
    console.log('\n🎯 Step 3: Testing with Sam\'s exact reported user ID...');
    const samsUserId = 'cmcxeysqi0000jiij569qtc8m';
    
    const samsTestResponse = await fetch('http://localhost:3000/api/stripe/subscription-demo', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-test-user-id': samsUserId,
        'x-test-authenticated': 'true'
      },
      body: JSON.stringify({
        planId: 'premium',
        paymentMethodId: 'demo_pm_card_visa',
        isSignupFlow: false,
        forceUserId: samsUserId
      })
    });
    
    const samsTestResult = await samsTestResponse.json();
    
    if (samsTestResult.error && samsTestResult.error.includes('User not found for ID:')) {
      console.log(`🎯 REPRODUCED SAM'S EXACT ERROR: ${samsTestResult.error}`);
      return false;
    } else {
      console.log(`📋 Response for Sam's ID: ${JSON.stringify(samsTestResult, null, 2)}`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  }
}

// Test database consistency
async function testDatabaseConsistency() {
  console.log('\n\n🔍 Testing Database Consistency...\n');
  
  try {
    // Create user and immediately check if it exists
    console.log('👤 Creating user for consistency test...');
    const timestamp = Date.now();
    const testUser = {
      email: `consistency.test.${timestamp}@example.com`,
      password: 'SecurePass123!',
      name: `Consistency Test ${timestamp}`,
      role: 'PARENT',
      agreeToTerms: true,
      agreeToPrivacy: true,
      homeAddress: '123 Consistency St, Test City, CA 90210',
      homeAddressValidation: {
        isValid: true,
        confidence: 0.95,
        originalInput: '123 Consistency St, Test City, CA 90210'
      },
      useDifferentBillingAddress: false
    };
    
    const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (!signupResponse.ok) {
      console.log(`❌ User creation failed`);
      return false;
    }
    
    const signupResult = await signupResponse.json();
    const userId = signupResult.data?.user?.id;
    console.log(`✅ User created: ${userId}`);
    
    // Test immediate lookup with different timing
    const timings = [0, 50, 100, 250, 500, 1000, 2000];
    
    for (const timing of timings) {
      if (timing > 0) {
        await new Promise(resolve => setTimeout(resolve, timing));
      }
      
      console.log(`🔍 Testing user existence after ${timing}ms...`);
      
      // Test by trying to create another account with same email (should fail if user exists)
      const duplicateResponse = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });
      
      const duplicateResult = await duplicateResponse.json();
      
      if (duplicateResponse.status === 409 && duplicateResult.error?.includes('already exists')) {
        console.log(`   ✅ User exists in database after ${timing}ms`);
      } else if (duplicateResponse.ok) {
        console.log(`   🚨 User NOT found in database after ${timing}ms - CONSISTENCY ISSUE!`);
        return false;
      } else {
        console.log(`   ⚠️  Unexpected response after ${timing}ms: ${duplicateResult.error}`);
      }
    }
    
    console.log(`✅ Database consistency test passed`);
    return true;
    
  } catch (error) {
    console.log(`❌ Database consistency test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Authenticated Subscription Error Investigation...\n');
  
  const authTestPassed = await testAuthenticatedSubscriptionError();
  const consistencyTestPassed = await testDatabaseConsistency();
  
  console.log('\n📊 === AUTHENTICATED SUBSCRIPTION ERROR TEST RESULTS ===');
  console.log(`Auth Test: ${authTestPassed ? '✅ PASSED' : '❌ FAILED - Error reproduced'}`);
  console.log(`Consistency Test: ${consistencyTestPassed ? '✅ PASSED' : '❌ FAILED - Database issue found'}`);
  
  if (authTestPassed && consistencyTestPassed) {
    console.log('\n🎉 No issues found - the error may be situational or fixed');
  } else {
    console.log('\n🔧 Issues found - investigation complete');
  }
  
  console.log('\n✅ Investigation complete!');
}

main().catch(console.error);
