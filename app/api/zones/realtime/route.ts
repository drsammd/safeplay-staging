
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/zones/realtime - Get real-time zone data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const zoneIds = searchParams.get('zoneIds')?.split(',');
    const includeHistory = searchParams.get('includeHistory') === 'true';

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 });
    }

    // Check venue access
    if (session.user.role === 'VENUE_ADMIN') {
      const venue = await prisma.venue.findFirst({
        where: { id: venueId, adminId: session.user.id }
      });
      if (!venue) {
        return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
      }
    }

    // Build zone filter
    let zoneFilter: any = {
      floorPlan: { venueId }
    };

    if (zoneIds && zoneIds.length > 0) {
      zoneFilter.id = { in: zoneIds };
    }

    // Get real-time zone data
    const zones = await prisma.floorPlanZone.findMany({
      where: zoneFilter,
      include: {
        configuration: {
          select: {
            maxCapacity: true,
            minStaffRequired: true,
            isMaintenanceMode: true,
            hazardLevel: true,
            safetyLevel: true
          }
        },
        capacityRecords: {
          orderBy: { lastUpdated: 'desc' },
          take: 1
        },
        occupancyHistory: includeHistory ? {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
            }
          },
          orderBy: { timestamp: 'desc' }
        } : false,
        childSightings: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
            }
          },
          include: {
            child: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { timestamp: 'desc' }
        },
        enhancedAlerts: {
          where: {
            status: 'ACTIVE'
          },
          select: {
            id: true,
            type: true,
            severity: true,
            title: true,
            createdAt: true
          }
        },
        zoneViolations: {
          where: {
            isResolved: false
          },
          select: {
            id: true,
            violationType: true,
            severity: true,
            timestamp: true
          }
        },
        cameras: {
          select: {
            id: true,
            name: true,
            status: true,
            position: true
          }
        },
        _count: {
          select: {
            accessLogs: {
              where: {
                entryTime: {
                  gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                }
              }
            }
          }
        }
      }
    });

    // Calculate real-time metrics for each zone
    const realTimeData = zones.map(zone => {
      const latestCapacity = zone.capacityRecords?.[0];
      const currentOccupancy = latestCapacity?.currentOccupancy ?? 0;
      const maxCapacity = zone.configuration?.maxCapacity ?? 0;
      const utilizationRate = maxCapacity > 0 ? (currentOccupancy / maxCapacity) * 100 : 0;

      // Calculate recent activity metrics
      const recentSightings = zone.childSightings?.length ?? 0;
      const activeAlerts = zone.enhancedAlerts?.length ?? 0;
      const unresolvedViolations = zone.zoneViolations?.length ?? 0;
      const hourlyAccess = zone._count?.accessLogs ?? 0;

      // Determine zone status
      let status = 'NORMAL';
      if (zone.configuration?.isMaintenanceMode) {
        status = 'MAINTENANCE';
      } else if (activeAlerts > 0 || unresolvedViolations > 0) {
        status = 'ALERT';
      } else if (utilizationRate >= 100) {
        status = 'FULL';
      } else if (utilizationRate >= 85) {
        status = 'NEAR_CAPACITY';
      }

      // Calculate occupancy trend
      const occupancyTrend = calculateOccupancyTrend(zone.occupancyHistory || []);

      return {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        coordinates: zone.coordinates,
        color: zone.color,
        status,
        realTimeMetrics: {
          currentOccupancy,
          maxCapacity,
          utilizationRate: Math.round(utilizationRate * 10) / 10,
          remainingCapacity: Math.max(0, maxCapacity - currentOccupancy),
          queueLength: latestCapacity?.queueLength ?? 0,
          entryRate: latestCapacity?.entryRate ?? 0,
          exitRate: latestCapacity?.exitRate ?? 0,
          lastUpdated: latestCapacity?.lastUpdated ?? zone.updatedAt
        },
        activity: {
          recentSightings,
          activeAlerts,
          unresolvedViolations,
          hourlyAccess,
          occupancyTrend
        },
        safety: {
          hazardLevel: zone.configuration?.hazardLevel ?? 'NONE',
          safetyLevel: zone.configuration?.safetyLevel ?? 'STANDARD',
          activeCameras: zone.cameras?.filter(c => c.status === 'ONLINE').length ?? 0,
          totalCameras: zone.cameras?.length ?? 0
        },
        alerts: zone.enhancedAlerts?.map(alert => ({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          age: Math.floor((Date.now() - new Date(alert.createdAt).getTime()) / 60000) // minutes
        })) ?? [],
        violations: zone.zoneViolations?.map(violation => ({
          id: violation.id,
          type: violation.violationType,
          severity: violation.severity,
          age: Math.floor((Date.now() - new Date(violation.timestamp).getTime()) / 60000) // minutes
        })) ?? [],
        recentActivity: zone.childSightings?.slice(0, 5).map(sighting => ({
          childName: `${sighting.child.firstName} ${sighting.child.lastName}`,
          timestamp: sighting.timestamp,
          confidence: sighting.confidence
        })) ?? [],
        ...(includeHistory && {
          occupancyHistory: zone.occupancyHistory?.map(oh => ({
            timestamp: oh.timestamp,
            occupancyCount: oh.occupancyCount,
            eventType: oh.eventType
          }))
        })
      };
    });

    // Calculate venue-wide metrics
    const venueMetrics = {
      totalZones: zones.length,
      activeZones: realTimeData.filter(z => z.status !== 'MAINTENANCE').length,
      zonesAtCapacity: realTimeData.filter(z => z.realTimeMetrics.utilizationRate >= 100).length,
      zonesWithAlerts: realTimeData.filter(z => z.activity.activeAlerts > 0).length,
      totalOccupancy: realTimeData.reduce((sum, z) => sum + z.realTimeMetrics.currentOccupancy, 0),
      totalCapacity: realTimeData.reduce((sum, z) => sum + z.realTimeMetrics.maxCapacity, 0),
      overallUtilization: 0
    };

    if (venueMetrics.totalCapacity > 0) {
      venueMetrics.overallUtilization = Math.round((venueMetrics.totalOccupancy / venueMetrics.totalCapacity) * 1000) / 10;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      venueId,
      venueMetrics,
      zones: realTimeData,
      updateInterval: 30000, // Recommended update interval in ms
      websocketAvailable: true
    });

  } catch (error) {
    console.error('Error fetching real-time zone data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time zone data' },
      { status: 500 }
    );
  }
}

