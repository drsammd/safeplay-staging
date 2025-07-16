
// Test script for Stripe Product Management functionality
// Run with: node test-stripe-product-management.js

const { spawn } = require('child_process');

async function testStripeProductManagement() {
  console.log('🧪 Testing Stripe Product Management Functionality...\n');

  const tests = [
    {
      name: 'Test Admin Authentication',
      url: 'http://localhost:3000/api/auth/user',
      method: 'GET'
    },
    {
      name: 'List Existing Stripe Products',
      url: 'http://localhost:3000/api/admin/stripe/products/list',
      method: 'GET'
    },
    {
      name: 'Test Enhanced Subscription Service',
      url: 'http://localhost:3000/api/stripe/plans',
      method: 'GET'
    }
  ];

  console.log('📋 Test Plan:');
  tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}`);
  });
  console.log('\n🚀 Starting tests...\n');

  for (const [index, test] of tests.entries()) {
    console.log(`\n--- Test ${index + 1}: ${test.name} ---`);
    
    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log(`✅ Status: ${response.status}`);
      
      if (response.ok) {
        if (typeof data === 'object') {
          console.log(`📊 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
        } else {
          console.log(`📊 Response: ${String(data).substring(0, 200)}...`);
        }
      } else {
        console.log(`❌ Error Response: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }

  console.log('\n🎯 Manual Testing Instructions:');
  console.log('1. Start the dev server: npm run dev or yarn dev');
  console.log('2. Sign in as admin: john@doe.com / johndoe123');
  console.log('3. Navigate to: http://localhost:3000/admin/stripe-products');
  console.log('4. Click "Create New Structure" to create Sam\'s pricing');
  console.log('5. Copy the generated environment variables');
  console.log('6. Update .env file with new price IDs');
  console.log('7. Test subscription creation with new prices');

  console.log('\n✅ Test script completed!');
}

// Start dev server and run tests
async function startDevServerAndTest() {
  console.log('🚀 Starting development server...\n');
  
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true
  });

  let serverReady = false;
  
  devServer.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    if (output.includes('Local:') || output.includes('localhost:3000')) {
      if (!serverReady) {
        serverReady = true;
        console.log('✅ Server is ready! Waiting 3 seconds before testing...\n');
        
        setTimeout(() => {
          testStripeProductManagement().catch(console.error);
        }, 3000);
      }
    }
  });

  devServer.stderr.on('data', (data) => {
    console.error(`Server error: ${data}`);
  });

  // Keep the server running
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down dev server...');
    devServer.kill();
    process.exit(0);
  });
}

// Check if we can connect to a running server first
fetch('http://localhost:3000/api/health')
  .then(response => {
    if (response.ok) {
      console.log('✅ Server already running, starting tests...\n');
      testStripeProductManagement().catch(console.error);
    } else {
      throw new Error('Server not responsive');
    }
  })
  .catch(() => {
    console.log('📡 No server detected, starting dev server...\n');
    startDevServerAndTest();
  });
