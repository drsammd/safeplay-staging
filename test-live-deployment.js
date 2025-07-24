const fetch = require('node-fetch');

async function testLiveDeployment() {
    console.log('🚨 TESTING LIVE DEPLOYMENT FOR CUSTOMER PROTECTION...\n');
    
    const baseUrl = 'https://mysafeplay.ai';
    
    try {
        // Test 1: Check version endpoint
        console.log('📋 TEST 1: Checking deployed version...');
        const versionResponse = await fetch(`${baseUrl}/api/version`);
        const versionData = await versionResponse.json();
        console.log('Version Data:', JSON.stringify(versionData, null, 2));
        
        // Test 2: Test signup with minimal data to check for customer protection
        console.log('\n📋 TEST 2: Testing signup endpoint for customer protection...');
        const signupResponse = await fetch(`${baseUrl}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Test Customer Protection',
                email: 'test-protection@example.com',
                password: 'testpass123',
                role: 'PARENT',
                agreeToTerms: true,
                agreeToPrivacy: true,
                selectedPlan: { 
                    id: 'test', 
                    priceId: 'price_test', 
                    type: 'BASIC_MONTHLY',
                    price: 9.99 
                }
            })
        });
        
        const signupData = await signupResponse.text();
        console.log('Signup Response Status:', signupResponse.status);
        console.log('Signup Response:', signupData);
        
        // Check for emergency fix markers
        if (signupData.includes('emergencyFixActive') || signupData.includes('v1.5.40-alpha')) {
            console.log('✅ CUSTOMER PROTECTION: Emergency fix markers detected!');
        } else {
            console.log('❌ CUSTOMER PROTECTION: No emergency fix markers found!');
        }
        
        if (signupData.includes('customerProtected')) {
            console.log('✅ CUSTOMER PROTECTION: Customer protection active!');
        } else {
            console.log('❌ CUSTOMER PROTECTION: Customer protection not detected!');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testLiveDeployment();
