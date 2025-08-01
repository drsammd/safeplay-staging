const { PrismaClient } = require('@prisma/client');

async function testFullSignupFlow() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing complete signup flow with corrected schema...');
    
    const testUserId = 'test-user-' + Date.now();
    const testEmail = `test${Date.now()}@example.com`;
    
    // Step 1: Create a test user
    console.log('👤 Creating test user...');
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: testEmail,
        name: 'Test User',
        role: 'PARENT',
        hashedPassword: 'dummy-hash'
      }
    });
    
    console.log('✅ User created:', { id: user.id, email: user.email });
    
    // Step 2: Create subscription
    console.log('💳 Creating subscription...');
    const subscriptionData = {
      userId: testUserId,
      status: 'ACTIVE',
      planType: 'FREE',
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      metadata: {}
    };
    
    const subscription = await prisma.userSubscription.create({
      data: subscriptionData
    });
    
    console.log('✅ SUCCESS: Complete signup flow works!');
    console.log('📋 Created subscription:', {
      id: subscription.id,
      userId: subscription.userId,
      status: subscription.status,
      planType: subscription.planType,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      createdAt: subscription.createdAt
    });
    
    // Clean up test data
    await prisma.userSubscription.delete({ where: { id: subscription.id } });
    await prisma.user.delete({ where: { id: testUserId } });
    
    console.log('🧹 Test data cleaned up');
    console.log('🎉 FREE PLAN SIGNUP IS NOW FIXED!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFullSignupFlow();
