
require('dotenv').config();

async function testNextAuthFlow() {
  console.log('🧪 Testing NextAuth Flow...');
  
  // Test 1: Check NextAuth API endpoints
  try {
    const response = await fetch('http://localhost:3000/api/auth/providers');
    const providers = await response.json();
    console.log('✅ NextAuth providers endpoint working:', Object.keys(providers));
  } catch (error) {
    console.log('❌ NextAuth providers endpoint failed:', error.message);
  }
  
  // Test 2: Check session endpoint
  try {
    const response = await fetch('http://localhost:3000/api/auth/session');
    const session = await response.json();
    console.log('✅ NextAuth session endpoint working:', session);
  } catch (error) {
    console.log('❌ NextAuth session endpoint failed:', error.message);
  }
  
  // Test 3: Check CSRF endpoint
  try {
    const response = await fetch('http://localhost:3000/api/auth/csrf');
    const csrf = await response.json();
    console.log('✅ NextAuth CSRF endpoint working:', !!csrf.csrfToken);
  } catch (error) {
    console.log('❌ NextAuth CSRF endpoint failed:', error.message);
  }
  
  // Test 4: Manual signin simulation
  try {
    // Get CSRF token first
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();
    
    // Attempt signin
    const signinResponse = await fetch('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@safeplay.com',
        password: 'password123',
        csrfToken: csrfToken,
        callbackUrl: 'http://localhost:3000/admin',
        json: 'true'
      }).toString()
    });
    
    console.log('🔐 Signin attempt response:', {
      status: signinResponse.status,
      statusText: signinResponse.statusText,
      headers: Object.fromEntries(signinResponse.headers.entries())
    });
    
    const signinData = await signinResponse.text();
    console.log('🔐 Signin response body:', signinData.substring(0, 200));
    
  } catch (error) {
    console.log('❌ Manual signin failed:', error.message);
  }
}

testNextAuthFlow();
