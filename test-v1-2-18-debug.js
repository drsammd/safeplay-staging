
const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test utilities
function generateTestUser() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return {
    email: `test.user.${timestamp}.${random}@example.com`,
    password: 'SecurePass123!',
    name: `Test User ${timestamp}`,
    role: 'PARENT',
    agreeToTerms: true,
    agreeToPrivacy: true,
    homeAddress: '123 Main St, Anytown, CA 90210',
    homeAddressValidation: {
      isValid: true,
      confidence: 0.95,
      originalInput: '123 Main St, Anytown, CA 90210'
    },
    useDifferentBillingAddress: false,
    selectedPlan: {
      id: 'premium',
      name: 'Premium Plan',
      stripePriceId: 'demo_price_premium_monthly',
      billingInterval: 'monthly',
      amount: 19.99,
      planType: 'PREMIUM'
    }
  };
}

// ISSUE 1: Test User Creation and Stripe Timing
async function testUserCreationFlow() {
  log('\n🔍 === TESTING ISSUE 1: USER CREATION AND STRIPE TIMING ===', 'bright');
  
  try {
    // Step 1: Test subscription-demo API (unauthenticated signup flow)
    log('\n📋 Step 1: Testing subscription-demo API (signup flow)...', 'blue');
    
    const subscriptionResponse = await fetch(`${BASE_URL}/api/stripe/subscription-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'premium',
        paymentMethodId: 'demo_pm_card_visa',
        isSignupFlow: true
      })
    });
    
    const subscriptionResult = await subscriptionResponse.json();
    log(`📊 Subscription demo response status: ${subscriptionResponse.status}`, 
        subscriptionResponse.ok ? 'green' : 'red');
    
    if (subscriptionResult.debugId) {
      log(`🆔 Debug ID: ${subscriptionResult.debugId}`, 'cyan');
    }
    
    if (!subscriptionResponse.ok) {
      log(`❌ Subscription demo failed: ${subscriptionResult.error}`, 'red');
      return false;
    }
    
    log(`✅ Subscription demo successful`, 'green');
    log(`📦 Subscription ID: ${subscriptionResult.subscription?.id}`, 'cyan');
    log(`👤 Customer ID: ${subscriptionResult.customer?.id}`, 'cyan');
    
    // Step 2: Test signup with subscription data
    log('\n📋 Step 2: Testing signup API with subscription data...', 'blue');
    
    const testUser = generateTestUser();
    testUser.subscriptionData = {
      subscription: subscriptionResult.subscription,
      customer: subscriptionResult.customer,
      debugId: subscriptionResult.debugId
    };
    
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const signupResult = await signupResponse.json();
    log(`📊 Signup response status: ${signupResponse.status}`, 
        signupResponse.ok ? 'green' : 'red');
    
    if (signupResult.debugId) {
      log(`🆔 Signup Debug ID: ${signupResult.debugId}`, 'cyan');
    }
    
    if (!signupResponse.ok) {
      log(`❌ Signup failed: ${signupResult.error}`, 'red');
      log(`❌ Error details: ${JSON.stringify(signupResult, null, 2)}`, 'red');
      return false;
    }
    
    log(`✅ Signup successful!`, 'green');
    log(`👤 Created user ID: ${signupResult.user?.id}`, 'cyan');
    log(`📧 Created user email: ${signupResult.user?.email}`, 'cyan');
    
    // Step 3: Test authenticated subscription lookup
    log('\n📋 Step 3: Testing user lookup after creation...', 'blue');
    
    // Wait a moment to ensure database commit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate the scenario where a user ID exists but lookup fails
    const userId = signupResult.user?.id;
    if (userId) {
      // Test direct database lookup through subscription status API
      // We need to create a session first for this test
      // For now, let's test the subscription demo GET endpoint which doesn't need auth
      
      log(`🔍 Testing user existence for ID: ${userId}`, 'yellow');
      
      // Test if we can create a subscription for this user (this should trigger the error if it exists)
      const authTestResponse = await fetch(`${BASE_URL}/api/stripe/subscription-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'basic',
          paymentMethodId: 'demo_pm_card_visa',
          isSignupFlow: false,
          testUserId: userId // This will be used internally for testing
        })
      });
      
      const authTestResult = await authTestResponse.json();
      if (authTestResult.error && authTestResult.error.includes('User not found for ID:')) {
        log(`🚨 REPRODUCED ISSUE 1: ${authTestResult.error}`, 'red');
        log(`🎯 User ID that failed lookup: ${userId}`, 'yellow');
        return false;
      } else {
        log(`✅ User lookup test completed without "User not found" error`, 'green');
      }
    }
    
    return true;
    
  } catch (error) {
    log(`❌ User creation flow test failed: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

// ISSUE 2: Test Geoapify Address Autocomplete
async function testGeoapifyAddressAutocomplete() {
  log('\n🔍 === TESTING ISSUE 2: GEOAPIFY ADDRESS AUTOCOMPLETE ===', 'bright');
  
  try {
    // Test different address inputs to see how many suggestions we get
    const testAddresses = [
      '123 Main',
      '123 Main St',
      '123 Main Street',
      '456 Oak Ave',
      '789 Pine Street, Los Angeles',
      '1000 Market St, San Francisco'
    ];
    
    for (const testAddress of testAddresses) {
      log(`\n📍 Testing address autocomplete for: "${testAddress}"`, 'blue');
      
      const response = await fetch(`${BASE_URL}/api/verification/address/autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: testAddress,
          countryRestriction: ['us', 'ca']
        })
      });
      
      const result = await response.json();
      
      log(`📊 Response status: ${response.status}`, response.ok ? 'green' : 'red');
      
      if (!response.ok) {
        log(`❌ Autocomplete failed: ${result.error}`, 'red');
        continue;
      }
      
      const suggestions = result.suggestions || [];
      log(`📋 Number of suggestions: ${suggestions.length}`, 
          suggestions.length > 1 ? 'green' : (suggestions.length === 1 ? 'yellow' : 'red'));
      
      if (suggestions.length === 0) {
        log(`🚨 ISSUE 2A: No suggestions returned for "${testAddress}"`, 'red');
      } else if (suggestions.length === 1) {
        log(`🚨 ISSUE 2B: Only 1 suggestion returned (should be multiple)`, 'yellow');
      } else {
        log(`✅ Multiple suggestions returned`, 'green');
      }
      
      // Display suggestions
      suggestions.forEach((suggestion, index) => {
        log(`  ${index + 1}. ${suggestion.main_text}`, 'cyan');
        log(`     ${suggestion.secondary_text}`, 'cyan');
        
        // Check confidence if available
        if (suggestion.confidence !== undefined) {
          if (suggestion.confidence === 1.0 || suggestion.confidence === 100) {
            log(`     🚨 ISSUE 2C: Confidence is 100% (${suggestion.confidence}) - likely incorrect`, 'red');
          } else {
            log(`     Confidence: ${suggestion.confidence}`, 'cyan');
          }
        }
      });
      
      // Test address validation for the first suggestion
      if (suggestions.length > 0) {
        log(`\n🔍 Testing address validation for first suggestion...`, 'blue');
        
        const validationResponse = await fetch(`${BASE_URL}/api/verification/address/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: suggestions[0].description,
            placeId: suggestions[0].place_id,
            countryRestriction: ['us', 'ca']
          })
        });
        
        if (validationResponse.ok) {
          const validationResult = await validationResponse.json();
          const validation = validationResult.validation;
          
          log(`✅ Validation successful`, 'green');
          log(`   Valid: ${validation.isValid}`, validation.isValid ? 'green' : 'yellow');
          log(`   Confidence: ${Math.round(validation.confidence * 100)}%`, 'cyan');
          
          if (validation.confidence === 1.0) {
            log(`   🚨 ISSUE 2C: Validation confidence is 100% - likely incorrect`, 'red');
          }
        } else {
          log(`❌ Validation failed`, 'red');
        }
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Geoapify test failed: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

// Test current version
async function testVersion() {
  log('\n🔍 === TESTING CURRENT VERSION ===', 'bright');
  
  try {
    const response = await fetch(`${BASE_URL}/api/version`);
    const version = await response.json();
    
    log(`📋 Current Version: ${version.version}`, 'cyan');
    log(`🌍 Environment: ${version.environment}`, 'cyan');
    log(`⏰ Build Time: ${version.buildTimestamp}`, 'cyan');
    log(`🔧 Commit: ${version.commit}`, 'cyan');
    
    if (version.version !== '1.2.18-staging') {
      log(`⚠️  Warning: Expected version 1.2.18-staging but got ${version.version}`, 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ Version test failed: ${error.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting comprehensive debugging for v1.2.18 issues...', 'bright');
  
  const results = {};
  
  // Test current version
  results.version = await testVersion();
  
  // Test Issue 1: User creation and Stripe timing
  results.userCreation = await testUserCreationFlow();
  
  // Test Issue 2: Geoapify address autocomplete
  results.geoapify = await testGeoapifyAddressAutocomplete();
  
  // Summary
  log('\n📊 === TEST RESULTS SUMMARY ===', 'bright');
  log(`Version Test: ${results.version ? '✅ PASSED' : '❌ FAILED'}`, 
      results.version ? 'green' : 'red');
  log(`User Creation Test: ${results.userCreation ? '✅ PASSED' : '❌ FAILED'}`, 
      results.userCreation ? 'green' : 'red');
  log(`Geoapify Test: ${results.geoapify ? '✅ PASSED' : '❌ FAILED'}`, 
      results.geoapify ? 'green' : 'red');
  
  const allPassed = Object.values(results).every(result => result === true);
  log(`\nOverall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`, 
      allPassed ? 'green' : 'red');
  
  if (!allPassed) {
    log('\n🔧 Issues found - proceeding with fixes...', 'yellow');
  }
  
  return results;
}

// Run tests
runAllTests().catch(console.error);
