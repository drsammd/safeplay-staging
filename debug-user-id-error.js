
/**
 * Debug script to investigate the specific "User not found for ID: cmcxeysqi0000jiij569qtc8m" error
 */

const { PrismaClient } = require('@prisma/client');

async function debugSpecificUserIdError() {
  console.log('🔍 DEBUG: Investigating specific user ID error...\n');
  
  const problematicUserId = 'cmcxeysqi0000jiij569qtc8m';
  
  console.log('=== USER ID ERROR ANALYSIS ===');
  console.log(`🎯 Target User ID: ${problematicUserId}`);
  
  try {
    const prisma = new PrismaClient();
    
    // 1. Direct database lookup
    console.log('\n1️⃣ DIRECT DATABASE LOOKUP:');
    const user = await prisma.user.findUnique({
      where: { id: problematicUserId }
    });
    
    console.log('👤 User found:', !!user);
    if (user) {
      console.log('✅ User details:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      });
    } else {
      console.log('❌ User does not exist in database');
    }
    
    // 2. Check if this ID exists in any related tables
    console.log('\n2️⃣ CHECKING RELATED TABLES:');
    
    // Check user subscriptions
    const subscription = await prisma.userSubscription.findFirst({
      where: { userId: problematicUserId }
    });
    console.log('💳 Subscription found:', !!subscription);
    
    // Check email automation logs (if they exist)
    try {
      const emailLogs = await prisma.emailAutomationLog.findMany({
        where: { userId: problematicUserId },
        take: 5
      });
      console.log('📧 Email logs found:', emailLogs.length);
    } catch (e) {
      console.log('📧 Email logs table not accessible');
    }
    
    // 3. Check for similar user IDs (possible typos)
    console.log('\n3️⃣ CHECKING FOR SIMILAR USER IDs:');
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('🔍 Recent user IDs:');
    allUsers.forEach(u => {
      const similarity = u.id.startsWith('cmcxeys') ? '🔥 SIMILAR' : '';
      console.log(`  ${u.id} (${u.email}) ${similarity}`);
    });
    
    // 4. Check if this ID format matches expected pattern
    console.log('\n4️⃣ ID FORMAT ANALYSIS:');
    console.log(`📏 Length: ${problematicUserId.length} characters`);
    console.log(`🔤 Starts with: ${problematicUserId.substring(0, 8)}`);
    console.log(`🔤 Ends with: ${problematicUserId.substring(-8)}`);
    
    // Check if it's a valid cuid/cuid2 format
    const isCuidLike = /^c[a-z0-9]{24}$/i.test(problematicUserId);
    console.log(`✅ CUID format: ${isCuidLike}`);
    
    // 5. Test the exact subscription service scenario
    console.log('\n5️⃣ SIMULATING SUBSCRIPTION SERVICE CALL:');
    console.log('🔍 Simulating user lookup in createSubscription...');
    
    const subscriptionServiceLookup = await prisma.user.findUnique({
      where: { id: problematicUserId }
    });
    
    if (!subscriptionServiceLookup) {
      console.log('❌ CONFIRMED: This is exactly where the error occurs');
      console.log('🚨 subscription-service.ts line 117-118 throws "User not found"');
    } else {
      console.log('✅ User found in subscription service simulation');
    }
    
    // 6. Check for session/cache issues
    console.log('\n6️⃣ POTENTIAL CAUSES:');
    console.log('🤔 Possible reasons for this error:');
    console.log('   a) User was created but later deleted');
    console.log('   b) User creation failed but ID was cached somewhere');
    console.log('   c) Session/browser has stale user ID');
    console.log('   d) Race condition during user creation');
    console.log('   e) Database rollback after user creation');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('💥 Debug script error:', error);
  }
  
  console.log('\n✅ USER ID DEBUG COMPLETE');
  console.log('🎯 Next step: Identify where this user ID is coming from');
}

debugSpecificUserIdError().catch(console.error);
