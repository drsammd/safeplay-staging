
const { chromium } = require('playwright');

async function testSubscriptionFix() {
  console.log('🔍 Testing subscription fix...\n');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForLoadState('networkidle');

    // Fill in demo account credentials
    console.log('2. Logging in with demo account...');
    await page.fill('input[type="email"]', 'john@doe.com');
    await page.fill('input[type="password"]', 'johndoe123');
    
    // Submit login form
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('3. Login successful! Navigating to account page...');
    
    // Navigate to account page
    await page.goto('http://localhost:3000/parent/account');
    await page.waitForLoadState('networkidle');
    
    // Wait a moment for the API call to complete
    await page.waitForTimeout(3000);
    
    console.log('4. Checking subscription section...');
    
    // Check if the page contains subscription information
    const subscriptionSection = await page.locator('text=Subscription').first();
    const isSubscriptionSectionVisible = await subscriptionSection.isVisible();
    
    if (isSubscriptionSectionVisible) {
      console.log('✅ Subscription section found');
      
      // Check for loading state
      const loadingText = await page.locator('text=Loading subscription data').first();
      const isLoading = await loadingText.isVisible().catch(() => false);
      
      if (isLoading) {
        console.log('⏳ Still loading, waiting...');
        await page.waitForTimeout(5000);
      }
      
      // Check for "No Active Subscription" (for users without subscription)
      const noSubscription = await page.locator('text=No Active Subscription').first();
      const hasNoSubscription = await noSubscription.isVisible().catch(() => false);
      
      // Check for actual subscription data
      const basicPlanOld = await page.locator('text=Basic Plan').first();
      const hasBasicPlan = await basicPlanOld.isVisible().catch(() => false);
      
      const trialingStatus = await page.locator('text=trialing').first();
      const hasTrialing = await trialingStatus.isVisible().catch(() => false);
      
      // Check for hardcoded data (this should NOT be present)
      const hardcodedPrice = await page.locator('text=$9.99/month').first();
      const hasHardcodedPrice = await hardcodedPrice.isVisible().catch(() => false);
      
      const hardcodedActive = await page.locator('text=Status: active').first();
      const hasHardcodedActive = await hardcodedActive.isVisible().catch(() => false);
      
      console.log('\n📊 Subscription Status Results:');
      console.log(`- Has "No Active Subscription": ${hasNoSubscription}`);
      console.log(`- Has Basic Plan: ${hasBasicPlan}`);
      console.log(`- Has Trialing Status: ${hasTrialing}`);
      console.log(`- Has hardcoded $9.99/month (should be false): ${hasHardcodedPrice}`);
      console.log(`- Has hardcoded "active" status (should be false): ${hasHardcodedActive}`);
      
      if (hasNoSubscription) {
        console.log('\n✅ SUCCESS: Users without subscription see "No Active Subscription"');
      } else if (hasBasicPlan && hasTrialing && !hasHardcodedPrice && !hasHardcodedActive) {
        console.log('\n✅ SUCCESS: Users with subscription see real subscription data (not hardcoded)');
      } else if (hasHardcodedPrice || hasHardcodedActive) {
        console.log('\n❌ FAILURE: Still showing hardcoded subscription data');
      } else {
        console.log('\n⚠️  PARTIAL: Unexpected subscription state detected');
      }
      
      // Get the full HTML content of the subscription section for debugging
      const subscriptionHTML = await page.locator('div.card:has(text("Subscription"))').innerHTML();
      console.log('\n🔍 Subscription Section HTML (first 500 chars):');
      console.log(subscriptionHTML.substring(0, 500) + '...');
      
    } else {
      console.log('❌ Subscription section not found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testSubscriptionFix();
