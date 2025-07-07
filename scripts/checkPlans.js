const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPlans() {
  try {
    console.log('🔍 Checking subscription plans...');
    
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    
    console.log(`\n📋 Found ${plans.length} subscription plans:`);
    plans.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.price}/month (Active: ${plan.isActive})`);
    });
    
    if (plans.length === 0) {
      console.log('\n❌ No subscription plans found in database!');
      console.log('💡 Need to create subscription plans for pricing display to work.');
    }
    
  } catch (error) {
    console.error('❌ Error checking plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();
