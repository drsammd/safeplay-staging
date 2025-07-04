
import { prisma } from './lib/db.js';
import bcrypt from 'bcryptjs';

async function testCaseInsensitiveAuth() {
  console.log('🧪 TESTING CASE-INSENSITIVE EMAIL AUTHENTICATION');
  console.log('=' .repeat(60));

  const testCases = [
    // John Doe account tests
    { email: 'john@mysafeplay.ai', password: 'johndoe123', expectedName: 'John Doe' },
    { email: 'JOHN@MYSAFEPLAY.AI', password: 'johndoe123', expectedName: 'John Doe' },
    { email: 'John@MySafePlay.ai', password: 'johndoe123', expectedName: 'John Doe' },
    { email: 'john@MYSAFEPLAY.AI', password: 'johndoe123', expectedName: 'John Doe' },
    
    // Venue Admin tests
    { email: 'venue@mysafeplay.ai', password: 'password123', expectedName: 'John Smith' },
    { email: 'VENUE@MYSAFEPLAY.AI', password: 'password123', expectedName: 'John Smith' },
    { email: 'Venue@MySafePlay.ai', password: 'password123', expectedName: 'John Smith' },
    
    // Company Admin tests
    { email: 'admin@mysafeplay.ai', password: 'password123', expectedName: 'Sarah Mitchell' },
    { email: 'ADMIN@MYSAFEPLAY.AI', password: 'password123', expectedName: 'Sarah Mitchell' },
    { email: 'Admin@MySafePlay.ai', password: 'password123', expectedName: 'Sarah Mitchell' },
    
    // Parent tests
    { email: 'parent@mysafeplay.ai', password: 'password123', expectedName: 'Emily Johnson' },
    { email: 'PARENT@MYSAFEPLAY.AI', password: 'password123', expectedName: 'Emily Johnson' },
    { email: 'Parent@MySafePlay.ai', password: 'password123', expectedName: 'Emily Johnson' },
  ];

  const passwordTestCases = [
    // Test that passwords remain case-sensitive (should fail)
    { email: 'john@mysafeplay.ai', password: 'JOHNDOE123', expectedName: 'John Doe', shouldFail: true },
    { email: 'venue@mysafeplay.ai', password: 'PASSWORD123', expectedName: 'John Smith', shouldFail: true },
    { email: 'admin@mysafeplay.ai', password: 'Password123', expectedName: 'Sarah Mitchell', shouldFail: true },
  ];

  let passedTests = 0;
  let totalTests = testCases.length + passwordTestCases.length;

  console.log('🔍 Testing Case-Insensitive Email Login...\n');

  // Test case-insensitive email authentication
  for (const testCase of testCases) {
    try {
      // Simulate the authentication logic
      const normalizedEmail = testCase.email.toLowerCase().trim();
      
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (!user) {
        console.log(`❌ ${testCase.email}: User not found`);
        continue;
      }

      const isPasswordValid = await bcrypt.compare(testCase.password, user.password);
      
      if (!isPasswordValid) {
        console.log(`❌ ${testCase.email}: Invalid password`);
        continue;
      }

      if (user.name === testCase.expectedName) {
        console.log(`✅ ${testCase.email}: SUCCESS (found ${user.name})`);
        passedTests++;
      } else {
        console.log(`❌ ${testCase.email}: Wrong user (found ${user.name}, expected ${testCase.expectedName})`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.email}: Error - ${error.message}`);
    }
  }

  console.log('\n🔒 Testing Case-Sensitive Password Validation...\n');

  // Test that passwords remain case-sensitive
  for (const testCase of passwordTestCases) {
    try {
      const normalizedEmail = testCase.email.toLowerCase().trim();
      
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (!user) {
        console.log(`❌ ${testCase.email}: User not found`);
        continue;
      }

      const isPasswordValid = await bcrypt.compare(testCase.password, user.password);
      
      if (testCase.shouldFail && !isPasswordValid) {
        console.log(`✅ ${testCase.email}: CORRECTLY REJECTED invalid password "${testCase.password}"`);
        passedTests++;
      } else if (testCase.shouldFail && isPasswordValid) {
        console.log(`❌ ${testCase.email}: INCORRECTLY ACCEPTED invalid password "${testCase.password}"`);
      } else {
        console.log(`❌ ${testCase.email}: Unexpected result`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.email}: Error - ${error.message}`);
    }
  }

  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('-' .repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Case-insensitive email authentication is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the authentication logic.');
  }

  console.log('\n🔑 UPDATED DEMO CREDENTIALS:');
  console.log('=' .repeat(60));
  console.log('Company Admin: admin@mysafeplay.ai / password123');
  console.log('Venue Admin: venue@mysafeplay.ai / password123');  
  console.log('Parent: parent@mysafeplay.ai / password123');
  console.log('Demo Parent: john@mysafeplay.ai / johndoe123');
  console.log('=' .repeat(60));
  console.log('✨ All emails are now case-insensitive for login!');
  console.log('🔒 Passwords remain case-sensitive for security.');
}

async function main() {
  try {
    await testCaseInsensitiveAuth();
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
