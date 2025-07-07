// @ts-nocheck

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDemoFloorPlan() {
  console.log('🏗️ Creating demo floor plan and zones...');

  try {
    // Find the demo venue
    const venue = await prisma.venue.findFirst({
      where: { name: 'Adventure Playground Demo' }
    });

    if (!venue) {
      console.log('❌ Demo venue not found. Please run seed-venue-demo.ts first.');
      return;
    }

    // Find the venue admin
    const venueAdmin = await prisma.user.findFirst({
      where: { email: 'venue@demo.com' }
    });

    if (!venueAdmin) {
      console.log('❌ Venue admin not found.');
      return;
    }

    // Check if floor plan already exists
    const existingFloorPlan = await prisma.floorPlan.findFirst({
      where: { venueId: venue.id }
    });

    if (existingFloorPlan) {
      console.log('✅ Floor plan already exists');
      return;
    }

    // Create floor plan with a real playground layout image
    const floorPlan = await prisma.floorPlan.create({
      data: {
        name: 'Adventure Playground Main Floor',
        description: 'Main floor plan showing play areas, entrance, and safety zones',
        imageUrl: 'https://i.pinimg.com/736x/f3/ac/17/f3ac1781405fd89e7527ee0970ab5bd5.jpg',
        imageKey: 'floor-plans/adventure-playground-main.jpg',
        width: 1200,
        height: 800,
        scale: 1.0, // 1 pixel = 1 unit
        version: 1,
        isActive: true,
        venueId: venue.id,
        uploadedBy: venueAdmin.id,
        metadata: {
          uploadType: 'demo',
          version: '1.0',
          description: 'Demo floor plan for Adventure Playground'
        }
      }
    });

    console.log(`✅ Created floor plan: ${floorPlan.name}`);

    // Create zones for the floor plan
    const zones = [
      {
        name: 'Main Entrance',
        type: 'ENTRANCE',
        coordinates: [
          { x: 50, y: 20 },
          { x: 200, y: 20 },
          { x: 200, y: 100 },
          { x: 50, y: 100 }
        ],
        color: '#10B981',
        description: 'Primary entrance and check-in area'
      },
      {
        name: 'Play Area A',
        type: 'PLAY_AREA',
        coordinates: [
          { x: 250, y: 100 },
          { x: 450, y: 100 },
          { x: 450, y: 250 },
          { x: 250, y: 250 }
        ],
        color: '#3B82F6',
        description: 'Main play area for ages 6-12',
        capacity: 25
      },
      {
        name: 'Play Area B',
        type: 'PLAY_AREA',
        coordinates: [
          { x: 500, y: 100 },
          { x: 700, y: 100 },
          { x: 700, y: 250 },
          { x: 500, y: 250 }
        ],
        color: '#8B5CF6',
        description: 'Secondary play area for ages 8-14',
        capacity: 20
      },
      {
        name: 'Toddler Zone',
        type: 'TODDLER_AREA',
        coordinates: [
          { x: 100, y: 450 },
          { x: 280, y: 450 },
          { x: 280, y: 550 },
          { x: 100, y: 550 }
        ],
        color: '#F59E0B',
        description: 'Safe play area for toddlers ages 2-5',
        capacity: 15
      },
      {
        name: 'Climbing Zone',
        type: 'CLIMBING_AREA',
        coordinates: [
          { x: 250, y: 300 },
          { x: 430, y: 300 },
          { x: 430, y: 420 },
          { x: 250, y: 420 }
        ],
        color: '#EF4444',
        description: 'Rock climbing and adventure area',
        capacity: 12
      },
      {
        name: 'Ball Pit',
        type: 'BALL_PIT',
        coordinates: [
          { x: 500, y: 300 },
          { x: 650, y: 300 },
          { x: 650, y: 400 },
          { x: 500, y: 400 }
        ],
        color: '#06B6D4',
        description: 'Ball pit area for active play',
        capacity: 18
      },
      {
        name: 'Snack Bar',
        type: 'FOOD_AREA',
        coordinates: [
          { x: 350, y: 450 },
          { x: 470, y: 450 },
          { x: 470, y: 530 },
          { x: 350, y: 530 }
        ],
        color: '#84CC16',
        description: 'Food and beverage area',
        capacity: 30
      },
      {
        name: 'Restrooms',
        type: 'RESTROOM',
        coordinates: [
          { x: 550, y: 450 },
          { x: 650, y: 450 },
          { x: 650, y: 510 },
          { x: 550, y: 510 }
        ],
        color: '#6B7280',
        description: 'Restroom facilities'
      },
      {
        name: 'Exit Zone',
        type: 'EXIT',
        coordinates: [
          { x: 650, y: 200 },
          { x: 750, y: 200 },
          { x: 750, y: 400 },
          { x: 650, y: 400 }
        ],
        color: '#DC2626',
        description: 'Emergency exit area'
      }
    ];

    // Create all zones
    for (const zoneData of zones) {
      await prisma.floorPlanZone.create({
        data: {
          name: zoneData.name,
          type: zoneData.type,
          coordinates: zoneData.coordinates,
          color: zoneData.color,
          description: zoneData.description,
          capacity: zoneData.capacity,
          isActive: true,
          floorPlanId: floorPlan.id
        }
      });
    }

    console.log(`✅ Created ${zones.length} floor plan zones`);
    console.log('🎉 Demo floor plan setup completed successfully!');

  } catch (error) {
    console.error('❌ Error creating demo floor plan:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDemoFloorPlan();
