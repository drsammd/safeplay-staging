const { PrismaClient } = require('@prisma/client');

async function checkStatusColumn() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking status column...');
    
    const columnInfo = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        udt_name,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' AND column_name = 'status'
    `;
    
    console.log('📋 status column info:', columnInfo);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatusColumn();
