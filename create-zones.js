
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createZones() {
  console.log('🎭 Creating zones for floor plan...');
  
  try {
    const floorPlan = await prisma.floorPlan.findFirst({
      where: { name: 'Main Play Area Floor Plan' }
    });
    
    if (!floorPlan) {
      console.log('❌ Floor plan not found');
      return;
    }
    
    console.log('✅ Found floor plan:', floorPlan.name);
    
    // Create zones
    const zonesToCreate = [
      {
        name: 'Main Entrance',
        type: 'ENTRANCE',
        coordinates: [
          { x: 50, y: 50 },
          { x: 250, y: 50 },
          { x: 250, y: 150 },
          { x: 50, y: 150 }
        ],
        color: '#22C55E',
        description: 'Main entrance area for children check-in'
      },
      {
        name: 'Emergency Exit',
        type: 'EXIT',
        coordinates: [
          { x: 950, y: 650 },
          { x: 1150, y: 650 },
          { x: 1150, y: 750 },
          { x: 950, y: 750 }
        ],
        color: '#EF4444',
        description: 'Emergency exit route'
      },
      {
        name: 'Central Play Area',
        type: 'PLAY_AREA',
        coordinates: [
          { x: 300, y: 200 },
          { x: 900, y: 200 },
          { x: 900, y: 600 },
          { x: 300, y: 600 }
        ],
        color: '#3B82F6',
        description: 'Main children play area'
      },
      {
        name: 'Food Court',
        type: 'FOOD_COURT',
        coordinates: [
          { x: 100, y: 200 },
          { x: 280, y: 200 },
          { x: 280, y: 400 },
          { x: 100, y: 400 }
        ],
        color: '#F59E0B',
        description: 'Food and beverage area'
      }
    ];
    
    console.log('🚀 Creating', zonesToCreate.length, 'zones...');
    
    for (const zone of zonesToCreate) {
      try {
        const createdZone = await prisma.floorPlanZone.create({
          data: {
            name: zone.name,
            type: zone.type,
            coordinates: zone.coordinates,
            color: zone.color,
            description: zone.description,
            floorPlanId: floorPlan.id
          }
        });
        
        console.log('✅ Created zone:', createdZone.name);
      } catch (error) {
        console.log('❌ Failed to create zone', zone.name, ':', error.message);
      }
    }
    
    // Verify zones were created
    const zones = await prisma.floorPlanZone.findMany({
      where: { floorPlanId: floorPlan.id }
    });
    
    console.log('✅ Total zones in database:', zones.length);
    zones.forEach(zone => {
      console.log('  🎭', zone.name, '-', zone.type);
    });
    
  } catch (error) {
    console.error('❌ Error creating zones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createZones();
