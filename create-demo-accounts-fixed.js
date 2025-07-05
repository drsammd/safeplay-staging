const https = require('https');

const LIVE_BASE_URL = 'https://mysafeplay.ai';

const DEMO_ACCOUNTS = [
  {
    email: 'admin@mysafeplay.ai',
    password: 'password123',
    name: 'Sarah Mitchell',
    role: 'COMPANY_ADMIN',
    agreeToTerms: true,
    agreeToPrivacy: true
  },
  {
    email: 'venue@mysafeplay.ai',
    password: 'password123',
    name: 'John Smith',
    role: 'VENUE_ADMIN',
    agreeToTerms: true,
    agreeToPrivacy: true
  },
  {
    email: 'parent@mysafeplay.ai',
    password: 'password123',
    name: 'Emily Johnson',
    role: 'PARENT',
    agreeToTerms: true,
    agreeToPrivacy: true
  },
  {
    email: 'john@mysafeplay.ai',
    password: 'johndoe123',
    name: 'John Doe', 
    role: 'PARENT',
    agreeToTerms: true,
    agreeToPrivacy: true
  },
];

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Demo-Account-Creator/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: json
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            parseError: true
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

async function createDemoAccounts() {
  console.log('🚀 Creating demo accounts with proper validation...\n');
  
  let successCount = 0;
  let existingCount = 0;
  let errorCount = 0;
  
  for (const account of DEMO_ACCOUNTS) {
    try {
      console.log(`Creating account: ${account.email} (${account.role})`);
      
      const response = await makeRequest(`${LIVE_BASE_URL}/api/auth/signup`, 'POST', account);
      
      console.log(`  Status: ${response.status}`);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`  ✅ SUCCESS: Account created successfully`);
        successCount++;
      } else if (response.status === 409) {
        console.log(`  ℹ️  ALREADY EXISTS: Account already exists`);
        existingCount++;
      } else if (response.data && typeof response.data === 'object') {
        if (response.data.error) {
          console.log(`  ❌ ERROR: ${response.data.error}`);
        } else {
          console.log(`  📝 Response:`, JSON.stringify(response.data, null, 2));
        }
        errorCount++;
      } else {
        console.log(`  📝 Raw response: ${JSON.stringify(response.data).substring(0, 200)}...`);
        errorCount++;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`  ❌ Request failed: ${error.message}`);
      errorCount++;
    }
    console.log('');
  }
  
  console.log('📊 SUMMARY:');
  console.log(`✅ Created: ${successCount}`);
  console.log(`ℹ️  Already existed: ${existingCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('');
  
  if (successCount > 0 || existingCount > 0) {
    console.log('🎉 Demo accounts are ready! Test at: https://mysafeplay.ai');
    console.log('🔑 Stakeholder password: SafePlay2025Beta!');
    console.log('');
    console.log('DEMO CREDENTIALS:');
    DEMO_ACCOUNTS.forEach(account => {
      console.log(`  ${account.role}: ${account.email} / ${account.password}`);
    });
  } else {
    console.log('⚠️  No accounts were created successfully. Check the errors above.');
  }
}

createDemoAccounts().catch(console.error);
