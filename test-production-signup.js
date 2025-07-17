const fetch = require('node-fetch');

// Test the actual signup API endpoint
async function testProductionSignup() {
  const testData = {
    email: "test" + Date.now() + "@example.com",
    password: "testpassword123",
    name: "Test User",
    role: "PARENT",
    agreeToTerms: true,
    agreeToPrivacy: true,
    homeAddress: "123 Test Street, Test City, Test State 12345",
    homeAddressValidation: null,
    useDifferentBillingAddress: false,
    billingAddress: "",
    billingAddressValidation: null,
    selectedPlan: null,
    subscriptionData: null,
    paymentMethodId: null,
    homeAddressFields: null,
    billingAddressFields: null,
    debugMetadata: null
  };

  console.log('🧪 TESTING PRODUCTION SIGNUP API');
  console.log('='.repeat(50));
  console.log('Test data:', JSON.stringify(testData, null, 2));
  console.log('\n🚀 Sending request to /api/auth/signup...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response statusText:', response.statusText);
    console.log('📡 Response ok:', response.ok);
    
    const responseData = await response.json();
    console.log('📡 Response data:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS: Signup API test passed!');
      console.log('✅ Validation schema fixes are working correctly');
      console.log('✅ Account creation should now work properly');
      return true;
    } else {
      console.log('\n❌ FAILED: Signup API test failed');
      console.log('❌ Status:', response.status);
      console.log('❌ Error:', responseData.error || 'Unknown error');
      
      if (responseData.error && responseData.error.issues) {
        console.log('❌ Validation issues:');
        responseData.error.issues.forEach((issue, index) => {
          console.log(`   ${index + 1}. Path: ${issue.path.join('.')}, Message: ${issue.message}`);
        });
      }
      return false;
    }
  } catch (error) {
    console.log('\n💥 EXCEPTION: Test failed with exception');
    console.log('💥 Error:', error.message);
    console.log('💥 Make sure the dev server is running on port 3000');
    return false;
  }
}

// Run the test
testProductionSignup().then(success => {
  console.log('\n' + '='.repeat(50));
  console.log('🎯 PRODUCTION SIGNUP TEST COMPLETE');
  console.log('Result:', success ? '✅ PASSED' : '❌ FAILED');
  process.exit(success ? 0 : 1);
});
