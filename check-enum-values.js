const { PrismaClient } = require('@prisma/client');

async function checkEnumValues() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking enum types in database...');
    
    // Check what types exist for subscriptions
    const enumTypes = await prisma.$queryRaw`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname LIKE '%subscription%' OR t.typname LIKE '%plan%'
      ORDER BY t.typname, e.enumsortorder;
    `;
    
    console.log('📋 Enum types found:');
    enumTypes.forEach(type => {
      console.log(`  ${type.enum_name}: ${type.enum_value}`);
    });
    
    // Also check current planType values in use
    const currentPlanTypes = await prisma.$queryRaw`
      SELECT DISTINCT planType 
      FROM user_subscriptions 
      LIMIT 10;
    `;
    
    console.log('📊 Current planType values in database:');
    currentPlanTypes.forEach(row => {
      console.log(`  - ${row.plantype}`);
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnumValues();
