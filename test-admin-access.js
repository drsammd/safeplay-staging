
const fetch = require('node-fetch');

async function testAdminLogin() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    console.log('🧪 Testing admin login flow...');
    
    // Step 1: Get CSRF token
    console.log('📝 Step 1: Getting CSRF token...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log('CSRF Token:', csrfData.csrfToken);
    
    // Step 2: Login as admin
    console.log('📝 Step 2: Attempting admin login...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `next-auth.csrf-token=${csrfData.csrfToken}`
      },
      body: new URLSearchParams({
        email: 'admin@mysafeplay.ai',
        password: 'password123',
        csrfToken: csrfData.csrfToken,
        callbackUrl: `${baseUrl}/admin`,
        json: 'true'
      }),
      redirect: 'manual'
    });
    
    console.log('Login Response Status:', loginResponse.status);
    console.log('Login Response Headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Set Cookies:', cookies);
    
    // Step 3: Try to access admin route with session
    if (cookies) {
      console.log('📝 Step 3: Testing admin route access...');
      const adminResponse = await fetch(`${baseUrl}/admin`, {
        headers: {
          'Cookie': cookies
        },
        redirect: 'manual'
      });
      
      console.log('Admin Route Status:', adminResponse.status);
      console.log('Admin Route Location:', adminResponse.headers.get('location'));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminLogin();
