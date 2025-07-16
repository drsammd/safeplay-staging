const fetch = require('node-fetch');

async function testSignupValidation() {
  console.log('🧪 Testing signup API validation...');
  
  // Test data that should mimic what the frontend sends
  const testData = {
    name: "Test User",
    email: "test@example.com", 
    password: "testpass123",
    role: "PARENT",
    agreeToTerms: true,
    agreeToPrivacy: true,
    homeAddress: "123 Test Street, Test City, Test State 12345",
    homeAddressValidation: {
      isValid: true,
      confidence: 0.95,
      standardizedAddress: {
        formatted_address: "123 Test Street, Test City, Test State 12345, United States",
        route: "123 Test Street",
        locality: "Test City",
        administrative_area_level_1: "Test State",
        postal_code: "12345",
        country: "US"
      },
      originalInput: "123 Test Street, Test City, Test State 12345"
    },
    useDifferentBillingAddress: false,
    billingAddress: "",
    billingAddressValidation: null,
    selectedPlan: {
      id: "enterprise",
      name: "Enterprise",
      stripePriceId: "price_test_123",
      billingInterval: "monthly",
      amount: 299.99,
      planType: "ENTERPRISE"
    },
    subscriptionData: {
      subscription: {
        id: "sub_test_123",
        status: "active",
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        cancel_at_period_end: false
      },
      customer: {
        id: "cus_test_123"
      },
      isSignupFlow: true,
      debugId: "test_validation_123"
    },
    homeAddressFields: {
      street: "123 Test Street",
      city: "Test City", 
      state: "Test State",
      zipCode: "12345",
      fullAddress: "123 Test Street, Test City, Test State 12345, United States"
    },
    billingAddressFields: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      fullAddress: ""
    }
  };

  try {
    console.log('📤 Sending request to signup API...');
    console.log('🔍 Request data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    const responseData = await response.json();
    console.log('📡 Response data:', JSON.stringify(responseData, null, 2));
    
    if (!response.ok) {
      console.log('❌ Signup failed as expected - validation error details should be in server logs');
    } else {
      console.log('✅ Signup succeeded unexpectedly');
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

testSignupValidation();
