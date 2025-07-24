
/**
 * EMERGENCY RACE CONDITION TEST - Fresh Email Investigation
 * Tests the exact signup flow for fresh emails to identify where "already exists" error originates
 */

const API_BASE = 'http://localhost:3000';
const FRESH_EMAIL = 'drsam+999@outlook.com'; // Known fresh email
const TEST_PASSWORD = 'TestPass123!';

async function testFreshEmailSignupFlow() {
  console.log('🚨 EMERGENCY TEST: Testing fresh email signup flow to identify race condition');
  console.log(`📧 Testing with fresh email: ${FRESH_EMAIL}`);
  
  try {
    // STEP 1: Test email validation endpoint first
    console.log('\n📡 STEP 1: Testing /api/auth/check-email');
    const emailCheckResponse = await fetch(`${API_BASE}/api/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: FRESH_EMAIL })
    });
    
    const emailCheckResult = await emailCheckResponse.json();
    console.log(`📊 Email check response status: ${emailCheckResponse.status}`);
    console.log(`📊 Email check result:`, emailCheckResult);
    
    if (emailCheckResult.exists === true) {
      console.log('❌ PROBLEM FOUND: Fresh email shows as existing in check-email endpoint!');
      return { step: 'email-check', issue: 'fresh-email-shows-as-existing' };
    }
    
    // STEP 2: Test multiple concurrent email checks (race condition simulation)
    console.log('\n🔄 STEP 2: Testing concurrent email checks for race conditions');
    const concurrentChecks = Array(5).fill().map(async (_, i) => {
      console.log(`🔄 Starting concurrent email check ${i + 1}`);
      const response = await fetch(`${API_BASE}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: FRESH_EMAIL })
      });
      const result = await response.json();
      console.log(`🔄 Concurrent check ${i + 1} result:`, result);
      return { check: i + 1, exists: result.exists, status: response.status };
    });
    
    const concurrentResults = await Promise.all(concurrentChecks);
    console.log('\n📊 CONCURRENT CHECKS SUMMARY:');
    concurrentResults.forEach(result => {
      console.log(`  - Check ${result.check}: exists=${result.exists}, status=${result.status}`);
    });
    
    // Check if any concurrent check returned exists=true
    const falsePositive = concurrentResults.find(r => r.exists === true);
    if (falsePositive) {
      console.log('❌ RACE CONDITION DETECTED: Concurrent email check returned exists=true for fresh email!');
      return { step: 'concurrent-checks', issue: 'race-condition-detected' };
    }
    
    // STEP 3: Test actual signup API with FREE plan (no payment complications)
    console.log('\n📡 STEP 3: Testing actual signup API with FREE plan');
    const signupData = {
      email: FRESH_EMAIL,
      password: TEST_PASSWORD,
      name: 'Test User',
      role: 'PARENT',
      agreeToTerms: true,
      agreeToPrivacy: true,
      homeAddress: 'Not Provided (Free Plan)', // FREE plan default
      selectedPlan: {
        id: 'free-plan',
        name: 'Free Plan',
        stripePriceId: null,
        billingInterval: 'free',
        amount: 0,
        planType: 'FREE'
      }
    };
    
    console.log('📤 Sending signup request...');
    const signupResponse = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });
    
    const signupResult = await signupResponse.json();
    console.log(`📊 Signup response status: ${signupResponse.status}`);
    console.log(`📊 Signup result:`, JSON.stringify(signupResult, null, 2));
    
    if (signupResponse.status === 409 && signupResult.error && 
        (signupResult.error.includes('already exists') || signupResult.errorCode === 'COMPLETE_ACCOUNT_EXISTS')) {
      console.log('❌ PROBLEM FOUND: Signup API returned "already exists" for fresh email!');
      return { 
        step: 'signup-api', 
        issue: 'fresh-email-signup-conflict', 
        errorCode: signupResult.errorCode,
        details: signupResult
      };
    }
    
    if (signupResponse.status === 201 && signupResult.success) {
      console.log('✅ SUCCESS: Fresh email signup completed successfully');
      return { step: 'complete', issue: 'none', success: true };
    }
    
    console.log('❌ UNEXPECTED: Signup failed for unknown reason');
    return { 
      step: 'signup-api', 
      issue: 'unexpected-failure', 
      status: signupResponse.status,
      details: signupResult 
    };
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    return { step: 'error', issue: 'test-exception', error: error.message };
  }
}

// Run the test
testFreshEmailSignupFlow().then(result => {
  console.log('\n🎯 FINAL TEST RESULT:', result);
  process.exit(0);
}).catch(error => {
  console.error('🚨 CRITICAL TEST ERROR:', error);
  process.exit(1);
});
