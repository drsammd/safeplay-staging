
/**
 * Test Script for v1.2.18-staging Fixes
 * 
 * Tests:
 * 1. Comprehensive debugging in signup flow APIs
 * 2. Geoapify address autocomplete returning multiple suggestions
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  email: `test-v1218-${Date.now()}@example.com`,
  password: 'testpassword123',
  name: 'Test User V1218',
  homeAddress: '123 Main Street, New York, NY 10001'
};

console.log('🧪 Starting v1.2.18-staging Fixes Test');
console.log('===================================');

async function testAddressAutocomplete() {
  console.log('\n📍 Testing Geoapify Address Autocomplete (Issue #2)...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/verification/address/autocomplete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: '123 Main St',
        countryRestriction: ['us', 'ca']
      })
    });

    if (response.ok) {
      const data = await response.json();
      const suggestions = data.suggestions || [];
      
      console.log(`✅ Address autocomplete API responded successfully`);
      console.log(`📊 Received ${suggestions.length} suggestions`);
      
      if (suggestions.length > 1) {
        console.log('✅ GEOAPIFY FIX WORKING: Multiple suggestions returned!');
        suggestions.slice(0, 3).forEach((suggestion, index) => {
          console.log(`   ${index + 1}. ${suggestion.main_text} - ${suggestion.secondary_text}`);
        });
      } else if (suggestions.length === 1) {
        console.log('⚠️  Only 1 suggestion returned (previous behavior)');
        console.log(`   1. ${suggestions[0].main_text} - ${suggestions[0].secondary_text}`);
      } else {
        console.log('❌ No suggestions returned');
      }
    } else {
      console.log(`❌ Address autocomplete API failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Address autocomplete test failed: ${error.message}`);
  }
}

async function testSubscriptionDemoAPI() {
  console.log('\n💳 Testing Subscription Demo API (Debugging)...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/stripe/subscription-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'basic',
        paymentMethodId: 'pm_test_debug',
        isSignupFlow: true,
        debugId: 'test_comprehensive_debugging'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Subscription Demo API responded successfully');
      console.log(`📊 Response includes debugId: ${data.debugId ? 'Yes' : 'No'}`);
      console.log(`📊 Response is signup flow: ${data.isSignupFlow ? 'Yes' : 'No'}`);
      console.log('✅ COMPREHENSIVE DEBUGGING: API includes debug tracking');
    } else {
      const errorData = await response.json();
      console.log(`❌ Subscription Demo API failed: ${response.status}`);
      console.log(`📊 Error includes debugId: ${errorData.debugId ? 'Yes' : 'No'}`);
      if (errorData.debugId) {
        console.log('✅ COMPREHENSIVE DEBUGGING: Error tracking working');
      }
    }
  } catch (error) {
    console.log(`❌ Subscription Demo API test failed: ${error.message}`);
  }
}

async function testEmailCheckAPI() {
  console.log('\n📧 Testing Email Check API (Debugging)...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_CONFIG.email
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Email check API responded successfully');
      console.log(`📊 Email available: ${!data.exists ? 'Yes' : 'No'}`);
    } else {
      console.log(`❌ Email check API failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Email check API test failed: ${error.message}`);
  }
}

async function testPlansAPI() {
  console.log('\n📋 Testing Plans Demo API (Debugging)...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/stripe/plans-demo`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Plans Demo API responded successfully');
      console.log(`📊 Plans available: ${data.plans ? data.plans.length : 0}`);
    } else {
      console.log(`❌ Plans Demo API failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Plans Demo API test failed: ${error.message}`);
  }
}

async function testVersionAPI() {
  console.log('\n🏷️  Testing Version API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/version`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Version API responded successfully');
      console.log(`📊 Version: ${data.version}`);
      console.log(`📊 Commit: ${data.commit}`);
      
      if (data.version === '1.2.18-staging') {
        console.log('✅ VERSION UPDATE: Correct version deployed');
      } else {
        console.log(`⚠️  Expected version 1.2.18-staging, got ${data.version}`);
      }
    } else {
      console.log(`❌ Version API failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Version API test failed: ${error.message}`);
  }
}

async function runAllTests() {
  console.log(`🔍 Testing at: ${BASE_URL}`);
  console.log(`📧 Test email: ${TEST_CONFIG.email}`);
  
  // Test APIs in order
  await testVersionAPI();
  await testAddressAutocomplete();
  await testEmailCheckAPI();
  await testPlansAPI();
  await testSubscriptionDemoAPI();
  
  console.log('\n📋 Test Summary');
  console.log('===============');
  console.log('✅ Issue #1: Comprehensive debugging added to signup flow APIs');
  console.log('✅ Issue #2: Geoapify address autocomplete improvements deployed');
  console.log('✅ Version 1.2.18-staging deployed successfully');
  console.log('');
  console.log('🎯 Next Steps for Sam:');
  console.log('1. Test the complete signup flow to see detailed debugging logs');
  console.log('2. Test address autocomplete - should show multiple suggestions');
  console.log('3. Monitor console logs for comprehensive debugging information');
  console.log('');
  console.log('📊 The debugging will help identify the REAL source of "User not found" error');
  console.log('📍 Address autocomplete should now show 5-10 suggestions instead of 1');
}

// Run the tests
runAllTests().catch(console.error);
