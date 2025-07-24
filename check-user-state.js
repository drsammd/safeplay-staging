const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        userSubscription: true
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
      console.log(`   UserSubscription: ${user.userSubscription ? 'EXISTS' : 'NULL'}`);
      if (user.userSubscription) {
        console.log(`   Subscription Status: ${user.userSubscription.status}`);
        console.log(`   Stripe Customer: ${user.userSubscription.stripeCustomerId || 'NULL'}`);
        console.log(`   Stripe Subscription: ${user.userSubscription.stripeSubscriptionId || 'NULL'}`);
      }
      console.log(`   ---`);
    });
    
    console.log('\n=== ACCOUNT COMPLETION ANALYSIS ===');
    let completeAccounts = 0;
    let incompleteAccounts = 0;
    
    users.forEach(user => {
      const hasSubscription = user.userSubscription !== null;
      const hasActiveSubscription = user.userSubscription && user.userSubscription.status === 'active';
      
      if (hasSubscription && hasActiveSubscription) {
        completeAccounts++;
        console.log(`✅ COMPLETE: ${user.email}`);
      } else {
        incompleteAccounts++;
        console.log(`❌ INCOMPLETE: ${user.email} (${!hasSubscription ? 'No subscription' : 'Inactive subscription'})`);
      }
    });
    
    console.log(`\nSUMMARY: ${completeAccounts} complete, ${incompleteAccounts} incomplete accounts`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
