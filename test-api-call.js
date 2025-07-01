
const fetch = require('node-fetch');

async function testSubscriptionModifyAPI() {
  try {
    console.log('🔍 Testing subscription modify API endpoint...');
    
    // Test plan IDs
    const testPlanIds = [
      'cmci6xte60003pkkm8hsg6bkt', // Lifetime Plan
      'cmci6xte10001pkkmt9im5ros', // Premium Plan
      'cmci6xte30002pkkmv94lxxgu', // Family Plan
      'cmci6xtdv0000pkkmrfyiqowp'  // Basic Plan
    ];
    
    for (const planId of testPlanIds) {
      console.log(`\n🧪 Testing API call with plan ID: ${planId}`);
      
      try {
        const response = await fetch('http://localhost:3000/api/stripe/subscription/modify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planId }),
        });
        
        const data = await response.json();
        
        console.log(`📡 Response status: ${response.status}`);
        console.log(`📊 Response data:`, data);
        
        if (!response.ok) {
          console.log(`❌ API call failed for plan ID: ${planId}`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Error: ${data.error || 'Unknown error'}`);
        } else {
          console.log(`✅ API call successful for plan ID: ${planId}`);
        }
        
      } catch (error) {
        console.error(`💥 Network error for plan ID ${planId}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testSubscriptionModifyAPI();
