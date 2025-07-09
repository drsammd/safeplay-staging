const fetch = require('node-fetch');

async function testSignupFlow() {
  const baseUrl = 'http://localhost:3000';
  console.log('🧪 Testing Complete Signup Flow...\n');

  // Test 1: Address Autocomplete
  console.log('1. Testing Address Autocomplete...');
  try {
    const response = await fetch(`${baseUrl}/api/verification/address/autocomplete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: '1600 Amphitheatre Parkway',
        countryRestriction: ['us']
      })
    });
    
    const data = await response.json();
    if (data.success && data.suggestions.length > 0) {
      console.log('✅ Address autocomplete working - Got', data.suggestions.length, 'suggestions');
    } else {
      console.log('❌ Address autocomplete failed:', data);
    }
  } catch (error) {
    console.log('❌ Address autocomplete error:', error.message);
  }

  // Test 2: Address Validation
  console.log('\n2. Testing Address Validation...');
  try {
    const response = await fetch(`${baseUrl}/api/verification/address/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
        countryRestriction: ['us']
      })
    });
    
    const data = await response.json();
    if (data.success && data.validation.isValid) {
      console.log('✅ Address validation working - Confidence:', data.validation.confidence);
    } else {
      console.log('❌ Address validation failed:', data);
    }
  } catch (error) {
    console.log('❌ Address validation error:', error.message);
  }

  // Test 3: Check Email Availability
  console.log('\n3. Testing Email Check...');
  try {
    const response = await fetch(`${baseUrl}/api/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com'
      })
    });
    
    const data = await response.json();
    console.log('✅ Email check working - Email available:', !data.exists);
  } catch (error) {
    console.log('❌ Email check error:', error.message);
  }

  // Test 4: Get Available Plans
  console.log('\n4. Testing Plans API...');
  try {
    const response = await fetch(`${baseUrl}/api/stripe/plans`);
    const data = await response.json();
    if (data.plans && data.plans.length > 0) {
      console.log('✅ Plans API working - Found', data.plans.length, 'plans');
      console.log('Available plans:', data.plans.map(p => p.name).join(', '));
    } else {
      console.log('❌ Plans API failed:', data);
    }
  } catch (error) {
    console.log('❌ Plans API error:', error.message);
  }

  // Test 5: Test Signup Subscription Endpoint
  console.log('\n5. Testing Signup Subscription Endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/stripe/subscription/create-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: 'price_basic_monthly',
        userEmail: 'testuser@example.com',
        userName: 'Test User'
      })
    });
    
    const data = await response.json();
    if (data.subscription) {
      console.log('✅ Signup subscription endpoint working - Created subscription:', data.subscription.id);
    } else {
      console.log('❌ Signup subscription failed:', data);
    }
  } catch (error) {
    console.log('❌ Signup subscription error:', error.message);
  }

  console.log('\n🎯 Signup Flow Test Complete!');
}

testSignupFlow().catch(console.error);
