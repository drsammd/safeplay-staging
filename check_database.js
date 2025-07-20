const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_M6gknpGef8Fz@ep-tight-fog-adn7uvk9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function checkDatabase() {
  try {
    console.log("🔍 Checking database connection...");
    
    // Check if we can connect
    await prisma.$connect();
    console.log("✅ Database connection successful");
    
    // Check what tables exist
    console.log("\n📋 Checking existing tables...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log("Tables found:", tables);
    
    // Try to check if users table exists and query it
    try {
      console.log("\n👥 Checking users table...");
      const userCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM users;
      `;
      console.log("Total users:", userCount);
      
      // Check table structure first
      console.log("\n📋 Checking users table structure...");
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position;
      `;
      console.log("Users table columns:", columns);
      
      // Check for drsam accounts
      console.log("\n🔍 Checking for drsam accounts...");
      const drsamUsers = await prisma.$queryRaw`
        SELECT email, id, "createdAt", "isActive"
        FROM users 
        WHERE email LIKE 'drsam%' 
        ORDER BY email;
      `;
      console.log("drsam accounts found:", drsamUsers);
      
      // Check all users
      console.log("\n👥 All users in database...");
      const allUsers = await prisma.$queryRaw`
        SELECT email, id, "createdAt", "isActive"
        FROM users 
        ORDER BY email;
      `;
      console.log("All users:", allUsers);
      
    } catch (error) {
      console.log("❌ Users table query failed:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Database check failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
