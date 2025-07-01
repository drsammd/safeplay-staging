
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/zones/[zoneId]/capacity - Get capacity information for a zone
export async function GET(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { zoneId } = params;
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const daysBack = parseInt(searchParams.get('daysBack') || '7');

    // Verify zone exists and user has access
    const zone = await prisma.floorPlanZone.findUnique({
      where: { id: zoneId },
      include: {
        floorPlan: {
          include: { venue: true }
        },
        zoneConfig: {
          select: {
            maxCapacity: true,
            minStaffRequired: true
          }
        }
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    // Get current capacity record
    const currentCapacity = await prisma.zoneCapacityRecord.findFirst({
      where: { zoneId },
      orderBy: { lastUpdated: 'desc' }
    });

    // Get capacity history if requested
    let capacityHistory = null;
    if (includeHistory) {
      capacityHistory = await prisma.zoneCapacityRecord.findMany({
        where: {
          zoneId,
          recordDate: {
            gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { recordDate: 'desc' }
      });
    }

    // Get occupancy events for real-time tracking
    const recentOccupancy = await prisma.zoneOccupancyHistory.findMany({
      where: {
        zoneId,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    // Calculate real-time metrics
    const maxCapacity = zone.zoneConfig?.maxCapacity || 0;
    const currentOccupancy = currentCapacity?.currentOccupancy || 0;
    const utilizationRate = maxCapacity > 0 ? (currentOccupancy / maxCapacity) * 100 : 0;

    // Calculate peak times and patterns
    const hourlyStats = calculateHourlyStats(recentOccupancy);
    const dailyPeaks = calculateDailyPeaks(capacityHistory || []);

    // Generate capacity insights
    const insights = generateCapacityInsights(currentCapacity, capacityHistory || [], recentOccupancy);

    const response = {
      zoneInfo: {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        venueId: zone.floorPlan.venueId
      },
      currentCapacity: {
        ...currentCapacity,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        remainingCapacity: Math.max(0, maxCapacity - currentOccupancy),
        isAtCapacity: utilizationRate >= 100,
        isNearCapacity: utilizationRate >= 85,
        capacityTrend: calculateCapacityTrend(recentOccupancy.slice(0, 10))
      },
      configuration: {
        maxCapacity,
        minStaffRequired: zone.zoneConfig?.minStaffRequired || 0
      },
      analytics: {
        hourlyStats,
        dailyPeaks,
        insights
      },
      ...(includeHistory && { capacityHistory }),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching capacity information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capacity information' },
      { status: 500 }
    );
  }
}

// POST /api/zones/[zoneId]/capacity - Update capacity manually
export async function POST(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { zoneId } = params;
    const body = await request.json();

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

    const { occupancyCount, eventType, childId, reason } = body;

    if (typeof occupancyCount !== 'number' || occupancyCount < 0) {
      return NextResponse.json({
        error: 'Invalid occupancy count'
      }, { status: 400 });
    }

    const maxCapacity = zone.zoneConfig?.maxCapacity || 0;
    
    // Update capacity in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create occupancy history entry
      await tx.zoneOccupancyHistory.create({
        data: {
          zoneId,
          occupancyCount,
          eventType: eventType || 'CAPACITY_UPDATE',
          childId,
          entryMethod: 'manual',
          metadata: {
            updatedBy: session.user.id,
            reason: reason || 'Manual capacity update',
            timestamp: new Date().toISOString()
          }
        }
      });

      // Calculate new metrics
      const utilizationRate = maxCapacity > 0 ? (occupancyCount / maxCapacity) * 100 : 0;
      let capacityStatus: any = 'NORMAL';
      
      if (occupancyCount === 0) capacityStatus = 'EMPTY';
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
          currentOccupancy: occupancyCount,
          utilizationRate: utilizationRate / 100,
          capacityStatus,
          peakOccupancy: occupancyCount,
          lastUpdated: new Date()
        },
        create: {
          zoneId,
          currentOccupancy: occupancyCount,
          maxCapacity,
          utilizationRate: utilizationRate / 100,
          peakOccupancy: occupancyCount,
          capacityStatus,
          recordDate: today
        }
      });

      // Check for capacity violations and create alerts if needed
      if (utilizationRate >= 100) {
        // Create capacity exceeded alert
        await createCapacityAlert(tx, zoneId, zone.floorPlan.venueId, 'CAPACITY_EXCEEDED', {
          currentOccupancy: occupancyCount,
          maxCapacity,
          utilizationRate
        });
      }

      return updatedRecord;
    });

    return NextResponse.json({
      capacityRecord: result,
      message: 'Capacity updated successfully'
    });

  } catch (error) {
    console.error('Error updating capacity:', error);
    return NextResponse.json(
      { error: 'Failed to update capacity' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateHourlyStats(occupancyHistory: any[]) {
  const hourlyData: { [hour: string]: { total: number, count: number, peak: number } } = {};
  
  occupancyHistory.forEach(entry => {
    const hour = new Date(entry.timestamp).getHours().toString().padStart(2, '0');
    if (!hourlyData[hour]) {
      hourlyData[hour] = { total: 0, count: 0, peak: 0 };
    }
    hourlyData[hour].total += entry.occupancyCount;
    hourlyData[hour].count += 1;
    hourlyData[hour].peak = Math.max(hourlyData[hour].peak, entry.occupancyCount);
  });

  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour,
    averageOccupancy: Math.round(data.total / data.count),
    peakOccupancy: data.peak,
    dataPoints: data.count
  })).sort((a, b) => a.hour.localeCompare(b.hour));
}

function calculateDailyPeaks(capacityHistory: any[]) {
  return capacityHistory.map(record => ({
    date: record.recordDate,
    peakOccupancy: record.peakOccupancy,
    averageOccupancy: record.averageOccupancy || 0,
    utilizationRate: record.utilizationRate * 100
  }));
}

function calculateCapacityTrend(recentOccupancy: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (recentOccupancy.length < 3) return 'stable';
  
  const recent = recentOccupancy.slice(0, 3).map(entry => entry.occupancyCount);
  const avg1 = recent[0];
  const avg2 = (recent[0] + recent[1]) / 2;
  const avg3 = (recent[0] + recent[1] + recent[2]) / 3;
  
  if (avg1 > avg2 && avg2 > avg3) return 'decreasing';
  if (avg1 < avg2 && avg2 < avg3) return 'increasing';
  return 'stable';
}

function generateCapacityInsights(currentCapacity: any, capacityHistory: any[], occupancyHistory: any[]) {
  const insights = [];
  
  if (currentCapacity) {
    const utilizationRate = currentCapacity.utilizationRate * 100;
    
    if (utilizationRate >= 90) {
      insights.push({
        type: 'warning',
        message: 'Zone is near capacity. Consider crowd control measures.',
        priority: 'high'
      });
    }
    
    if (currentCapacity.queueLength > 0) {
      insights.push({
        type: 'info',
        message: `${currentCapacity.queueLength} people waiting to enter zone.`,
        priority: 'medium'
      });
    }
  }
  
  // Analyze trends from history
  if (capacityHistory.length >= 3) {
    const recentUtilization = capacityHistory.slice(0, 3).map(r => r.utilizationRate * 100);
    const avgUtilization = recentUtilization.reduce((a, b) => a + b, 0) / recentUtilization.length;
    
    if (avgUtilization > 80) {
      insights.push({
        type: 'trend',
        message: 'Consistently high utilization. Consider capacity expansion.',
        priority: 'medium'
      });
    }
  }
  
  return insights;
}

async function createCapacityAlert(tx: any, zoneId: string, venueId: string, alertType: string, data: any) {
  // Implementation would create an enhanced alert for capacity issues
  // This is a placeholder for the alert creation logic
  return Promise.resolve();
}
