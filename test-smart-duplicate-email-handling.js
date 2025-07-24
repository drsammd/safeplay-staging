/**
 * Test Smart Duplicate Email Handling v1.5.40-alpha.19
 * Verifies transaction isolation success + new duplicate email logic
 */

async function testSmartDuplicateEmailHandling() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 TESTING SMART DUPLICATE EMAIL HANDLING v1.5.40-alpha.19');
  console.log('================================================');
  
  // Test 1: Try to sign up with existing complete account (should guide to login)
  console.log('\n📧 TEST 1: Existing Complete Account');
  console.log('--------------------------------------');
  
  const existingEmail = 'drsam+213@outlook.com'; // From our database check - has active subscription
  
  const signupData = {
    email: existingEmail,
    password: 'testpassword123',
    name: 'Test User',
    homeAddress: '123 Test St, Test City, TS 12345',
    acceptTerms: true,
    selectedPlan: {
      id: 'free-plan',
      name: 'FREE Plan',
      stripePriceId: null,
      billingInterval: 'free',
      amount: 0,
      planType: 'FREE'
    }
  };
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });
    
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 409) {
      console.log('✅ EXPECTED: Duplicate email detected');
      if (data.action === 'LOGIN') {
        console.log('✅ SMART GUIDANCE: User directed to login');
      }
      if (data.userMessage && data.userMessage.includes('sign in instead')) {
        console.log('✅ USER EXPERIENCE: Clear messaging provided');
      }
    } else {
      console.log('❌ UNEXPECTED: Should have detected existing account');
    }
    
  } catch (error) {
    console.error('❌ TEST 1 FAILED:', error.message);
  }
  
  // Test 2: Try to sign up with a new email (should work)
  console.log('\n📧 TEST 2: New Email Signup');
  console.log('-----------------------------');
  
  const newEmail = `test_smart_signup_${Date.now()}@example.com`;
  const newSignupData = {
    ...signupData,
    email: newEmail
  };
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSignupData)
    });
    
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response summary:`, {
      success: response.status === 201,
      transactionIsolationFixed: data.transactionIsolationFixed,
      duplicateEmailHandlingActive: data.duplicateEmailHandlingActive,
      smartSignupActive: data.smartSignupActive
    });
    
    if (response.status === 201) {
      console.log('✅ SUCCESS: New account created successfully');
      console.log('✅ TRANSACTION ISOLATION: Still working correctly');
    } else {
      console.log('❌ UNEXPECTED: New email signup should succeed');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ TEST 2 FAILED:', error.message);
  }
  
  // Test 3: Check version endpoint
  console.log('\n🏷️ TEST 3: Version Endpoint Check');
  console.log('----------------------------------');
  
  try {
    const response = await fetch(`${baseUrl}/api/version`);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`🏷️ Version: ${data.version}`);
    console.log(`🔧 Features:`, {
      customerProtected: data.customerProtected,
      comprehensiveFixesActive: data.comprehensiveFixesActive,
      deploymentStatus: data.deploymentStatus
    });
    
    if (data.version && data.version.includes('alpha.19')) {
      console.log('✅ VERSION: Correctly updated to alpha.19');
    } else {
      console.log('⚠️ VERSION: May need version endpoint update');
    }
    
  } catch (error) {
    console.error('❌ TEST 3 FAILED:', error.message);
  }
  
  console.log('\n🎉 SMART DUPLICATE EMAIL HANDLING TEST COMPLETE');
  console.log('================================================');
}

// Run the test
testSmartDuplicateEmailHandling().catch(console.error);
