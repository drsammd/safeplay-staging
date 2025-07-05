const https = require('https');

const LIVE_BASE_URL = 'https://mysafeplay.ai';

const TEST_CREDENTIALS = [
  { email: 'admin@mysafeplay.ai', password: 'password123' },
  { email: 'venue@mysafeplay.ai', password: 'password123' },
  { email: 'parent@mysafeplay.ai', password: 'password123' },
  { email: 'john@mysafeplay.ai', password: 'johndoe123' },
  // Test case variations
  { email: 'ADMIN@MYSAFEPLAY.AI', password: 'password123' },
  { email: 'Admin@MySafePlay.ai', password: 'password123' },
];

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Login-Test/1.0',
        ...headers
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
            headers: res.headers,
            data: json
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
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

async function testDirectLogin() {
  console.log('🔐 Testing direct login functionality...\n');
  
  // First, let's try to authenticate with NextAuth API
  for (const cred of TEST_CREDENTIALS) {
    try {
      console.log(`Testing login: ${cred.email}`);
      
      // Try the NextAuth credentials endpoint
      const response = await makeRequest(`${LIVE_BASE_URL}/api/auth/callback/credentials`, 'POST', {
        email: cred.email,
        password: cred.password,
        redirect: false,
        json: true
      });
      
      console.log(`  Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`  ✅ SUCCESS: Login appears to work`);
      } else if (response.status === 401) {
        console.log(`  ❌ UNAUTHORIZED: Invalid credentials`);
      } else if (response.status === 302) {
        console.log(`  🔄 REDIRECT: Login may have worked (redirect response)`);
      } else {
        console.log(`  📝 Response type: ${typeof response.data}`);
        if (typeof response.data === 'string' && response.data.length < 200) {
          console.log(`  📝 Response: ${response.data}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`  ❌ Request failed: ${error.message}`);
    }
    console.log('');
  }
}

// Also test the health endpoint to ensure the API is working
async function testHealthAndBasicEndpoints() {
  console.log('🏥 Testing basic API health...\n');
  
  const endpoints = [
    { path: '/api/health', desc: 'Health check' },
    { path: '/api/auth/csrf', desc: 'CSRF token' },
    { path: '/api/auth/session', desc: 'Session check' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.desc}: ${endpoint.path}`);
      const response = await makeRequest(`${LIVE_BASE_URL}${endpoint.path}`, 'GET');
      console.log(`  Status: ${response.status} ${response.status < 400 ? '✅' : '❌'}`);
      
      if (response.data && typeof response.data === 'object' && Object.keys(response.data).length < 10) {
        console.log(`  Data:`, response.data);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

async function main() {
  console.log('🚀 COMPREHENSIVE LOGIN TESTING');
  console.log('=' .repeat(50));
  
  await testHealthAndBasicEndpoints();
  await testDirectLogin();
  
  console.log('📝 RECOMMENDATIONS:');
  console.log('1. If health endpoints work but login fails, accounts may not exist');
  console.log('2. Try manually creating one account through the website signup form');
  console.log('3. Check Vercel logs for detailed error messages');
  console.log('4. Consider running a database seed script through Vercel admin panel');
  console.log('');
  console.log('🌐 Test manually at: https://mysafeplay.ai');
  console.log('🔑 Stakeholder password: SafePlay2025Beta!');
}

main().catch(console.error);
