// Test login and floor plans API
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Starting login test...');
    
    // Manually test the login first by accessing the page
    const response = await fetch('http://localhost:3000/auth/signin');
    console.log('Login page status:', response.status);
    
    // Test if venue-admin floor plans page is accessible (should redirect to login)
    const floorPlansResponse = await fetch('http://localhost:3000/venue-admin/floor-plans');
    console.log('Floor plans page (no auth) status:', floorPlansResponse.status);
    
    console.log('Manual login required - please login via browser');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
