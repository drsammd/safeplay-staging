import { createAWSConfig } from "../utils/aws-config";

import { realTimeFaceRecognitionService } from './real-time-face-recognition-service';
import { liveTrackingService } from './live-tracking-service';
import { cameraHardwareIntegrationService } from './camera-hardware-integration-service';
import { webSocketService } from './websocket-service';
import { prisma } from '@/lib/db';

export interface CoreSafetyLoopStatus {
  isActive: boolean;
  venueId: string;
  activeCameras: number;
  activeChildren: number;
  recognitionRate: number;
  systemHealth: 'excellent' | 'good' | 'poor' | 'critical';
  lastUpdate: Date;
  metrics: {
    totalRecognitions: number;
    averageConfidence: number;
    responseTime: number;
    uptime: number;
  };
}

export interface SystemAlert {
  id: string;
  type: 'camera_offline' | 'low_confidence' | 'child_exit' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  venueId: string;
  childId?: string;
  cameraId?: string;
  timestamp: Date;
  acknowledged: boolean;
}

export class CoreSafetyLoopIntegrationService {
  private static instance: CoreSafetyLoopIntegrationService;
  private activeVenues: Map<string, CoreSafetyLoopStatus> = new Map();
  private systemAlerts: Map<string, SystemAlert[]> = new Map();
  private monitoringTimers: Map<string, NodeJS.Timeout> = new Map();
  private systemStartTime: Date = new Date();

  private constructor() {
    this.initializeIntegrationService();
  }

  public static getInstance(): CoreSafetyLoopIntegrationService {
    if (!CoreSafetyLoopIntegrationService.instance) {
      CoreSafetyLoopIntegrationService.instance = new CoreSafetyLoopIntegrationService();
    }
    return CoreSafetyLoopIntegrationService.instance;
  }

  private async initializeIntegrationService(): Promise<void> {
    console.log('Initializing Core Safety Loop Integration Service...');
    
    // Start system health monitoring
    this.startSystemHealthMonitoring();
    
    // Initialize alert monitoring
    this.startAlertMonitoring();
  }

