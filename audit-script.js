
const { chromium } = require('playwright');
const fs = require('fs');

async function auditModules() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    admin: { working: [], broken: [], errors: [] },
    venue: { working: [], broken: [], errors: [] },
    timestamp: new Date().toISOString()
  };

  // Admin routes to test
  const adminRoutes = [
    '/admin',
    '/admin/analytics',
    '/admin/discount-codes',
    '/admin/email-automation',
    '/admin/venues',
    '/admin/discount-analytics',
    '/admin/payments',
    '/admin/verification'
  ];

  // Venue admin routes to test
  const venueRoutes = [
    '/venue-admin',
    '/venue-admin/kiosks',
    '/venue-admin/pickup',
    '/venue-admin/payment-setup',
    '/venue-admin/advanced-zones',
    '/venue-admin/revenue',
    '/venue-admin/ai-features',
    '/venue-admin/biometric',
    '/venue-admin/qr-codes',
    '/venue-admin/zone-configuration',
    '/venue-admin/zone-analytics',
    '/venue-admin/emergency-management',
    '/venue-admin/demo',
    '/venue-admin/floor-plans',
    '/venue-admin/tracking',
    '/venue-admin/alerts',
    '/venue-admin/check-in-out',
    '/venue-admin/ai-analytics'
  ];

  console.log('🔍 Starting comprehensive audit...');

  try {
    // First, login as admin
    console.log('🔐 Logging in as admin...');
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForTimeout(2000);
    
    await page.fill('#email', 'admin@mysafeplay.ai');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Test Admin routes
    console.log('🏢 Testing Admin module routes...');
    for (const route of adminRoutes) {
      try {
        console.log(`Testing: ${route}`);
        const response = await page.goto(`http://localhost:3000${route}`);
        await page.waitForTimeout(2000);
        
        const status = response.status();
        const url = page.url();
        const title = await page.title();
        
        // Check for error indicators
        const hasError = await page.locator('text=Error').count() > 0;
        const hasAccessDenied = await page.locator('text=Access Denied').count() > 0;
        const hasUnauthorized = await page.locator('text=Unauthorized').count() > 0;
        const redirectedToDashboard = url.includes('/dashboard') && !route.includes('/dashboard');
        
        if (status === 200 && !hasError && !hasAccessDenied && !hasUnauthorized && !redirectedToDashboard) {
          results.admin.working.push({ route, status, url, title });
        } else {
          results.admin.broken.push({ 
            route, 
            status, 
            url, 
            title,
            issues: {
              hasError,
              hasAccessDenied,
              hasUnauthorized,
              redirectedToDashboard
            }
          });
        }
      } catch (error) {
        results.admin.errors.push({ route, error: error.message });
      }
    }

    // Now login as venue admin
    console.log('🔐 Logging in as venue admin...');
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForTimeout(2000);
    
    await page.fill('#email', 'venue@mysafeplay.ai');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Test Venue routes
    console.log('🏟️ Testing Venue Admin module routes...');
    for (const route of venueRoutes) {
      try {
        console.log(`Testing: ${route}`);
        const response = await page.goto(`http://localhost:3000${route}`);
        await page.waitForTimeout(2000);
        
        const status = response.status();
        const url = page.url();
        const title = await page.title();
        
        // Check for error indicators
        const hasError = await page.locator('text=Error').count() > 0;
        const hasAccessDenied = await page.locator('text=Access Denied').count() > 0;
        const hasUnauthorized = await page.locator('text=Unauthorized').count() > 0;
        const redirectedToDashboard = url.includes('/dashboard') && !route.includes('/dashboard');
        
        if (status === 200 && !hasError && !hasAccessDenied && !hasUnauthorized && !redirectedToDashboard) {
          results.venue.working.push({ route, status, url, title });
        } else {
          results.venue.broken.push({ 
            route, 
            status, 
            url, 
            title,
            issues: {
              hasError,
              hasAccessDenied,
              hasUnauthorized,
              redirectedToDashboard
            }
          });
        }
      } catch (error) {
        results.venue.errors.push({ route, error: error.message });
      }
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
    results.errors = [error.message];
  }

  await browser.close();
  
  // Save results
  fs.writeFileSync('/tmp/admin_audit.json', JSON.stringify(results, null, 2));
  
  console.log('\n📊 AUDIT SUMMARY:');
  console.log(`✅ Admin Working: ${results.admin.working.length}`);
  console.log(`❌ Admin Broken: ${results.admin.broken.length}`);
  console.log(`⚠️ Admin Errors: ${results.admin.errors.length}`);
  console.log(`✅ Venue Working: ${results.venue.working.length}`);
  console.log(`❌ Venue Broken: ${results.venue.broken.length}`);
  console.log(`⚠️ Venue Errors: ${results.venue.errors.length}`);
  
  return results;
}

if (require.main === module) {
  auditModules().catch(console.error);
}

module.exports = { auditModules };
