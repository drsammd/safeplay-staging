
const fetch = require('node-fetch');

// Test user creation timing issues
async function testUserCreationTiming() {
  console.log('🔍 Testing User Creation Timing Issues...\n');
  
  // Test the exact scenario that might cause "User not found" error
  // This simulates rapid subscription requests that might race with user creation
  
  for (let i = 0; i < 3; i++) {
    console.log(`\n🧪 Test ${i + 1}: Complete signup flow with timing validation`);
    
    try {
      // Step 1: Create subscription demo (this should work)
      console.log('📋 Step 1: Creating demo subscription...');
      const subscriptionResponse = await fetch('http://localhost:3000/api/stripe/subscription-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'premium',
          paymentMethodId: 'demo_pm_card_visa',
          isSignupFlow: true
        })
      });
      
      if (!subscriptionResponse.ok) {
        const error = await subscriptionResponse.json();
        console.log(`❌ Subscription failed: ${error.error}`);
        continue;
      }
      
      const subscriptionResult = await subscriptionResponse.json();
      console.log(`✅ Subscription created: ${subscriptionResult.subscription?.id}`);
      console.log(`🆔 Debug ID: ${subscriptionResult.debugId}`);
      
      // Step 2: Create user with subscription data
      const timestamp = Date.now();
      const testUser = {
        email: `timing.test.${timestamp}@example.com`,
        password: 'SecurePass123!',
        name: `Timing Test ${timestamp}`,
        role: 'PARENT',
        agreeToTerms: true,
        agreeToPrivacy: true,
        homeAddress: '123 Test Street, Test City, CA 90210',
        homeAddressValidation: {
          isValid: true,
          confidence: 0.95,
          originalInput: '123 Test Street, Test City, CA 90210'
        },
        useDifferentBillingAddress: false,
        selectedPlan: {
          id: 'premium',
          name: 'Premium Plan',
          stripePriceId: 'demo_price_premium_monthly',
          billingInterval: 'monthly',
          amount: 19.99,
          planType: 'PREMIUM'
        },
        subscriptionData: {
          subscription: subscriptionResult.subscription,
          customer: subscriptionResult.customer,
          debugId: subscriptionResult.debugId
        }
      };
      
      console.log('👤 Step 2: Creating user account...');
      const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });
      
      if (!signupResponse.ok) {
        const error = await signupResponse.json();
        console.log(`❌ Signup failed: ${error.error}`);
        
        if (error.error && error.error.includes('User not found for ID:')) {
          console.log(`🎯 REPRODUCED THE ERROR: ${error.error}`);
          console.log(`🆔 Failed User ID: ${error.error.match(/ID:\s*(\w+)/)?.[1]}`);
          return false;
        }
        continue;
      }
      
      const signupResult = await signupResponse.json();
      console.log(`✅ User created: ${signupResult.data?.user?.id}`);
      console.log(`📧 Email: ${signupResult.data?.user?.email}`);
      
      // Step 3: Test immediate lookup (this is where timing issues might occur)
      const userId = signupResult.data?.user?.id;
      if (userId) {
        console.log('🔍 Step 3: Testing immediate user lookup...');
        
        // Wait various amounts to test timing sensitivity
        const delays = [0, 100, 500, 1000];
        
        for (const delay of delays) {
          if (delay > 0) {
            console.log(`   ⏳ Waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          try {
            // This simulates what the subscription service does when looking up users
            // We'll use the authenticated subscription demo endpoint that requires user lookup
            const lookupResponse = await fetch('http://localhost:3000/api/stripe/subscription-demo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                planId: 'basic',
                paymentMethodId: 'demo_pm_card_visa',
                isSignupFlow: false, // This will trigger authenticated lookup
                testUserId: userId   // Custom field for testing
              })
            });
            
            const lookupResult = await lookupResponse.json();
            
            if (lookupResult.error && lookupResult.error.includes('User not found for ID:')) {
              console.log(`🚨 TIMING ISSUE FOUND after ${delay}ms: ${lookupResult.error}`);
              console.log(`🎯 This is the exact error Sam reported!`);
              return false;
            } else if (lookupResponse.status === 401) {
              console.log(`   ✅ Lookup after ${delay}ms: Authentication required (expected)`);
            } else if (lookupResponse.ok) {
              console.log(`   ✅ Lookup after ${delay}ms: Success`);
            } else {
              console.log(`   ⚠️  Lookup after ${delay}ms: ${lookupResult.error || 'Unknown error'}`);
            }
            
          } catch (error) {
            console.log(`   ❌ Lookup after ${delay}ms failed: ${error.message}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log(`✅ Test ${i + 1} completed successfully - no timing issues found`);
      
    } catch (error) {
      console.log(`❌ Test ${i + 1} failed: ${error.message}`);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return true;
}

// Test specific user lookup scenarios
async function testUserLookupScenarios() {
  console.log('\n\n🔍 Testing specific user lookup scenarios...\n');
  
  // Test with invalid user ID format (similar to Sam's reported ID)
  const testUserIds = [
    'cmcxeysqi0000jiij569qtc8m', // Sam's exact reported ID
    'invalid_user_id_123',
    'cmcx' + Date.now() + '0000abc', // Valid format but non-existent
  ];
  
  for (const userId of testUserIds) {
    console.log(`🔍 Testing lookup for user ID: ${userId}`);
    
    try {
      // This will test if the demo subscription service properly handles invalid user IDs
      const response = await fetch('http://localhost:3000/api/stripe/subscription-demo', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'x-test-user-id': userId  // Custom header for testing
        }
      });
      
      const result = await response.json();
      
      if (result.error && result.error.includes('User not found for ID:')) {
        console.log(`🎯 REPRODUCED ERROR for ${userId}: ${result.error}`);
      } else if (response.status === 401) {
        console.log(`✅ Proper auth handling for ${userId}`);
      } else {
        console.log(`📋 Response for ${userId}: ${JSON.stringify(result, null, 2)}`);
      }
      
    } catch (error) {
      console.log(`❌ Error testing ${userId}: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function main() {
  console.log('🚀 Starting User Creation Timing Tests...\n');
  
  // Wait for server
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const timingTestPassed = await testUserCreationTiming();
  await testUserLookupScenarios();
  
  console.log('\n📊 === USER CREATION TIMING TEST RESULTS ===');
  console.log(`Timing Test: ${timingTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('\n✅ User creation timing testing complete!');
}

main().catch(console.error);
