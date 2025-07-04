
const http = require('http');
const https = require('https');
const { parse } = require('url');

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function parseCookies(cookies) {
  const cookieObj = {};
  cookies.forEach(cookie => {
    const [nameValue] = cookie.split(';')[0].split('=');
    if (nameValue) {
      const [name, ...valueParts] = nameValue.split('=');
      cookieObj[name] = valueParts.join('=');
    }
  });
  return cookieObj;
}

async function testCompleteFlow() {
  const baseUrl = 'http://localhost:3000';
  let allCookies = {};

  try {
    console.log('🧪 Testing complete admin login flow...');
    
    // Step 1: Get CSRF token
    console.log('📝 Step 1: Getting CSRF token...');
    const csrfResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/csrf',
      method: 'GET'
    });
    
    const csrfData = JSON.parse(csrfResponse.data);
    console.log('✓ CSRF Token received:', csrfData.csrfToken?.substring(0, 20) + '...');
    
    // Update cookies
    Object.assign(allCookies, parseCookies(csrfResponse.cookies));
    
    // Step 2: Login attempt
    console.log('📝 Step 2: Attempting admin login...');
    const loginData = new URLSearchParams({
      email: 'admin@mysafeplay.ai',
      password: 'password123',
      csrfToken: csrfData.csrfToken,
      callbackUrl: baseUrl + '/admin',
      json: 'true'
    }).toString();
    
    const cookieString = Object.entries(allCookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/signin/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieString
      }
    }, loginData);
    
    console.log('✓ Login response status:', loginResponse.statusCode);
    console.log('✓ Login response location:', loginResponse.headers.location);
    
    // Update cookies with session token
    Object.assign(allCookies, parseCookies(loginResponse.cookies));
    
    // Step 3: Get session to verify login
    console.log('📝 Step 3: Checking session...');
    const sessionCookieString = Object.entries(allCookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    
    const sessionResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/session',
      method: 'GET',
      headers: {
        'Cookie': sessionCookieString
      }
    });
    
    console.log('✓ Session response status:', sessionResponse.statusCode);
    if (sessionResponse.data) {
      const sessionData = JSON.parse(sessionResponse.data);
      console.log('✓ Session user:', sessionData.user?.email);
      console.log('✓ Session role:', sessionData.user?.role);
    }
    
    // Step 4: Try to access admin route
    console.log('📝 Step 4: Testing admin route access...');
    const adminResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin',
      method: 'GET',
      headers: {
        'Cookie': sessionCookieString
      }
    });
    
    console.log('✓ Admin route status:', adminResponse.statusCode);
    console.log('✓ Admin route location:', adminResponse.headers.location);
    
    if (adminResponse.statusCode === 200) {
      console.log('🎉 SUCCESS: Admin can access admin route!');
    } else if (adminResponse.headers.location?.includes('unauthorized')) {
      console.log('❌ FAILURE: Admin redirected to unauthorized page');
    } else if (adminResponse.headers.location?.includes('signin')) {
      console.log('❌ FAILURE: Admin redirected to signin (not authenticated)');
    } else {
      console.log('❓ UNKNOWN: Unexpected response', adminResponse.headers.location);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteFlow();
