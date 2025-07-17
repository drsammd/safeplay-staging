
/**
 * Direct test for EmailPreferences creation with new field names
 */

const { PrismaClient } = require('@prisma/client');

const testEmailPreferences = async () => {
  const prisma = new PrismaClient();
  const testUserId = `test_${Date.now()}`;
  
  console.log('🧪 TESTING: EmailPreferences creation with new field names...');
  
  try {
    // First create a test user
    const testUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: `test.${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'Test User',
        role: 'PARENT'
      }
    });
    
    console.log('✅ Test user created:', testUser.id);
    
    // Now test creating EmailPreferences with new field names
    const emailPrefs = await prisma.emailPreferences.create({
      data: {
        userId: testUser.id,
        marketingEmails: true,
        securityAlerts: true,
        productUpdates: true,
        frequency: 'DAILY'
      }
    });
    
    console.log('✅ EmailPreferences created successfully with new field names:');
    console.log('  - marketingEmails:', emailPrefs.marketingEmails);
    console.log('  - securityAlerts:', emailPrefs.securityAlerts);
    console.log('  - productUpdates:', emailPrefs.productUpdates);
    console.log('  - frequency:', emailPrefs.frequency);
    
    // Clean up
    await prisma.emailPreferences.delete({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    
    console.log('🎉 SUCCESS: EmailPreferences creation with new field names works!');
    return true;
    
  } catch (error) {
    console.error('❌ FAILED: EmailPreferences creation failed:', error.message);
    
    // Try to clean up in case of error
    try {
      await prisma.emailPreferences.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
};

testEmailPreferences().then(success => {
  if (success) {
    console.log('\n🎉 SCHEMA FIX VERIFICATION: SUCCESS!');
    console.log('✅ The v1.5.24 fix successfully resolved the schema mismatch issue');
    process.exit(0);
  } else {
    console.log('\n🚨 SCHEMA FIX VERIFICATION: FAILED!');
    console.log('❌ The v1.5.24 fix did not resolve the schema mismatch issue');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 SCHEMA FIX VERIFICATION: Test failed with exception:', error);
  process.exit(1);
});
