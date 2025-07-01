const dotenv = require('dotenv');
// Load environment variables
dotenv.config();

const { PrismaClient } = require('@prisma/client');

async function simpleTest() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing with loaded env vars...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    const userCount = await prisma.user.count();
    console.log('👥 Total users:', userCount);
    
    const venueCount = await prisma.venue.count();
    console.log('🏢 Total venues:', venueCount);
    
    const floorPlanCount = await prisma.floorPlan.count();
    console.log('🗺️ Total floor plans:', floorPlanCount);
    
    const cameraCount = await prisma.camera.count();
    console.log('📹 Total cameras:', cameraCount);
    
    // Get the venue admin user
    const venueAdmin = await prisma.user.findFirst({
      where: { email: 'venue@safeplay.com' }
    });
    
    if (venueAdmin) {
      console.log('✅ Venue admin found:', venueAdmin.email, 'ID:', venueAdmin.id);
      
      // Get their venues
      const venues = await prisma.venue.findMany({
        where: { adminId: venueAdmin.id },
        include: { 
          floorPlans: {
            include: {
              zones: true
            }
          }
        }
      });
      
      console.log('🏢 Admin venues:', venues.length);
      
      if (venues.length > 0) {
        const venue = venues[0];
        console.log(`\n🎯 VENUE DATA:`);
        console.log(`Venue ID: ${venue.id}`);
        console.log(`Venue Name: ${venue.name}`);
        console.log(`Floor Plans: ${venue.floorPlans.length}`);
        
        if (venue.floorPlans.length > 0) {
          const fp = venue.floorPlans[0];
          console.log(`\n🗺️ FLOOR PLAN DATA:`);
          console.log(`Floor Plan ID: ${fp.id}`);
          console.log(`Floor Plan Name: ${fp.name}`);
          console.log(`Zones: ${fp.zones.length}`);
          
          // Test the exact API call parameters
          console.log(`\n🎯 API TEST PARAMETERS:`);
          console.log(`venueId: "${venue.id}"`);
          console.log(`floorPlanId: "${fp.id}"`);
          
          console.log(`\n📋 CURL TEST COMMAND:`);
          console.log(`curl -X POST http://localhost:3001/api/cameras/recommendations \\`);
          console.log(`  -H "Content-Type: application/json" \\`);
          console.log(`  -d '{"venueId": "${venue.id}", "floorPlanId": "${fp.id}", "regenerate": true}'`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simpleTest();
