
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/zones/capacity-monitoring - Monitor capacity across multiple zones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const alertsOnly = searchParams.get('alertsOnly') === 'true';
    const threshold = parseFloat(searchParams.get('threshold') || '80'); // Capacity threshold percentage

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

    // Get zones with current capacity data
    const zones = await prisma.floorPlanZone.findMany({
      where: {
        floorPlan: { venueId }
      },
      include: {
        zoneConfig: {
          select: {
            maxCapacity: true,
            minStaffRequired: true,
            alertThresholds: true
          }
        },
        capacityRecords: {
          orderBy: { lastUpdated: 'desc' },
          take: 1
        },
        occupancyHistory: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
            }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    // Calculate capacity metrics for each zone
    const capacityData = zones.map(zone => {
      const latestCapacity = zone.capacityRecords?.[0];
      const currentOccupancy = latestCapacity?.currentOccupancy ?? 0;
      const maxCapacity = zone.zoneConfig?.maxCapacity ?? 0;
      const utilizationRate = maxCapacity > 0 ? (currentOccupancy / maxCapacity) * 100 : 0;
      
      // Calculate queue metrics
      const queueLength = latestCapacity?.queueLength ?? 0;
      const entryRate = latestCapacity?.entryRate ?? 0;
      const exitRate = latestCapacity?.exitRate ?? 0;
      
      // Calculate trend from recent occupancy history
      const occupancyTrend = calculateCapacityTrend(zone.occupancyHistory || []);
      
      // Determine alert level
      let alertLevel = 'NORMAL';
      let alertReason = '';
      
      if (utilizationRate >= 100) {
        alertLevel = 'CRITICAL';
        alertReason = 'Zone at full capacity';
      } else if (utilizationRate >= 95) {
        alertLevel = 'HIGH';
        alertReason = 'Zone near full capacity';
      } else if (utilizationRate >= threshold) {
        alertLevel = 'MEDIUM';
        alertReason = `Zone above ${threshold}% capacity`;
      } else if (queueLength > 0) {
        alertLevel = 'LOW';
        alertReason = 'Queue detected';
      }
      
      // Calculate estimated wait time if there's a queue
      let estimatedWaitTime = 0;
      if (queueLength > 0 && exitRate > 0) {
        estimatedWaitTime = Math.ceil((queueLength / exitRate) * 60); // Convert to minutes
      }
      
      // Calculate expected capacity in next hour based on trends
      const expectedCapacity = calculateExpectedCapacity(currentOccupancy, entryRate, exitRate, occupancyTrend);
      
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        zoneType: zone.type,
        capacity: {
          current: currentOccupancy,
          maximum: maxCapacity,
          available: Math.max(0, maxCapacity - currentOccupancy),
          utilizationRate: Math.round(utilizationRate * 10) / 10,
          status: latestCapacity?.capacityStatus ?? 'NORMAL'
        },
        queue: {
          length: queueLength,
          estimatedWaitTime,
          entryRate: Math.round(entryRate * 10) / 10,
          exitRate: Math.round(exitRate * 10) / 10
        },
        trend: {
          direction: occupancyTrend,
          expectedCapacity,
          hourlyProjection: Math.min(maxCapacity, expectedCapacity)
        },
        alert: {
          level: alertLevel,
          reason: alertReason,
          timestamp: latestCapacity?.lastUpdated ?? zone.updatedAt
        },
        thresholds: zone.zoneConfig?.alertThresholds ?? {},
        lastUpdated: latestCapacity?.lastUpdated ?? zone.updatedAt
      };
    });

    // Filter for alerts only if requested
    const filteredData = alertsOnly 
      ? capacityData.filter(zone => zone.alert.level !== 'NORMAL')
      : capacityData;

    // Calculate venue-wide metrics
    const venueCapacityMetrics = {
      totalZones: zones.length,
      alertZones: capacityData.filter(z => z.alert.level !== 'NORMAL').length,
      criticalZones: capacityData.filter(z => z.alert.level === 'CRITICAL').length,
      totalOccupancy: capacityData.reduce((sum, z) => sum + z.capacity.current, 0),
      totalCapacity: capacityData.reduce((sum, z) => sum + z.capacity.maximum, 0),
      totalAvailable: capacityData.reduce((sum, z) => sum + z.capacity.available, 0),
      totalQueue: capacityData.reduce((sum, z) => sum + z.queue.length, 0),
      overallUtilization: 0,
      averageWaitTime: 0
    };

    if (venueCapacityMetrics.totalCapacity > 0) {
      venueCapacityMetrics.overallUtilization = Math.round(
        (venueCapacityMetrics.totalOccupancy / venueCapacityMetrics.totalCapacity) * 1000
      ) / 10;
    }

    const zonesWithQueues = capacityData.filter(z => z.queue.length > 0);
    if (zonesWithQueues.length > 0) {
      venueCapacityMetrics.averageWaitTime = Math.round(
        zonesWithQueues.reduce((sum, z) => sum + z.queue.estimatedWaitTime, 0) / zonesWithQueues.length
      );
    }

    // Generate capacity recommendations
    const recommendations = generateCapacityRecommendations(capacityData, venueCapacityMetrics);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      venueId,
      summary: venueCapacityMetrics,
      zones: filteredData,
      recommendations,
      alertsOnly,
      threshold,
      updateFrequency: 30 // Recommended update frequency in seconds
    });

  } catch (error) {
    console.error('Error in capacity monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capacity monitoring data' },
      { status: 500 }
    );
  }
}

