const { PrismaClient } = require('@prisma/client');

async function checkPlanType() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking planType column...');
    
    // Get specific column info for planType
    const columnInfo = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        udt_name,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' AND column_name = 'planType'
    `;
    
    console.log('📋 planType column info:', columnInfo);
    
    // Try to get any existing values
    try {
      const sampleData = await prisma.$queryRaw`
        SELECT "planType" FROM user_subscriptions LIMIT 1
      `;
      console.log('📊 Sample planType value:', sampleData);
    } catch (queryError) {
      console.log('ℹ️ No data found or query error:', queryError.message);
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlanType();
