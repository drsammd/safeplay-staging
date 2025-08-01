const { PrismaClient } = require('@prisma/client');

async function testDatabaseFields() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing what fields exist in user_subscriptions table...');
    
    // Try to find any existing subscription to see what fields are available
    const existingSubscription = await prisma.userSubscription.findFirst({
      select: {
        id: true,
        userId: true,
        planType: true,
        status: true,
        // Try common field variations
        startDate: true,
        endDate: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true
      }
    });
    
    if (existingSubscription) {
      console.log('✅ Found existing subscription with fields:', existingSubscription);
    } else {
      console.log('ℹ️ No existing subscriptions found in database');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    // Let's try with minimal fields only
    try {
      console.log('🔄 Trying with basic fields only...');
      const basicQuery = await prisma.userSubscription.findFirst({
        select: {
          id: true,
          userId: true,
          status: true,
          planType: true
        }
      });
      
      console.log('✅ Basic query successful:', basicQuery || 'No records found');
      
    } catch (basicError) {
      console.error('❌ Even basic query failed:', basicError.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseFields();