// POST /api/zones/capacity-monitoring - Create capacity alert or update thresholds
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, zoneId, data } = body;

    if (!action || !zoneId) {
      return NextResponse.json({
        error: 'Missing required fields: action, zoneId'
      }, { status: 400 });
    }

    // Verify zone exists and user has access
    const zone = await prisma.floorPlanZone.findUnique({
      where: { id: zoneId },
      include: {
        floorPlan: {
          include: { venue: true }
        },
        zoneConfig: true
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    let result;

    switch (action) {
      case 'update_thresholds':
        result = await updateCapacityThresholds(zoneId, data, session.user.id);
        break;
        
      case 'create_manual_alert':
        result = await createManualCapacityAlert(zone, data, session.user.id);
        break;
        
      case 'set_queue_limit':
        result = await setQueueLimit(zoneId, data.queueLimit, session.user.id);
        break;
        
      case 'update_entry_rules':
        result = await updateEntryRules(zoneId, data, session.user.id);
        break;
        
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      message: `Capacity monitoring ${action} completed successfully`
    });

  } catch (error) {
    console.error('Error in capacity monitoring action:', error);
    return NextResponse.json(
      { error: 'Failed to process capacity monitoring action' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateCapacityTrend(occupancyHistory: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (occupancyHistory.length < 4) return 'stable';
  
  const recent = occupancyHistory.slice(0, 4);
  const counts = recent.map(oh => oh.occupancyCount);
  
  // Calculate linear trend
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  const n = counts.length;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += counts[i];
    sumXY += i * counts[i];
    sumXX += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  if (slope > 0.5) return 'increasing';
  if (slope < -0.5) return 'decreasing';
  return 'stable';
}

function calculateExpectedCapacity(currentOccupancy: number, entryRate: number, exitRate: number, trend: string): number {
  const netRate = entryRate - exitRate;
  let projectionMultiplier = 1;
  
  // Adjust based on trend
  switch (trend) {
    case 'increasing':
      projectionMultiplier = 1.2;
      break;
    case 'decreasing':
      projectionMultiplier = 0.8;
      break;
    default:
      projectionMultiplier = 1;
  }
  
  // Project one hour ahead
  const expectedChange = netRate * 60 * projectionMultiplier; // 60 minutes
  return Math.max(0, Math.round(currentOccupancy + expectedChange));
}

function generateCapacityRecommendations(capacityData: any[], venueMetrics: any) {
  const recommendations = [];
  
  // Critical capacity alerts
  const criticalZones = capacityData.filter(z => z.alert.level === 'CRITICAL');
  if (criticalZones.length > 0) {
    recommendations.push({
      type: 'immediate_action',
      priority: 'CRITICAL',
      title: 'Zones at Full Capacity',
      description: `${criticalZones.length} zones are at full capacity and require immediate attention.`,
      zones: criticalZones.map(z => ({ id: z.zoneId, name: z.zoneName })),
      actions: [
        'Implement crowd control measures',
        'Redirect visitors to alternative zones',
        'Consider temporary capacity expansion',
        'Activate queue management protocols'
      ]
    });
  }
  
  // Queue management
  const zonesWithLongQueues = capacityData.filter(z => z.queue.estimatedWaitTime > 15);
  if (zonesWithLongQueues.length > 0) {
    recommendations.push({
      type: 'queue_management',
      priority: 'HIGH',
      title: 'Long Wait Times Detected',
      description: 'Some zones have extended wait times that may impact visitor experience.',
      zones: zonesWithLongQueues.map(z => ({ 
        id: z.zoneId, 
        name: z.zoneName, 
        waitTime: z.queue.estimatedWaitTime 
      })),
      actions: [
        'Increase zone capacity temporarily',
        'Add entertainment for waiting visitors',
        'Implement reservation system',
        'Optimize entry/exit flow'
      ]
    });
  }
  
  // Trend-based recommendations
  const increasingTrendZones = capacityData.filter(z => 
    z.trend.direction === 'increasing' && z.capacity.utilizationRate > 70
  );
  if (increasingTrendZones.length > 0) {
    recommendations.push({
      type: 'proactive_planning',
      priority: 'MEDIUM',
      title: 'Rising Occupancy Trends',
      description: 'Several zones show increasing occupancy trends and may reach capacity soon.',
      zones: increasingTrendZones.map(z => ({ 
        id: z.zoneId, 
        name: z.zoneName, 
        projection: z.trend.hourlyProjection 
      })),
      actions: [
        'Prepare crowd control measures',
        'Alert staff to monitor these zones',
        'Consider promotional activities in underutilized zones',
        'Review capacity allocation'
      ]
    });
  }
  
  // Underutilization opportunities
  const underutilizedZones = capacityData.filter(z => z.capacity.utilizationRate < 30);
  if (underutilizedZones.length > 0 && venueMetrics.alertZones > 0) {
    recommendations.push({
      type: 'optimization',
      priority: 'LOW',
      title: 'Capacity Redistribution Opportunity',
      description: 'Some zones are underutilized while others are overcrowded.',
      zones: underutilizedZones.map(z => ({ 
        id: z.zoneId, 
        name: z.zoneName, 
        utilization: z.capacity.utilizationRate 
      })),
      actions: [
        'Promote underutilized zones',
        'Consider temporary attractions or activities',
        'Review zone layout and accessibility',
        'Implement dynamic pricing or incentives'
      ]
    });
  }
  
  return recommendations;
}

async function updateCapacityThresholds(zoneId: string, thresholds: any, userId: string) {
  return await prisma.zoneConfiguration.upsert({
    where: { zoneId },
    update: {
      alertThresholds: thresholds,
      metadata: {
        lastModifiedBy: userId,
        lastModifiedAt: new Date().toISOString()
      }
    },
    create: {
      zoneId,
      alertThresholds: thresholds,
      metadata: {
        createdBy: userId,
        createdAt: new Date().toISOString()
      }
    }
  });
}

async function createManualCapacityAlert(zone: any, alertData: any, userId: string) {
  return await prisma.enhancedAlert.create({
    data: {
      type: 'CROWD_DENSITY',
      subType: 'MANUAL_CAPACITY_ALERT',
      title: alertData.title || `Manual Capacity Alert: ${zone.name}`,
      description: alertData.description || 'Manual capacity alert created by staff',
      severity: alertData.severity || 'MEDIUM',
      priority: 'HIGH',
      venueId: zone.floorPlan.venueId,
      floorPlanZoneId: zone.id,
      triggerData: {
        manualAlert: true,
        createdBy: userId,
        reason: alertData.reason
      },
      metadata: {
        manuallyCreated: true,
        createdBy: userId
      }
    }
  });
}

async function setQueueLimit(zoneId: string, queueLimit: number, userId: string) {
  return await prisma.zoneConfiguration.upsert({
    where: { zoneId },
    update: {
      alertThresholds: {
        queueLimit
      },
      metadata: {
        lastModifiedBy: userId,
        lastModifiedAt: new Date().toISOString()
      }
    },
    create: {
      zoneId,
      alertThresholds: {
        queueLimit
      },
      metadata: {
        createdBy: userId,
        createdAt: new Date().toISOString()
      }
    }
  });
}

async function updateEntryRules(zoneId: string, entryRules: any, userId: string) {
  // This would update zone access rules based on capacity conditions
  return await prisma.zoneAccessRule.create({
    data: {
      zoneId,
      ruleType: 'CAPACITY_RESTRICTION',
      conditions: entryRules,
      violationAction: 'BLOCK_ACCESS',
      metadata: {
        createdBy: userId,
        createdAt: new Date().toISOString(),
        reason: 'Capacity management'
      }
    }
  });
}
