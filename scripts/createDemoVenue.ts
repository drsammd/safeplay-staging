import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDemoVenue() {
  try {
    console.log('🏢 Creating demo venue...');

    // First, let's create a venue admin user if it doesn't exist
    const venueAdminEmail = 'venue-admin@mySafePlay.ai';
    let venueAdmin = await prisma.user.findUnique({
      where: { email: venueAdminEmail }
    });

    if (!venueAdmin) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('demo123', 12);
      
      venueAdmin = await prisma.user.create({
        data: {
          email: venueAdminEmail,
          name: 'Demo Venue Admin',
          password: hashedPassword,
          role: 'VENUE_ADMIN',
          phoneVerified: true,
          identityVerified: true,
          verificationLevel: 'FULLY_VERIFIED'
        }
      });
      console.log('✅ Created venue admin user:', venueAdmin.email);
    } else {
      console.log('✅ Found existing venue admin user:', venueAdmin.email);
    }

    // Create or update demo venue
    const demoVenue = await prisma.venue.upsert({
      where: { 
        name: 'Adventure Playground Demo'
      },
      update: {
        adminId: venueAdmin.id,
        address: '123 Demo Street, Demo City, DC 12345',
        phone: '+1-555-DEMO-123',
        email: 'demo@adventureplayground.com',
        website: 'https://adventureplayground.demo',
        description: 'A demo adventure playground for showcasing mySafePlay™ capabilities',
        capacity: 150,
        operatingHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '20:00', closed: false },
          saturday: { open: '08:00', close: '20:00', closed: false },
          sunday: { open: '10:00', close: '18:00', closed: false }
        },
        amenities: ['playground', 'food_court', 'restrooms', 'parking', 'wifi'],
        safetyFeatures: ['cctv', 'emergency_exits', 'first_aid', 'security_staff'],
        isActive: true,
        subscriptionStatus: 'ACTIVE'
      },
      create: {
        name: 'Adventure Playground Demo',
        adminId: venueAdmin.id,
        address: '123 Demo Street, Demo City, DC 12345',
        phone: '+1-555-DEMO-123',
        email: 'demo@adventureplayground.com',
        website: 'https://adventureplayground.demo',
        description: 'A demo adventure playground for showcasing mySafePlay™ capabilities',
        capacity: 150,
        operatingHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '20:00', closed: false },
          saturday: { open: '08:00', close: '20:00', closed: false },
          sunday: { open: '10:00', close: '18:00', closed: false }
        },
        amenities: ['playground', 'food_court', 'restrooms', 'parking', 'wifi'],
        safetyFeatures: ['cctv', 'emergency_exits', 'first_aid', 'security_staff'],
        isActive: true,
        subscriptionStatus: 'ACTIVE'
      }
    });

    console.log('✅ Created/updated demo venue:', demoVenue.name);

    // Create a demo floor plan for the venue
    const floorPlan = await prisma.floorPlan.upsert({
      where: {
        venueId_name: {
          venueId: demoVenue.id,
          name: 'Main Floor'
        }
      },
      update: {
        description: 'Main floor layout with play areas and facilities',
        imageUrl: '/demo/floor-plan-main.png',
        isActive: true
      },
      create: {
        venueId: demoVenue.id,
        name: 'Main Floor',
        description: 'Main floor layout with play areas and facilities',
        imageUrl: '/demo/floor-plan-main.png',
        uploadedById: venueAdmin.id,
        isActive: true
      }
    });

    console.log('✅ Created/updated floor plan:', floorPlan.name);

    // Create demo zones
    const zones = [
      {
        name: 'Main Play Area',
        type: 'PLAY_AREA',
        coordinates: { x: 50, y: 50, width: 200, height: 150 },
        color: '#3B82F6',
        description: 'Primary play area with climbing structures and slides'
      },
      {
        name: 'Toddler Zone',
        type: 'PLAY_AREA',
        coordinates: { x: 300, y: 50, width: 150, height: 100 },
        color: '#10B981',
        description: 'Safe play area designed for children under 5'
      },
      {
        name: 'Main Entrance',
        type: 'ENTRANCE',
        coordinates: { x: 10, y: 250, width: 80, height: 30 },
        color: '#F59E0B',
        description: 'Primary entrance with check-in/check-out station'
      },
      {
        name: 'Emergency Exit',
        type: 'EXIT',
        coordinates: { x: 400, y: 250, width: 60, height: 30 },
        color: '#EF4444',
        description: 'Emergency exit with direct access to parking'
      },
      {
        name: 'Food Court',
        type: 'FOOD_COURT',
        coordinates: { x: 50, y: 220, width: 120, height: 80 },
        color: '#8B5CF6',
        description: 'Dining area with healthy snacks and beverages'
      }
    ];

    for (const zoneData of zones) {
      await prisma.zone.upsert({
        where: {
          floorPlanId_name: {
            floorPlanId: floorPlan.id,
            name: zoneData.name
          }
        },
        update: zoneData,
        create: {
          ...zoneData,
          floorPlanId: floorPlan.id
        }
      });
    }

    console.log('✅ Created/updated demo zones');

    console.log('\n🎉 Demo venue setup completed!');
    console.log(`📧 Venue Admin Login: ${venueAdminEmail}`);
    console.log(`🔑 Password: demo123`);
    console.log(`🏢 Venue: ${demoVenue.name}`);

  } catch (error) {
    console.error('❌ Error creating demo venue:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createDemoVenue().catch((error) => {
  console.error('Failed to create demo venue:', error);
  process.exit(1);
});
