
/**
 * Test script to verify the v1.5.24 signup fix
 * Tests that EmailPreferences creation works with correct field names
 */

const fetch = require('node-fetch');

const testSignup = async () => {
  const debugId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🧪 SIGNUP TEST [${debugId}]: Testing v1.5.24 signup fix`);
  
  const testEmail = `test.user.${Date.now()}@example.com`;
  const testData = {
    name: "Test User",
    email: testEmail,
    password: "testpassword123",
    role: "PARENT",
    agreeToTerms: true,
    agreeToPrivacy: true,
    homeAddress: "123 Main St, Anytown, USA",
    billingAddress: "123 Main St, Anytown, USA",
    useDifferentBillingAddress: false,
    homeAddressValidation: {
      isValid: true,
      confidence: 1,
      standardizedAddress: {
        street: "123 Main St",
        city: "Anytown",
        state: "NY",
        zipCode: "12345",
        country: "USA"
      }
    },
    billingAddressValidation: {
      isValid: true,
      confidence: 1,
      standardizedAddress: {
        street: "123 Main St",
        city: "Anytown",
        state: "NY", 
        zipCode: "12345",
        country: "USA"
      }
    },
    selectedPlan: {
      name: "FREE",
      planType: "FREE",
      amount: 0,
      billingInterval: "free"
    }
  };
  
  try {
    console.log(`📤 SIGNUP TEST [${debugId}]: Sending signup request...`);
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const responseText = await response.text();
    console.log(`📥 SIGNUP TEST [${debugId}]: Response status: ${response.status}`);
    console.log(`📥 SIGNUP TEST [${debugId}]: Response text: ${responseText}`);
    
    if (response.status === 200) {
      console.log(`✅ SIGNUP TEST [${debugId}]: SUCCESS - Signup worked!`);
      const responseData = JSON.parse(responseText);
      console.log(`✅ SIGNUP TEST [${debugId}]: User created with ID: ${responseData.user?.id}`);
      return true;
    } else {
      console.error(`❌ SIGNUP TEST [${debugId}]: FAILED - Status: ${response.status}`);
      try {
        const errorData = JSON.parse(responseText);
        console.error(`❌ SIGNUP TEST [${debugId}]: Error details: ${errorData.details}`);
        // Check if this is still the old EmailPreferences error
        if (errorData.details && errorData.details.includes('receivePromotional')) {
          console.error(`🚨 SIGNUP TEST [${debugId}]: OLD ERROR STILL PRESENT - Fix did not work!`);
          return false;
        }
      } catch (e) {
        // Response wasn't JSON
      }
      return false;
    }
  } catch (error) {
    console.error(`💥 SIGNUP TEST [${debugId}]: Exception occurred:`, error);
    return false;
  }
};

// Run the test
testSignup().then(success => {
  if (success) {
    console.log(`\n🎉 SIGNUP FIX VERIFICATION: SUCCESS!`);
    console.log(`✅ The v1.5.24 fix successfully resolved the schema mismatch issue`);
    process.exit(0);
  } else {
    console.log(`\n🚨 SIGNUP FIX VERIFICATION: FAILED!`);
    console.log(`❌ The v1.5.24 fix did not resolve the issue`);
    process.exit(1);
  }
}).catch(error => {
  console.error(`💥 SIGNUP FIX VERIFICATION: Test failed with exception:`, error);
  process.exit(1);
});
