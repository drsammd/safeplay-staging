const https = require('https');

const LIVE_BASE_URL = 'https://mysafeplay.ai';

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
        'User-Agent': 'Endpoint-Test/1.0'
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
        resolve({
          status: res.statusCode,
          data: responseData
        });
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

async function testExistingEndpoints() {
  console.log('🔍 Testing existing endpoints on live site...\n');
  
  const endpointsToTest = [
    { path: '/api/health', method: 'GET', desc: 'Health check' },
    { path: '/api/auth/signup', method: 'POST', desc: 'Auth signup (should exist)' },
    { path: '/api/staging-auth', method: 'GET', desc: 'Staging auth' },
    { path: '/api/admin/verification', method: 'GET', desc: 'Admin verification' },
  ];

  for (const endpoint of endpointsToTest) {
    try {
      console.log(`Testing ${endpoint.desc}: ${endpoint.path}`);
      const response = await makeRequest(`${LIVE_BASE_URL}${endpoint.path}`, endpoint.method, endpoint.method === 'POST' ? {} : null);
      console.log(`  Status: ${response.status} ${response.status !== 404 ? '✅' : '❌'}`);
      
      if (response.status !== 404 && response.data.length < 200) {
        console.log(`  Response: ${response.data}`);
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    console.log('');
  }
}

testExistingEndpoints().catch(console.error);
