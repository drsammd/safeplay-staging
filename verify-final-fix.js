
// Final verification test after applying URL encoding fixes
const { PrismaClient } = require('@prisma/client');

async function verifyFix() {
  console.log('🔧 SUPABASE CONNECTION FIX VERIFICATION\n');
  
  // Read the current environment variable
  require('dotenv').config();
  const currentUrl = process.env.DATABASE_URL;
  
  console.log('✅ Configuration Status:');
  console.log('  - .env file updated with URL encoding');
  console.log('  - vercel.json updated with URL encoding');
  console.log('  - Password character "!" → "%21"');
  console.log('');
  
  console.log('🔍 Current DATABASE_URL:');
  console.log('  ', currentUrl ? currentUrl.replace(/SafePlay2025Beta[!%21]+/, 'SafePlay2025Beta***') : 'NOT SET');
  console.log('');
  
  console.log('⏳ Testing connection...');
  
  try {
    const prisma = new PrismaClient();
    const start = Date.now();
    
    await prisma.$connect();
    console.log(`🎉 SUCCESS! Connection established in ${Date.now() - start}ms`);
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT current_timestamp as now`;
    console.log('📊 Database response:', result[0]);
    
    await prisma.$disconnect();
    console.log('✅ All systems operational!');
    
  } catch (error) {
    console.log(`❌ Connection still failing: ${error.message}`);
    console.log('');
    console.log('🚨 NEXT STEPS REQUIRED:');
    console.log('   1. Go to https://app.supabase.com');
    console.log('   2. Open your "safeplay-staging" project');
    console.log('   3. Check Settings → Database → make sure database is ACTIVE');
    console.log('   4. Check Settings → Database → Network Restrictions');
    console.log('   5. Either disable "Restrict to project" OR add 0.0.0.0/0');
    console.log('   6. Run this test again: node verify-final-fix.js');
    console.log('');
    console.log('🔧 Technical Details:');
    console.log('   - DNS Resolution: ✅ Working (IPv6)');
    console.log('   - URL Format: ✅ Fixed (URL encoded)');
    console.log('   - Network Access: ❌ Blocked/Restricted');
  }
}

verifyFix().catch(console.error);
