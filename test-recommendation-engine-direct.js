
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Camera recommendation algorithm (copied from the API)
class CameraRecommendationEngine {
  static generateRecommendations(floorPlan, existingCameras, zones) {
    console.log('🤖 Starting recommendation generation');
    console.log('📊 Input data:', {
      floorPlan: floorPlan?.name,
      dimensions: floorPlan?.dimensions,
      camerasCount: existingCameras?.length,
      zonesCount: zones?.length
    });

    const recommendations = [];
    const floorWidth = floorPlan.dimensions?.width || 1000;
    const floorHeight = floorPlan.dimensions?.height || 800;
    
    console.log('📐 Floor dimensions:', { width: floorWidth, height: floorHeight });
    
    // Define high-priority areas that need coverage
    const criticalZones = zones.filter(zone => 
      ['ENTRANCE', 'EXIT', 'EMERGENCY_EXIT', 'HIGH_TRAFFIC'].includes(zone.type)
    );
    
    console.log('🚨 Critical zones found:', criticalZones.map(z => ({ name: z.name, type: z.type })));
    
    // Calculate coverage gaps
    const coverageMap = this.calculateCoverageMap(existingCameras, floorWidth, floorHeight);
    console.log('🗺️ Coverage map calculated');
    
    // Recommend cameras for critical zones without coverage
    for (const zone of criticalZones) {
      console.log('🔍 Analyzing zone:', zone.name);
      const zoneCoverage = this.calculateZoneCoverage(zone, existingCameras);
      console.log(`📊 Zone ${zone.name} coverage: ${Math.round(zoneCoverage * 100)}%`);
      
      if (zoneCoverage < 0.8) { // Less than 80% coverage
        const optimalPosition = this.findOptimalPosition(zone, existingCameras, floorWidth, floorHeight);
        
        const recommendation = {
          recommendationType: zone.type === 'ENTRANCE' || zone.type === 'EXIT' ? 'ENTRANCE_EXIT' : 'HIGH_TRAFFIC',
          suggestedPosition: optimalPosition,
          reasoning: `${zone.name} area has insufficient camera coverage (${Math.round(zoneCoverage * 100)}%)`,
          priority: zone.type.includes('EMERGENCY') ? 'CRITICAL' : 'HIGH',
          coverageArea: this.calculateCoverageArea(optimalPosition, 60, 10),
          estimatedCost: 1500,
          metadata: {
            targetZone: zone.id,
            currentCoverage: zoneCoverage,
            expectedImprovement: 0.9 - zoneCoverage
          }
        };
        
        recommendations.push(recommendation);
        console.log('✅ Added recommendation for', zone.name);
      } else {
        console.log('✅ Zone', zone.name, 'has sufficient coverage');
      }
    }
    
    console.log('📋 Final recommendations count:', recommendations.length);
    return recommendations;
  }
  
