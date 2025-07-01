const { PrismaClient } = require('@prisma/client');

async function testDB() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // First, check if venue admin exists
    const venueAdmin = await prisma.user.findFirst({
      where: { email: 'venue@safeplay.com' }
    });
    
    if (!venueAdmin) {
      console.log('❌ Venue admin user not found');
      return;
    }
    
    console.log('✅ Venue admin found:', {
      id: venueAdmin.id,
      email: venueAdmin.email,
      role: venueAdmin.role
    });
    
    // Find venues for this admin
    const venues = await prisma.venue.findMany({
      where: { adminId: venueAdmin.id },
      include: { floorPlans: true }
    });
    
    console.log('🏢 Venues for admin:', venues.length);
    
    if (venues.length === 0) {
      console.log('❌ No venues found for admin');
      return;
    }
    
    const venue = venues[0];
    console.log('🏢 Using venue:', {
      id: venue.id,
      name: venue.name,
      floorPlansCount: venue.floorPlans.length
    });
    
    if (venue.floorPlans.length === 0) {
      console.log('❌ No floor plans found for venue');
      return;
    }
    
    const floorPlan = venue.floorPlans[0];
    console.log('🗺️ Using floor plan:', {
      id: floorPlan.id,
      name: floorPlan.name,
      dimensions: floorPlan.dimensions
    });
    
    // Check zones and cameras
    const zones = await prisma.zone.findMany({
      where: { floorPlanId: floorPlan.id }
    });
    
    const cameras = await prisma.camera.findMany({
      where: { venueId: venue.id }
    });
    
    console.log('📊 Data summary:', {
      zones: zones.length,
      cameras: cameras.length
    });
    
    console.log('🎯 Zones:', zones.map(z => ({ 
      id: z.id, 
      name: z.name, 
      type: z.type,
      coordinates: z.coordinates 
    })));
    
    console.log('📹 Cameras:', cameras.map(c => ({ 
      id: c.id, 
      name: c.name, 
      position: c.position,
      viewAngle: c.viewAngle,
      viewDistance: c.viewDistance
    })));
    
    // Test direct API call parameters
    console.log('🎯 API Test Parameters:');
    console.log(`venueId: "${venue.id}"`);
    console.log(`floorPlanId: "${floorPlan.id}"`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
