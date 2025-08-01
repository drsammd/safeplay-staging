const { PrismaClient } = require('@prisma/client');

async function checkTableStructure() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking user_subscriptions table structure...');
    
    // Get table column information using raw SQL
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' 
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 Table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableStructure();
