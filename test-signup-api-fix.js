// Test the signup API endpoint directly to ensure it can handle FREE plan signups
const { cleanAccountInitializer } = require('./lib/clean-account-initializer');

async function testSignupAPIFix() {
  console.log('🧪 Testing signup API fix for FREE plan...');
  
  try {
    // Test the clean account initializer with FREE plan data
    const testConfig = {
      userId: 'test-user-' + Date.now(),
      email: 'test@example.com',
      name: 'Test User',
      role: 'PARENT',  
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      selectedPlan: {
        id: 'free-plan',
        name: 'Free Plan',
        stripePriceId: null,
        billingInterval: 'free',
        amount: 0,
        planType: 'FREE'
      }
    };
    
    console.log('📊 Test configuration:', {
      userId: testConfig.userId,
      email: testConfig.email,
      planType: testConfig.selectedPlan.planType,
      amount: testConfig.selectedPlan.amount
    });
    
    // This should NOT fail with autoRenew errors anymore
    const result = await cleanAccountInitializer.initializeCleanAccount(testConfig);
    
    if (result.success) {
      console.log('✅ SUCCESS: Clean account initializer works for FREE plan!');
      console.log('📋 Result:', {
        success: result.success,
        isClean: result.isClean,
        errors: result.errors,
        warnings: result.warnings
      });
    } else {
      console.log('❌ FAILED: Clean account initializer failed');
      console.log('📋 Errors:', result.errors);
    }
    
  } catch (error) {
    console.error('❌ ERROR in signup API fix test:', error.message);
    
    // Check if it's still the autoRenew error
    if (error.message.includes('autoRenew')) {
      console.error('🚨 CRITICAL: autoRenew error still exists!');
    } else {
      console.log('ℹ️ Different error (not autoRenew related)');
    }
  }
}

testSignupAPIFix();
