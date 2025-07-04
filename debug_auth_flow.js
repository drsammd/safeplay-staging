const https = require('https');
const http = require('http');
const { URL, URLSearchParams } = require('url');

// Create an agent that keeps cookies
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

async function testLoginFlow() {
  try {
    console.log('=== Testing SafePlay Login Flow ===\n');

    // Step 1: Get the login page to establish session
    console.log('1. Getting login page...');
    const loginPageResponse = await makeRequest('http://localhost:3000/auth/signin');
    console.log('Login page status:', loginPageResponse.status);
    console.log('Cookies after login page:', cookieJar);

    // Step 2: Get CSRF token from NextAuth
    console.log('\n2. Getting CSRF token...');
    const csrfResponse = await makeRequest('http://localhost:3000/api/auth/csrf');
    console.log('CSRF response status:', csrfResponse.status);
    let csrfToken = '';
    try {
      const csrfData = JSON.parse(csrfResponse.data);
      csrfToken = csrfData.csrfToken;
      console.log('CSRF token obtained:', csrfToken ? 'Yes' : 'No');
    } catch (e) {
      console.log('Failed to parse CSRF response:', csrfResponse.data);
    }

    // Step 3: Attempt login
    console.log('\n3. Attempting login...');
    const loginData = new URLSearchParams({
      email: 'venue@mysafeplay.ai',
      password: 'password123',
      csrfToken: csrfToken,
      callbackUrl: 'http://localhost:3000/venue-admin/floor-plans',
      json: 'true'
    });

    const loginResponse = await makeRequest('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: loginData.toString()
    });

    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', loginResponse.data.substring(0, 200) + '...');
    console.log('Cookies after login:', cookieJar);

    // Step 4: Test session
    console.log('\n4. Testing session...');
    const sessionResponse = await makeRequest('http://localhost:3000/api/auth/session');
    console.log('Session status:', sessionResponse.status);
    console.log('Session data:', sessionResponse.data);

    // Step 5: Test floor plans API
    console.log('\n5. Testing floor plans API...');
    const venueId = 'cmcfkccg8000dploh9yjk1u9z'; // Adventure Playground from DB
    const floorPlansResponse = await makeRequest(`http://localhost:3000/api/floor-plans?venueId=${venueId}`);
    console.log('Floor plans API status:', floorPlansResponse.status);
    console.log('Floor plans response:', floorPlansResponse.data);

    // Step 6: Test direct page access
    console.log('\n6. Testing direct page access...');
    const pageResponse = await makeRequest('http://localhost:3000/venue-admin/floor-plans');
    console.log('Page access status:', pageResponse.status);
    console.log('Is redirect?', pageResponse.headers.location ? 'Yes -> ' + pageResponse.headers.location : 'No');

  } catch (error) {
    console.error('Error in test flow:', error.message);
  }
}

testLoginFlow();
