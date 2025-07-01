
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubscriptions() {
  console.log('🔍 Checking existing user subscriptions...');
  
  try {
    // Check users with subscriptions
    const usersWithSubscriptions = await prisma.user.findMany({
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });
    
    console.log('\n📊 Users and their subscriptions:');
    usersWithSubscriptions.forEach(user => {
      console.log(`👤 ${user.email} (${user.role})`);
      if (user.subscription) {
        console.log(`   📋 Plan: ${user.subscription.plan?.name || 'Unknown'}`);
        console.log(`   💰 Status: ${user.subscription.status}`);
        console.log(`   📅 Created: ${user.subscription.createdAt}`);
        console.log(`   🆔 Plan ID: ${user.subscription.planId}`);
      } else {
        console.log('   ❌ No subscription');
      }
      console.log('');
    });
    
    // Check subscription plans
    const plans = await prisma.subscriptionPlan.findMany();
    console.log('\n📋 Available subscription plans:');
    plans.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.price}/month (ID: ${plan.id})`);
    });
    
    // Check for the specific user mentioned in the issue
    const specificUser = await prisma.user.findUnique({
      where: { email: 'drsam+17@outlook.com' },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });
    
    if (specificUser) {
      console.log('\n🎯 Specific user drsam+17@outlook.com:');
      console.log(`   📋 Plan: ${specificUser.subscription?.plan?.name || 'None'}`);
      console.log(`   💰 Status: ${specificUser.subscription?.status || 'None'}`);
    } else {
      console.log('\n🎯 User drsam+17@outlook.com: NOT FOUND');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscriptions();
