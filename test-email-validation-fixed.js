const fetch = require('node-fetch');

async function testEmailValidation() {
    console.log('🔍 Testing Email Validation API...\n');
    
    // Test 1: Check existing email
    try {
        console.log('Test 1: Checking existing email (admin@mysafeplay.ai)...');
        const response1 = await fetch('http://localhost:3000/api/auth/check-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: 'admin@mysafeplay.ai' })
        });
        
        const data1 = await response1.json();
        console.log('Response:', data1);
        
        if (data1.data && data1.data.exists === true) {
            console.log('✅ Test 1 PASSED: Existing email correctly detected\n');
        } else {
            console.log('❌ Test 1 FAILED: Existing email not detected\n');
        }
    } catch (error) {
        console.log('❌ Test 1 ERROR:', error.message, '\n');
    }
    
    // Test 2: Check non-existing email
    try {
        console.log('Test 2: Checking non-existing email (newuser@example.com)...');
        const response2 = await fetch('http://localhost:3000/api/auth/check-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: 'newuser@example.com' })
        });
        
        const data2 = await response2.json();
        console.log('Response:', data2);
        
        if (data2.data && data2.data.exists === false) {
            console.log('✅ Test 2 PASSED: Non-existing email correctly detected\n');
        } else {
            console.log('❌ Test 2 FAILED: Non-existing email not detected correctly\n');
        }
    } catch (error) {
        console.log('❌ Test 2 ERROR:', error.message, '\n');
    }
    
    // Test 3: Test invalid email
    try {
        console.log('Test 3: Testing invalid email format...');
        const response3 = await fetch('http://localhost:3000/api/auth/check-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: 'invalid-email' })
        });
        
        const data3 = await response3.json();
        console.log('Response:', data3);
        
        if (response3.status === 400 && data3.success === false) {
            console.log('✅ Test 3 PASSED: Invalid email format correctly rejected\n');
        } else {
            console.log('❌ Test 3 FAILED: Invalid email format not rejected\n');
        }
    } catch (error) {
        console.log('❌ Test 3 ERROR:', error.message, '\n');
    }
    
    console.log('🔍 Email validation testing complete!');
}

testEmailValidation().catch(console.error);
