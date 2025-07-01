
const { PrismaClient } = require('@prisma/client');

async function testRecommendationsAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing Recommendations API...\n');
    
    // 1. Check database data
    console.log('📊 Checking database data...');
    const venues = await prisma.venue.findMany({
      select: { id: true, name: true, adminId: true }
    });
    console.log('Venues found:', venues.length);
    
    const floorPlans = await prisma.floorPlan.findMany({
      select: { id: true, name: true, venueId: true, dimensions: true }
    });
    console.log('Floor plans found:', floorPlans.length);
    
    const cameras = await prisma.camera.findMany({
      select: { id: true, name: true, venueId: true, floorPlanId: true, position: true }
    });
    console.log('Cameras found:', cameras.length);
    
    const zones = await prisma.zone.findMany({
      select: { id: true, name: true, type: true, floorPlanId: true, coordinates: true }
    });
    console.log('Zones found:', zones.length);
    
    if (venues.length === 0 || floorPlans.length === 0) {
      console.log('❌ No venues or floor plans found. Cannot test API.');
      return;
    }
    
    const testVenue = venues[0];
    const testFloorPlan = floorPlans.find(fp => fp.venueId === testVenue.id) || floorPlans[0];
    
    console.log(`\n🎯 Testing with:
    - Venue: ${testVenue.name} (${testVenue.id})
    - Floor Plan: ${testFloorPlan.name} (${testFloorPlan.id})`);
    
    // 2. Test API endpoint without authentication first
    console.log('\n📡 Testing API endpoint without auth...');
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('http://localhost:3000/api/cameras/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueId: testVenue.id,
          floorPlanId: testFloorPlan.id,
          regenerate: true
        })
      });
      
      const result = await response.text();
      console.log('Status:', response.status);
      console.log('Response:', result.substring(0, 500));
      
    } catch (error) {
      console.error('API Error:', error.message);
    }
    
    // 3. Test the recommendation engine directly
    console.log('\n🤖 Testing recommendation engine directly...');
    
    // Import the recommendation engine (simulate it)
    const testFloorPlanData = {
      id: testFloorPlan.id,
      name: testFloorPlan.name,
      dimensions: testFloorPlan.dimensions || { width: 1000, height: 800 }
    };
    
    const testCameras = cameras.filter(c => c.floorPlanId === testFloorPlan.id);
    const testZones = zones.filter(z => z.floorPlanId === testFloorPlan.id);
    
    console.log(`Floor plan dimensions:`, testFloorPlanData.dimensions);
    console.log(`Cameras for this floor plan:`, testCameras.length);
    console.log(`Zones for this floor plan:`, testZones.length);
    
    // 4. Check for data validation issues
    console.log('\n🔍 Checking data validation...');
    
    if (!testFloorPlanData.dimensions) {
      console.log('⚠️  Floor plan missing dimensions');
    }
    
    testZones.forEach((zone, index) => {
      if (!zone.coordinates) {
        console.log(`⚠️  Zone ${index + 1} (${zone.name}) missing coordinates`);
      } else {
        console.log(`✅ Zone ${index + 1} (${zone.name}) has coordinates:`, JSON.stringify(zone.coordinates));
      }
    });
    
    testCameras.forEach((camera, index) => {
      if (!camera.position) {
        console.log(`⚠️  Camera ${index + 1} (${camera.name}) missing position`);
      } else {
        console.log(`✅ Camera ${index + 1} (${camera.name}) has position:`, JSON.stringify(camera.position));
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRecommendationsAPI();
