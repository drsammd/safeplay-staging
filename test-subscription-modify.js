
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSubscriptionModify() {
  try {
    console.log('🔍 Testing subscription modification logic...');
    
    // Test plan IDs from the API response
    const testPlanIds = [
      'cmci6xte60003pkkm8hsg6bkt', // Lifetime Plan
      'cmci6xte10001pkkmt9im5ros', // Premium Plan
      'cmci6xte30002pkkmv94lxxgu', // Family Plan
      'cmci6xtdv0000pkkmrfyiqowp'  // Basic Plan
    ];
    
    console.log('📋 Testing plan lookup for each plan ID...');
    
    for (const planId of testPlanIds) {
      console.log(`\n🔍 Testing plan ID: ${planId}`);
      
      // Test the same logic used in the API endpoint
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId }
      });
      
      if (!plan) {
        console.log(`❌ Plan not found for ID: ${planId}`);
      } else {
        console.log(`✅ Plan found: ${plan.name} - $${plan.price}`);
        console.log(`   - Type: ${plan.planType}`);
        console.log(`   - Active: ${plan.isActive}`);
        console.log(`   - Stripe Price ID: ${plan.stripePriceId}`);
      }
    }
    
    // Also test with some invalid IDs to see what happens
    console.log('\n🧪 Testing invalid plan IDs...');
    const invalidIds = ['invalid_id', 'nonexistent', ''];
    
    for (const invalidId of invalidIds) {
      console.log(`\n🔍 Testing invalid ID: "${invalidId}"`);
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: invalidId }
      });
      
      if (!plan) {
        console.log(`❌ Plan not found (expected): "${invalidId}"`);
      } else {
        console.log(`⚠️ Unexpected: Plan found for invalid ID: ${invalidId}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSubscriptionModify();
