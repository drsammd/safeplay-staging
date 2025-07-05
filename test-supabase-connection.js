
const { PrismaClient } = require('@prisma/client');

async function testConnections() {
  console.log('=== Supabase Connection Diagnostics ===\n');
  
  const variations = [
    {
      name: 'Current (.env format)',
      url: 'postgresql://postgres:SafePlay2025Beta!@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres'
    },
    {
      name: 'URL Encoded Password',
      url: 'postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres'
    },
    {
      name: 'With pgbouncer (Vercel format)',
      url: 'postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1'
    },
    {
      name: 'Direct Connection with SSL',
      url: 'postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres?sslmode=require'
    },
    {
      name: 'Alternative port 6543 (Supabase pooler)',
      url: 'postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:6543/postgres?pgbouncer=true'
    }
  ];

  for (const variation of variations) {
    console.log(`\n--- Testing: ${variation.name} ---`);
    console.log(`URL: ${variation.url.replace(/SafePlay2025Beta[!%21]/, 'SafePlay2025Beta***')}`);
    
    try {
      // Test URL parsing first
      const httpUrl = variation.url.replace('postgresql://', 'http://');
      const parsedUrl = new URL(httpUrl);
      console.log(`✓ URL parsing successful`);
      console.log(`  - Host: ${parsedUrl.hostname}`);
      console.log(`  - Port: ${parsedUrl.port || '5432'}`);
      console.log(`  - Username: ${parsedUrl.username}`);
      console.log(`  - Password length: ${parsedUrl.password.length}`);
      
      // Test Prisma client creation
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: variation.url
          }
        }
      });
      
      console.log(`✓ Prisma client created successfully`);
      
      // Test connection
      console.log(`  Attempting connection...`);
      const startTime = Date.now();
      
      try {
        await prisma.$connect();
        console.log(`✓ Connection successful! (${Date.now() - startTime}ms)`);
        
        // Test a simple query
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log(`✓ Query successful:`, result);
        
      } catch (connError) {
        console.log(`✗ Connection failed (${Date.now() - startTime}ms):`);
        console.log(`  Error: ${connError.message}`);
        console.log(`  Code: ${connError.code || 'N/A'}`);
        
        // Check specific error types
        if (connError.message.includes('getaddrinfo ENOTFOUND')) {
          console.log(`  → DNS resolution issue`);
        } else if (connError.message.includes('connect ECONNREFUSED')) {
          console.log(`  → Connection refused (port not open)`);
        } else if (connError.message.includes('connect ETIMEDOUT')) {
          console.log(`  → Connection timeout (network/firewall issue)`);
        } else if (connError.message.includes('database string is invalid')) {
          console.log(`  → Invalid database URL format`);
        } else if (connError.message.includes('password authentication failed')) {
          console.log(`  → Authentication failed (wrong credentials)`);
        }
      } finally {
        await prisma.$disconnect();
      }
      
    } catch (setupError) {
      console.log(`✗ Setup failed:`);
      console.log(`  Error: ${setupError.message}`);
    }
  }

  // Test DNS resolution
  console.log(`\n--- DNS Resolution Test ---`);
  try {
    const dns = require('dns').promises;
    const hostname = 'db.gjkhbzedenvvwgqivkcf.supabase.co';
    
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      console.log(`✓ DNS resolution successful for ${hostname}:`);
      addresses.forEach((addr, i) => {
        console.log(`  ${i + 1}. ${addr.address} (${addr.family === 4 ? 'IPv4' : 'IPv6'})`);
      });
    } catch (dnsError) {
      console.log(`✗ DNS resolution failed: ${dnsError.message}`);
    }
  } catch (error) {
    console.log(`✗ DNS test setup failed: ${error.message}`);
  }

  console.log(`\n=== Diagnostics Complete ===`);
}

testConnections().catch(console.error);
