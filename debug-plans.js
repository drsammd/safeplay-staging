
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPlans() {
  try {
    console.log('🔍 Checking subscription plans in database...');
    
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    
    console.log('📊 Total plans found:', plans.length);
    
    if (plans.length === 0) {
      console.log('❌ No subscription plans found in database!');
    } else {
      console.log('✅ Subscription plans:');
      plans.forEach((plan, index) => {
        console.log(`${index + 1}. ${plan.name} (ID: ${plan.id})`);
        console.log(`   - Type: ${plan.planType}`);
        console.log(`   - Price: $${plan.price}`);
        console.log(`   - Active: ${plan.isActive}`);
        console.log(`   - Display Order: ${plan.displayOrder}`);
        console.log('');
      });
    }
    
    // Also check active plans specifically
    const activePlans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });
    
    console.log('📊 Active plans found:', activePlans.length);
    if (activePlans.length > 0) {
      console.log('✅ Active subscription plans:');
      activePlans.forEach((plan, index) => {
        console.log(`${index + 1}. ${plan.name} (ID: ${plan.id}) - $${plan.price}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPlans();
