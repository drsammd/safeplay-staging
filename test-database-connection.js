
// Simple test script to validate database connection without Next.js server
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔧 Testing Database Connection...');
  console.log('Timestamp:', new Date().toISOString());
  
  const result = {
    status: 'error',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    databaseUrl: process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@') : 'NOT_SET',
    tests: {
      basicConnection: { success: false },
      simpleQuery: { success: false },
      modelAccess: { success: false }
    },
    recommendations: []
  };

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    result.recommendations.push('DATABASE_URL environment variable is not set');
    console.log('❌ DATABASE_URL not set');
    return result;
  }

  console.log('✅ DATABASE_URL is set:', result.databaseUrl);

  // Parse database URL for validation
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    console.log('✅ Database URL parsed successfully');
    console.log('   - Protocol:', dbUrl.protocol);
    console.log('   - Hostname:', dbUrl.hostname);
    console.log('   - Port:', dbUrl.port);

    if (dbUrl.hostname.includes('supabase.co')) {
      result.recommendations.push('Detected Supabase database - ensure IP whitelisting allows 0.0.0.0/0 for Vercel');
      console.log('ℹ️  Detected Supabase database');
    }
  } catch (urlError) {
    result.recommendations.push(`Invalid DATABASE_URL format: ${urlError.message}`);
    console.log('❌ Invalid DATABASE_URL format:', urlError.message);
    return result;
  }

  let prisma = null;

  try {
    console.log('🔗 Creating Prisma client...');
    
    // Test 1: Basic Prisma Connection
    const connectionStart = Date.now();
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    console.log('🔗 Attempting to connect to database...');
    await prisma.$connect();
    result.tests.basicConnection = { 
      success: true, 
      duration: Date.now() - connectionStart 
    };
    console.log('✅ Basic connection successful');

    // Test 2: Simple Raw Query
    console.log('🔍 Testing simple query...');
    const queryStart = Date.now();
    const rawResult = await prisma.$queryRaw`SELECT 1 as test`;
    result.tests.simpleQuery = { 
      success: true, 
      duration: Date.now() - queryStart,
      count: Array.isArray(rawResult) ? rawResult.length : 1
    };
    console.log('✅ Simple query successful');

    // Test 3: Model Access Test
    console.log('📊 Testing model access...');
    const modelStart = Date.now();
    const userCount = await prisma.user.count();
    result.tests.modelAccess = { 
      success: true, 
      duration: Date.now() - modelStart
    };
    console.log('✅ Model access successful - User count:', userCount);

    result.status = 'success';
    result.recommendations.push('All database connection tests passed successfully');

    if (userCount === 0) {
      result.recommendations.push('No users found in database - may need to run seed script');
      console.log('⚠️  No users found in database');
    }

  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    
    // Categorize different types of errors
    if (error.message.includes("Can't reach database server")) {
      result.tests.basicConnection.error = `Network connectivity issue: ${error.message}`;
      result.recommendations.push('Database server is unreachable - check firewall, IP whitelisting, and network connectivity');
      
      if (error.message.includes('supabase.co')) {
        result.recommendations.push('For Supabase: Go to Project Settings > Database > Network Restrictions and ensure "Restrict to project" is disabled or add 0.0.0.0/0 to allowed IPs');
      }
    } else if (error.message.includes('password authentication failed')) {
      result.tests.basicConnection.error = `Authentication failed: ${error.message}`;
      result.recommendations.push('Database credentials are incorrect - verify username and password in DATABASE_URL');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      result.tests.basicConnection.error = `Database not found: ${error.message}`;
      result.recommendations.push('Database does not exist - create the database or check DATABASE_URL database name');
    } else if (error.message.includes('SSL')) {
      result.tests.basicConnection.error = `SSL/TLS issue: ${error.message}`;
      result.recommendations.push('SSL connection failed - check if database requires SSL and if certificates are valid');
    } else if (error.message.includes('timeout')) {
      result.tests.basicConnection.error = `Connection timeout: ${error.message}`;
      result.recommendations.push('Connection timed out - check network latency and database server responsiveness');
    } else if (error.message.includes('ENOTFOUND')) {
      result.tests.basicConnection.error = `DNS resolution failed: ${error.message}`;
      result.recommendations.push('Cannot resolve database hostname - check DNS settings and hostname in DATABASE_URL');
    } else if (error.message.includes('ECONNREFUSED')) {
      result.tests.basicConnection.error = `Connection refused: ${error.message}`;
      result.recommendations.push('Database server refused connection - check if database is running and port is correct');
    } else {
      result.tests.basicConnection.error = `Unknown error: ${error.message}`;
      result.recommendations.push('Unknown database error - check logs for more details');
    }

    result.recommendations.push(`Full error details: ${error.stack || error.message}`);
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
        console.log('🔌 Disconnected from database');
      } catch (disconnectError) {
        console.log('⚠️  Error disconnecting:', disconnectError.message);
      }
    }
  }

  console.log('\n📋 Test Results:');
  console.log('Status:', result.status);
  console.log('Basic Connection:', result.tests.basicConnection.success ? '✅' : '❌');
  console.log('Simple Query:', result.tests.simpleQuery.success ? '✅' : '❌'); 
  console.log('Model Access:', result.tests.modelAccess.success ? '✅' : '❌');
  
  console.log('\n💡 Recommendations:');
  result.recommendations.forEach(rec => console.log('  -', rec));
  
  return result;
}

// Run the test
testDatabaseConnection()
  .then(result => {
    console.log('\n🎯 Final Result:', result.status.toUpperCase());
    process.exit(result.status === 'success' ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
