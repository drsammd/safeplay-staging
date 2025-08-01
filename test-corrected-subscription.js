const { PrismaClient } = require('@prisma/client');

async function testCorrectedSubscription() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing subscription creation with corrected schema...');
    
    const testSubscriptionData = {
      userId: 'test-user-id-' + Date.now(),
      status: 'ACTIVE',
      planType: 'FREE',
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      metadata: {}
    };
    
    console.log('📊 Test data:', testSubscriptionData);
    
    const result = await prisma.userSubscription.create({
      data: testSubscriptionData
    });
    
    console.log('✅ SUCCESS: Subscription created with corrected schema!');
    console.log('📋 Created subscription:', {
      id: result.id,
      userId: result.userId,
      status: result.status,
      planType: result.planType,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
      createdAt: result.createdAt
    });
    
    // Clean up test data
    await prisma.userSubscription.delete({
      where: { id: result.id }
    });
    
    console.log('🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCorrectedSubscription();
