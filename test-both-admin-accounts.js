
require('dotenv').config();

async function testAdminAccounts() {
  console.log('🧪 Testing Both Admin Accounts...\n');
  
  const accounts = [
    { email: 'john@doe.com', password: 'johndoe123', name: 'John (Modified Admin)' },
    { email: 'admin@safeplay.com', password: 'password123', name: 'Original Admin' }
  ];
  
  for (const account of accounts) {
    console.log(`\n🔍 Testing ${account.name}: ${account.email}`);
    console.log('=' * 50);
    
    try {
      // Test login
      const loginResponse = await fetch('http://localhost:3000/api/auth/signin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: account.email,
          password: account.password,
          redirect: 'false'
        })
      });
      
      console.log(`📡 Login Response Status: ${loginResponse.status}`);
      console.log(`📡 Login Response Headers:`, Object.fromEntries(loginResponse.headers));
      
      if (loginResponse.status === 200) {
        const cookies = loginResponse.headers.get('set-cookie');
        console.log(`🍪 Cookies Set: ${cookies ? 'YES' : 'NO'}`);
        
        if (cookies) {
          // Extract session token
          const sessionTokenMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
          const sessionToken = sessionTokenMatch ? sessionTokenMatch[1] : null;
          
          if (sessionToken) {
            console.log(`🔑 Session Token: ${sessionToken.substring(0, 20)}...`);
            
            // Test session endpoint
            const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
              headers: {
                'Cookie': `next-auth.session-token=${sessionToken}`
              }
            });
            
            const sessionData = await sessionResponse.json();
            console.log(`📊 Session Data:`, sessionData);
            
            if (sessionData?.user?.role) {
              console.log(`✅ SUCCESS: Role = ${sessionData.user.role}`);
              
              // Test admin dashboard access
              const adminResponse = await fetch('http://localhost:3000/admin', {
                headers: {
                  'Cookie': `next-auth.session-token=${sessionToken}`
                },
                redirect: 'manual'
              });
              
              console.log(`🏛️ Admin Dashboard Status: ${adminResponse.status}`);
              
              if (adminResponse.status === 200) {
                console.log(`🎉 ${account.name} CAN ACCESS ADMIN DASHBOARD!`);
              } else if (adminResponse.status === 307 || adminResponse.status === 302) {
                const location = adminResponse.headers.get('location');
                console.log(`🚫 ${account.name} REDIRECTED TO: ${location}`);
              } else {
                console.log(`❌ ${account.name} CANNOT ACCESS ADMIN DASHBOARD`);
              }
            } else {
              console.log(`❌ FAILED: No role in session`);
            }
          } else {
            console.log(`❌ FAILED: No session token found`);
          }
        } else {
          console.log(`❌ FAILED: No cookies set`);
        }
      } else {
        const responseText = await loginResponse.text();
        console.log(`❌ FAILED: Login failed with status ${loginResponse.status}`);
        console.log(`Response: ${responseText.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.error(`❌ ERROR testing ${account.name}:`, error.message);
    }
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('If John (Modified Admin) works but Original Admin fails = Account-specific issue');
  console.log('If both fail = Role/Auth system issue');
  console.log('If both work = Issue was elsewhere');
}

testAdminAccounts();