  // Start Core Safety Loop for a venue
  async startCoreSafetyLoop(venueId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Starting Core Safety Loop for venue ${venueId}...`);

      // Initialize live tracking
      const trackingResult = await liveTrackingService.initializeVenueTracking(venueId);
      if (!trackingResult.success) {
        return { success: false, message: `Failed to initialize tracking: ${trackingResult.message}` };
      }

      // Get venue cameras
      const cameras = await prisma.camera.findMany({
        where: { venueId, isActive: true }
      });

      let connectedCameras = 0;
      
      // Configure face recognition for each camera
      for (const camera of cameras) {
        try {
          const configResult = await realTimeFaceRecognitionService.configureCameraStream({
            cameraId: camera.id,
            streamUrl: camera.streamUrl || `demo://camera-${camera.id}`,
            venueId,
            isActive: true,
            frameRate: 2, // 2 fps for real-time processing
            recognitionThreshold: (camera.recognitionThreshold || 0.8) * 100,
            zone: camera.name
          });

          if (configResult.success) {
            connectedCameras++;
          }
        } catch (error) {
          console.error(`Failed to configure camera ${camera.id}:`, error);
        }
      }

      // Create status record
      const status: CoreSafetyLoopStatus = {
        isActive: true,
        venueId,
        activeCameras: connectedCameras,
        activeChildren: 0, // Will be updated by tracking service
        recognitionRate: 0,
        systemHealth: connectedCameras > 0 ? 'good' : 'poor',
        lastUpdate: new Date(),
        metrics: {
          totalRecognitions: 0,
          averageConfidence: 0,
          responseTime: 0,
          uptime: 0
        }
      };

      this.activeVenues.set(venueId, status);
      this.systemAlerts.set(venueId, []);

      // Start monitoring for this venue
      this.startVenueMonitoring(venueId);

      // Broadcast system status
      await webSocketService.broadcastToVenue(venueId, {
        type: 'core_safety_loop_started',
        status,
        timestamp: new Date().toISOString()
      });

      console.log(`Core Safety Loop started for venue ${venueId} with ${connectedCameras} cameras`);
      return { 
        success: true, 
        message: `Core Safety Loop started successfully with ${connectedCameras} cameras` 
      };
    } catch (error) {
      console.error('Error starting Core Safety Loop:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to start Core Safety Loop' 
      };
    }
  }

  // Stop Core Safety Loop for a venue
  async stopCoreSafetyLoop(venueId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Stopping Core Safety Loop for venue ${venueId}...`);

      // Stop camera streams
      const cameras = await prisma.camera.findMany({
        where: { venueId }
      });

      for (const camera of cameras) {
        await realTimeFaceRecognitionService.stopCameraStream(camera.id);
        await cameraHardwareIntegrationService.disconnectCamera(camera.id);
      }

      // Stop venue monitoring
      const timer = this.monitoringTimers.get(venueId);
      if (timer) {
        clearInterval(timer);
        this.monitoringTimers.delete(venueId);
      }

      // Update status
      const status = this.activeVenues.get(venueId);
      if (status) {
        status.isActive = false;
        status.lastUpdate = new Date();
      }

      // Remove from active venues
      this.activeVenues.delete(venueId);
      this.systemAlerts.delete(venueId);

      // Broadcast system status
      await webSocketService.broadcastToVenue(venueId, {
        type: 'core_safety_loop_stopped',
        venueId,
        timestamp: new Date().toISOString()
      });

      console.log(`Core Safety Loop stopped for venue ${venueId}`);
      return { success: true, message: 'Core Safety Loop stopped successfully' };
    } catch (error) {
      console.error('Error stopping Core Safety Loop:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to stop Core Safety Loop' 
      };
    }
  }

  // Get status for a venue
  getVenueStatus(venueId: string): CoreSafetyLoopStatus | null {
    return this.activeVenues.get(venueId) || null;
  }

  // Get all active venues
  getAllActiveVenues(): CoreSafetyLoopStatus[] {
    return Array.from(this.activeVenues.values());
  }

  // Get alerts for a venue
  getVenueAlerts(venueId: string): SystemAlert[] {
    return this.systemAlerts.get(venueId) || [];
  }

  // Acknowledge alert
  async acknowledgeAlert(venueId: string, alertId: string): Promise<void> {
    const alerts = this.systemAlerts.get(venueId);
    if (alerts) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
      }
    }
  }

  private startVenueMonitoring(venueId: string): void {
    const timer = setInterval(async () => {
      await this.updateVenueStatus(venueId);
    }, 10000); // Update every 10 seconds

    this.monitoringTimers.set(venueId, timer);
  }

  private async updateVenueStatus(venueId: string): Promise<void> {
    try {
      const status = this.activeVenues.get(venueId);
      if (!status) return;

      // Get tracking data
      const trackingData = liveTrackingService.getVenueTrackingData(venueId);
      
      if (trackingData) {
        status.activeChildren = trackingData.activeChildren;
        status.recognitionRate = trackingData.averageConfidence;
      }

      // Get camera statuses
      const cameraStatuses = cameraHardwareIntegrationService.getAllCameraStatuses()
        .filter(camera => camera.cameraId.includes(venueId)); // Simple filter for demo

      const activeCameras = cameraStatuses.filter(camera => camera.isConnected).length;
      status.activeCameras = activeCameras;

      // Calculate system health
      const healthyRecognitionRate = status.recognitionRate > 85;
      const goodCameraRatio = activeCameras >= Math.ceil(cameraStatuses.length * 0.8);
      
      if (healthyRecognitionRate && goodCameraRatio) {
        status.systemHealth = 'excellent';
      } else if (status.recognitionRate > 70 && activeCameras > 0) {
        status.systemHealth = 'good';
      } else if (activeCameras > 0) {
        status.systemHealth = 'poor';
      } else {
        status.systemHealth = 'critical';
      }

      // Update metrics
      status.metrics.uptime = Math.floor((Date.now() - this.systemStartTime.getTime()) / 1000);
      status.metrics.responseTime = 1500 + Math.random() * 500; // Simulated response time
      status.lastUpdate = new Date();

      // Check for alerts
      await this.checkForAlerts(venueId, status);

      // Broadcast status update
      await webSocketService.broadcastToVenue(venueId, {
        type: 'core_safety_loop_status_update',
        status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`Error updating venue status for ${venueId}:`, error);
    }
  }

  private async checkForAlerts(venueId: string, status: CoreSafetyLoopStatus): Promise<void> {
    const alerts = this.systemAlerts.get(venueId) || [];

    // Check for camera offline alerts
    if (status.activeCameras === 0) {
      const existingAlert = alerts.find(a => a.type === 'camera_offline' && !a.acknowledged);
      if (!existingAlert) {
        const alert: SystemAlert = {
          id: `alert-${Date.now()}`,
          type: 'camera_offline',
          severity: 'critical',
          message: 'All cameras are offline. Child tracking is not available.',
          venueId,
          timestamp: new Date(),
          acknowledged: false
        };
        alerts.push(alert);
        await this.broadcastAlert(alert);
      }
    }

    // Check for low confidence alerts
    if (status.recognitionRate < 70 && status.recognitionRate > 0) {
      const existingAlert = alerts.find(a => a.type === 'low_confidence' && !a.acknowledged);
      if (!existingAlert) {
        const alert: SystemAlert = {
          id: `alert-${Date.now()}`,
          type: 'low_confidence',
          severity: 'medium',
          message: `Face recognition confidence is low (${status.recognitionRate.toFixed(1)}%). Check camera positioning and lighting.`,
          venueId,
          timestamp: new Date(),
          acknowledged: false
        };
        alerts.push(alert);
        await this.broadcastAlert(alert);
      }
    }

    // Check for system errors
    if (status.systemHealth === 'critical') {
      const existingAlert = alerts.find(a => a.type === 'system_error' && !a.acknowledged);
      if (!existingAlert) {
        const alert: SystemAlert = {
          id: `alert-${Date.now()}`,
          type: 'system_error',
          severity: 'critical',
          message: 'Core Safety Loop is experiencing critical issues. Immediate attention required.',
          venueId,
          timestamp: new Date(),
          acknowledged: false
        };
        alerts.push(alert);
        await this.broadcastAlert(alert);
      }
    }

    this.systemAlerts.set(venueId, alerts);
  }

  private async broadcastAlert(alert: SystemAlert): Promise<void> {
    await webSocketService.broadcastToVenue(alert.venueId, {
      type: 'safety_alert',
      alert,
      timestamp: alert.timestamp.toISOString()
    });
  }

  private startSystemHealthMonitoring(): void {
    setInterval(async () => {
      await this.monitorSystemHealth();
    }, 60000); // Every minute
  }

  private async monitorSystemHealth(): Promise<void> {
    try {
      const activeVenueCount = this.activeVenues.size;
      const totalCameras = Array.from(this.activeVenues.values())
        .reduce((sum, status) => sum + status.activeCameras, 0);
      
      console.log(`System Health Check: ${activeVenueCount} active venues, ${totalCameras} active cameras`);
      
      // Log any critical issues
      for (const [venueId, status] of this.activeVenues.entries()) {
        if (status.systemHealth === 'critical') {
          console.warn(`CRITICAL: Venue ${venueId} has critical system health issues`);
        }
      }
    } catch (error) {
      console.error('Error in system health monitoring:', error);
    }
  }

  private startAlertMonitoring(): void {
    setInterval(async () => {
      await this.cleanupOldAlerts();
    }, 300000); // Every 5 minutes
  }

  private async cleanupOldAlerts(): Promise<void> {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = new Date(Date.now() - maxAge);

    for (const [venueId, alerts] of this.systemAlerts.entries()) {
      const filteredAlerts = alerts.filter(alert => 
        alert.timestamp > cutoff || !alert.acknowledged
      );
      this.systemAlerts.set(venueId, filteredAlerts);
    }
  }

  // Get system-wide statistics
  getSystemStatistics(): {
    totalActiveVenues: number;
    totalActiveCameras: number;
    totalActiveChildren: number;
    averageSystemHealth: string;
    totalAlerts: number;
    systemUptime: number;
  } {
    const venues = Array.from(this.activeVenues.values());
    const totalAlerts = Array.from(this.systemAlerts.values())
      .reduce((sum, alerts) => sum + alerts.filter(a => !a.acknowledged).length, 0);

    return {
      totalActiveVenues: venues.length,
      totalActiveCameras: venues.reduce((sum, v) => sum + v.activeCameras, 0),
      totalActiveChildren: venues.reduce((sum, v) => sum + v.activeChildren, 0),
      averageSystemHealth: this.calculateAverageHealth(venues),
      totalAlerts,
      systemUptime: Math.floor((Date.now() - this.systemStartTime.getTime()) / 1000)
    };
  }

  private calculateAverageHealth(venues: CoreSafetyLoopStatus[]): string {
    if (venues.length === 0) return 'unknown';
    
    const healthScores = venues.map(v => {
      switch (v.systemHealth) {
        case 'excellent': return 4;
        case 'good': return 3;
        case 'poor': return 2;
        case 'critical': return 1;
        default: return 0;
      }
    });

    const averageScore = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
    
    if (averageScore >= 3.5) return 'excellent';
    if (averageScore >= 2.5) return 'good';
    if (averageScore >= 1.5) return 'poor';
    return 'critical';
  }
}

// Export singleton instance
export const coreSafetyLoopIntegrationService = CoreSafetyLoopIntegrationService.getInstance();