  static calculateCoverageMap(cameras, width, height) {
    const gridSize = 20;
    const map = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
    
    for (const camera of cameras) {
      if (camera.position && camera.viewAngle && camera.viewDistance) {
        const coverage = this.calculateCameraCoverage(camera, gridSize, width, height);
        
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            if (coverage[i][j]) {
              map[i][j] = 1;
            }
          }
        }
      }
    }
    
    return map;
  }
  
  static calculateCameraCoverage(camera, gridSize, floorWidth, floorHeight) {
    const coverage = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    const camX = (camera.position.x / floorWidth) * gridSize;
    const camY = (camera.position.y / floorHeight) * gridSize;
    const maxDistance = (camera.viewDistance / Math.max(floorWidth, floorHeight)) * gridSize;
    const halfAngle = (camera.viewAngle || 60) / 2;
    const rotation = camera.rotation || 0;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const distance = Math.sqrt((i - camX) ** 2 + (j - camY) ** 2);
        
        if (distance <= maxDistance) {
          const angle = Math.atan2(j - camY, i - camX) * (180 / Math.PI);
          const relativeAngle = Math.abs(angle - rotation);
          
          if (relativeAngle <= halfAngle || relativeAngle >= 360 - halfAngle) {
            coverage[i][j] = true;
          }
        }
      }
    }
    
    return coverage;
  }
  
  static calculateZoneCoverage(zone, cameras) {
    const zoneCenter = this.getZoneCenter(zone.coordinates);
    let maxCoverage = 0;
    
    for (const camera of cameras) {
      if (camera.position) {
        const distance = Math.sqrt(
          (camera.position.x - zoneCenter.x) ** 2 + 
          (camera.position.y - zoneCenter.y) ** 2
        );
        
        const coverage = Math.max(0, 1 - (distance / (camera.viewDistance || 10)));
        maxCoverage = Math.max(maxCoverage, coverage);
      }
    }
    
    return maxCoverage;
  }
  
  static getZoneCenter(coordinates) {
    if (Array.isArray(coordinates) && coordinates.length > 0) {
      const sumX = coordinates.reduce((sum, point) => sum + point.x, 0);
      const sumY = coordinates.reduce((sum, point) => sum + point.y, 0);
      
      return {
        x: sumX / coordinates.length,
        y: sumY / coordinates.length
      };
    }
    
    return { x: 500, y: 400 }; // Default center
  }
  
  static findOptimalPosition(zone, existingCameras, floorWidth, floorHeight) {
    const zoneCenter = this.getZoneCenter(zone.coordinates);
    
    const candidates = [
      { x: zoneCenter.x - 100, y: zoneCenter.y - 100 },
      { x: zoneCenter.x + 100, y: zoneCenter.y - 100 },
      { x: zoneCenter.x - 100, y: zoneCenter.y + 100 },
      { x: zoneCenter.x + 100, y: zoneCenter.y + 100 }
    ];
    
    let bestPosition = candidates[0];
    let bestScore = 0;
    
    for (const candidate of candidates) {
      if (candidate.x < 0 || candidate.x > floorWidth || 
          candidate.y < 0 || candidate.y > floorHeight) {
        continue;
      }
      
      const score = this.scorePosition(candidate, zone, existingCameras);
      
      if (score > bestScore) {
        bestScore = score;
        bestPosition = candidate;
      }
    }
    
    return bestPosition;
  }
  
  static scorePosition(position, zone, existingCameras) {
    let score = 0;
    
    const zoneCenter = this.getZoneCenter(zone.coordinates);
    const distanceToZone = Math.sqrt(
      (position.x - zoneCenter.x) ** 2 + (position.y - zoneCenter.y) ** 2
    );
    score += Math.max(0, 200 - distanceToZone);
    
    for (const camera of existingCameras) {
      if (camera.position) {
        const distance = Math.sqrt(
          (position.x - camera.position.x) ** 2 + (position.y - camera.position.y) ** 2
        );
        score += Math.min(100, distance);
      }
    }
    
    return score;
  }
  
  static calculateCoverageArea(position, viewAngle, viewDistance) {
    const points = [];
    const angleStep = viewAngle / 8;
    const startAngle = -viewAngle / 2;
    
    points.push(position);
    
    for (let i = 0; i <= 8; i++) {
      const angle = (startAngle + (i * angleStep)) * (Math.PI / 180);
      const x = position.x + Math.cos(angle) * viewDistance;
      const y = position.y + Math.sin(angle) * viewDistance;
      points.push({ x, y });
    }
    
    return points;
  }
}

async function testRecommendationEngine() {
  console.log('🧪 Starting recommendation engine test');
  console.log('==================================================');
  
  try {
    // Get test data from database
    console.log('🔍 Fetching test data from database...');
    
    const floorPlan = await prisma.floorPlan.findFirst({
      where: { name: 'Main Play Area Floor Plan' }
    });
    
    if (!floorPlan) {
      console.log('❌ No floor plan found');
      return;
    }
    
    console.log('✅ Floor plan found:', floorPlan.name);
    
    const cameras = await prisma.camera.findMany({
      where: { floorPlanId: floorPlan.id }
    });
    
    console.log('✅ Cameras found:', cameras.length);
    cameras.forEach(camera => {
      console.log('  📹', camera.name, '- Position:', camera.position);
    });
    
    // Create mock zones since the zones table might have issues
    const mockZones = [
      {
        id: 'zone1',
        name: 'Main Entrance',
        type: 'ENTRANCE',
        coordinates: [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 200 },
          { x: 100, y: 200 }
        ]
      },
      {
        id: 'zone2',
        name: 'Emergency Exit',
        type: 'EMERGENCY_EXIT',
        coordinates: [
          { x: 1000, y: 700 },
          { x: 1100, y: 700 },
          { x: 1100, y: 800 },
          { x: 1000, y: 800 }
        ]
      },
      {
        id: 'zone3',
        name: 'Play Area',
        type: 'PLAY_AREA',
        coordinates: [
          { x: 400, y: 300 },
          { x: 800, y: 300 },
          { x: 800, y: 600 },
          { x: 400, y: 600 }
        ]
      }
    ];
    
    console.log('🎭 Using mock zones:', mockZones.length);
    
    // Test the recommendation engine
    console.log('\n🚀 Testing recommendation engine...');
    console.log('==================================================');
    
    const recommendations = CameraRecommendationEngine.generateRecommendations(
      floorPlan,
      cameras,
      mockZones
    );
    
    console.log('\n📋 FINAL RESULTS:');
    console.log('==================================================');
    console.log('✅ Generated', recommendations.length, 'recommendations');
    
    recommendations.forEach((rec, index) => {
      console.log(`\n📍 Recommendation ${index + 1}:`);
      console.log('  Type:', rec.recommendationType);
      console.log('  Priority:', rec.priority);
      console.log('  Reasoning:', rec.reasoning);
      console.log('  Position:', rec.suggestedPosition);
      console.log('  Cost:', rec.estimatedCost);
    });
    
    if (recommendations.length === 0) {
      console.log('⚠️ No recommendations generated - this might indicate an issue');
    } else {
      console.log('✅ Recommendation engine is working correctly!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testRecommendationEngine();
