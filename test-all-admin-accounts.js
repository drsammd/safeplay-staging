
require('dotenv').config();

const testAccounts = [
  { name: 'New Test Admin', email: 'test@admin.com', password: 'test123' },
  { name: 'New Admin2', email: 'admin2@safeplay.com', password: 'admin123' },
  { name: 'Modified John', email: 'john@doe.com', password: 'johndoe123' },
  { name: 'Original Admin', email: 'admin@safeplay.com', password: 'password123' }
];

async function testAllAdminAccounts() {
  console.log('🧪 Testing All Admin Accounts with Proper Form Submission...\n');
  
  for (const account of testAccounts) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Testing: ${account.name} (${account.email})`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      // Step 1: Get a fresh CSRF token
      const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
      const csrfData = await csrfResponse.json();
      
      if (!csrfData.csrfToken) {
        console.log('❌ Failed to get CSRF token');
        continue;
      }
      
      console.log(`🔑 CSRF Token: ${csrfData.csrfToken.substring(0, 20)}...`);
      
      // Step 2: Submit login form exactly like browser would
      const formData = new URLSearchParams({
        email: account.email,
        password: account.password,
        csrfToken: csrfData.csrfToken,
        callbackUrl: 'http://localhost:3000/admin',
        json: 'true'
      });
      
      console.log('📤 Submitting login form...');
      const loginResponse = await fetch('http://localhost:3000/api/auth/signin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData,
        redirect: 'manual'
      });
      
      console.log(`📡 Response Status: ${loginResponse.status}`);
      
      const responseText = await loginResponse.text();
      console.log(`📄 Response Body: ${responseText}`);
      
      const cookies = loginResponse.headers.get('set-cookie');
      console.log(`🍪 Cookies: ${cookies ? 'YES' : 'NO'}`);
      
      if (cookies) {
        console.log(`🍪 Cookie Details: ${cookies.substring(0, 200)}...`);
        
        // Check if we got a session token
        const hasSessionToken = cookies.includes('next-auth.session-token');
        console.log(`🎫 Session Token: ${hasSessionToken ? 'YES' : 'NO'}`);
        
        if (hasSessionToken) {
          console.log(`✅ SUCCESS: ${account.name} LOGIN WORKED!`);
          
          // Extract session token and test admin access
          const sessionTokenMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
          if (sessionTokenMatch) {
            const sessionToken = sessionTokenMatch[1];
            
            // Test admin dashboard access
            console.log('🏛️ Testing admin dashboard access...');
            const adminResponse = await fetch('http://localhost:3000/admin', {
              headers: {
                'Cookie': `next-auth.session-token=${sessionToken}`
              },
              redirect: 'manual'
            });
            
            console.log(`🏛️ Admin Dashboard Status: ${adminResponse.status}`);
            
            if (adminResponse.status === 200) {
              console.log(`🎉 ${account.name} CAN ACCESS ADMIN DASHBOARD!`);
              return { success: true, account: account };
            } else if (adminResponse.status === 302 || adminResponse.status === 307) {
              const location = adminResponse.headers.get('location');
              console.log(`🚫 Redirected to: ${location}`);
              
              if (location && !location.includes('/unauthorized')) {
                console.log(`✅ ${account.name} REDIRECT LOOKS GOOD!`);
                return { success: true, account: account };
              }
            }
          }
        } else {
          console.log(`❌ FAILED: No session token for ${account.name}`);
        }
      } else {
        console.log(`❌ FAILED: No cookies for ${account.name}`);
      }
      
    } catch (error) {
      console.error(`❌ ERROR testing ${account.name}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 SUMMARY: All accounts failed to login properly');
  console.log('This suggests a fundamental NextAuth configuration issue');
  console.log('='.repeat(60));
  
  return { success: false };
}

testAllAdminAccounts().then(result => {
  if (result.success) {
    console.log(`\n🎉 WORKING ADMIN ACCOUNT FOUND: ${result.account.email}`);
  } else {
    console.log('\n🔧 Need to investigate NextAuth configuration');
  }
});
