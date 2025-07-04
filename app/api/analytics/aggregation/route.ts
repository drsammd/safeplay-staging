
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const aggregationRequestSchema = z.object({
  venueId: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metrics: z.array(z.enum([
    'safety_score', 'incident_rate', 'alert_rate', 'camera_uptime',
    'detection_accuracy', 'parent_engagement', 'traffic_flow',
    'occupancy_rate', 'response_time', 'resolution_time'
  ])),
  aggregationType: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
  groupBy: z.array(z.enum(['venue', 'zone', 'camera', 'user', 'child'])).optional()
});

// POST /api/analytics/aggregation - Generate aggregated analytics data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = aggregationRequestSchema.parse(body);

    // Verify venue access if venueId is provided
    if (data.venueId) {
      const venue = await prisma.venue.findFirst({
        where: {
          id: data.venueId,
          OR: [
            { adminId: session.user.id },
            session.user.role === 'COMPANY_ADMIN' ? {} : { id: 'never' }
          ]
        }
      });

      if (!venue) {
        return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 404 });
      }
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Build aggregated data based on requested metrics
    const aggregatedData = await buildAggregatedData(
      data.venueId,
      startDate,
      endDate,
      data.metrics,
      data.aggregationType,
      data.groupBy || [],
      session.user.id,
      session.user.role
    );

    return NextResponse.json({
      venueId: data.venueId,
      period: {
        start: data.startDate,
        end: data.endDate
      },
      aggregationType: data.aggregationType,
      metrics: data.metrics,
      groupBy: data.groupBy || [],
      data: aggregatedData,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating aggregated data:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/analytics/aggregation/summary - Get quick summary analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId') || undefined;
    const period = searchParams.get('period') || '7d'; // 1d, 7d, 30d, 90d
    
    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case '1d':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build where clause for venue access
    const whereClause = await buildVenueWhereClause(venueId, session.user.id, session.user.role);
    const dateFilter = {
      gte: startDate,
      lte: endDate
    };

    // Get summary metrics
    const [
      totalEvents,
      incidentCount,
      alertCount,
      avgCameraUptime,
      avgParentEngagement,
      trafficSummary,
      recentIncidents,
      performanceMetrics
    ] = await Promise.all([
      // Total analytics events
      prisma.analyticsEvent.count({
        where: {
          ...whereClause,
          timestamp: dateFilter
        }
      }),

      // Incident count
      prisma.incidentReport.count({
        where: {
          ...whereClause,
          incidentOccurredAt: dateFilter
        }
      }),

      // Alert count
      prisma.enhancedAlert.count({
        where: {
          ...whereClause,
          createdAt: dateFilter
        }
      }),

      // Average camera uptime
      prisma.cameraPerformance.aggregate({
        where: {
          ...whereClause,
          date: dateFilter
        },
        _avg: {
          uptimePercentage: true
        }
      }),

      // Average parent engagement
      prisma.parentEngagement.aggregate({
        where: {
          ...whereClause,
          date: dateFilter
        },
        _avg: {
          engagementScore: true
        }
      }),

      // Traffic summary
      prisma.trafficPattern.aggregate({
        where: {
          ...whereClause,
          date: dateFilter
        },
        _sum: {
          totalOccupancy: true,
          safetyIncidents: true,
          emergencyEvents: true
        },
        _avg: {
          peakOccupancy: true,
          capacityUtilization: true
        }
      }),

      // Recent high-severity incidents
      prisma.incidentReport.findMany({
        where: {
          ...whereClause,
          incidentOccurredAt: dateFilter,
          severity: {
            in: ['HIGH', 'CRITICAL', 'CATASTROPHIC']
          }
        },
        select: {
          id: true,
          title: true,
          severity: true,
          status: true,
          incidentOccurredAt: true,
          venue: { select: { name: true } }
        },
        orderBy: { incidentOccurredAt: 'desc' },
        take: 5
      }),

      // Latest performance metrics
      prisma.performanceMetric.findMany({
        where: {
          ...whereClause,
          periodStart: dateFilter,
          isKPI: true
        },
        select: {
          metricType: true,
          name: true,
          value: true,
          unit: true,
          trend: true,
          status: true,
          target: true,
          changePercentage: true
        },
        orderBy: { lastCalculated: 'desc' },
        take: 10
      })
    ]);

    // Calculate safety score
    const safetyScore = calculateSafetyScore({
      totalEvents,
      incidentCount,
      alertCount,
      avgCameraUptime: avgCameraUptime._avg.uptimePercentage || 0,
      trafficIncidents: trafficSummary._sum.safetyIncidents || 0,
      emergencyEvents: trafficSummary._sum.emergencyEvents || 0
    });

    const summary = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        label: period
      },
      overallMetrics: {
        safetyScore,
        totalEvents,
        incidentCount,
        alertCount,
        incidentRate: totalEvents > 0 ? ((incidentCount / totalEvents) * 100).toFixed(2) : '0',
        alertRate: totalEvents > 0 ? ((alertCount / totalEvents) * 100).toFixed(2) : '0'
      },
      systemPerformance: {
        avgCameraUptime: Math.round((avgCameraUptime._avg.uptimePercentage || 0) * 100) / 100,
        avgParentEngagement: Math.round((avgParentEngagement._avg.engagementScore || 0) * 100) / 100,
        avgCapacityUtilization: Math.round((trafficSummary._avg.capacityUtilization || 0) * 100) / 100
      },
      trafficMetrics: {
        totalOccupancy: trafficSummary._sum.totalOccupancy || 0,
        avgPeakOccupancy: Math.round((trafficSummary._avg.peakOccupancy || 0) * 100) / 100,
        safetyIncidents: trafficSummary._sum.safetyIncidents || 0,
        emergencyEvents: trafficSummary._sum.emergencyEvents || 0
      },
      recentIncidents,
      kpiMetrics: performanceMetrics,
      trends: {
        // These would be calculated by comparing with previous period
        safetyTrend: 'STABLE', // IMPROVING, DETERIORATING, STABLE
        performanceTrend: 'STABLE',
        engagementTrend: 'STABLE'
      },
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error generating summary analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to build aggregated data
async function buildAggregatedData(
  venueId: string | undefined,
  startDate: Date,
  endDate: Date,
  metrics: string[],
  aggregationType: string,
  groupBy: string[],
  userId: string,
  userRole: string
) {
  const whereClause = await buildVenueWhereClause(venueId, userId, userRole);
  const dateFilter = { gte: startDate, lte: endDate };
  const aggregatedData: any = {};

  for (const metric of metrics) {
    switch (metric) {
      case 'safety_score':
        aggregatedData.safety_score = await calculateAggregatedSafetyScore(
          whereClause, dateFilter, aggregationType
        );
        break;

      case 'incident_rate':
        aggregatedData.incident_rate = await calculateAggregatedIncidentRate(
          whereClause, dateFilter, aggregationType
        );
        break;

      case 'camera_uptime':
        aggregatedData.camera_uptime = await calculateAggregatedCameraUptime(
          whereClause, dateFilter, aggregationType
        );
        break;

      case 'parent_engagement':
        aggregatedData.parent_engagement = await calculateAggregatedParentEngagement(
          whereClause, dateFilter, aggregationType
        );
        break;

      case 'traffic_flow':
        aggregatedData.traffic_flow = await calculateAggregatedTrafficFlow(
          whereClause, dateFilter, aggregationType
        );
        break;

      // Add more metrics as needed
    }
  }

  return aggregatedData;
}

// Helper function to build venue where clause
async function buildVenueWhereClause(venueId: string | undefined, userId: string, userRole: string) {
  if (venueId) {
    return { venueId };
  }
  
  if (userRole !== 'COMPANY_ADMIN') {
    const userVenues = await prisma.venue.findMany({
      where: { adminId: userId },
      select: { id: true }
    });
    return { venueId: { in: userVenues.map(v => v.id) } };
  }
  
  return {};
}

// Helper functions for aggregated calculations
async function calculateAggregatedSafetyScore(whereClause: any, dateFilter: any, aggregationType: string) {
  // Implementation for aggregated safety score calculation
  const events = await (prisma.analyticsEvent.groupBy as any)({
    by: getGroupByFields(aggregationType),
    where: { ...whereClause, timestamp: dateFilter },
    _count: true
  });

  return events.map((event: any) => ({
    ...event,
    safetyScore: 85 // Placeholder calculation
  }));
}

async function calculateAggregatedIncidentRate(whereClause: any, dateFilter: any, aggregationType: string) {
  return await (prisma.incidentReport.groupBy as any)({
    by: getGroupByFields(aggregationType),
    where: { ...whereClause, incidentOccurredAt: dateFilter },
    _count: true
  });
}

async function calculateAggregatedCameraUptime(whereClause: any, dateFilter: any, aggregationType: string) {
  return await (prisma.cameraPerformance.groupBy as any)({
    by: getGroupByFields(aggregationType),
    where: { ...whereClause, date: dateFilter },
    _avg: {
      uptimePercentage: true
    }
  });
}

async function calculateAggregatedParentEngagement(whereClause: any, dateFilter: any, aggregationType: string) {
  return await (prisma.parentEngagement.groupBy as any)({
    by: getGroupByFields(aggregationType),
    where: { ...whereClause, date: dateFilter },
    _avg: {
      engagementScore: true,
      satisfactionScore: true
    }
  });
}

async function calculateAggregatedTrafficFlow(whereClause: any, dateFilter: any, aggregationType: string) {
  return await (prisma.trafficPattern.groupBy as any)({
    by: getGroupByFields(aggregationType),
    where: { ...whereClause, date: dateFilter },
    _sum: {
      totalOccupancy: true,
      entryCount: true,
      exitCount: true
    },
    _avg: {
      averageDwellTime: true,
      efficiency: true
    }
  });
}

// Helper function to get group by fields based on aggregation type
function getGroupByFields(aggregationType: string): any[] {
  switch (aggregationType) {
    case 'hourly':
      return ['venueId']; // Would need more complex date grouping
    case 'daily':
      return ['venueId'];
    case 'weekly':
      return ['venueId'];
    case 'monthly':
      return ['venueId'];
    default:
      return ['venueId'];
  }
}

// Helper function to calculate safety score
function calculateSafetyScore(data: {
  totalEvents: number;
  incidentCount: number;
  alertCount: number;
  avgCameraUptime: number;
  trafficIncidents: number;
  emergencyEvents: number;
}): number {
  if (data.totalEvents === 0) return 100;
  
  const weights = {
    incidents: 0.3,
    alerts: 0.2,
    cameraUptime: 0.25,
    trafficSafety: 0.15,
    emergencies: 0.1
  };
  
  const incidentScore = Math.max(0, 100 - (data.incidentCount / data.totalEvents) * 1000);
  const alertScore = Math.max(0, 100 - (data.alertCount / data.totalEvents) * 500);
  const cameraScore = data.avgCameraUptime;
  const trafficScore = Math.max(0, 100 - (data.trafficIncidents * 20));
  const emergencyScore = Math.max(0, 100 - (data.emergencyEvents * 30));
  
  const totalScore = 
    (incidentScore * weights.incidents) +
    (alertScore * weights.alerts) +
    (cameraScore * weights.cameraUptime) +
    (trafficScore * weights.trafficSafety) +
    (emergencyScore * weights.emergencies);
  
  return Math.round(totalScore);
}
