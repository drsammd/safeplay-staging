const https = require('https');

const LIVE_BASE_URL = 'https://mysafeplay.ai';

const DEMO_ACCOUNTS = [
  {
    email: 'admin@mysafeplay.ai',
    password: 'password123',
    name: 'Sarah Mitchell',
    role: 'COMPANY_ADMIN',
    phone: '+1 (555) 001-0001',
  },
  {
    email: 'venue@mysafeplay.ai',
    password: 'password123',
    name: 'John Smith',
    role: 'VENUE_ADMIN', 
    phone: '+1 (555) 002-0001',
  },
  {
    email: 'parent@mysafeplay.ai',
    password: 'password123',
    name: 'Emily Johnson',
    role: 'PARENT',
    phone: '+1 (555) 003-0001',
  },
  {
    email: 'john@mysafeplay.ai',
    password: 'johndoe123',
    name: 'John Doe', 
    role: 'PARENT',
    phone: '+1 (555) 001-0002',
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
  console.log('🚀 Creating demo accounts using signup endpoint...\n');
  
  for (const account of DEMO_ACCOUNTS) {
    try {
      console.log(`Creating account: ${account.email} (${account.role})`);
      
      const response = await makeRequest(`${LIVE_BASE_URL}/api/auth/signup`, 'POST', {
        email: account.email,
        password: account.password,
        name: account.name,
        phone: account.phone,
        role: account.role
      });
      
      console.log(`  Status: ${response.status}`);
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success) {
          console.log(`  ✅ SUCCESS: Account created`);
        } else if (response.data.error) {
          console.log(`  ⚠️  ERROR: ${response.data.error}`);
        } else {
          console.log(`  📝 Response:`, response.data);
        }
      } else {
        console.log(`  📝 Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`  ❌ Request failed: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🎯 Demo account creation completed!');
  console.log('');
  console.log('Test these credentials at: https://mysafeplay.ai');
  console.log('Stakeholder password: SafePlay2025Beta!');
  console.log('');
  DEMO_ACCOUNTS.forEach(account => {
    console.log(`${account.role}: ${account.email} / ${account.password}`);
  });
}

createDemoAccounts().catch(console.error);
