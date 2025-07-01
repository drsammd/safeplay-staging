
import { prisma } from '../db';
import { computerVisionService } from './computer-vision-service';
import { NavigationMode, NavigationRequest, NavigationPath } from '@prisma/client';

export interface NavigationOptions {
  mode: NavigationMode;
  avoidCrowds: boolean;
  accessibilityNeeds: boolean;
  prioritizeSafety: boolean;
}

export interface Waypoint {
  zoneId: string;
  zoneName: string;
  coordinates: { x: number; y: number };
  estimatedTime: number;
  crowdDensity: number;
  safetyScore: number;
}

export interface NavigationResult {
  success: boolean;
  requestId?: string;
  path?: {
    waypoints: Waypoint[];
    totalDistance: number;
    estimatedTime: number;
    safetyScore: number;
    crowdFactor: number;
  };
  alternatives?: Array<{
    name: string;
    waypoints: Waypoint[];
    totalDistance: number;
    estimatedTime: number;
    benefits: string[];
  }>;
  error?: string;
}

export interface CrowdData {
  zoneId: string;
  density: number;
  capacity: number;
  timestamp: Date;
}

export class EnhancedNavigationService {
  /**
   * Generate smart navigation path with crowd awareness and accessibility options
   */
  async generateNavigationPath(
    parentId: string,
    childId: string,
    venueId: string,
    targetLocation: string,
    options: NavigationOptions
  ): Promise<NavigationResult> {
    try {
      // Get venue floor plan and zones
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        include: {
          floorPlans: {
            include: {
              zones: true,
            },
          },
        },
      });

      if (!venue || !venue.floorPlans.length) {
        return {
          success: false,
          error: 'Venue floor plan not available',
        };
      }

      const floorPlan = venue.floorPlans[0]; // Use primary floor plan
      
      // Find child's current location
      const currentLocation = await this.findChildCurrentLocation(childId, venueId);
      if (!currentLocation) {
        return {
          success: false,
          error: 'Unable to determine child current location',
        };
      }

      // Find target zone
      const targetZone = floorPlan.zones.find(zone => 
        zone.name.toLowerCase().includes(targetLocation.toLowerCase()) ||
        zone.id === targetLocation
      );

      if (!targetZone) {
        return {
          success: false,
          error: 'Target location not found',
        };
      }

      // Get real-time crowd data
      const crowdData = await this.getCurrentCrowdData(venueId);

      // Calculate primary path
      const primaryPath = await this.calculateOptimalPath(
        currentLocation,
        targetZone,
        floorPlan.zones,
        crowdData,
        options
      );

      // Generate alternative paths
      const alternatives = await this.generateAlternativePaths(
        currentLocation,
        targetZone,
        floorPlan.zones,
        crowdData,
        options
      );

      // Create navigation request record
      const navigationRequest = await prisma.navigationRequest.create({
        data: {
          parentId,
          childId,
          venueId,
          targetLocation,
          mode: options.mode,
          estimatedTime: primaryPath.estimatedTime,
          crowdFactor: primaryPath.crowdFactor,
        },
      });

      // Create navigation path record
      await prisma.navigationPath.create({
        data: {
          requestId: navigationRequest.id,
          startLocation: currentLocation.name,
          endLocation: targetZone.name,
          waypoints: primaryPath.waypoints as any,
          totalDistance: primaryPath.totalDistance,
          estimatedTime: primaryPath.estimatedTime,
          crowdAvoidance: options.avoidCrowds,
          accessibilityMode: options.accessibilityNeeds,
        },
      });

