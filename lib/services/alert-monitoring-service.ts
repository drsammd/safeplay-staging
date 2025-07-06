// @ts-nocheck

import { prisma } from '@/lib/db';
import { NotificationService } from './notification-service';
import { WebSocketService } from './websocket-service';
import { 
  EnhancedAlertType,
  AlertSeverity,
  AlertPriority,
  EnhancedAlertStatus,
  SightingType,
  NotificationChannel,
  NotificationRecipientType 
} from '@prisma/client';

export class AlertMonitoringService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the alert monitoring service
   */
  start(): void {
    if (this.isRunning) {
      console.log('Alert monitoring service is already running');
      return;
    }

    console.log('Starting Alert Monitoring Service...');
    this.isRunning = true;

    // Run initial check
    this.runMonitoringCycle().catch(console.error);

    // Set up periodic monitoring (every 30 seconds)
    this.monitoringInterval = setInterval(() => {
      this.runMonitoringCycle().catch(console.error);
    }, 30000);
  }

  /**
   * Stop the alert monitoring service
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
    console.log('Alert monitoring service stopped');
  }

  /**
   * Run a complete monitoring cycle
   */
  private async runMonitoringCycle(): Promise<void> {
    try {
      console.log('Running alert monitoring cycle...');
      
      // Check for missing children
      await this.checkMissingChildren();
      
      // Check for auto-resolve alerts
      await this.checkAutoResolveAlerts();
      
      // Check for alert escalations
      await this.checkAlertEscalations();
      
      // Process unauthorized detections
      await this.processUnauthorizedDetections();
      
      // Clean up old notifications
      await this.cleanupOldNotifications();
      
    } catch (error) {
      console.error('Error in monitoring cycle:', error);
    }
  }

  /**
   * Check for children who haven't been seen for configured time thresholds
   */
  private async checkMissingChildren(): Promise<void> {
    try {
      // Get all active venues with alert rules for missing children
      const venues = await prisma.venue.findMany({
        where: {
          active: true,
          alertRules: {
            some: {
              alertType: EnhancedAlertType.CHILD_MISSING,
              isActive: true
            }
          }
        },
        include: {
          alertRules: {
            where: {
              alertType: EnhancedAlertType.CHILD_MISSING,
              isActive: true
            }
          },
          children: {
            where: {
              status: 'CHECKED_IN',
              faceRecognitionEnabled: true
            },
            include: {
              parent: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              },
              childSightings: {
                orderBy: {
                  timestamp: 'desc'
                },
                take: 1
              }
            }
          }
        }
      });

      for (const venue of venues) {
        const alertRule = venue.alertRules[0]; // Assuming one rule per type per venue
        const thresholds = alertRule.thresholds as any;
        const missingThresholdMinutes = thresholds?.missingThresholdMinutes || 30;
        const escalationThresholdMinutes = thresholds?.escalationThresholdMinutes || 60;
        
        const missingThreshold = new Date(Date.now() - missingThresholdMinutes * 60 * 1000);
        const escalationThreshold = new Date(Date.now() - escalationThresholdMinutes * 60 * 1000);

        for (const child of venue.children) {
          const lastSighting = child.childSightings[0];
          
          // Skip if child was seen recently
          if (lastSighting && lastSighting.timestamp > missingThreshold) {
            continue;
          }

          // Check if we already have an active missing child alert
          const existingAlert = await prisma.enhancedAlert.findFirst({
            where: {
              childId: child.id,
              venueId: venue.id,
              type: EnhancedAlertType.CHILD_MISSING,
              status: {
                in: [EnhancedAlertStatus.ACTIVE, EnhancedAlertStatus.ACKNOWLEDGED, EnhancedAlertStatus.IN_PROGRESS]
              }
            }
          });

          if (existingAlert) {
            // Check if we need to escalate
            if (lastSighting && lastSighting.timestamp < escalationThreshold && existingAlert.escalationLevel === 0) {
              await this.escalateAlert(existingAlert.id, 'Child missing for extended period');
            }
            continue;
          }

          // Create missing child alert
          const severity = lastSighting && lastSighting.timestamp < escalationThreshold 
            ? AlertSeverity.CRITICAL 
            : AlertSeverity.HIGH;

          const alert = await prisma.enhancedAlert.create({
            data: {
              type: EnhancedAlertType.CHILD_MISSING,
              title: `Missing Child: ${child.firstName} ${child.lastName}`,
              description: `${child.firstName} ${child.lastName} has not been seen at ${venue.name} for ${missingThresholdMinutes} minutes.`,
              severity,
              priority: AlertPriority.URGENT,
              status: EnhancedAlertStatus.ACTIVE,
              childId: child.id,
              venueId: venue.id,
              lastSeenLocation: lastSighting?.position as any,
              lastSeenTime: lastSighting?.timestamp,
              triggerData: {
                missingThresholdMinutes,
                lastSightingId: lastSighting?.id,
                cameraId: lastSighting?.cameraId,
                zoneId: lastSighting?.floorPlanZoneId
              },
              metadata: {
                autoGenerated: true,
                alertRuleId: alertRule.id
              }
            },
            include: {
              child: {
                include: {
                  parent: true
                }
              },
              venue: true
            }
          });

          // Create timeline entry
          await prisma.alertTimelineEntry.create({
            data: {
              alertId: alert.id,
              eventType: 'CREATED',
              description: 'Missing child alert automatically generated',
              metadata: {
                autoGenerated: true,
                lastSeen: lastSighting?.timestamp,
                thresholdMinutes: missingThresholdMinutes
              }
            }
          });

          // Send notifications
          await this.sendMissingChildNotifications(alert);

          // Broadcast via WebSocket
          WebSocketService.getInstance().sendEmergencyBroadcast(alert.venueId, alert);

          console.log(`Created missing child alert for ${child.firstName} ${child.lastName} at ${venue.name}`);
        }
      }
    } catch (error) {
      console.error('Error checking missing children:', error);
    }
  }

  /**
   * Check for alerts that should be auto-resolved
   */
  private async checkAutoResolveAlerts(): Promise<void> {
    try {
      const now = new Date();
      
      const alertsToResolve = await prisma.enhancedAlert.findMany({
        where: {
          autoResolveAt: {
            lte: now
          },
          status: {
            in: [EnhancedAlertStatus.ACTIVE, EnhancedAlertStatus.ACKNOWLEDGED]
          }
        }
      });

      for (const alert of alertsToResolve) {
        await prisma.enhancedAlert.update({
          where: { id: alert.id },
          data: {
            status: EnhancedAlertStatus.RESOLVED,
            resolvedAt: now,
            resolution: 'Auto-resolved based on configured timeout',
            responseTime: alert.createdAt ? Math.floor((now.getTime() - alert.createdAt.getTime()) / 1000) : null
          }
        });

        // Create timeline entry
        await prisma.alertTimelineEntry.create({
          data: {
            alertId: alert.id,
            eventType: 'RESOLVED',
            description: 'Alert auto-resolved due to timeout',
            metadata: {
              autoResolved: true,
              resolvedAt: now
            }
          }
        });

        console.log(`Auto-resolved alert ${alert.id}: ${alert.title}`);
      }
    } catch (error) {
      console.error('Error checking auto-resolve alerts:', error);
    }
  }

  /**
   * Check for alerts that need escalation
   */
  private async checkAlertEscalations(): Promise<void> {
    try {
      const escalationThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes

      const alertsToEscalate = await prisma.enhancedAlert.findMany({
        where: {
          createdAt: {
            lte: escalationThreshold
          },
          escalationLevel: 0,
          status: {
            in: [EnhancedAlertStatus.ACTIVE, EnhancedAlertStatus.ACKNOWLEDGED]
          },
          severity: {
            in: [AlertSeverity.HIGH, AlertSeverity.CRITICAL, AlertSeverity.EMERGENCY]
          }
        }
      });

      for (const alert of alertsToEscalate) {
        await this.escalateAlert(alert.id, 'Alert escalated due to no response within threshold time');
      }
    } catch (error) {
      console.error('Error checking alert escalations:', error);
    }
  }

  /**
   * Escalate an alert
   */
  private async escalateAlert(alertId: string, reason: string): Promise<void> {
    try {
      const alert = await prisma.enhancedAlert.update({
        where: { id: alertId },
        data: {
          escalationLevel: {
            increment: 1
          },
          escalatedAt: new Date(),
          status: EnhancedAlertStatus.ESCALATED
        },
        include: {
          child: {
            include: {
              parent: true
            }
          },
          venue: true
        }
      });

      // Create timeline entry
      await prisma.alertTimelineEntry.create({
        data: {
          alertId: alertId,
          eventType: 'ESCALATED',
          description: reason,
          metadata: {
            escalationLevel: alert.escalationLevel,
            autoEscalated: true
          }
        }
      });

      // Send escalation notifications
      await this.sendEscalationNotifications(alert);

      // Broadcast via WebSocket
      WebSocketService.getInstance().broadcastToVenue(alert.venueId, {
        type: 'ALERT_UPDATED',
        data: {
          alert,
          message: `Alert escalated: ${alert.title}`,
          escalationLevel: alert.escalationLevel
        },
        recipients: {
          roles: ['SUPER_ADMIN'],
          venueIds: [alert.venueId]
        }
      });

      console.log(`Escalated alert ${alertId} to level ${alert.escalationLevel}: ${reason}`);
    } catch (error) {
      console.error('Error escalating alert:', error);
    }
  }

  /**
   * Process unauthorized detections and create alerts if needed
   */
  private async processUnauthorizedDetections(): Promise<void> {
    try {
      // Get unprocessed unauthorized detections with high risk
      const detections = await prisma.unauthorizedDetection.findMany({
        where: {
          alertGenerated: false,
          riskLevel: {
            in: ['HIGH', 'CRITICAL']
          },
          timestamp: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        },
        include: {
          venue: true,
          camera: true,
          zone: true
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 10
      });

      for (const detection of detections) {
        const alert = await prisma.enhancedAlert.create({
          data: {
            type: detection.detectionType === 'UNKNOWN_ADULT' 
              ? EnhancedAlertType.UNAUTHORIZED_PERSON 
              : EnhancedAlertType.STRANGER_DANGER,
            title: `Unauthorized Person Detected`,
            description: `${detection.description || 'Unauthorized person detected'} at ${detection.venue.name}`,
            severity: detection.riskLevel === 'CRITICAL' ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
            priority: AlertPriority.HIGH,
            status: EnhancedAlertStatus.ACTIVE,
            venueId: detection.venueId,
            cameraId: detection.cameraId,
            floorPlanZoneId: detection.floorPlanZoneId,
            imageUrls: detection.imageUrl ? [detection.imageUrl] : [],
            triggerData: {
              detectionId: detection.id,
              detectionType: detection.detectionType,
              confidence: detection.confidence,
              estimatedAge: detection.estimatedAge,
              riskLevel: detection.riskLevel
            },
            location: {
              camera: detection.camera?.name,
              zone: detection.zone?.name
            },
            metadata: {
              autoGenerated: true,
              detectionTimestamp: detection.timestamp
            }
          },
          include: {
            venue: true,
            camera: true,
            zone: true
          }
        });

        // Mark detection as processed
        await prisma.unauthorizedDetection.update({
          where: { id: detection.id },
          data: {
            alertGenerated: true,
            alertId: alert.id
          }
        });

        // Create timeline entry
        await prisma.alertTimelineEntry.create({
          data: {
            alertId: alert.id,
            eventType: 'CREATED',
            description: 'Alert created from unauthorized detection',
            metadata: {
              autoGenerated: true,
              detectionId: detection.id
            }
          }
        });

        // Send notifications
        await this.sendUnauthorizedPersonNotifications(alert);

        // Broadcast via WebSocket
        WebSocketService.getInstance().sendEmergencyBroadcast(alert.venueId, alert);

        console.log(`Created unauthorized person alert from detection ${detection.id}`);
      }
    } catch (error) {
      console.error('Error processing unauthorized detections:', error);
    }
  }

  /**
   * Clean up old notifications
   */
  private async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await prisma.alertNotification.deleteMany({
        where: {
          scheduledAt: {
            lt: thirtyDaysAgo
          },
          status: {
            in: ['DELIVERED', 'READ', 'FAILED']
          }
        }
      });

      if (result.count > 0) {
        console.log(`Cleaned up ${result.count} old notifications`);
      }
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }

  /**
   * Send missing child notifications
   */
  private async sendMissingChildNotifications(alert: any): Promise<void> {
    try {
      const recipients = [];

      // Add parent
      if (alert.child?.parent) {
        recipients.push({
          userId: alert.child.parent.id,
          recipientType: NotificationRecipientType.PARENT,
          channels: [NotificationChannel.SMS, NotificationChannel.EMAIL, NotificationChannel.PUSH_NOTIFICATION]
        });
      }

      // Add venue admin
      const venue = await prisma.venue.findUnique({
        where: { id: alert.venueId },
        include: {
          admin: true
        }
      });

      if (venue?.admin) {
        recipients.push({
          userId: venue.admin.id,
          recipientType: NotificationRecipientType.VENUE_ADMIN,
          channels: [NotificationChannel.SMS, NotificationChannel.EMAIL, NotificationChannel.IN_APP]
        });
      }

      // Add company admins
      const companyAdmins = await prisma.user.findMany({
        where: {
          role: 'SUPER_ADMIN'
        }
      });

      for (const admin of companyAdmins) {
        recipients.push({
          userId: admin.id,
          recipientType: NotificationRecipientType.SUPER_ADMIN,
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
        });
      }

      await NotificationService.sendAlertNotifications(alert.id, recipients);
    } catch (error) {
      console.error('Error sending missing child notifications:', error);
    }
  }

  /**
   * Send escalation notifications
   */
  private async sendEscalationNotifications(alert: any): Promise<void> {
    try {
      const recipients = [];

      // Add company admins for escalated alerts
      const companyAdmins = await prisma.user.findMany({
        where: {
          role: 'SUPER_ADMIN'
        }
      });

      for (const admin of companyAdmins) {
        recipients.push({
          userId: admin.id,
          recipientType: NotificationRecipientType.SUPER_ADMIN,
          channels: [NotificationChannel.SMS, NotificationChannel.EMAIL, NotificationChannel.PHONE_CALL]
        });
      }

      const escalationMessage = `ESCALATED ALERT: ${alert.title} at ${alert.venue.name}. Escalation level: ${alert.escalationLevel}`;

      await NotificationService.sendAlertNotifications(alert.id, recipients, escalationMessage);
    } catch (error) {
      console.error('Error sending escalation notifications:', error);
    }
  }

  /**
   * Send unauthorized person notifications
   */
  private async sendUnauthorizedPersonNotifications(alert: any): Promise<void> {
    try {
      const recipients = [];

      // Add venue admin
      const venue = await prisma.venue.findUnique({
        where: { id: alert.venueId },
        include: {
          admin: true
        }
      });

      if (venue?.admin) {
        recipients.push({
          userId: venue.admin.id,
          recipientType: NotificationRecipientType.VENUE_ADMIN,
          channels: [NotificationChannel.SMS, NotificationChannel.EMAIL, NotificationChannel.IN_APP]
        });
      }

      await NotificationService.sendAlertNotifications(alert.id, recipients);
    } catch (error) {
      console.error('Error sending unauthorized person notifications:', error);
    }
  }

  /**
   * Process a face recognition event and create child sighting
   */
  static async processFaceRecognitionEvent(recognitionEvent: any): Promise<void> {
    try {
      // Create child sighting record
      const sighting = await prisma.childSighting.create({
        data: {
          childId: recognitionEvent.childId,
          venueId: recognitionEvent.venueId,
          confidence: recognitionEvent.confidence,
          boundingBox: recognitionEvent.boundingBox,
          imageUrl: recognitionEvent.sourceImageUrl,
          imageKey: recognitionEvent.sourceImageKey,
          recognitionEventId: recognitionEvent.id,
          sightingType: SightingType.DETECTED,
          timestamp: recognitionEvent.createdAt,
          metadata: {
            processingTime: recognitionEvent.processingTime,
            recognitionData: recognitionEvent.recognitionData
          }
        },
        include: {
          child: {
            include: {
              parent: true
            }
          },
          venue: true
        }
      });

      // Send real-time update
      WebSocketService.getInstance().broadcastToVenue(sighting.venueId, {
        type: 'CHILD_SIGHTING_UPDATE',
        data: sighting
      });

      // Check if we should create a child detected alert
      await AlertMonitoringService.checkChildDetectedAlert(sighting);

    } catch (error) {
      console.error('Error processing face recognition event:', error);
    }
  }

  /**
   * Check if we should create a child detected alert
   */
  private static async checkChildDetectedAlert(sighting: any): Promise<void> {
    try {
      // Check if there's an alert rule for child detection
      const alertRule = await prisma.alertRule.findFirst({
        where: {
          venueId: sighting.venueId,
          alertType: EnhancedAlertType.CHILD_DETECTED,
          isActive: true
        }
      });

      if (!alertRule) return;

      // Check conditions (e.g., only alert for first sighting of the day)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const previousSightings = await prisma.childSighting.count({
        where: {
          childId: sighting.childId,
          venueId: sighting.venueId,
          timestamp: {
            gte: todayStart,
            lt: sighting.timestamp
          }
        }
      });

      // Only create alert for first sighting if configured
      const conditions = alertRule.conditions as any;
      if (conditions?.firstSightingOnly && previousSightings > 0) {
        return;
      }

      // Create child detected alert
      const alert = await prisma.enhancedAlert.create({
        data: {
          type: EnhancedAlertType.CHILD_DETECTED,
          title: `Child Detected: ${sighting.child.firstName} ${sighting.child.lastName}`,
          description: `${sighting.child.firstName} ${sighting.child.lastName} has been detected at ${sighting.venue.name}`,
          severity: AlertSeverity.LOW,
          priority: AlertPriority.NORMAL,
          status: EnhancedAlertStatus.ACTIVE,
          childId: sighting.childId,
          venueId: sighting.venueId,
          triggerData: {
            sightingId: sighting.id,
            confidence: sighting.confidence,
            isFirstSighting: previousSightings === 0
          },
          imageUrls: sighting.imageUrl ? [sighting.imageUrl] : [],
          autoResolveAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Auto-resolve in 24 hours
          metadata: {
            autoGenerated: true,
            alertRuleId: alertRule.id
          }
        },
        include: {
          child: {
            include: {
              parent: true
            }
          },
          venue: true
        }
      });

      // Send notifications to parent
      if (sighting.child?.parent) {
        await NotificationService.sendAlertNotifications(alert.id, [{
          userId: sighting.child.parent.id,
          recipientType: NotificationRecipientType.PARENT,
          channels: [NotificationChannel.PUSH_NOTIFICATION, NotificationChannel.IN_APP]
        }]);
      }

      console.log(`Created child detection alert for ${sighting.child.firstName} ${sighting.child.lastName}`);
    } catch (error) {
      console.error('Error checking child detected alert:', error);
    }
  }
}

// Export singleton instance
export const alertMonitoringService = new AlertMonitoringService();
