
import { webSocketService } from './websocket-service';
import { realTimeFaceRecognitionService } from './real-time-face-recognition-service';
import { prisma } from '@/lib/db';

export interface ChildLocation {
  childId: string;
  childName: string;
  venueId: string;
  zone: string;
  coordinates: { x: number; y: number };
  confidence: number;
  lastSeen: Date;
  status: 'present' | 'departed' | 'unknown';
  cameraId?: string;
  alertLevel: 'green' | 'yellow' | 'red';
}

export interface ZoneOccupancy {
  zoneId: string;
  zoneName: string;
  currentOccupancy: number;
  maxCapacity: number;
  utilizationRate: number;
  children: string[]; // child IDs
  alerts: string[];
  lastUpdated: Date;
}

export interface VenueTrackingStatus {
  venueId: string;
  totalChildren: number;
  activeChildren: number;
  totalZones: number;
  alerts: number;
  averageConfidence: number;
  lastUpdated: Date;
  zones: ZoneOccupancy[];
  children: ChildLocation[];
}

export class LiveTrackingService {
  private static instance: LiveTrackingService;
  private venueTracking: Map<string, VenueTrackingStatus> = new Map();
  private childLocations: Map<string, ChildLocation> = new Map();
  private zoneOccupancy: Map<string, ZoneOccupancy> = new Map();
  private trackingTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeTrackingSystem();
  }

  public static getInstance(): LiveTrackingService {
    if (!LiveTrackingService.instance) {
      LiveTrackingService.instance = new LiveTrackingService();
    }
    return LiveTrackingService.instance;
  }

  private async initializeTrackingSystem(): Promise<void> {
    console.log('Initializing Live Tracking Service...');
    
    // Start tracking updates every 5 seconds
    setInterval(async () => {
      await this.updateTrackingData();
    }, 5000);

    // Start demo simulations every 10 seconds for active venues
    setInterval(async () => {
      await this.simulateDemoTracking();
    }, 10000);
  }

  // Initialize tracking for a venue
  async initializeVenueTracking(venueId: string): Promise<{ success: boolean; message: string }> {
    try {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        include: {
          children: {
            where: { currentVenueId: venueId },
            include: { parent: true }
          },
          floorPlans: {
            include: { zones: true }
          }
        }
      });

      if (!venue) {
        return { success: false, message: 'Venue not found' };
      }

      // Initialize zone tracking
      const zones: ZoneOccupancy[] = [];
      if (venue.floorPlans[0]?.zones) {
        for (const zone of venue.floorPlans[0].zones) {
          const zoneOccupancy: ZoneOccupancy = {
            zoneId: zone.id,
            zoneName: zone.name,
            currentOccupancy: 0,
            maxCapacity: zone.capacity || 20,
            utilizationRate: 0,
            children: [],
            alerts: [],
            lastUpdated: new Date()
          };
          zones.push(zoneOccupancy);
          this.zoneOccupancy.set(zone.id, zoneOccupancy);
        }
      }

      // Initialize child tracking
      const children: ChildLocation[] = [];
      for (const child of venue.children) {
        const childLocation: ChildLocation = {
          childId: child.id,
          childName: `${child.firstName} ${child.lastName}`,
          venueId,
          zone: 'Entrance', // Default zone
          coordinates: { x: 0, y: 0 },
          confidence: 0,
          lastSeen: new Date(),
          status: 'present',
          alertLevel: 'green'
        };
        children.push(childLocation);
        this.childLocations.set(child.id, childLocation);
      }

      const venueStatus: VenueTrackingStatus = {
        venueId,
        totalChildren: children.length,
        activeChildren: children.length,
        totalZones: zones.length,
        alerts: 0,
        averageConfidence: 0,
        lastUpdated: new Date(),
        zones,
        children
      };

      this.venueTracking.set(venueId, venueStatus);

      console.log(`Venue tracking initialized for ${venueId} with ${children.length} children and ${zones.length} zones`);
      return { success: true, message: 'Venue tracking initialized successfully' };
    } catch (error) {
      console.error('Error initializing venue tracking:', error);
      return { success: false, message: 'Failed to initialize venue tracking' };
    }
  }

  // Update child location from recognition result
  async updateChildLocation(
    childId: string,
    venueId: string,
    zone: string,
    coordinates: { x: number; y: number },
    confidence: number,
    cameraId?: string
  ): Promise<void> {
    try {
      const existingLocation = this.childLocations.get(childId);
      const child = await prisma.child.findUnique({
        where: { id: childId },
        select: { firstName: true, lastName: true }
      });

      if (!child) return;

      const updatedLocation: ChildLocation = {
        childId,
        childName: `${child.firstName} ${child.lastName}`,
        venueId,
        zone,
        coordinates,
        confidence,
        lastSeen: new Date(),
        status: 'present',
        cameraId,
        alertLevel: this.calculateAlertLevel(zone, confidence)
      };

      this.childLocations.set(childId, updatedLocation);

      // Update zone occupancy
      await this.updateZoneOccupancy(venueId, existingLocation?.zone, zone, childId);

      // Update venue tracking status
      await this.updateVenueStatus(venueId);

      // Broadcast location update
      await this.broadcastLocationUpdate(updatedLocation);

    } catch (error) {
      console.error('Error updating child location:', error);
    }
  }

  private calculateAlertLevel(zone: string, confidence: number): 'green' | 'yellow' | 'red' {
    if (zone.toLowerCase().includes('exit') || zone.toLowerCase().includes('emergency')) {
      return 'yellow';
    }
    if (confidence < 0.8) {
      return 'yellow';
    }
    return 'green';
  }

  private async updateZoneOccupancy(
    venueId: string,
    previousZone: string | undefined,
    currentZone: string,
    childId: string
  ): Promise<void> {
    // Remove from previous zone
    if (previousZone && previousZone !== currentZone) {
      const prevZoneData = Array.from(this.zoneOccupancy.values())
        .find(z => z.zoneName === previousZone);
      if (prevZoneData) {
        prevZoneData.children = prevZoneData.children.filter(id => id !== childId);
        prevZoneData.currentOccupancy = prevZoneData.children.length;
        prevZoneData.utilizationRate = prevZoneData.currentOccupancy / prevZoneData.maxCapacity;
        prevZoneData.lastUpdated = new Date();
      }
    }

    // Add to current zone
    const currentZoneData = Array.from(this.zoneOccupancy.values())
      .find(z => z.zoneName === currentZone);
    if (currentZoneData) {
      if (!currentZoneData.children.includes(childId)) {
        currentZoneData.children.push(childId);
      }
      currentZoneData.currentOccupancy = currentZoneData.children.length;
      currentZoneData.utilizationRate = currentZoneData.currentOccupancy / currentZoneData.maxCapacity;
      currentZoneData.lastUpdated = new Date();

      // Check for capacity alerts
      if (currentZoneData.utilizationRate > 0.9) {
        currentZoneData.alerts.push('Near capacity');
      } else {
        currentZoneData.alerts = currentZoneData.alerts.filter(a => a !== 'Near capacity');
      }
    }
  }

  private async updateVenueStatus(venueId: string): Promise<void> {
    const venueStatus = this.venueTracking.get(venueId);
    if (!venueStatus) return;

    const children = Array.from(this.childLocations.values())
      .filter(c => c.venueId === venueId);

    const zones = Array.from(this.zoneOccupancy.values());

    venueStatus.activeChildren = children.filter(c => c.status === 'present').length;
    venueStatus.alerts = children.filter(c => c.alertLevel !== 'green').length +
                        zones.reduce((sum, z) => sum + z.alerts.length, 0);
    venueStatus.averageConfidence = children.length > 0 
      ? children.reduce((sum, c) => sum + c.confidence, 0) / children.length 
      : 0;
    venueStatus.lastUpdated = new Date();
    venueStatus.children = children;
    venueStatus.zones = zones;
  }

  private async broadcastLocationUpdate(location: ChildLocation): Promise<void> {
    await webSocketService.broadcastToVenue(location.venueId, {
      type: 'live_location_update',
      childId: location.childId,
      childName: location.childName,
      zone: location.zone,
      coordinates: location.coordinates,
      confidence: location.confidence,
      alertLevel: location.alertLevel,
      timestamp: location.lastSeen.toISOString()
    });
  }

  // Get live tracking data for venue
  getVenueTrackingData(venueId: string): VenueTrackingStatus | null {
    return this.venueTracking.get(venueId) || null;
  }

  // Get child location
  getChildLocation(childId: string): ChildLocation | null {
    return this.childLocations.get(childId) || null;
  }

  // Update tracking data from database
  private async updateTrackingData(): Promise<void> {
    try {
      // Get recent face recognition events and update locations
      const recentEvents = await prisma.faceRecognitionEvent.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30000) // Last 30 seconds
          }
        },
        include: {
          child: {
            select: { firstName: true, lastName: true, currentVenueId: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      for (const event of recentEvents) {
        if (event.child?.currentVenueId) {
          const zone = event.recognitionData && typeof event.recognitionData === 'object'
            ? (event.recognitionData as any).zone || 'Unknown Zone'
            : 'Unknown Zone';

          await this.updateChildLocation(
            event.childId,
            event.child.currentVenueId,
            zone,
            { x: 0, y: 0 }, // Would be calculated from bounding box
            event.confidence,
            event.recognitionData && typeof event.recognitionData === 'object'
              ? (event.recognitionData as any).cameraId
              : undefined
          );
        }
      }
    } catch (error) {
      console.error('Error updating tracking data:', error);
    }
  }

  // Simulate demo tracking data
  private async simulateDemoTracking(): Promise<void> {
    try {
      for (const [venueId, venueStatus] of this.venueTracking.entries()) {
        if (venueStatus.children.length === 0) continue;

        // Simulate random child movements
        const activeChildren = venueStatus.children.filter(() => Math.random() > 0.3);

        for (const child of activeChildren) {
          const zones = ['Play Area A', 'Play Area B', 'Climbing Zone', 'Ball Pit', 'Toddler Area', 'Snack Bar'];
          const randomZone = zones[Math.floor(Math.random() * zones.length)];
          
          await this.updateChildLocation(
            child.childId,
            venueId,
            randomZone,
            {
              x: Math.random() * 800,
              y: Math.random() * 600
            },
            0.85 + Math.random() * 0.14
          );
        }
      }
    } catch (error) {
      console.error('Error in demo tracking simulation:', error);
    }
  }

  // Get tracking statistics
  getTrackingStatistics(): {
    totalVenues: number;
    totalChildren: number;
    activeChildren: number;
    totalAlerts: number;
  } {
    const venues = Array.from(this.venueTracking.values());
    return {
      totalVenues: venues.length,
      totalChildren: venues.reduce((sum, v) => sum + v.totalChildren, 0),
      activeChildren: venues.reduce((sum, v) => sum + v.activeChildren, 0),
      totalAlerts: venues.reduce((sum, v) => sum + v.alerts, 0)
    };
  }
}

// Export singleton instance
export const liveTrackingService = LiveTrackingService.getInstance();
