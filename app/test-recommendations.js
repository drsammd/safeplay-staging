// This script will be accessible via http://localhost:3001/test-recommendations.js
// and can use the NextJS context

window.testRecommendations = async function() {
  console.log('🧪 Testing recommendations API...');
  
  try {
    // First try without authentication to see what happens
    const response = await fetch('/api/cameras/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venueId: 'test-venue-id',
        floorPlanId: 'test-floor-plan-id',
        regenerate: true
      })
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log('📡 Response body:', result);
    
    if (response.status === 401) {
      console.log('🔐 Authentication required (expected)');
      console.log('👉 Please login first, then call this function again');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
};

console.log('✅ Test function loaded. Call window.testRecommendations() to test.');
