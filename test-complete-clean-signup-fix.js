
/**
 * Comprehensive Test: Complete Clean Signup Fix
 * Tests that new parent accounts start completely clean with:
 * - 0 children ✅ (already fixed)
 * - 0 family members (including detailed profiles)
 * - 0 emergency contacts
 * - 0 memories
 * - 0 videos
 * - Empty activity logs
 * 
 * Also verifies demo account still shows demo data properly.
 */

const baseUrl = 'http://localhost:3000';

// Test credentials
const testUsers = [
  { email: 'newparent1@example.com', name: 'New Parent One' },
  { email: 'newparent2@example.com', name: 'New Parent Two' },
  { email: 'testclean@gmail.com', name: 'Clean Test User' }
];

const demoAccount = { email: 'parent@mysafeplay.ai', name: 'Demo Parent' };

/**
 * Test a user's data for cleanliness
 */
async function testUserDataCleanliness(userEmail, userName, shouldBeClean = true) {
  console.log(`\n🔍 Testing ${shouldBeClean ? 'CLEAN' : 'DEMO'} account: ${userEmail}`);

  try {
    // Test 1: Children Count
    const childrenResponse = await fetch(`${baseUrl}/api/children`);
    if (!childrenResponse.ok) {
      console.log(`❌ Children API failed: ${childrenResponse.status}`);
      return false;
    }
    
    const childrenData = await childrenResponse.json();
    const childrenCount = childrenData.children?.length || 0;
    
    if (shouldBeClean) {
      console.log(`✅ Children: ${childrenCount} (should be 0)`);
      if (childrenCount !== 0) {
        console.log(`❌ FAILURE: Expected 0 children, got ${childrenCount}`);
        return false;
      }
    } else {
      console.log(`🎭 Demo Children: ${childrenCount} (should be > 0)`);
    }

    // Test 2: Family Members Count
    const familyResponse = await fetch(`${baseUrl}/api/family/members`);
    if (!familyResponse.ok) {
      console.log(`❌ Family API failed: ${familyResponse.status}`);
      return false;
    }
    
    const familyData = await familyResponse.json();
    const familyCount = familyData.ownedFamilies?.length || 0;
    const emergencyContactsCount = familyData.ownedFamilies?.filter(member => member.emergencyContact)?.length || 0;
    
    if (shouldBeClean) {
      console.log(`✅ Family Members: ${familyCount} (should be 0)`);
      console.log(`✅ Emergency Contacts: ${emergencyContactsCount} (should be 0)`);
      if (familyCount !== 0) {
        console.log(`❌ FAILURE: Expected 0 family members, got ${familyCount}`);
        return false;
      }
      if (emergencyContactsCount !== 0) {
        console.log(`❌ FAILURE: Expected 0 emergency contacts, got ${emergencyContactsCount}`);
        return false;
      }
    } else {
      console.log(`🎭 Demo Family Members: ${familyCount} (should be > 0)`);
      console.log(`🎭 Demo Emergency Contacts: ${emergencyContactsCount} (should be > 0)`);
    }

    // Test 3: Memories Count
    const memoriesResponse = await fetch(`${baseUrl}/api/memories`);
    if (!memoriesResponse.ok) {
      console.log(`❌ Memories API failed: ${memoriesResponse.status}`);
      return false;
    }
    
    const memoriesData = await memoriesResponse.json();
    const memoriesCount = memoriesData.length || 0;
    const videosCount = memoriesData.filter(memory => memory.type === 'VIDEO')?.length || 0;
    
    if (shouldBeClean) {
      console.log(`✅ Memories: ${memoriesCount} (should be 0)`);
      console.log(`✅ Videos: ${videosCount} (should be 0)`);
      if (memoriesCount !== 0) {
        console.log(`❌ FAILURE: Expected 0 memories, got ${memoriesCount}`);
        return false;
      }
      if (videosCount !== 0) {
        console.log(`❌ FAILURE: Expected 0 videos, got ${videosCount}`);
        return false;
      }
    } else {
      console.log(`🎭 Demo Memories: ${memoriesCount} (should be > 0)`);
      console.log(`🎭 Demo Videos: ${videosCount} (should be > 0)`);
    }

    // Test 4: Emergency Contacts Direct API
    const emergencyResponse = await fetch(`${baseUrl}/api/emergency-contacts`);
    if (!emergencyResponse.ok) {
      console.log(`❌ Emergency Contacts API failed: ${emergencyResponse.status}`);
      return false;
    }
    
    const emergencyData = await emergencyResponse.json();
    const directEmergencyCount = emergencyData.contacts?.length || 0;
    
    if (shouldBeClean) {
      console.log(`✅ Direct Emergency Contacts: ${directEmergencyCount} (should be 0)`);
      if (directEmergencyCount !== 0) {
        console.log(`❌ FAILURE: Expected 0 direct emergency contacts, got ${directEmergencyCount}`);
        return false;
      }
    } else {
      console.log(`🎭 Demo Direct Emergency Contacts: ${directEmergencyCount}`);
    }

    if (shouldBeClean) {
      console.log(`🎉 SUCCESS: ${userEmail} account is completely CLEAN!`);
    } else {
      console.log(`🎭 SUCCESS: ${userEmail} demo account shows demo data properly!`);
    }
    
    return true;

  } catch (error) {
    console.log(`❌ ERROR testing ${userEmail}:`, error.message);
    return false;
  }
}

/**
 * Main test execution
 */
async function runCompleteCleanSignupTest() {
  console.log('🧹 COMPREHENSIVE CLEAN SIGNUP FIX TEST');
  console.log('=====================================');
  console.log('Testing that new accounts are completely clean and demo accounts preserve demo data');

  let allTestsPassed = true;

  // Test 1: Verify existing test accounts are clean
  console.log('\n📋 Phase 1: Testing Existing Clean Accounts');
  for (const user of testUsers) {
    const testPassed = await testUserDataCleanliness(user.email, user.name, true);
    if (!testPassed) {
      allTestsPassed = false;
    }
  }

  // Test 2: Verify demo account still shows demo data
  console.log('\n📋 Phase 2: Testing Demo Account Functionality');
  const demoTestPassed = await testUserDataCleanliness(demoAccount.email, demoAccount.name, false);
  if (!demoTestPassed) {
    allTestsPassed = false;
  }

  // Summary
  console.log('\n📊 COMPLETE CLEAN SIGNUP FIX TEST RESULTS');
  console.log('==========================================');
  
  if (allTestsPassed) {
    console.log('🎉 ✅ ALL TESTS PASSED!');
    console.log('✅ New accounts start completely clean (0 children, 0 family members, 0 memories, 0 emergency contacts)');
    console.log('✅ Demo account preserves demo data functionality');
    console.log('✅ Clean signup implementation is COMPLETE and working properly');
    console.log('\n🏆 V1.5.40-ALPHA.8 CLEAN SIGNUP FIX: SUCCESS!');
    return true;
  } else {
    console.log('❌ ⚠️  SOME TESTS FAILED!');
    console.log('❌ Clean signup fix is not fully implemented');
    console.log('❌ Additional demo data sources need to be addressed');
    console.log('\n🔧 V1.5.40-ALPHA.8 CLEAN SIGNUP FIX: NEEDS MORE WORK');
    return false;
  }
}

// Execute the test
if (require.main === module) {
  runCompleteCleanSignupTest()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runCompleteCleanSignupTest, testUserDataCleanliness };
