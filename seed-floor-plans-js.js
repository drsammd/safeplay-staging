
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedFloorPlansAndCameras() {
  console.log('🌱 Seeding floor plans and cameras...');

  try {
    // Get the existing demo venue
    const venue = await prisma.venue.findFirst({
      where: {
        admin: {
          email: 'venue@mysafeplay.ai'
        }
      }
    });

    if (!venue) {
      console.log('Demo venue not found. Please run the main seed script first.');
      return;
    }

    console.log(`Found venue: ${venue.name}`);

    // Get the venue admin user
    const venueAdmin = await prisma.user.findUnique({
      where: { email: 'venue@mysafeplay.ai' }
    });

    if (!venueAdmin) {
      console.log('Venue admin not found.');
      return;
    }

    // Create sample floor plan
    const floorPlan = await prisma.floorPlan.create({
      data: {
        name: 'Main Play Area Floor Plan',
        description: 'Primary floor plan showing the main play area, entrance, and safety zones',
        fileUrl: '/backgrounds/venue_bg.png',
        fileType: 'PNG',
        originalFileName: 'main_floor_plan.png',
        fileSize: 1024000,
        dimensions: {
          width: 1200,
          height: 800,
          scale: 0.01
        },
        metadata: {
          uploadType: 'sample',
          version: '1.0'
        },
        version: 1,
        isActive: true,
        venueId: venue.id,
        uploadedBy: venueAdmin.id
      }
    });

    console.log(`Created floor plan: ${floorPlan.name}`);

    // Create floor plan zones
    const zones = await Promise.all([
      prisma.floorPlanZone.create({
        data: {
          name: 'Main Entrance',
          type: 'ENTRANCE',
          coordinates: [
            { x: 100, y: 100 },
            { x: 300, y: 100 },
            { x: 300, y: 200 },
            { x: 100, y: 200 }
          ],
          color: '#10B981',
          description: 'Primary entrance for guests',
          floorPlanId: floorPlan.id
        }
      }),
      prisma.floorPlanZone.create({
        data: {
          name: 'Play Area',
          type: 'PLAY_AREA',
          coordinates: [
            { x: 350, y: 150 },
            { x: 900, y: 150 },
            { x: 900, y: 600 },
            { x: 350, y: 600 }
          ],
          color: '#3B82F6',
          description: 'Main children play area',
          floorPlanId: floorPlan.id
        }
      }),
      prisma.floorPlanZone.create({
        data: {
          name: 'Emergency Exit',
          type: 'EMERGENCY_EXIT',
          coordinates: [
            { x: 950, y: 300 },
            { x: 1100, y: 300 },
            { x: 1100, y: 400 },
            { x: 950, y: 400 }
          ],
          color: '#EF4444',
          description: 'Emergency exit route',
          floorPlanId: floorPlan.id
        }
      }),
      prisma.floorPlanZone.create({
        data: {
          name: 'Food Court',
          type: 'FOOD_COURT',
          coordinates: [
            { x: 100, y: 600 },
            { x: 300, y: 600 },
            { x: 300, y: 750 },
            { x: 100, y: 750 }
          ],
          color: '#F59E0B',
          description: 'Food and beverage area',
          floorPlanId: floorPlan.id
        }
      })
    ]);

    console.log(`Created ${zones.length} floor plan zones`);

    // Create sample cameras
    const cameras = await Promise.all([
      // Entrance Camera
      prisma.camera.create({
        data: {
          name: 'Entrance Camera 1',
          model: 'SafeCam Pro 4K',
          serialNumber: 'SC-ENT-001',
          ipAddress: '192.168.1.101',
          streamUrl: 'rtsp://192.168.1.101:554/stream1',
          status: 'ONLINE',
          position: { x: 200, y: 80 },
          viewAngle: 90,
          viewDistance: 15,
          rotation: 45,
          height: 3.0,
          isRecordingEnabled: true,
          isRecognitionEnabled: true,
          recognitionThreshold: 0.90,
          specifications: {
            resolution: '4K',
            fps: 30,
            nightVision: true,
            weatherProof: true
          },
          configuration: {
            motionDetection: true,
            audioRecording: false,
            alertsEnabled: true
          },
          venueId: venue.id,
          floorPlanId: floorPlan.id,
          lastPing: new Date()
        }
      }),

      // Play Area Camera 1
      prisma.camera.create({
        data: {
          name: 'Play Area Camera 1',
          model: 'SafeCam Standard HD',
          serialNumber: 'SC-PA-001',
          ipAddress: '192.168.1.102',
          streamUrl: 'rtsp://192.168.1.102:554/stream1',
          status: 'ONLINE',
          position: { x: 500, y: 200 },
          viewAngle: 110,
          viewDistance: 20,
          rotation: 135,
          height: 4.0,
          isRecordingEnabled: true,
          isRecognitionEnabled: true,
          recognitionThreshold: 0.85,
          specifications: {
            resolution: '1080p',
            fps: 25,
            nightVision: false,
            weatherProof: false
          },
          configuration: {
            motionDetection: true,
            audioRecording: true,
            alertsEnabled: true
          },
          venueId: venue.id,
          floorPlanId: floorPlan.id,
          lastPing: new Date()
        }
      }),

      // Play Area Camera 2
      prisma.camera.create({
        data: {
          name: 'Play Area Camera 2',
          model: 'SafeCam Standard HD',
          serialNumber: 'SC-PA-002',
          ipAddress: '192.168.1.103',
          streamUrl: 'rtsp://192.168.1.103:554/stream1',
          status: 'ONLINE',
          position: { x: 750, y: 400 },
          viewAngle: 120,
          viewDistance: 18,
          rotation: 225,
          height: 3.5,
          isRecordingEnabled: true,
          isRecognitionEnabled: true,
          recognitionThreshold: 0.85,
          specifications: {
            resolution: '1080p',
            fps: 25,
            nightVision: false,
            weatherProof: false
          },
          configuration: {
            motionDetection: true,
            audioRecording: true,
            alertsEnabled: true
          },
          venueId: venue.id,
          floorPlanId: floorPlan.id,
          lastPing: new Date()
        }
      }),

      // Emergency Exit Camera
      prisma.camera.create({
        data: {
          name: 'Emergency Exit Camera',
          model: 'SafeCam Pro 4K',
          serialNumber: 'SC-EXIT-001',
          ipAddress: '192.168.1.104',
          streamUrl: 'rtsp://192.168.1.104:554/stream1',
          status: 'ONLINE',
          position: { x: 1025, y: 280 },
          viewAngle: 80,
          viewDistance: 12,
          rotation: 270,
          height: 2.8,
          isRecordingEnabled: true,
          isRecognitionEnabled: true,
          recognitionThreshold: 0.95,
          specifications: {
            resolution: '4K',
            fps: 30,
            nightVision: true,
            weatherProof: true
          },
          configuration: {
            motionDetection: true,
            audioRecording: false,
            alertsEnabled: true
          },
          venueId: venue.id,
          floorPlanId: floorPlan.id,
          lastPing: new Date()
        }
      })
    ]);

    console.log(`Created ${cameras.length} cameras`);

    console.log('✅ Successfully seeded floor plans and cameras!');
    
    // Print summary
    console.log('\n📊 Seeding Summary:');
    console.log(`- Floor Plans: 1`);
    console.log(`- Zones: ${zones.length}`);
    console.log(`- Cameras: ${cameras.length}`);
    console.log(`- Venue: ${venue.name}`);
    
  } catch (error) {
    console.error('❌ Error seeding floor plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFloorPlansAndCameras();
