// @ts-nocheck

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
        imageUrl: 'https://i.pinimg.com/736x/f3/ac/17/f3ac1781405fd89e7527ee0970ab5bd5.jpg', // Demo floor plan image
        imageKey: 'floor-plans/demo-main-area.png',
        width: 1200,
        height: 800,
        scale: 0.01, // 1cm per pixel
        version: 1,
        isActive: true,
        venueId: venue.id,
        uploadedBy: venueAdmin.id,
        metadata: {
          uploadType: 'sample',
          version: '1.0'
        }
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
          type: 'DOME',
          brand: 'SafeCam',
          model: 'SafeCam Pro 4K',
          serialNumber: 'SC-ENT-001',
          ipAddress: '192.168.1.101',
          streamUrl: 'rtsp://192.168.1.101:554/stream1',
          status: 'ONLINE',
          coordinates: { x: 200, y: 80 },
          orientation: 45,
          resolution: '4K',
          frameRate: 30,
          fieldOfView: 90,
          nightVision: true,
          motionDetection: true,
          isActive: true,
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
          position: { x: 750, y: 450 },
          viewAngle: 100,
          viewDistance: 18,
          rotation: 270,
          height: 3.5,
          isRecordingEnabled: true,
          isRecognitionEnabled: true,
          recognitionThreshold: 0.88,
          specifications: {
            resolution: '1080p',
            fps: 25,
            nightVision: false,
            weatherProof: false
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

      // Emergency Exit Camera
      prisma.camera.create({
        data: {
          name: 'Emergency Exit Camera',
          model: 'SafeCam Pro 4K',
          serialNumber: 'SC-EX-001',
          ipAddress: '192.168.1.104',
          streamUrl: 'rtsp://192.168.1.104:554/stream1',
          status: 'MAINTENANCE',
          position: { x: 1000, y: 350 },
          viewAngle: 70,
          viewDistance: 12,
          rotation: 180,
          height: 2.8,
          isRecordingEnabled: true,
          isRecognitionEnabled: true,
          recognitionThreshold: 0.92,
          specifications: {
            resolution: '4K',
            fps: 30,
            nightVision: true,
            weatherProof: true
          },
          configuration: {
            motionDetection: true,
            audioRecording: true,
            alertsEnabled: true
          },
          venueId: venue.id,
          floorPlanId: floorPlan.id,
          lastPing: new Date(Date.now() - 300000) // 5 minutes ago
        }
      }),

      // Food Court Camera
      prisma.camera.create({
        data: {
          name: 'Food Court Camera',
          model: 'SafeCam Compact',
          serialNumber: 'SC-FC-001',
          ipAddress: '192.168.1.105',
          status: 'OFFLINE',
          position: { x: 200, y: 675 },
          viewAngle: 80,
          viewDistance: 10,
          rotation: 315,
          height: 2.5,
          isRecordingEnabled: false,
          isRecognitionEnabled: false,
          recognitionThreshold: 0.80,
          specifications: {
            resolution: '720p',
            fps: 20,
            nightVision: false,
            weatherProof: false
          },
          configuration: {
            motionDetection: false,
            audioRecording: false,
            alertsEnabled: false
          },
          venueId: venue.id,
          floorPlanId: floorPlan.id
        }
      })
    ]);

    console.log(`Created ${cameras.length} cameras`);

    // Create camera coverage areas for online cameras
    const onlineCameras = cameras.filter(camera => camera.status === 'ONLINE');
    
    for (const camera of onlineCameras) {
      // Calculate simple coverage area polygon
      const coveragePolygon = calculateCoveragePolygon(
        camera.position as { x: number; y: number },
        camera.viewAngle || 60,
        camera.viewDistance || 10,
        camera.rotation || 0
      );

      await prisma.cameraCoverageArea.create({
        data: {
          cameraId: camera.id,
          area: coveragePolygon,
          confidence: 0.95,
          metadata: {
            calculatedAt: new Date().toISOString(),
            algorithm: 'geometric_projection',
            area: calculatePolygonArea(coveragePolygon)
          }
        }
      });
    }

    console.log(`Created coverage areas for ${onlineCameras.length} online cameras`);

    // Create camera events
    const cameraEvents = await Promise.all([
      prisma.cameraEvent.create({
        data: {
          type: 'ONLINE',
          description: 'Camera came online',
          severity: 'INFO',
          cameraId: cameras[0].id,
          venueId: venue.id,
          metadata: {
            timestamp: new Date().toISOString(),
            previousStatus: 'OFFLINE'
          }
        }
      }),
      prisma.cameraEvent.create({
        data: {
          type: 'MAINTENANCE_REQUIRED',
          description: 'Camera requires scheduled maintenance',
          severity: 'WARNING',
          cameraId: cameras[3].id, // Emergency exit camera
          venueId: venue.id,
          metadata: {
            maintenanceType: 'lens_cleaning',
            scheduledDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
          }
        }
      }),
      prisma.cameraEvent.create({
        data: {
          type: 'OFFLINE',
          description: 'Camera connection lost',
          severity: 'ERROR',
          cameraId: cameras[4].id, // Food court camera
          venueId: venue.id,
          metadata: {
            lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            reason: 'network_timeout'
          }
        }
      })
    ]);

    console.log(`Created ${cameraEvents.length} camera events`);

    // Create camera recommendations
    const recommendations = await Promise.all([
      prisma.cameraRecommendation.create({
        data: {
          venueId: venue.id,
          floorPlanId: floorPlan.id,
          recommendationType: 'COVERAGE_GAP',
          suggestedPosition: { x: 600, y: 300 },
          reasoning: 'Large uncovered area detected in central play zone',
          priority: 'HIGH',
          coverageArea: [
            { x: 600, y: 300 },
            { x: 650, y: 280 },
            { x: 700, y: 300 },
            { x: 650, y: 320 }
          ],
          estimatedCost: 1500,
          status: 'PENDING',
          metadata: {
            uncoveredArea: 120,
            expectedImprovement: 0.15
          }
        }
      }),
      prisma.cameraRecommendation.create({
        data: {
          venueId: venue.id,
          floorPlanId: floorPlan.id,
          recommendationType: 'BLIND_SPOT',
          suggestedPosition: { x: 450, y: 500 },
          reasoning: 'Blind spot created by play equipment obstacle',
          priority: 'MEDIUM',
          coverageArea: [
            { x: 450, y: 500 },
            { x: 480, y: 485 },
            { x: 510, y: 500 },
            { x: 480, y: 515 }
          ],
          estimatedCost: 1200,
          status: 'PENDING',
          metadata: {
            obstacleType: 'play_structure',
            blindSpotSize: 25
          }
        }
      })
    ]);

    console.log(`Created ${recommendations.length} camera recommendations`);

    console.log('✅ Floor plans and cameras seeded successfully!');
    console.log('\nSample Data Created:');
    console.log(`- 1 Floor Plan: "${floorPlan.name}"`);
    console.log(`- ${zones.length} Zones: Entrance, Play Area, Emergency Exit, Food Court`);
    console.log(`- ${cameras.length} Cameras: Various statuses and configurations`);
    console.log(`- ${onlineCameras.length} Coverage Areas for online cameras`);
    console.log(`- ${cameraEvents.length} Camera Events`);
    console.log(`- ${recommendations.length} Camera Recommendations`);
    
    console.log('\n🎯 Test the system by:');
    console.log('1. Login as venue@mysafeplay.ai / venue123');
    console.log('2. Navigate to "Floor Plans & Cameras" in the venue admin dashboard');
    console.log('3. View the sample floor plan and interact with cameras');
    console.log('4. Try placing new cameras and viewing coverage analysis');

  } catch (error) {
    console.error('Error seeding floor plans and cameras:', error);
    throw error;
  }
}

// Helper function to calculate coverage polygon
function calculateCoveragePolygon(
  position: { x: number; y: number },
  viewAngle: number,
  viewDistance: number,
  rotation: number
): Array<{ x: number; y: number }> {
  const points = [position]; // Start with camera position
  
  const startAngle = rotation - (viewAngle / 2);
  const endAngle = rotation + (viewAngle / 2);
  const angleStep = viewAngle / 8; // 8 points for coverage

  // Generate arc points
  for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
    const radians = (angle * Math.PI) / 180;
    const x = position.x + Math.cos(radians) * viewDistance * 10; // Scale for screen coordinates
    const y = position.y + Math.sin(radians) * viewDistance * 10;
    points.push({ x, y });
  }

  // Close the polygon
  points.push(position);

  return points;
}

// Helper function to calculate polygon area
function calculatePolygonArea(polygon: Array<{ x: number; y: number }>): number {
  if (polygon.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < polygon.length - 1; i++) {
    area += (polygon[i].x * polygon[i + 1].y) - (polygon[i + 1].x * polygon[i].y);
  }
  
  return Math.abs(area) / 2;
}

// Main execution
if (require.main === module) {
  seedFloorPlansAndCameras()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default seedFloorPlansAndCameras;
