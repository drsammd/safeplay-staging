
const https = require('https');
const http = require('http');

const LIVE_BASE_URL = 'https://mysafeplay.ai';

console.log('🚀 TESTING LIVE SITE DEMO CREDENTIALS FIX');
console.log('=' .repeat(60));

// Function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Demo-Fix-Script/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: json
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndpoint(path, method = 'GET', data = null, description = '') {
  try {
    console.log(`\n🧪 ${description || `Testing ${method} ${path}`}`);
    console.log(`   URL: ${LIVE_BASE_URL}${path}`);
    
    const response = await makeRequest(`${LIVE_BASE_URL}${path}`, method, data);
    
    console.log(`   Status: ${response.status}`);
    
    if (response.data && typeof response.data === 'object') {
      console.log(`   Success: ${response.data.success ? '✅ YES' : '❌ NO'}`);
      if (response.data.message) {
        console.log(`   Message: ${response.data.message}`);
      }
      if (response.data.summary) {
        console.log(`   Summary:`, response.data.summary);
      }
      if (response.data.error) {
        console.log(`   Error: ${response.data.error}`);
      }
    } else {
      console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return { status: 0, error: error.message };
  }
}

async function main() {
  try {
    console.log(`\nTesting against: ${LIVE_BASE_URL}`);
    console.log(`Current time: ${new Date().toISOString()}`);

    // Step 1: Check current database state
    console.log('\n📊 STEP 1: CHECKING CURRENT DATABASE STATE');
    console.log('-' .repeat(40));
    const dbState = await testEndpoint('/api/debug/users', 'GET', null, 'Checking database users');

    // Step 2: Check environment
    console.log('\n🔧 STEP 2: CHECKING ENVIRONMENT CONFIGURATION');
    console.log('-' .repeat(40));
    const envCheck = await testEndpoint('/api/debug/environment', 'GET', null, 'Checking environment config');

    // Step 3: Test authentication flow (current state)
    console.log('\n🔐 STEP 3: TESTING CURRENT AUTHENTICATION');
    console.log('-' .repeat(40));
    const authTest = await testEndpoint('/api/debug/test-auth', 'POST', {}, 'Testing current auth flow');

    // Step 4: Set up demo accounts
    console.log('\n🛠️ STEP 4: SETTING UP DEMO ACCOUNTS');
    console.log('-' .repeat(40));
    const setupDemo = await testEndpoint('/api/setup-demo', 'POST', {}, 'Creating/updating demo accounts');

    // Step 5: Test authentication after setup
    console.log('\n✅ STEP 5: TESTING AUTHENTICATION AFTER SETUP');
    console.log('-' .repeat(40));
    const authTestAfter = await testEndpoint('/api/debug/test-auth', 'POST', {}, 'Testing auth after setup');

    // Step 6: Deployment seed as backup
    console.log('\n🌱 STEP 6: RUNNING DEPLOYMENT SEED (BACKUP)');
    console.log('-' .repeat(40));
    const deploymentSeed = await testEndpoint('/api/admin/deployment-seed', 'POST', {}, 'Running deployment seed');

    // Summary
    console.log('\n📋 FINAL SUMMARY');
    console.log('=' .repeat(60));
    
    const tests = [
      { name: 'Database Check', result: dbState },
      { name: 'Environment Check', result: envCheck },
      { name: 'Auth Test (Before)', result: authTest },
      { name: 'Demo Setup', result: setupDemo },
      { name: 'Auth Test (After)', result: authTestAfter },
      { name: 'Deployment Seed', result: deploymentSeed }
    ];

    tests.forEach(test => {
      const status = test.result.status === 200 && test.result.data?.success ? '✅' : '❌';
      console.log(`${status} ${test.name}: HTTP ${test.result.status}`);
    });

    console.log('\n🎯 DEMO CREDENTIALS TO TEST:');
    console.log('=' .repeat(60));
    console.log('Company Admin: admin@mysafeplay.ai / password123');
    console.log('Venue Admin: venue@mysafeplay.ai / password123');
    console.log('Parent: parent@mysafeplay.ai / password123');
    console.log('Demo Parent: john@mysafeplay.ai / johndoe123');
    console.log('');
    console.log('🌐 Test at: https://mysafeplay.ai');
    console.log('🔑 Stakeholder password: SafePlay2025Beta!');

    // Check if demo setup was successful
    const setupSuccess = setupDemo.status === 200 && setupDemo.data?.success;
    const authSuccess = authTestAfter.status === 200 && authTestAfter.data?.success;
    
    if (setupSuccess && authSuccess) {
      console.log('\n🎉 SUCCESS: Demo credentials should now work!');
    } else {
      console.log('\n⚠️ WARNING: Demo setup may have issues. Check the results above.');
    }

  } catch (error) {
    console.error('\n❌ SCRIPT FAILED:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
