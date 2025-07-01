
require('dotenv').config();

async function testAdminLogin() {
  console.log('🔐 Testing Admin Login Flow...');
  
  const baseURL = 'http://localhost:3001';
  
  try {
    // Step 1: Get CSRF token
    console.log('1️⃣ Getting CSRF token...');
    const csrfResponse = await fetch(`${baseURL}/api/auth/csrf`);
    const { csrfToken } = await csrfResponse.json();
    console.log('✅ CSRF token obtained:', csrfToken.substring(0, 20) + '...');
    
    // Step 2: Attempt signin with proper form data
    console.log('2️⃣ Attempting admin signin...');
    const signinResponse = await fetch(`${baseURL}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': baseURL,
        'Referer': `${baseURL}/auth/signin`
      },
      body: new URLSearchParams({
        email: 'admin@safeplay.com',
        password: 'password123',
        csrfToken: csrfToken,
        callbackUrl: `${baseURL}/admin`,
        json: 'true'
      }).toString()
    });
    
    console.log('📊 Signin response:', {
      status: signinResponse.status,
      statusText: signinResponse.statusText,
      headers: Object.fromEntries(signinResponse.headers.entries())
    });
    
    const signinResult = await signinResponse.text();
    console.log('📝 Signin result:', signinResult);
    
    // Step 3: Check if we got a successful response
    let parsedResult;
    try {
      parsedResult = JSON.parse(signinResult);
    } catch {
      parsedResult = { raw: signinResult };
    }
    
    if (parsedResult.url && !parsedResult.url.includes('csrf=true')) {
      console.log('✅ Authentication appears successful!');
      
      // Step 4: Try to access admin route
      console.log('3️⃣ Testing admin route access...');
      const adminResponse = await fetch(`${baseURL}/admin`, {
        headers: {
          'Cookie': signinResponse.headers.get('set-cookie') || ''
        }
      });
      
      console.log('🏛️ Admin route response:', {
        status: adminResponse.status,
        redirect: adminResponse.url
      });
      
      if (adminResponse.status === 200) {
        console.log('🎉 SUCCESS: Admin can access admin dashboard!');
      } else {
        console.log('❌ FAILED: Admin still cannot access admin dashboard');
      }
      
    } else {
      console.log('❌ Authentication failed - CSRF or other error');
      if (parsedResult.url && parsedResult.url.includes('csrf=true')) {
        console.log('🔍 CSRF validation is still failing');
      }
    }
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
  }
}

testAdminLogin();
