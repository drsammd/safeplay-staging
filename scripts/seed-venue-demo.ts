
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Demo avatar images
const DEMO_AVATARS = [
  'https://cdn.abacus.ai/images/f4c211d6-381f-4a4c-9f9e-c83c1f16262a.png', // Girl with curly brown hair
  'https://cdn.abacus.ai/images/717d6bf8-00ba-428a-be06-751273e7c291.png', // Boy with black hair
  'https://cdn.abacus.ai/images/5b8a3c7b-6ce9-4d97-8ba4-1c5cbbd72a91.png', // Girl with blonde pigtails
  'https://cdn.abacus.ai/images/c8f16198-68ee-40f3-86b4-43726d5d552b.png', // Boy with afro hair
  'https://cdn.abacus.ai/images/a06294b5-8deb-4342-86fa-a7498885a50c.png', // Asian girl with long hair
  'https://cdn.abacus.ai/images/0e8496b3-a6f2-45fb-8ac0-a97f5e6eb921.png', // Hispanic boy
];

const DEMO_SILHOUETTES = [
  'https://cdn.abacus.ai/images/7511ea17-3b10-4c2f-a2bf-8f74b4d5b939.png', // Girl standing
  'https://cdn.abacus.ai/images/b5b0816b-434c-4dda-b77c-60246a39f0aa.png', // Boy walking
  'https://cdn.abacus.ai/images/a7baea96-0dba-40f1-9187-ca2772fae779.png', // Child sitting
  'https://cdn.abacus.ai/images/7f03b507-edef-42ce-9402-1aa3cc1d6cfe.png', // Child running
  'https://cdn.abacus.ai/images/aedc0199-10cf-4083-aec8-ecf076ac446a.png', // Girl with pigtails
  'https://cdn.abacus.ai/images/53039cb2-7f34-45d6-99b9-4cbf60325aa6.png', // Boy waving
];

// Demo venue zones
const DEMO_ZONES = [
  { name: 'Main Entrance', x: 50, y: 20, width: 150, height: 80 },
  { name: 'Play Area A', x: 250, y: 100, width: 200, height: 150 },
  { name: 'Play Area B', x: 500, y: 100, width: 200, height: 150 },
  { name: 'Climbing Zone', x: 250, y: 300, width: 180, height: 120 },
  { name: 'Ball Pit', x: 500, y: 300, width: 150, height: 100 },
  { name: 'Toddler Area', x: 100, y: 450, width: 180, height: 100 },
  { name: 'Snack Bar', x: 350, y: 450, width: 120, height: 80 },
  { name: 'Restrooms', x: 550, y: 450, width: 100, height: 60 },
  { name: 'Exit Zone', x: 650, y: 200, width: 100, height: 200 },
];

// Demo children data
const DEMO_CHILDREN = [
  { firstName: 'Emma', lastName: 'Johnson', age: 7, avatar: DEMO_AVATARS[0] },
  { firstName: 'Michael', lastName: 'Chen', age: 6, avatar: DEMO_AVATARS[1] },
  { firstName: 'Sofia', lastName: 'Martinez', age: 8, avatar: DEMO_AVATARS[2] },
  { firstName: 'Marcus', lastName: 'Thompson', age: 5, avatar: DEMO_AVATARS[3] },
  { firstName: 'Aria', lastName: 'Kim', age: 7, avatar: DEMO_AVATARS[4] },
  { firstName: 'Diego', lastName: 'Rodriguez', age: 6, avatar: DEMO_AVATARS[5] },
  { firstName: 'Zoe', lastName: 'Williams', age: 8, avatar: DEMO_SILHOUETTES[0] },
  { firstName: 'Noah', lastName: 'Davis', age: 5, avatar: DEMO_SILHOUETTES[1] },
  { firstName: 'Maya', lastName: 'Patel', age: 7, avatar: DEMO_SILHOUETTES[2] },
  { firstName: 'Elijah', lastName: 'Brown', age: 6, avatar: DEMO_SILHOUETTES[3] },
];

