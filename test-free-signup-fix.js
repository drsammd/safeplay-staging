const { PrismaClient } = require('@prisma/client');

async function testFreeSignupFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing FREE plan subscription creation without autoRenew field...');
    
    // Test subscription creation data (similar to what the signup API does)
    const testSubscriptionData = {
      userId: 'test-user-id-' + Date.now(),
      status: 'ACTIVE',
      planType: 'FREE',
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      // Note: NO autoRenew field included
    };
    
    console.log('📊 Test data:', testSubscriptionData);
    
    // Try to create the subscription
    const result = await prisma.userSubscription.create({
      data: testSubscriptionData
    });
    
    console.log('✅ SUCCESS: Subscription created without autoRenew field!');
    console.log('📋 Created subscription:', {
      id: result.id,
      userId: result.userId,
      status: result.status,
      planType: result.planType,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd
    });
    
    // Clean up test data
    await prisma.userSubscription.delete({
      where: { id: result.id }
    });
    
    console.log('🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('❌ ERROR: Subscription creation failed:', error);
    console.error('🔍 Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFreeSignupFix();
