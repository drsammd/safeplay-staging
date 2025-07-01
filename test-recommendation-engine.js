const dotenv = require('dotenv');
dotenv.config();

const { PrismaClient } = require('@prisma/client');

// Import the recommendation engine class (we'll extract it)
class CameraRecommendationEngine {
  static generateRecommendations(floorPlan, existingCameras, zones) {
    const recommendations = [];
    const floorWidth = floorPlan.dimensions?.width || 1000;
    const floorHeight = floorPlan.dimensions?.height || 800;
    
    console.log('🤖 Recommendation engine input:', {
      floorWidth,
      floorHeight,
      existingCamerasCount: existingCameras.length,
      zonesCount: zones.length
    });
    
    // Define high-priority areas that need coverage
    const criticalZones = zones.filter(zone => 
      ['ENTRANCE', 'EXIT', 'EMERGENCY_EXIT', 'HIGH_TRAFFIC'].includes(zone.type)
    );
    
    console.log('🎯 Critical zones found:', criticalZones.length, criticalZones.map(z => z.type));
    
    // Calculate coverage gaps
    const coverageMap = this.calculateCoverageMap(existingCameras, floorWidth, floorHeight);
    
    // Recommend cameras for critical zones without coverage
    for (const zone of criticalZones) {
      const zoneCoverage = this.calculateZoneCoverage(zone, existingCameras);
      
      console.log(`📊 Zone ${zone.name} coverage: ${Math.round(zoneCoverage * 100)}%`);
      
      if (zoneCoverage < 0.8) { // Less than 80% coverage
        const optimalPosition = this.findOptimalPosition(zone, existingCameras, floorWidth, floorHeight);
        
        recommendations.push({
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
        });
      }
    }
    
    return recommendations;
  }
  
  static calculateCoverageMap(cameras, width, height) {
    console.log('🗺️ Calculating coverage map for', cameras.length, 'cameras');
    const gridSize = 20;
    const map = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
    return map;
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
    return { x: 500, y: 400 };
  }
  
  static findOptimalPosition(zone, existingCameras, floorWidth, floorHeight) {
    const zoneCenter = this.getZoneCenter(zone.coordinates);
    return { x: zoneCenter.x + 100, y: zoneCenter.y + 100 };
  }
  
  static calculateCoverageArea(position, viewAngle, viewDistance) {
    return [position];
  }
}

async function testRecommendationEngine() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Recommendation Engine Directly...\n');
    
    // Get the test data
    const venue = await prisma.venue.findFirst({
      where: { name: 'Adventure Playground' }
    });
    
    const floorPlan = await prisma.floorPlan.findFirst({
      where: { venueId: venue.id },
      include: { zones: true }
    });
    
    const cameras = await prisma.camera.findMany({
      where: { venueId: venue.id }
    });
    
    console.log('📊 Test Data:');
    console.log('- Floor Plan:', floorPlan.name);
    console.log('- Dimensions:', floorPlan.dimensions);
    console.log('- Zones:', floorPlan.zones.length);
    console.log('- Cameras:', cameras.length);
    console.log('');
    
    // Test the recommendation engine
    console.log('🚀 Running Recommendation Engine...\n');
    
    const recommendations = CameraRecommendationEngine.generateRecommendations(
      floorPlan,
      cameras,
      floorPlan.zones
    );
    
    console.log('\n✅ Recommendation Engine Results:');
    console.log('- Generated recommendations:', recommendations.length);
    
    recommendations.forEach((rec, index) => {
      console.log(`\n📋 Recommendation ${index + 1}:`);
      console.log(`  Type: ${rec.recommendationType}`);
      console.log(`  Priority: ${rec.priority}`);
      console.log(`  Reasoning: ${rec.reasoning}`);
      console.log(`  Position: (${rec.suggestedPosition.x}, ${rec.suggestedPosition.y})`);
      console.log(`  Cost: $${rec.estimatedCost}`);
    });
    
    if (recommendations.length === 0) {
      console.log('⚠️ No recommendations generated. This might indicate:');
      console.log('- All zones have sufficient coverage');
      console.log('- Zone coordinates are invalid');
      console.log('- Camera positions are covering all critical areas');
      
      console.log('\n🔍 Debugging Zone Data:');
      floorPlan.zones.forEach(zone => {
        console.log(`- Zone: ${zone.name} (${zone.type})`);
        console.log(`  Coordinates: ${JSON.stringify(zone.coordinates)}`);
      });
      
      console.log('\n🔍 Debugging Camera Data:');
      cameras.forEach(camera => {
        console.log(`- Camera: ${camera.name}`);
        console.log(`  Position: ${JSON.stringify(camera.position)}`);
        console.log(`  View Distance: ${camera.viewDistance}`);
        console.log(`  View Angle: ${camera.viewAngle}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing recommendation engine:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRecommendationEngine();
