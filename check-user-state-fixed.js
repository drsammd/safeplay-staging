const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        subscription: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('=== RECENT USERS (Last 10) ===');
    users.forEach(user => {
      console.log(`📧 ${user.email}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Subscription: ${user.subscription ? 'EXISTS' : 'NULL'}`);
      if (user.subscription) {
        console.log(`   Subscription Status: ${user.subscription.status}`);
        console.log(`   Stripe Customer: ${user.subscription.stripeCustomerId || 'NULL'}`);
        console.log(`   Stripe Subscription: ${user.subscription.stripeSubscriptionId || 'NULL'}`);
        console.log(`   Plan: ${user.subscription.planType || 'NULL'}`);
      }
      console.log(`   ---`);
    });
    
    console.log('\n=== ACCOUNT COMPLETION ANALYSIS ===');
    let completeAccounts = 0;
    let incompleteAccounts = 0;
    
    users.forEach(user => {
      const hasSubscription = user.subscription !== null;
      
      if (hasSubscription) {
        completeAccounts++;
        console.log(`✅ COMPLETE: ${user.email} (${user.subscription.status} - ${user.subscription.planType})`);
      } else {
        incompleteAccounts++;
        console.log(`❌ INCOMPLETE: ${user.email} (No subscription record)`);
      }
    });
    
    console.log(`\nSUMMARY: ${completeAccounts} complete, ${incompleteAccounts} incomplete accounts`);
    
    // Also check total user count
    const totalUsers = await prisma.user.count();
    console.log(`\nTOTAL USERS IN DATABASE: ${totalUsers}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkUsers();
