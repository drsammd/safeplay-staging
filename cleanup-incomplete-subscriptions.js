
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupIncompleteSubscriptions() {
  console.log('🧹 Cleaning up incomplete subscription records...');
  
  try {
    // Find all incomplete subscriptions
    const incompleteSubscriptions = await prisma.userSubscription.findMany({
      where: {
        status: 'INCOMPLETE'
      },
      include: {
        user: true,
        plan: true
      }
    });
    
    console.log(`\n📊 Found ${incompleteSubscriptions.length} incomplete subscriptions:`);
    incompleteSubscriptions.forEach(sub => {
      console.log(`  - ${sub.user.email}: ${sub.plan?.name || 'Unknown Plan'} (${sub.status})`);
    });
    
    if (incompleteSubscriptions.length > 0) {
      // Delete incomplete subscriptions
      const deletedCount = await prisma.userSubscription.deleteMany({
        where: {
          status: 'INCOMPLETE'
        }
      });
      
      console.log(`\n✅ Deleted ${deletedCount.count} incomplete subscription records`);
    } else {
      console.log('\n✅ No incomplete subscriptions found');
    }
    
    // Show remaining subscriptions
    const remainingSubscriptions = await prisma.userSubscription.findMany({
      include: {
        user: true,
        plan: true
      }
    });
    
    console.log(`\n📊 Remaining subscriptions (${remainingSubscriptions.length}):`);
    remainingSubscriptions.forEach(sub => {
      console.log(`  - ${sub.user.email}: ${sub.plan?.name || 'Unknown Plan'} (${sub.status})`);
    });
    
    // Verify the specific user mentioned in the issue
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
      console.log(`\n🎯 User drsam+17@outlook.com status:`);
      if (specificUser.subscription) {
        console.log(`   📋 Plan: ${specificUser.subscription.plan?.name || 'Unknown'}`);
        console.log(`   💰 Status: ${specificUser.subscription.status}`);
      } else {
        console.log('   ✅ No subscription (correct state for new user)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up subscriptions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupIncompleteSubscriptions();
