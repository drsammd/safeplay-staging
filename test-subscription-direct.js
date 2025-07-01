
const fetch = require('node-fetch');

async function testSubscriptionDirect() {
  console.log('🧪 TESTING: Direct subscription creation test');
  
  try {
    console.log('\n📋 TESTING: Getting subscription plans from port 3001...');
    const plansResponse = await fetch('http://localhost:3001/api/stripe/plans');
    
    console.log('📋 TESTING: Plans response status:', plansResponse.status);
    
    if (plansResponse.ok) {
      const plansData = await plansResponse.json();
      console.log('📋 TESTING: Plans available:', {
        count: plansData.plans?.length || 0,
        firstPlan: plansData.plans?.[0]?.name,
        priceId: plansData.plans?.[0]?.stripePriceId
      });
      
      if (plansData.plans?.length > 0) {
        const plan = plansData.plans[0];
        const priceId = plan.stripePriceId;
        
        console.log('\n🎯 TESTING: Testing subscription creation API directly...');
        console.log('🎯 TESTING: This should show the authentication error and our debugging logs');
        
        // Test the subscription API - this should fail with auth error but show our debugging
        const subscriptionResponse = await fetch('http://localhost:3001/api/stripe/subscription/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId: priceId,
            paymentMethodId: 'pm_test_fake'
          })
        });
        
        const subscriptionData = await subscriptionResponse.json();
        
        console.log('\n📤 TESTING: Subscription API Response:', {
          status: subscriptionResponse.status,
          error: subscriptionData.error,
          details: subscriptionData.details
        });
        
        console.log('✅ TESTING: This should show "Unauthorized" but confirm the API is accessible');
      }
    } else {
      console.log('❌ TESTING: Could not get plans');
    }
    
  } catch (error) {
    console.error('💥 TESTING: Test error:', error.message);
  }
  
  console.log('\n🔧 TESTING: Now let\'s temporarily modify the API to bypass auth for debugging...');
}

testSubscriptionDirect();