      return {
        success: true,
        requestId: navigationRequest.id,
        path: primaryPath,
        alternatives,
      };
    } catch (error: any) {
      console.error('Error generating navigation path:', error);
      return {
        success: false,
        error: error.message || 'Navigation path generation failed',
      };
    }
  }

  /**
   * Find child's current location using latest tracking data
   */
  private async findChildCurrentLocation(childId: string, venueId: string): Promise<any> {
    try {
      // Get latest child sighting
      const latestSighting = await prisma.childSighting.findFirst({
        where: {
          childId,
          venueId,
        },
        orderBy: {
          timestamp: 'desc',
        },
        include: {
          zone: true,
        },
      });

      if (latestSighting?.zone) {
        return latestSighting.zone;
      }

      // Fallback to last check-in location
      const lastCheckIn = await prisma.checkInOutEvent.findFirst({
        where: {
          childId,
          venueId,
          eventType: 'CHECK_IN',
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      if (lastCheckIn) {
        // Find entrance zone
        const venue = await prisma.venue.findUnique({
          where: { id: venueId },
          include: {
            floorPlans: {
              include: {
                zones: {
                  where: {
                    type: 'ENTRANCE',
                  },
                },
              },
            },
          },
        });

        return venue?.floorPlans[0]?.zones[0] || null;
      }

      return null;
    } catch (error) {
      console.error('Error finding child current location:', error);
      return null;
    }
  }

  /**
   * Get current crowd density data for all zones
   */
  private async getCurrentCrowdData(venueId: string): Promise<CrowdData[]> {
    try {
      // Get latest crowd analysis for each zone
      const crowdAnalyses = await prisma.crowdDensityAnalysis.findMany({
        where: {
          venueId,
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      const crowdData: CrowdData[] = [];
      const processedZones = new Set<string>();

      for (const analysis of crowdAnalyses) {
        const zoneId = analysis.zoneId || analysis.cameraId || 'unknown';
        if (zoneId !== 'unknown' && !processedZones.has(zoneId)) {
          crowdData.push({
            zoneId: zoneId,
            density: analysis.densityScore || 0,
            capacity: analysis.capacityUtilization || 1.0,
            timestamp: new Date(analysis.timestamp),
          });
          processedZones.add(zoneId);
        }
      }

      return crowdData;
    } catch (error) {
      console.error('Error getting crowd data:', error);
      return [];
    }
  }

  /**
   * Calculate optimal path considering all factors
   */
  private async calculateOptimalPath(
    startZone: any,
    targetZone: any,
    allZones: any[],
    crowdData: CrowdData[],
    options: NavigationOptions
  ): Promise<{
    waypoints: Waypoint[];
    totalDistance: number;
    estimatedTime: number;
    safetyScore: number;
    crowdFactor: number;
  }> {
    try {
      // Simple pathfinding algorithm (can be enhanced with A* or Dijkstra)
      const path = this.findShortestPath(startZone, targetZone, allZones, crowdData, options);
      
      // Calculate metrics
      const totalDistance = this.calculatePathDistance(path.waypoints);
      const estimatedTime = this.calculateTravelTime(path.waypoints, options.mode);
      const safetyScore = this.calculatePathSafetyScore(path.waypoints);
      const crowdFactor = this.calculateCrowdImpact(path.waypoints, crowdData);

      return {
        waypoints: path.waypoints,
        totalDistance,
        estimatedTime,
        safetyScore,
        crowdFactor,
      };
    } catch (error) {
      console.error('Error calculating optimal path:', error);
      throw error;
    }
  }

  /**
   * Find shortest path between zones with constraints
   */
  private findShortestPath(
    startZone: any,
    targetZone: any,
    allZones: any[],
    crowdData: CrowdData[],
    options: NavigationOptions
  ): { waypoints: Waypoint[] } {
    // Simple implementation - direct path for now
    // In production, implement proper pathfinding algorithm
    
    const waypoints: Waypoint[] = [];
    
    // Add start zone
    waypoints.push(this.createWaypoint(startZone, crowdData));
    
    // For multi-zone venues, add intermediate zones if needed
    if (startZone.id !== targetZone.id) {
      // Simple logic: if zones are not adjacent, find connecting zones
      const intermediateZones = this.findIntermediateZones(startZone, targetZone, allZones, options);
      
      for (const zone of intermediateZones) {
        waypoints.push(this.createWaypoint(zone, crowdData));
      }
    }
    
    // Add target zone
    if (startZone.id !== targetZone.id) {
      waypoints.push(this.createWaypoint(targetZone, crowdData));
    }
    
    return { waypoints };
  }

  /**
   * Create waypoint with crowd and safety data
   */
  private createWaypoint(zone: any, crowdData: CrowdData[]): Waypoint {
    const crowd = crowdData.find(c => c.zoneId === zone.id);
    const crowdDensity = crowd ? (crowd.density / crowd.capacity) : 0;
    
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      coordinates: zone.coordinates || { x: 0, y: 0 },
      estimatedTime: this.calculateZoneTraversalTime(zone, crowdDensity),
      crowdDensity,
      safetyScore: this.calculateZoneSafetyScore(zone),
    };
  }

  /**
   * Find intermediate zones for navigation
   */
  private findIntermediateZones(
    startZone: any,
    targetZone: any,
    allZones: any[],
    options: NavigationOptions
  ): any[] {
    // Simple implementation - return connecting zones
    // In production, implement proper zone connectivity analysis
    
    const intermediates: any[] = [];
    
    // If accessibility is needed, prefer accessible routes
    if (options.accessibilityNeeds) {
      const accessibleZones = allZones.filter(zone => 
        zone.metadata?.accessible === true ||
        zone.type === 'CORRIDOR' ||
        zone.type === 'MAIN_AREA'
      );
      
      // Return first accessible zone that could connect start and target
      const connecting = accessibleZones.find(zone => 
        zone.id !== startZone.id && zone.id !== targetZone.id
      );
      
      if (connecting) {
        intermediates.push(connecting);
      }
    }
    
    return intermediates;
  }

  /**
   * Calculate path distance in meters
   */
  private calculatePathDistance(waypoints: Waypoint[]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      
      // Simple Euclidean distance
      const dx = curr.coordinates.x - prev.coordinates.x;
      const dy = curr.coordinates.y - prev.coordinates.y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    
    return totalDistance;
  }

  /**
   * Calculate travel time based on mode and conditions
   */
  private calculateTravelTime(waypoints: Waypoint[], mode: NavigationMode): number {
    let totalTime = 0;
    
    // Base speed by mode (meters per minute)
    const speeds = {
      WALKING: 80,          // Normal walking pace
      ACCESSIBLE: 50,       // Slower for accessibility needs
      STROLLER_FRIENDLY: 60, // Moderate pace with stroller
      QUICKEST: 100,        // Fast walking
      SAFEST: 70,          // Slower but safer pace
    };
    
    const baseSpeed = speeds[mode] || speeds.WALKING;
    
    for (const waypoint of waypoints) {
      // Base traversal time
      totalTime += waypoint.estimatedTime;
      
      // Crowd impact
      const crowdDelay = waypoint.crowdDensity * 0.3; // 30% max delay
      totalTime *= (1 + crowdDelay);
    }
    
    return Math.round(totalTime);
  }

  /**
   * Calculate zone traversal time
   */
  private calculateZoneTraversalTime(zone: any, crowdDensity: number): number {
    // Base time depends on zone size and type
    let baseTime = 1; // 1 minute base
    
    if (zone.type === 'CORRIDOR') {
      baseTime = 0.5;
    } else if (zone.type === 'LARGE_PLAY_AREA') {
      baseTime = 2;
    } else if (zone.type === 'ENTRANCE') {
      baseTime = 0.5;
    }
    
    // Adjust for crowd density
    const crowdImpact = 1 + (crowdDensity * 0.5);
    
    return Math.round(baseTime * crowdImpact);
  }

  /**
   * Calculate overall path safety score
   */
  private calculatePathSafetyScore(waypoints: Waypoint[]): number {
    if (waypoints.length === 0) return 0;
    
    const totalSafety = waypoints.reduce((sum, wp) => sum + wp.safetyScore, 0);
    return totalSafety / waypoints.length;
  }

  /**
   * Calculate zone safety score
   */
  private calculateZoneSafetyScore(zone: any): number {
    let score = 0.7; // Base safety score
    
    // Zone type impact
    if (zone.type === 'ENTRANCE' || zone.type === 'EXIT') {
      score += 0.2; // High visibility areas
    } else if (zone.type === 'CORRIDOR') {
      score += 0.1; // Good visibility
    } else if (zone.type === 'SECLUDED_AREA') {
      score -= 0.2; // Lower visibility
    }
    
    // Camera coverage impact
    if (zone.cameras && zone.cameras.length > 0) {
      score += 0.1;
    }
    
    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Calculate crowd impact on path
   */
  private calculateCrowdImpact(waypoints: Waypoint[], crowdData: CrowdData[]): number {
    if (waypoints.length === 0) return 0;
    
    const totalCrowdDensity = waypoints.reduce((sum, wp) => sum + wp.crowdDensity, 0);
    return totalCrowdDensity / waypoints.length;
  }

  /**
   * Generate alternative navigation paths
   */
  private async generateAlternativePaths(
    startZone: any,
    targetZone: any,
    allZones: any[],
    crowdData: CrowdData[],
    options: NavigationOptions
  ): Promise<Array<{
    name: string;
    waypoints: Waypoint[];
    totalDistance: number;
    estimatedTime: number;
    benefits: string[];
  }>> {
    const alternatives: Array<{
      name: string;
      waypoints: Waypoint[];
      totalDistance: number;
      estimatedTime: number;
      benefits: string[];
    }> = [];

    try {
      // Safest route alternative
      const safestOptions = { ...options, prioritizeSafety: true, avoidCrowds: false };
      const safestPath = await this.calculateOptimalPath(startZone, targetZone, allZones, crowdData, safestOptions);
      
      alternatives.push({
        name: 'Safest Route',
        waypoints: safestPath.waypoints,
        totalDistance: safestPath.totalDistance,
        estimatedTime: safestPath.estimatedTime,
        benefits: ['Highest safety score', 'Well-monitored areas', 'Good visibility'],
      });

      // Fastest route alternative
      const fastestOptions = { ...options, mode: NavigationMode.QUICKEST, avoidCrowds: true };
      const fastestPath = await this.calculateOptimalPath(startZone, targetZone, allZones, crowdData, fastestOptions);
      
      alternatives.push({
        name: 'Fastest Route',
        waypoints: fastestPath.waypoints,
        totalDistance: fastestPath.totalDistance,
        estimatedTime: fastestPath.estimatedTime,
        benefits: ['Shortest time', 'Avoids crowds', 'Direct path'],
      });

      // Scenic/fun route alternative if venue has entertainment zones
      const entertainmentZones = allZones.filter(zone => 
        zone.type === 'PLAY_AREA' || 
        zone.type === 'ENTERTAINMENT' ||
        zone.name.toLowerCase().includes('fun')
      );

      if (entertainmentZones.length > 0) {
        const scenicPath = this.createScenicPath(startZone, targetZone, entertainmentZones, crowdData);
        alternatives.push({
          name: 'Scenic Route',
          waypoints: scenicPath.waypoints,
          totalDistance: scenicPath.totalDistance,
          estimatedTime: scenicPath.estimatedTime,
          benefits: ['Passes fun areas', 'Great for photos', 'Interactive journey'],
        });
      }

    } catch (error) {
      console.error('Error generating alternative paths:', error);
    }

    return alternatives;
  }

  /**
   * Create scenic path through interesting zones
   */
  private createScenicPath(
    startZone: any,
    targetZone: any,
    entertainmentZones: any[],
    crowdData: CrowdData[]
  ): {
    waypoints: Waypoint[];
    totalDistance: number;
    estimatedTime: number;
  } {
    const waypoints: Waypoint[] = [];
    
    // Start
    waypoints.push(this.createWaypoint(startZone, crowdData));
    
    // Add one entertainment zone if different from start/target
    const interestingZone = entertainmentZones.find(zone => 
      zone.id !== startZone.id && zone.id !== targetZone.id
    );
    
    if (interestingZone) {
      waypoints.push(this.createWaypoint(interestingZone, crowdData));
    }
    
    // Target
    if (targetZone.id !== startZone.id) {
      waypoints.push(this.createWaypoint(targetZone, crowdData));
    }
    
    return {
      waypoints,
      totalDistance: this.calculatePathDistance(waypoints),
      estimatedTime: this.calculateTravelTime(waypoints, NavigationMode.WALKING),
    };
  }

  /**
   * Update navigation progress when child moves
   */
  async updateNavigationProgress(
    requestId: string,
    currentZoneId: string
  ): Promise<{
    success: boolean;
    remainingTime?: number;
    nextWaypoint?: Waypoint;
    progress?: number;
    error?: string;
  }> {
    try {
      const request = await prisma.navigationRequest.findUnique({
        where: { id: requestId },
        include: { path: true },
      });

      if (!request || !request.path) {
        return {
          success: false,
          error: 'Navigation request not found',
        };
      }

      const waypoints = request.path.waypoints as any;
      const currentIndex = waypoints.findIndex((wp: any) => wp.zoneId === currentZoneId);
      
      if (currentIndex === -1) {
        return {
          success: false,
          error: 'Current location not found in path',
        };
      }

      const progress = (currentIndex + 1) / waypoints.length;
      const remainingWaypoints = waypoints.slice(currentIndex + 1);
      const remainingTime = remainingWaypoints.reduce((sum: number, wp: any) => sum + wp.estimatedTime, 0);
      const nextWaypoint = remainingWaypoints[0] || null;

      return {
        success: true,
        remainingTime,
        nextWaypoint,
        progress,
      };
    } catch (error: any) {
      console.error('Error updating navigation progress:', error);
      return {
        success: false,
        error: error.message || 'Failed to update navigation progress',
      };
    }
  }

  /**
   * Complete navigation when target is reached
   */
  async completeNavigation(requestId: string, actualTime: number): Promise<{
    success: boolean;
    summary?: {
      estimatedTime: number;
      actualTime: number;
      accuracy: number;
    };
    error?: string;
  }> {
    try {
      const request = await prisma.navigationRequest.update({
        where: { id: requestId },
        data: {
          actualTime,
          completedAt: new Date(),
        },
        include: { path: true },
      });

      const estimatedTime = request.estimatedTime || 0;
      const accuracy = estimatedTime > 0 ? Math.max(0, 1 - Math.abs(actualTime - estimatedTime) / estimatedTime) : 0;

      return {
        success: true,
        summary: {
          estimatedTime,
          actualTime,
          accuracy,
        },
      };
    } catch (error: any) {
      console.error('Error completing navigation:', error);
      return {
        success: false,
        error: error.message || 'Failed to complete navigation',
      };
    }
  }
}

// Export singleton instance
export const enhancedNavigationService = new EnhancedNavigationService();
