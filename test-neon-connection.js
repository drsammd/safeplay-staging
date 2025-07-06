
// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Test Neon Database Connection
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing Neon database connection...');
    console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.log('📍 DATABASE_URL_UNPOOLED:', process.env.DATABASE_URL_UNPOOLED ? 'Set' : 'Not set');
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set!');
      process.exit(1);
    }
    
    console.log('🔗 Using DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'));
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Successfully connected to Neon database!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database query successful!');
    console.log('📊 PostgreSQL version:', result[0].version);
    
    // Test if tables exist (optional)
    try {
      const userCount = await prisma.user.count();
      console.log('✅ User table accessible, count:', userCount);
    } catch (error) {
      console.log('⚠️  User table not accessible (might need migration):', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('💡 This looks like a DNS/network issue. Check your DATABASE_URL.');
    } else if (error.message.includes('authentication')) {
      console.error('💡 This looks like an authentication issue. Check your credentials.');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('💡 The database does not exist. Check your database name in the URL.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
