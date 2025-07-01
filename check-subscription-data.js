
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== Subscription Plans ===');
    const plans = await prisma.subscriptionPlan.findMany();
    console.log('Found', plans.length, 'plans');
    plans.forEach(p => console.log('Plan:', p.name, 'Type:', p.planType, 'Price:', p.price));
    
    console.log('\n=== User Subscriptions ===');
    const subs = await prisma.userSubscription.findMany({ 
      include: { user: true, plan: true } 
    });
    console.log('Found', subs.length, 'subscriptions');
    subs.forEach(s => console.log('User:', s.user?.email, 'Plan:', s.plan?.name, 'Status:', s.status));
    
    console.log('\n=== Users ===');
    const users = await prisma.user.findMany();
    console.log('Found', users.length, 'users');
    users.forEach(u => console.log('User:', u.email, 'Role:', u.role));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
