
require('dotenv').config();

async function testLogin() {
  console.log('🧪 Testing Login with Enhanced Debugging...\n');
  
  try {
    // First, test the session endpoint to ensure API is working
    console.log('1️⃣ Testing session endpoint...');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    console.log(`Session endpoint status: ${sessionResponse.status}`);
    
    // Test CSRF token endpoint
    console.log('\n2️⃣ Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('CSRF data:', csrfData);
    
    if (!csrfData.csrfToken) {
      console.log('❌ No CSRF token received');
      return;
    }
    
    // Test login with john@doe.com (modified admin)
    console.log('\n3️⃣ Testing login with john@doe.com...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'john@doe.com',
        password: 'johndoe123',
        csrfToken: csrfData.csrfToken,
        callbackUrl: 'http://localhost:3000/admin',
        json: 'true'
      }),
      redirect: 'manual'
    });
    
    console.log(`Login response status: ${loginResponse.status}`);
    console.log('Login response headers:', Object.fromEntries(loginResponse.headers));
    
    // Log response body to see what NextAuth returns
    const responseText = await loginResponse.text();
    console.log('Login response body:', responseText.substring(0, 500));
    
    const cookies = loginResponse.headers.get('set-cookie');
    if (cookies) {
      console.log('✅ Cookies received:', cookies);
      
      // Extract session token and test session
      const sessionTokenMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
      if (sessionTokenMatch) {
        const sessionToken = sessionTokenMatch[1];
        
        console.log('\n4️⃣ Testing session with token...');
        const sessionWithTokenResponse = await fetch('http://localhost:3000/api/auth/session', {
          headers: {
            'Cookie': `next-auth.session-token=${sessionToken}`
          }
        });
        
        const sessionData = await sessionWithTokenResponse.json();
        console.log('Session data:', sessionData);
        
        if (sessionData?.user?.role) {
          console.log(`✅ SUCCESS: User role = ${sessionData.user.role}`);
          
          // Test admin access
          console.log('\n5️⃣ Testing admin dashboard access...');
          const adminResponse = await fetch('http://localhost:3000/admin', {
            headers: {
              'Cookie': `next-auth.session-token=${sessionToken}`
            },
            redirect: 'manual'
          });
          
          console.log(`Admin dashboard response: ${adminResponse.status}`);
          if (adminResponse.status === 302 || adminResponse.status === 307) {
            console.log(`Redirect location: ${adminResponse.headers.get('location')}`);
          }
        }
      }
    } else {
      console.log('❌ No cookies in response');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testLogin();
