
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log('🔗 TESTING DATABASE CONNECTION...');
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testCriticalAccountsAuthentication() {
  console.log('\n🔐 TESTING AUTHENTICATION FLOW...');
  
  const testAccounts = [
    { email: 'admin@safeplay.com', password: 'password123', expectedRole: 'COMPANY_ADMIN' },
    { email: 'john@doe.com', password: 'johndoe123', expectedRole: 'PARENT' },
    { email: 'venue@safeplay.com', password: 'password123', expectedRole: 'VENUE_ADMIN' },
    { email: 'parent@safeplay.com', password: 'password123', expectedRole: 'PARENT' }
  ];

  const results = [];

  for (const account of testAccounts) {
    try {
      // Simulate the exact authentication flow from lib/auth.ts
      const user = await prisma.user.findUnique({
        where: { email: account.email }
      });

      if (!user) {
        console.log(`❌ ${account.email}: User not found`);
        results.push({ email: account.email, status: 'USER_NOT_FOUND' });
        continue;
      }

      const isPasswordValid = await bcrypt.compare(account.password, user.password);
      const isRoleCorrect = user.role === account.expectedRole;

      if (!isPasswordValid) {
        console.log(`❌ ${account.email}: Invalid password`);
        results.push({ email: account.email, status: 'INVALID_PASSWORD' });
        continue;
      }

      if (!isRoleCorrect) {
        console.log(`❌ ${account.email}: Role mismatch - expected ${account.expectedRole}, got ${user.role}`);
        results.push({ email: account.email, status: 'ROLE_MISMATCH' });
        continue;
      }

      console.log(`✅ ${account.email}: Authentication would succeed (Role: ${user.role})`);
      results.push({ email: account.email, status: 'SUCCESS', role: user.role });

    } catch (error) {
      console.log(`❌ ${account.email}: Authentication error - ${error.message}`);
      results.push({ email: account.email, status: 'ERROR', error: error.message });
    }
  }

  return results;
}

async function testEnvironmentVariables() {
  console.log('\n🌍 TESTING ENVIRONMENT CONFIGURATION...');
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ];

  const results = {};
  let allGood = true;

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Set`);
      results[varName] = 'SET';
    } else {
      console.log(`❌ ${varName}: Missing`);
      results[varName] = 'MISSING';
      allGood = false;
    }
  }

  // Check NEXTAUTH_URL format
  if (process.env.NEXTAUTH_URL) {
    try {
      new URL(process.env.NEXTAUTH_URL);
      console.log(`✅ NEXTAUTH_URL: Valid format (${process.env.NEXTAUTH_URL})`);
    } catch {
      console.log(`⚠️  NEXTAUTH_URL: Invalid format (${process.env.NEXTAUTH_URL})`);
      allGood = false;
    }
  }

  return { results, allGood };
}

async function testDatabaseSchema() {
  console.log('\n📋 TESTING DATABASE SCHEMA...');
  
  try {
    // Test if all required tables exist
    const userCount = await prisma.user.count();
    const venueCount = await prisma.venue.count();
    const childCount = await prisma.child.count();
    
    console.log(`✅ User table: ${userCount} records`);
    console.log(`✅ Venue table: ${venueCount} records`);
    console.log(`✅ Child table: ${childCount} records`);
    
    return true;
  } catch (error) {
    console.log(`❌ Schema test failed: ${error.message}`);
    return false;
  }
}

async function simulateMiddlewareLogic() {
  console.log('\n🛡️ SIMULATING MIDDLEWARE PROTECTION...');
  
  const testRoutes = [
    { path: '/admin', requiredRole: 'COMPANY_ADMIN', testUser: 'admin@safeplay.com' },
    { path: '/venue-admin', requiredRole: 'VENUE_ADMIN', testUser: 'venue@safeplay.com' },
    { path: '/parent', requiredRole: 'PARENT', testUser: 'john@doe.com' }
  ];

  for (const route of testRoutes) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: route.testUser }
      });

      if (user && user.role === route.requiredRole) {
        console.log(`✅ ${route.path}: ${route.testUser} would have access (Role: ${user.role})`);
      } else {
        console.log(`❌ ${route.path}: ${route.testUser} would be DENIED access (Role: ${user?.role || 'NOT_FOUND'})`);
      }
    } catch (error) {
      console.log(`❌ ${route.path}: Error checking access - ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 DEPLOYMENT READINESS TEST');
  console.log('=' .repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Node Environment: ${process.env.NODE_ENV || 'undefined'}`);
  console.log('');

  const testResults = {};

  // Test 1: Database Connection
  testResults.dbConnection = await testDatabaseConnection();

  if (!testResults.dbConnection) {
    console.log('\n❌ DEPLOYMENT NOT READY: Database connection failed');
    process.exit(1);
  }

  // Test 2: Environment Variables
  const envTest = await testEnvironmentVariables();
  testResults.environment = envTest.allGood;

  // Test 3: Database Schema
  testResults.schema = await testDatabaseSchema();

  // Test 4: Authentication Flow
  const authResults = await testCriticalAccountsAuthentication();
  testResults.authentication = authResults.every(r => r.status === 'SUCCESS');

  // Test 5: Middleware Simulation
  await simulateMiddlewareLogic();

  // Final Assessment
  console.log('\n📊 DEPLOYMENT READINESS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Database Connection: ${testResults.dbConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Environment Variables: ${testResults.environment ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Schema: ${testResults.schema ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authentication Flow: ${testResults.authentication ? '✅ PASS' : '❌ FAIL'}`);

  const overallReady = Object.values(testResults).every(result => result === true);
  
  console.log('\n' + '=' .repeat(60));
  if (overallReady) {
    console.log('🎉 DEPLOYMENT READY: All tests passed!');
    console.log('');
    console.log('🔑 VERIFIED ADMIN ACCESS:');
    console.log('Email: admin@safeplay.com');
    console.log('Password: password123');
    console.log('Role: COMPANY_ADMIN');
    console.log('Target URL: /admin');
  } else {
    console.log('❌ DEPLOYMENT NOT READY: Some tests failed');
    console.log('Please address the issues above before deployment.');
  }
  console.log('=' .repeat(60));

  await prisma.$disconnect();
  process.exit(overallReady ? 0 : 1);
}

main().catch((error) => {
  console.error('💥 DEPLOYMENT TEST CRASHED:', error);
  process.exit(1);
});
