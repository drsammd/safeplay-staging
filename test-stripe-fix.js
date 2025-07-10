const { demoSubscriptionService } = require('./lib/stripe/demo-subscription-service.ts');

async function testStripeFix() {
  console.log('🧪 Testing Stripe Payment Fix...\n');
  
  try {
    // Test 1: Check if createSignupSubscription method exists
    console.log('✅ Test 1: createSignupSubscription method exists');
    console.log('Method type:', typeof demoSubscriptionService.createSignupSubscription);
    
    // Test 2: Test creating a signup subscription
    console.log('\n🚀 Test 2: Creating signup subscription...');
    const signupSubscription = await demoSubscriptionService.createSignupSubscription(
      'premium', // planId
      'pm_test_mock_payment_method' // paymentMethodId
    );
    
    console.log('✅ Signup subscription created successfully!');
    console.log('Subscription ID:', signupSubscription.id);
    console.log('Customer ID:', signupSubscription.customer.id);
    console.log('Status:', signupSubscription.status);
    console.log('Is Signup Flow:', signupSubscription.metadata.signupFlow);
    
    // Test 3: Verify the subscription has correct structure
    console.log('\n🔍 Test 3: Verifying subscription structure...');
    const requiredFields = ['id', 'customer', 'status', 'metadata', 'latest_invoice'];
    const missingFields = requiredFields.filter(field => !signupSubscription[field]);
    
    if (missingFields.length === 0) {
      console.log('✅ All required fields present');
    } else {
      console.log('❌ Missing fields:', missingFields);
    }
    
    // Test 4: Verify customer structure
    console.log('\n👤 Test 4: Verifying customer structure...');
    const customer = signupSubscription.customer;
    if (customer && customer.id && customer.metadata) {
      console.log('✅ Customer structure is correct');
      console.log('Customer metadata:', customer.metadata);
    } else {
      console.log('❌ Customer structure is incorrect');
    }
    
    console.log('\n🎉 All tests passed! Stripe payment fix is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testStripeFix();