// POST /api/zones/realtime - Update real-time zone data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { zoneId, occupancyUpdate, eventType, source, metadata } = body;

    if (!zoneId || typeof occupancyUpdate !== 'number') {
      return NextResponse.json({
        error: 'Missing required fields: zoneId, occupancyUpdate'
      }, { status: 400 });
    }

    // Verify zone exists and user has access
    const zone = await prisma.floorPlanZone.findUnique({
      where: { id: zoneId },
      include: {
        floorPlan: {
          include: { venue: true }
        },
        configuration: true
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    // Update occupancy in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create occupancy history entry
      await tx.zoneOccupancyHistory.create({
        data: {
          zoneId,
          occupancyCount: occupancyUpdate,
          eventType: eventType || 'CAPACITY_UPDATE',
          entryMethod: source || 'api',
          metadata: {
            ...metadata,
            updatedBy: session.user.id,
            source,
            timestamp: new Date().toISOString()
          }
        }
      });

      // Calculate new metrics
      const maxCapacity = zone.configuration?.maxCapacity || 0;
      const utilizationRate = maxCapacity > 0 ? (occupancyUpdate / maxCapacity) * 100 : 0;
      
      let capacityStatus: any = 'NORMAL';
      if (occupancyUpdate === 0) capacityStatus = 'EMPTY';
      else if (utilizationRate < 25) capacityStatus = 'LOW';
      else if (utilizationRate >= 100) capacityStatus = 'FULL';
      else if (utilizationRate >= 85) capacityStatus = 'HIGH';

      // Update or create capacity record
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updatedRecord = await tx.zoneCapacityRecord.upsert({
        where: {
          zoneId_recordDate: {
            zoneId,
            recordDate: today
          }
        },
        update: {
          currentOccupancy: occupancyUpdate,
          utilizationRate: utilizationRate / 100,
          capacityStatus,
          lastUpdated: new Date()
        },
        create: {
          zoneId,
          currentOccupancy: occupancyUpdate,
          maxCapacity,
          utilizationRate: utilizationRate / 100,
          peakOccupancy: occupancyUpdate,
          capacityStatus,
          recordDate: today
        }
      });

      // Check for capacity alerts
      await checkCapacityAlerts(tx, zone, occupancyUpdate, utilizationRate);

      return updatedRecord;
    });

    // Broadcast update via WebSocket (if implemented)
    await broadcastZoneUpdate(zoneId, {
      currentOccupancy: occupancyUpdate,
      utilizationRate: result.utilizationRate * 100,
      capacityStatus: result.capacityStatus,
      lastUpdated: result.lastUpdated
    });

    return NextResponse.json({
      success: true,
      zoneId,
      updatedMetrics: {
        currentOccupancy: occupancyUpdate,
        utilizationRate: Math.round(result.utilizationRate * 1000) / 10,
        capacityStatus: result.capacityStatus,
        lastUpdated: result.lastUpdated
      },
      message: 'Zone occupancy updated successfully'
    });

  } catch (error) {
    console.error('Error updating real-time zone data:', error);
    return NextResponse.json(
      { error: 'Failed to update real-time zone data' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateOccupancyTrend(occupancyHistory: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (occupancyHistory.length < 3) return 'stable';
  
  const recent = occupancyHistory.slice(0, 3);
  const counts = recent.map(oh => oh.occupancyCount);
  
  const trend1 = counts[1] - counts[0];
  const trend2 = counts[2] - counts[1];
  
  if (trend1 > 0 && trend2 > 0) return 'increasing';
  if (trend1 < 0 && trend2 < 0) return 'decreasing';
  return 'stable';
}

async function checkCapacityAlerts(tx: any, zone: any, currentOccupancy: number, utilizationRate: number) {
  const alertThresholds = zone.configuration?.alertThresholds || {};
  const capacityThreshold = alertThresholds.capacityWarning || 85;
  
  // Check if we need to create capacity alert
  if (utilizationRate >= capacityThreshold) {
    // Check if alert already exists
    const existingAlert = await tx.enhancedAlert.findFirst({
      where: {
        type: 'SAFETY',
        subType: 'CAPACITY_WARNING',
        floorPlanZoneId: zone.id,
        status: 'ACTIVE'
      }
    });
    
    if (!existingAlert) {
      await tx.enhancedAlert.create({
        data: {
          type: 'SAFETY',
          subType: 'CAPACITY_WARNING',
          title: `Zone Near Capacity: ${zone.name}`,
          description: `Zone utilization is at ${Math.round(utilizationRate)}% (${currentOccupancy}/${zone.configuration?.maxCapacity})`,
          severity: utilizationRate >= 100 ? 'HIGH' : 'MEDIUM',
          priority: 'HIGH',
          venueId: zone.floorPlan.venueId,
          floorPlanZoneId: zone.id,
          triggerData: {
            currentOccupancy,
            maxCapacity: zone.configuration?.maxCapacity,
            utilizationRate
          }
        }
      });
    }
  }
}

async function broadcastZoneUpdate(zoneId: string, updateData: any) {
  // Placeholder for WebSocket broadcast implementation
  // This would integrate with your WebSocket server to broadcast real-time updates
  console.log(`Broadcasting zone update for ${zoneId}:`, updateData);
  
  // TODO: Implement WebSocket broadcasting
  // Example: websocketService.broadcast(`zone:${zoneId}`, updateData);
}
