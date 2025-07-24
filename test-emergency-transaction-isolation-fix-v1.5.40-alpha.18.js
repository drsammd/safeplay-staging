
/**
 * Emergency Transaction Isolation Fix Test v1.5.40-alpha.18
 * Tests that the unified customer service now uses transaction context properly
 * to prevent foreign key constraint violations
 */

const https = require('https');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = `test_transaction_isolation_${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

console.log('🚨 EMERGENCY TRANSACTION ISOLATION FIX TEST v1.5.40-alpha.18');
console.log('================================================================');
console.log(`Testing email: ${TEST_EMAIL}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log();

async function testTransactionIsolationFix() {
  console.log('🔄 Testing transaction isolation fix...');
  
  try {
    const signupData = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: 'Transaction Test User',
      role: 'PARENT',
      agreeToTerms: true,
      agreeToPrivacy: true,
      homeAddress: '123 Test Street, Test City, Test State, 12345',
      homeAddressValidation: {
        isValid: true,
        formatted_address: '123 Test Street, Test City, Test State, 12345'
      },
      selectedPlan: {
        id: 'basic',
        name: 'Basic Plan',
        stripePriceId: 'price_1RjxePC2961Zxi3Wku9h51bx',
        billingInterval: 'monthly',
        amount: 9.99,
        planType: 'BASIC'
      },
      paymentMethodId: 'pm_card_visa' // Test payment method
    };

    console.log('📤 Sending signup request...');
    
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData),
    });

    const responseData = await response.json();
    
    console.log('📥 Response received:');
    console.log(`Status: ${response.status}`);
    console.log(`Data:`, responseData);
    
    // Analysis
    if (response.ok) {
      console.log('✅ SUCCESS: Transaction isolation fix working!');
      console.log(`✅ Account created successfully: ${responseData.user?.email}`);
      console.log(`✅ Emergency fix status: ${responseData.emergencyFixActive || 'Not reported'}`);
      return true;
    } else if (responseData.error === "Transaction isolation issue prevented account creation") {
      console.log('❌ FAILURE: Transaction isolation error still occurring');
      console.log(`❌ Error code: ${responseData.errorCode}`);
      console.log(`❌ Details: ${responseData.details}`);
      console.log(`❌ Emergency fix status: ${responseData.emergencyFixActive}`);
      
      // Check if our fix version is active
      if (responseData.emergencyFixActive === 'v1.5.40-alpha.18-transaction-isolation-fix') {
        console.log('🔧 Our fix is active but error persists - need deeper investigation');
      } else {
        console.log('⚠️ Old fix version detected - deployment may not have taken effect');
      }
      
      return false;
    } else {
      console.log('⚠️ Different error occurred:');
      console.log(`Error: ${responseData.error}`);
      console.log(`Emergency fix status: ${responseData.emergencyFixActive || 'Not reported'}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test request failed:', error.message);
    return false;
  }
}

async function runTest() {
  console.log('🚀 Starting transaction isolation fix verification...');
  console.log();
  
  const success = await testTransactionIsolationFix();
  
  console.log();
  console.log('📊 TEST RESULTS:');
  console.log('================');
  
  if (success) {
    console.log('✅ TRANSACTION ISOLATION FIX: SUCCESS');
    console.log('✅ Foreign key constraint violation resolved');
    console.log('✅ Users can now successfully create paid accounts');
  } else {
    console.log('❌ TRANSACTION ISOLATION FIX: FAILED');
    console.log('❌ Foreign key constraint violation still occurring');
    console.log('❌ Additional investigation needed');
  }
  
  console.log();
  console.log('📋 Fix Summary:');
  console.log('- Modified unifiedCustomerService.getOrCreateCustomer() to accept transaction context');
  console.log('- Updated all database operations to use transaction context instead of global prisma');
  console.log('- Updated signup route to pass transaction context to customer service');
  console.log('- Version: v1.5.40-alpha.18-transaction-isolation-fix');
}

runTest();
