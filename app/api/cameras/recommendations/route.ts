
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = "force-dynamic";

// Camera recommendation algorithm
class CameraRecommendationEngine {
  static generateRecommendations(
    floorPlan: any,
    existingCameras: any[],
    zones: any[]
  ) {
    const recommendations = [];
    const floorWidth = floorPlan.dimensions?.width || 1000;
    const floorHeight = floorPlan.dimensions?.height || 800;
    
    // Define high-priority areas that need coverage
    const criticalZones = zones.filter(zone => 
      ['ENTRANCE', 'EXIT', 'EMERGENCY_EXIT', 'HIGH_TRAFFIC'].includes(zone.type)
    );
    
    // Calculate coverage gaps
    const coverageMap = this.calculateCoverageMap(existingCameras, floorWidth, floorHeight);
    
    // Recommend cameras for critical zones without coverage
    for (const zone of criticalZones) {
      const zoneCoverage = this.calculateZoneCoverage(zone, existingCameras);
      
      if (zoneCoverage < 0.8) { // Less than 80% coverage
        const optimalPosition = this.findOptimalPosition(zone, existingCameras, floorWidth, floorHeight);
        
        recommendations.push({
          recommendationType: zone.type === 'ENTRANCE' || zone.type === 'EXIT' ? 'ENTRANCE_EXIT' : 'HIGH_TRAFFIC',
          suggestedPosition: optimalPosition,
          reasoning: `${zone.name} area has insufficient camera coverage (${Math.round(zoneCoverage * 100)}%)`,
          priority: zone.type.includes('EMERGENCY') ? 'CRITICAL' : 'HIGH',
          coverageArea: this.calculateCoverageArea(optimalPosition, 60, 10), // 60° angle, 10m distance
          estimatedCost: 1500,
          metadata: {
            targetZone: zone.id,
            currentCoverage: zoneCoverage,
            expectedImprovement: 0.9 - zoneCoverage
          }
        });
      }
    }
    
    // Check for blind spots
    const blindSpots = this.findBlindSpots(coverageMap, floorWidth, floorHeight);
    
    for (const blindSpot of blindSpots.slice(0, 3)) { // Limit to 3 blind spot recommendations
      recommendations.push({
        recommendationType: 'BLIND_SPOT',
        suggestedPosition: blindSpot.position,
        reasoning: `Blind spot detected in coverage area (${blindSpot.size}m²)`,
        priority: blindSpot.size > 50 ? 'HIGH' : 'MEDIUM',
        coverageArea: this.calculateCoverageArea(blindSpot.position, 60, 10),
        estimatedCost: 1200,
        metadata: {
          blindSpotSize: blindSpot.size,
          adjacentCameras: blindSpot.nearbyCamera
        }
      });
    }
    
    // Recommend redundancy for critical areas
    const entranceExitZones = zones.filter(zone => 
      ['ENTRANCE', 'EXIT'].includes(zone.type)
    );
    
    for (const zone of entranceExitZones) {
      const coveringCameras = this.getCamerasInZone(zone, existingCameras);
      
      if (coveringCameras.length === 1) {
        const redundantPosition = this.findRedundantPosition(zone, coveringCameras[0], floorWidth, floorHeight);
        
        recommendations.push({
          recommendationType: 'REDUNDANCY',
          suggestedPosition: redundantPosition,
          reasoning: `Single point of failure: ${zone.name} covered by only one camera`,
          priority: 'MEDIUM',
          coverageArea: this.calculateCoverageArea(redundantPosition, 60, 10),
          estimatedCost: 1200,
          metadata: {
            primaryCamera: coveringCameras[0].id,
            redundancyType: 'backup_coverage'
          }
        });
      }
    }
    
    return recommendations;
  }
  
