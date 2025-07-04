const http = require('http');
const { URL, URLSearchParams } = require('url');

const PORT = 3000;
const cookieJar = [];

function extractCookies(response) {
  const cookies = response.headers['set-cookie'];
  if (cookies) {
    cookies.forEach(cookie => {
      cookieJar.push(cookie.split(';')[0]);
    });
  }
}

function getCookieHeader() {
  return cookieJar.join('; ');
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Cookie': getCookieHeader(),
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      extractCookies(res);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testFixedAuth() {
  try {
    console.log('=== Testing FIXED Authentication ===\n');

    // Step 1: Get CSRF token
    console.log('1. Getting CSRF token...');
    const csrfResponse = await makeRequest(`http://localhost:${PORT}/api/auth/csrf`);
    const csrfData = JSON.parse(csrfResponse.data);
    const csrfToken = csrfData.csrfToken;
    console.log('CSRF token obtained:', csrfToken ? 'Yes' : 'No');

    // Step 2: Login
    console.log('\n2. Logging in...');
    const loginData = new URLSearchParams({
      email: 'venue@mysafeplay.ai',
      password: 'password123',
      csrfToken: csrfToken,
      callbackUrl: `http://localhost:${PORT}/venue-admin/floor-plans`,
      json: 'true'
    });

    const loginResponse = await makeRequest(`http://localhost:${PORT}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: loginData.toString()
    });

    console.log('Login status:', loginResponse.status);
    console.log('Login successful:', loginResponse.data.includes('"url"') ? 'Yes' : 'No');

    // Step 3: Check session with user ID
    console.log('\n3. Checking session...');
    const sessionResponse = await makeRequest(`http://localhost:${PORT}/api/auth/session`);
    const sessionData = JSON.parse(sessionResponse.data);
    console.log('Session user ID:', sessionData.user?.id);
    console.log('Session user role:', sessionData.user?.role);
    console.log('Session user email:', sessionData.user?.email);

    // Step 4: Test floor plans API (the critical test!)
    console.log('\n4. Testing floor plans API...');
    const venueId = 'cmcfkccg8000dploh9yjk1u9z'; // Adventure Playground
    const floorPlansResponse = await makeRequest(`http://localhost:${PORT}/api/floor-plans?venueId=${venueId}`);
    console.log('Floor plans API status:', floorPlansResponse.status);
    
    if (floorPlansResponse.status === 200) {
      const floorPlansData = JSON.parse(floorPlansResponse.data);
      console.log('✅ SUCCESS! Floor plans retrieved:', floorPlansData.length, 'plans');
      console.log('Floor plan names:', floorPlansData.map(fp => fp.name));
    } else {
      console.log('❌ FAILED! Response:', floorPlansResponse.data);
    }

    // Step 5: Test page access
    console.log('\n5. Testing page access...');
    const pageResponse = await makeRequest(`http://localhost:${PORT}/venue-admin/floor-plans`);
    console.log('Page status:', pageResponse.status);
    console.log('Page access:', pageResponse.status === 200 ? '✅ SUCCESS' : '❌ FAILED');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFixedAuth();
