
/**
 * Test FREE PLAN Signup Fix v1.5.33-alpha.9
 * Tests the specific scenario that was failing in the log file
 */

const testFreePlanSignup = async () => {
  const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🧪 FREE PLAN SIGNUP TEST [${testId}]: Starting test...`);

  // Simulate the exact data from the failing log
  const signupData = {
    "name": "testuser+freeplanalpha9",
    "email": `testuser+freeplanalpha9+${Date.now()}@outlook.com`,
    "password": "password123",
    "role": "PARENT",
    "agreeToTerms": true,
    "agreeToPrivacy": true,
    "useDifferentBillingAddress": false,
    "homeAddress": "", // This was causing the error - empty string
    "homeAddressValidation": null,
    "billingAddress": "",
    "billingAddressValidation": null,
    "selectedPlan": {
      "id": "free",
      "name": "Free Plan",
      "stripePriceId": null,
      "billingInterval": "free",
      "amount": 0,
      "planType": "FREE"
    },
    "subscriptionData": null,
    "homeAddressFields": {
      "street": "",
      "city": "",
      "state": "",
      "zipCode": "",
      "fullAddress": ""
    },
    "billingAddressFields": {
      "street": "",
      "city": "",
      "state": "",
      "zipCode": "",
      "fullAddress": ""
    },
    "debugMetadata": {
      "attemptId": testId,
      "attemptType": "FREE_PLAN_FIX_TEST",
      "attemptTimestamp": new Date().toISOString(),
      "frontendVersion": "1.5.33-alpha.9",
      "testCase": "FREE_PLAN_EMPTY_ADDRESS_FIX"
    }
  };

  console.log(`📋 FREE PLAN TEST [${testId}]: Test data prepared:`, {
    email: signupData.email,
    planType: signupData.selectedPlan.planType,
    homeAddressLength: signupData.homeAddress.length,
    expectedFix: "homeAddress should be handled gracefully for FREE PLAN"
  });

  try {
    console.log(`🌐 FREE PLAN TEST [${testId}]: Sending POST request to /api/auth/signup...`);
    
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData)
    });

    console.log(`📥 FREE PLAN TEST [${testId}]: Response received:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    const responseData = await response.json();
    
    if (response.ok) {
      console.log(`✅ FREE PLAN TEST [${testId}]: SUCCESS! Free Plan signup worked!`);
      console.log(`✅ FREE PLAN TEST [${testId}]: Response data:`, {
        success: responseData.success,
        userId: responseData.data?.user?.id,
        email: responseData.data?.user?.email,
        role: responseData.data?.user?.role,
        protection: responseData.data?.protection
      });
      
      return {
        success: true,
        testId,
        result: 'FREE_PLAN_SIGNUP_SUCCESS',
        responseData
      };
      
    } else {
      console.error(`❌ FREE PLAN TEST [${testId}]: FAILED - HTTP ${response.status}`);
      console.error(`❌ FREE PLAN TEST [${testId}]: Error details:`, responseData);
      
      // Check if it's the same validation error as before
      if (responseData.error?.code === 'SIGNUP_VALIDATION_FAILED') {
        const issues = responseData.error?.details?.issues || [];
        const addressIssue = issues.find(issue => 
          issue.path && issue.path.includes('homeAddress') && 
          issue.message && issue.message.includes('5 characters')
        );
        
        if (addressIssue) {
          console.error(`🚨 FREE PLAN TEST [${testId}]: SAME ERROR AS BEFORE - Address validation not fixed!`);
          console.error(`🚨 FREE PLAN TEST [${testId}]: Address issue:`, addressIssue);
        } else {
          console.error(`🚨 FREE PLAN TEST [${testId}]: Different validation error:`, issues);
        }
      }
      
      return {
        success: false,
        testId,
        result: 'FREE_PLAN_SIGNUP_FAILED',
        error: responseData,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error(`🚨 FREE PLAN TEST [${testId}]: Network/fetch error:`, error);
    return {
      success: false,
      testId,
      result: 'NETWORK_ERROR',
      error: error.message
    };
  }
};

// Run the test
testFreePlanSignup()
  .then(result => {
    console.log(`\n🏁 FREE PLAN TEST COMPLETE:`);
    console.log(`📊 Result: ${result.result}`);
    console.log(`✅ Success: ${result.success}`);
    
    if (result.success) {
      console.log(`\n🎉 FREE PLAN FIX VERIFICATION: ✅ PASSED`);
      console.log(`🆓 FREE PLAN users can now create accounts successfully!`);
      console.log(`🔧 v1.5.33-alpha.9 fix is working correctly!`);
    } else {
      console.log(`\n❌ FREE PLAN FIX VERIFICATION: ❌ FAILED`);
      console.log(`🔧 Additional fixes may be needed for v1.5.33-alpha.9`);
    }
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error(`🚨 TEST EXECUTION ERROR:`, error);
    process.exit(1);
  });
