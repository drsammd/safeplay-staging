
const fetch = require('node-fetch');
const { exec } = require('child_process');

// Test script to identify the "User not found" error in payment processing
async function testPaymentAPIs() {
  console.log('🔍 Testing Payment API Endpoints for "User not found" error...\n');

  // Test 1: Demo subscription endpoint (should work for signup flow)
  console.log('1️⃣ Testing /api/stripe/subscription-demo with signup flow...');
  try {
    const response = await fetch('http://localhost:3000/api/stripe/subscription-demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: 'basic',
        paymentMethodId: 'pm_test_demo',
        isSignupFlow: true
      })
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
    
    if (!response.ok) {
      console.log('❌ Demo endpoint failed:', data.error);
    } else {
      console.log('✅ Demo endpoint succeeded');
    }
  } catch (error) {
    console.log('❌ Demo endpoint error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Regular subscription endpoint (should fail without auth)
  console.log('2️⃣ Testing /api/stripe/subscription/create without auth...');
  try {
    const response = await fetch('http://localhost:3000/api/stripe/subscription/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: 'demo_price_basic_monthly',
        paymentMethodId: 'pm_test_demo'
      })
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
    
    if (!response.ok) {
      console.log('❌ Regular endpoint failed (expected):', data.error);
    } else {
      console.log('✅ Regular endpoint succeeded (unexpected)');
    }
  } catch (error) {
    console.log('❌ Regular endpoint error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Check which endpoint throws "User not found"
  console.log('3️⃣ Checking for "User not found" in server logs...');
  exec('grep -n "User not found" /home/ubuntu/safeplay-staging/dev-server.log | tail -5', (error, stdout, stderr) => {
    if (stdout) {
      console.log('Recent "User not found" errors in logs:');
      console.log(stdout);
    } else {
      console.log('No recent "User not found" errors found in logs');
    }
  });
}

// Run the test
testPaymentAPIs().catch(console.error);