async function seedVenueDemo() {
  console.log('🎬 Starting venue demo data seeding...');

  try {
    // Find or create demo venue admin
    let venueAdmin = await prisma.user.findFirst({
      where: { email: 'venue@demo.com' }
    });

    if (!venueAdmin) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('demo123', 10);
      
      venueAdmin = await prisma.user.create({
        data: {
          email: 'venue@demo.com',
          name: 'Adventure Playground Admin',
          password: hashedPassword,
          role: 'VENUE_ADMIN',
          phone: '+1-555-0123',
          phoneVerified: true,
          identityVerified: true,
          verificationLevel: 'FULL_VERIFIED',
        }
      });
      console.log('✅ Created demo venue admin');
    }

    // Find or create demo venue
    let venue = await prisma.venue.findFirst({
      where: { adminId: venueAdmin.id }
    });

    if (!venue) {
      venue = await prisma.venue.create({
        data: {
          name: 'Adventure Playground Demo',
          address: '123 Fun Street',
          city: 'Playtown',
          state: 'CA',
          zipCode: '90210',
          phone: '+1-555-PLAY',
          email: 'info@adventureplayground.demo',
          operatingHours: {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '20:00' },
            saturday: { open: '08:00', close: '20:00' },
            sunday: { open: '10:00', close: '18:00' }
          },
          capacity: 150,
          ageGroups: ['3-5', '6-8', '9-12'],
          cameraConfig: {
            totalCameras: 8,
            activeRecognition: true,
            detectionThreshold: 0.85
          },
          alertSettings: {
            exitZoneEnabled: true,
            crowdingEnabled: true,
            unauthorizedPersonEnabled: true
          },
          adminId: venueAdmin.id,
        }
      });
      console.log('✅ Created demo venue');
    }

    // Create demo cameras
    const cameras = [];
    const cameraData = [
      { name: 'Main Entrance Camera', x: 125, y: 60, angle: 0 },
      { name: 'Play Area A Camera', x: 350, y: 175, angle: 45 },
      { name: 'Play Area B Camera', x: 600, y: 175, angle: 315 },
      { name: 'Climbing Zone Camera', x: 340, y: 360, angle: 90 },
      { name: 'Ball Pit Camera', x: 575, y: 350, angle: 180 },
      { name: 'Toddler Area Camera', x: 190, y: 500, angle: 270 },
      { name: 'Exit Zone Camera', x: 700, y: 300, angle: 225 },
      { name: 'Overview Camera', x: 400, y: 300, angle: 0 },
    ];

    for (const camData of cameraData) {
      const existingCamera = await prisma.camera.findFirst({
        where: { name: camData.name, venueId: venue.id }
      });

      if (!existingCamera) {
        const camera = await prisma.camera.create({
          data: {
            name: camData.name,
            model: 'Demo Camera Pro',
            serialNumber: `DEMO-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            ipAddress: `192.168.1.${100 + cameras.length}`,
            streamUrl: `rtsp://demo-stream-${cameras.length + 1}.local/stream`,
            status: 'ONLINE',
            lastPing: new Date(),
            venueId: venue.id,
            position: { x: camData.x, y: camData.y },
            viewAngle: 60,
            viewDistance: 12,
            rotation: camData.angle,
            height: 2.8,
            specifications: {
              resolution: '1920x1080',
              fps: 30,
              nightVision: true,
              zoom: '3x optical'
            },
            configuration: {
              motionDetection: true,
              faceRecognition: true,
              alertZones: true
            },
            isRecordingEnabled: true,
            isRecognitionEnabled: true,
            recognitionThreshold: 0.87,
          }
        });
        cameras.push(camera);
      }
    }
    console.log(`✅ Created ${cameras.length} demo cameras`);

    // Create demo parent users and children
    const children = [];
    for (let i = 0; i < DEMO_CHILDREN.length; i++) {
      const childData = DEMO_CHILDREN[i];
      
      // Find or create parent
      const parentEmail = `parent${i + 1}@demo.com`;
      let parent = await prisma.user.findFirst({
        where: { email: parentEmail }
      });

      if (!parent) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('demo123', 10);
        
        parent = await prisma.user.create({
          data: {
            email: parentEmail,
            name: `${childData.firstName} ${childData.lastName}'s Parent`,
            password: hashedPassword,
            role: 'PARENT',
            phone: `+1-555-010${i}`,
            phoneVerified: true,
            identityVerified: true,
            verificationLevel: 'FULL_VERIFIED',
          }
        });
      }

      // Create child
      const existingChild = await prisma.child.findFirst({
        where: { 
          firstName: childData.firstName,
          lastName: childData.lastName,
          parentId: parent.id
        }
      });

      if (!existingChild) {
        const child = await prisma.child.create({
          data: {
            firstName: childData.firstName,
            lastName: childData.lastName,
            dateOfBirth: new Date(Date.now() - (childData.age * 365 * 24 * 60 * 60 * 1000)),
            profilePhoto: childData.avatar,
            biometricId: `DEMO_BIO_${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            parentId: parent.id,
            currentVenueId: i < 6 ? venue.id : undefined, // First 6 children are currently in venue
            faceRecognitionConsent: true,
            faceRecognitionEnabled: true,
            recognitionThreshold: 0.92,
          }
        });
        children.push(child);
      }
    }
    console.log(`✅ Created ${children.length} demo children`);

    // Create recent check-in events for children currently in venue
    const currentTime = new Date();
    const currentChildren = children.slice(0, 6);
    
    for (let i = 0; i < currentChildren.length; i++) {
      const child = currentChildren[i];
      const checkInTime = new Date(currentTime.getTime() - (Math.random() * 3 * 60 * 60 * 1000)); // Random check-in within last 3 hours
      
      const existingCheckIn = await prisma.checkInOutEvent.findFirst({
        where: {
          childId: child.id,
          venueId: venue.id,
          eventType: 'CHECK_IN'
        }
      });

      if (!existingCheckIn) {
        await prisma.checkInOutEvent.create({
          data: {
            childId: child.id,
            venueId: venue.id,
            parentId: child.parentId,
            eventType: 'CHECK_IN',
            method: 'QR_CODE',
            location: { zone: 'Main Entrance' },
            timestamp: checkInTime,
            isAuthorized: true,
            notes: 'Demo check-in event',
          }
        });
      }
    }

    // Create tracking events (child movements through zones)
    const zones = ['Main Entrance', 'Play Area A', 'Play Area B', 'Climbing Zone', 'Ball Pit', 'Toddler Area', 'Snack Bar'];
    
    for (const child of currentChildren) {
      // Create 3-5 tracking events per child over the last few hours
      const eventCount = 3 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < eventCount; j++) {
        const eventTime = new Date(currentTime.getTime() - (Math.random() * 2 * 60 * 60 * 1000));
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const zoneData = DEMO_ZONES.find(z => z.name === zone);
        
        await prisma.trackingEvent.create({
          data: {
            type: 'ZONE_ENTRY',
            timestamp: eventTime,
            location: {
              zone: zone,
              x: zoneData?.x + Math.random() * (zoneData?.width || 100),
              y: zoneData?.y + Math.random() * (zoneData?.height || 100),
              confidence: 0.85 + Math.random() * 0.15
            },
            confidence: 0.85 + Math.random() * 0.15,
            cameraId: cameras[Math.floor(Math.random() * cameras.length)]?.id,
            metadata: {
              detectionMethod: 'face_recognition',
              processingTime: Math.floor(Math.random() * 500) + 100
            },
            childId: child.id,
            venueId: venue.id,
          }
        });
      }
    }
    console.log('✅ Created demo tracking events');

    // Create some demo alerts
    const alertData = [
      {
        type: 'EXIT',
        title: 'Child Near Exit',
        description: 'Sofia Martinez detected near unsupervised exit zone',
        severity: 3,
        childId: children.find(c => c.firstName === 'Sofia')?.id,
      },
      {
        type: 'SAFETY',
        title: 'Zone Capacity Alert',
        description: 'Play Area A approaching capacity limit',
        severity: 2,
        childId: null,
      }
    ];

    for (const alert of alertData) {
      const existingAlert = await prisma.alert.findFirst({
        where: {
          title: alert.title,
          venueId: venue.id,
          status: 'ACTIVE'
        }
      });

      if (!existingAlert) {
        await prisma.alert.create({
          data: {
            ...alert,
            venueId: venue.id,
          }
        });
      }
    }
    console.log('✅ Created demo alerts');

    // Create venue analytics data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAnalytics = await prisma.venueAnalytics.findFirst({
      where: { venueId: venue.id, date: today }
    });

    if (!existingAnalytics) {
      await prisma.venueAnalytics.create({
        data: {
          date: today,
          totalCheckIns: 23,
          totalCheckOuts: 17,
          peakOccupancy: 18,
          averageStayTime: 125, // minutes
          memoryRevenue: 156.50,
          photosSold: 31,
          videosSold: 8,
          alertsGenerated: 5,
          emergencyAlerts: 0,
          avgResponseTime: 45, // seconds
          venueId: venue.id,
        }
      });
      console.log('✅ Created demo analytics');
    }

    console.log('🎉 Venue demo data seeding completed successfully!');
    console.log(`📊 Demo venue: ${venue.name}`);
    console.log(`👨‍💼 Admin login: venue@demo.com / demo123`);
    console.log(`👶 Children in venue: ${currentChildren.length}`);
    console.log(`📹 Active cameras: ${cameras.length}`);

  } catch (error) {
    console.error('❌ Error seeding venue demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedVenueDemo();
