
// Quick connection test with multiple URL formats
const { PrismaClient } = require('@prisma/client');

async function quickTest() {
  console.log('🔄 Quick Supabase Connection Test\n');
  
  // Test the fixed URL format
  const fixedUrl = 'postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres';
  
  console.log('Testing fixed URL format...');
  console.log('URL:', fixedUrl.replace(/SafePlay2025Beta%21/, 'SafePlay2025Beta***'));
  
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: fixedUrl } }
    });
    
    console.log('⏳ Connecting...');
    const start = Date.now();
    
    await prisma.$connect();
    console.log(`✅ SUCCESS! Connected in ${Date.now() - start}ms`);
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 Database version:', result[0]?.version || 'Unknown');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    
    if (error.message.includes("Can't reach database server")) {
      console.log(`
🔧 SOLUTION REQUIRED:
1. Go to Supabase Dashboard (https://app.supabase.com)
2. Check if database is paused/stopped
3. Disable IP restrictions in Settings > Database > Network Restrictions
4. Ensure database is active and accessible
      `);
    }
  }
}

quickTest().catch(console.error);