  static calculateCoverageMap(cameras: any[], width: number, height: number) {
    const gridSize = 20; // 20x20 grid
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
  
  static calculateCameraCoverage(camera: any, gridSize: number, floorWidth: number, floorHeight: number) {
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
  
  static calculateZoneCoverage(zone: any, cameras: any[]) {
    // Simplified zone coverage calculation
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
  
  static getZoneCenter(coordinates: any) {
    if (Array.isArray(coordinates) && coordinates.length > 0) {
      const sumX = coordinates.reduce((sum: number, point: any) => sum + point.x, 0);
      const sumY = coordinates.reduce((sum: number, point: any) => sum + point.y, 0);
      
      return {
        x: sumX / coordinates.length,
        y: sumY / coordinates.length
      };
    }
    
    return { x: 500, y: 400 }; // Default center
  }
  
  static findOptimalPosition(zone: any, existingCameras: any[], floorWidth: number, floorHeight: number) {
    const zoneCenter = this.getZoneCenter(zone.coordinates);
    
    // Try positions around the zone center
    const candidates = [
      { x: zoneCenter.x - 100, y: zoneCenter.y - 100 },
      { x: zoneCenter.x + 100, y: zoneCenter.y - 100 },
      { x: zoneCenter.x - 100, y: zoneCenter.y + 100 },
      { x: zoneCenter.x + 100, y: zoneCenter.y + 100 }
    ];
    
    // Score each candidate position
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
  
  static scorePosition(position: any, zone: any, existingCameras: any[]) {
    let score = 0;
    
    // Distance to zone center (closer is better)
    const zoneCenter = this.getZoneCenter(zone.coordinates);
    const distanceToZone = Math.sqrt(
      (position.x - zoneCenter.x) ** 2 + (position.y - zoneCenter.y) ** 2
    );
    score += Math.max(0, 200 - distanceToZone);
    
    // Distance to existing cameras (farther is better to avoid overlap)
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
  
  static findBlindSpots(coverageMap: number[][], floorWidth: number, floorHeight: number) {
    const gridSize = coverageMap.length;
    const blindSpots = [];
    const visited = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (coverageMap[i][j] === 0 && !visited[i][j]) {
          const blindSpot = this.floodFillBlindSpot(coverageMap, visited, i, j);
          
          if (blindSpot.size > 4) { // Only consider significant blind spots
            blindSpots.push({
              position: {
                x: (blindSpot.centerX / gridSize) * floorWidth,
                y: (blindSpot.centerY / gridSize) * floorHeight
              },
              size: (blindSpot.size / (gridSize * gridSize)) * (floorWidth * floorHeight / 1000000), // Convert to m²
              nearbyCamera: null
            });
          }
        }
      }
    }
    
    return blindSpots.sort((a, b) => b.size - a.size);
  }
  
  static floodFillBlindSpot(coverageMap: number[][], visited: boolean[][], startI: number, startJ: number) {
    const gridSize = coverageMap.length;
    const queue = [{ i: startI, j: startJ }];
    const cells = [];
    
    while (queue.length > 0) {
      const { i, j } = queue.shift()!;
      
      if (i < 0 || i >= gridSize || j < 0 || j >= gridSize || 
          visited[i][j] || coverageMap[i][j] === 1) {
        continue;
      }
      
      visited[i][j] = true;
      cells.push({ i, j });
      
      // Add adjacent cells
      queue.push({ i: i + 1, j });
      queue.push({ i: i - 1, j });
      queue.push({ i, j: j + 1 });
      queue.push({ i, j: j - 1 });
    }
    
    const centerX = cells.reduce((sum, cell) => sum + cell.i, 0) / cells.length;
    const centerY = cells.reduce((sum, cell) => sum + cell.j, 0) / cells.length;
    
    return {
      size: cells.length,
      centerX,
      centerY
    };
  }
  
  static getCamerasInZone(zone: any, cameras: any[]) {
    const zoneCenter = this.getZoneCenter(zone.coordinates);
    const zoneRadius = 150; // Assume 150 unit radius for zone coverage
    
    return cameras.filter(camera => {
      if (!camera.position) return false;
      
      const distance = Math.sqrt(
        (camera.position.x - zoneCenter.x) ** 2 + 
        (camera.position.y - zoneCenter.y) ** 2
      );
      
      return distance <= zoneRadius;
    });
  }
  
  static findRedundantPosition(zone: any, primaryCamera: any, floorWidth: number, floorHeight: number) {
    const zoneCenter = this.getZoneCenter(zone.coordinates);
    
    // Position the redundant camera opposite to the primary camera relative to zone center
    const dx = primaryCamera.position.x - zoneCenter.x;
    const dy = primaryCamera.position.y - zoneCenter.y;
    
    const redundantX = Math.max(50, Math.min(floorWidth - 50, zoneCenter.x - dx));
    const redundantY = Math.max(50, Math.min(floorHeight - 50, zoneCenter.y - dy));
    
    return { x: redundantX, y: redundantY };
  }
  
  static calculateCoverageArea(position: any, viewAngle: number, viewDistance: number) {
    // Calculate approximate coverage area polygon
    const points = [];
    const angleStep = viewAngle / 8; // 8 points for coverage polygon
    const startAngle = -viewAngle / 2;
    
    // Add camera position as center
    points.push(position);
    
    // Add coverage arc points
    for (let i = 0; i <= 8; i++) {
      const angle = (startAngle + (i * angleStep)) * (Math.PI / 180);
      const x = position.x + Math.cos(angle) * viewDistance;
      const y = position.y + Math.sin(angle) * viewDistance;
      points.push({ x, y });
    }
    
    return points;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const floorPlanId = searchParams.get('floorPlanId');

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 });
    }

    // Check access permissions
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        OR: [
          { adminId: session.user.id },
          { admin: { role: 'SUPER_ADMIN' } }
        ]
      }
    });

    if (!venue && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const recommendations = await prisma.cameraRecommendation.findMany({
      where: {
        venueId,
        ...(floorPlanId && { floorPlanId })
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error fetching camera recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('🔥 POST /api/cameras/recommendations - Starting request');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('🔐 Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      userId: session?.user?.id
    });
    
    if (!session?.user) {
      console.log('❌ No session or user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      console.log('❌ Insufficient permissions:', session.user.role);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const requestBody = await request.json();
    const { venueId, floorPlanId, regenerate } = requestBody;
    console.log('📝 Request body:', { venueId, floorPlanId, regenerate });

    if (!venueId) {
      console.log('❌ No venue ID provided');
      return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 });
    }

    console.log('🏢 Checking venue access for:', venueId);
    
    // Check access permissions
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        OR: [
          { adminId: session.user.id },
          { admin: { role: 'SUPER_ADMIN' } }
        ]
      }
    });

    console.log('🏢 Venue check result:', {
      venueFound: !!venue,
      venueName: venue?.name,
      venueId: venue?.id,
      adminId: venue?.adminId,
      userRole: session.user.role
    });

    if (!venue && session.user.role !== 'SUPER_ADMIN') {
      console.log('❌ Access denied to venue');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let whereClause: any = { venueId };
    if (floorPlanId) {
      whereClause.floorPlanId = floorPlanId;
    }
    
    console.log('🗺️ Querying floor plan with clause:', whereClause);

    // Get floor plan data
    const floorPlan = await prisma.floorPlan.findFirst({
      where: whereClause,
      include: {
        zones: true
      }
    });

    console.log('🗺️ Floor plan query result:', {
      floorPlanFound: !!floorPlan,
      floorPlanId: floorPlan?.id,
      floorPlanName: floorPlan?.name,
      zonesCount: floorPlan?.zones?.length || 0,
      dimensions: floorPlan?.dimensions
    });

    if (!floorPlan) {
      console.log('❌ Floor plan not found');
      return NextResponse.json({ error: 'Floor plan not found' }, { status: 404 });
    }

    // Get existing cameras
    const existingCameras = await prisma.camera.findMany({
      where: {
        venueId,
        ...(floorPlanId && { floorPlanId })
      }
    });
    
    console.log('📹 Existing cameras query result:', {
      camerasCount: existingCameras.length,
      cameras: existingCameras.map(c => ({ id: c.id, name: c.name, position: c.position }))
    });

    // Clear existing recommendations if regenerating
    if (regenerate) {
      console.log('🗑️ Clearing existing recommendations');
      const deletedCount = await prisma.cameraRecommendation.deleteMany({
        where: whereClause
      });
      console.log('🗑️ Deleted', deletedCount.count, 'existing recommendations');
    }

    console.log('🤖 Generating recommendations with data:', {
      floorPlanDimensions: floorPlan.dimensions,
      zonesCount: floorPlan.zones.length,
      existingCamerasCount: existingCameras.length
    });

    // Generate new recommendations
    const recommendationData = CameraRecommendationEngine.generateRecommendations(
      floorPlan,
      existingCameras,
      floorPlan.zones
    );

    console.log('🤖 Generated recommendations:', {
      count: recommendationData.length,
      recommendations: recommendationData.map(r => ({
        type: r.recommendationType,
        priority: r.priority,
        reasoning: r.reasoning.substring(0, 50) + '...'
      }))
    });

    // Save recommendations to database
    console.log('💾 Saving recommendations to database');
    const recommendations = await Promise.all(
      recommendationData.map(async (rec) => {
        console.log('💾 Creating recommendation:', rec.recommendationType);
        return prisma.cameraRecommendation.create({
          data: {
            venueId,
            floorPlanId,
            recommendationType: rec.recommendationType as any,
            suggestedPosition: rec.suggestedPosition,
            reasoning: rec.reasoning,
            priority: rec.priority as any,
            coverageArea: rec.coverageArea,
            estimatedCost: rec.estimatedCost,
            status: 'PENDING',
            metadata: rec.metadata
          }
        });
      })
    );

    console.log('✅ Successfully created', recommendations.length, 'recommendations');
    return NextResponse.json(recommendations, { status: 201 });
  } catch (error) {
    console.error('Error generating camera recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
