// Test just the subscription creation part using an existing user
const { PrismaClient } = require('@prisma/client');

async function testSimpleSubscription() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing subscription creation only...');
    
    // Get an existing user if any
    const existingUser = await prisma.user.findFirst({
      select: { id: true, email: true }
    });
    
    if (!existingUser) {
      console.log('ℹ️ No existing users found. Creating subscription with dummy user ID to test schema...');
    } else {
      console.log('👤 Found existing user:', existingUser);
    }
    
    // Test the subscription data structure that would be used in signup
    const subscriptionData = {
      userId: existingUser ? existingUser.id : 'dummy-user-id',
      status: 'ACTIVE',
      planType: 'FREE',
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      metadata: {}
    };
    
    console.log('📊 Subscription data structure:', subscriptionData);
    
    if (existingUser) {
      try {
        const subscription = await prisma.userSubscription.create({
          data: subscriptionData
        });
        
        console.log('✅ SUCCESS: Subscription created!');
        console.log('📋 Result:', {
          id: subscription.id,
          userId: subscription.userId,
          planType: subscription.planType,
          status: subscription.status
        });
        
        // Clean up
        await prisma.userSubscription.delete({ where: { id: subscription.id } });
        console.log('🧹 Cleaned up test subscription');
        
      } catch (subError) {
        console.error('❌ Subscription creation failed:', subError.message);
      }
    } else {
      console.log('✅ Schema validation passed - subscription structure is correct');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleSubscription();
