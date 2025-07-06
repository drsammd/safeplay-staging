
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const reportGenerationSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  reportType: z.enum([
    'DAILY_SUMMARY', 'WEEKLY_SUMMARY', 'MONTHLY_SUMMARY', 'QUARTERLY_SUMMARY',
    'ANNUAL_SUMMARY', 'INCIDENT_ANALYSIS', 'PERFORMANCE_REVIEW', 'TRAFFIC_ANALYSIS',
    'ENGAGEMENT_REPORT', 'CAMERA_PERFORMANCE', 'SAFETY_COMPLIANCE',
    'EXECUTIVE_DASHBOARD', 'OPERATIONAL_EFFICIENCY', 'TREND_ANALYSIS',
    'COMPARATIVE_ANALYSIS', 'CUSTOM_REPORT'
  ]),
  period: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  venueId: z.string().optional(),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML', 'POWERPOINT']).optional(),
  customFilters: z.any().optional(),
  recipients: z.array(z.string().email()).optional()
});

// POST /api/analytics/reports - Generate safety report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = reportGenerationSchema.parse(body);

    // Verify venue access if venueId is provided
    if (data.venueId) {
      const venue = await prisma.venue.findFirst({
        where: {
          id: data.venueId,
          OR: [
            { adminId: session.user.id },
            session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' }
          ]
        }
      });

      if (!venue) {
        return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 404 });
      }
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Create report record
    const report = await prisma.safetyReport.create({
      data: {
        title: data.title,
        description: data.description,
        reportType: data.reportType,
        period: data.period,
        startDate,
        endDate,
        venueId: data.venueId,
        generatedBy: session.user.id,
        format: data.format || 'PDF',
        recipients: data.recipients || [],
        customFilters: data.customFilters,
        status: 'GENERATING',
        sections: {},
        metrics: {}
      }
    });

    // Generate report data asynchronously
    await generateReportData(report.id, data.venueId, startDate, endDate, data.reportType);

    return NextResponse.json({ 
      reportId: report.id,
      status: 'GENERATING',
      message: 'Report generation started'
    });
  } catch (error) {
    console.error('Error creating safety report:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/analytics/reports - Get safety reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const reportType = searchParams.get('reportType');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (venueId) {
      // Verify venue access
      const venue = await prisma.venue.findFirst({
        where: {
          id: venueId,
          OR: [
            { adminId: session.user.id },
            session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' }
          ]
        }
      });

      if (!venue) {
        return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 404 });
      }

      where.venueId = venueId;
    } else if (session.user.role !== 'SUPER_ADMIN') {
      // Non-admin users can only see their venue reports
      const userVenues = await prisma.venue.findMany({
        where: { adminId: session.user.id },
        select: { id: true }
      });
      where.OR = [
        { venueId: { in: userVenues.map(v => v.id) } },
        { venueId: null, generatedBy: session.user.id }
      ];
    }

    if (reportType) where.reportType = reportType;
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.safetyReport.findMany({
        where,
        include: {
          venue: { select: { name: true } },
          generator: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.safetyReport.count({ where })
    ]);

    return NextResponse.json({
      reports,
      total,
      limit,
      offset,
      hasMore: offset + reports.length < total
    });
  } catch (error) {
    console.error('Error fetching safety reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate report data
async function generateReportData(
  reportId: string,
  venueId: string | undefined,
  startDate: Date,
  endDate: Date,
  reportType: string
) {
  try {
    const whereClause = venueId ? { venueId } : {};
    const dateFilter = {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    };

    // Gather basic metrics
    const [
      totalEvents,
      incidentCount,
      alertCount,
      parentEngagementMetrics,
      trafficPatterns,
      cameraPerformance
    ] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { ...whereClause, ...dateFilter }
      }),
      prisma.incidentReport.count({
        where: {
          ...whereClause,
          incidentOccurredAt: dateFilter.timestamp
        }
      }),
      prisma.enhancedAlert.count({
        where: {
          ...whereClause,
          createdAt: dateFilter.timestamp
        }
      }),
      prisma.parentEngagement.findMany({
        where: {
          ...whereClause,
          date: dateFilter.timestamp
        }
      }),
      prisma.trafficPattern.findMany({
        where: {
          ...whereClause,
          date: dateFilter.timestamp
        }
      }),
      prisma.cameraPerformance.findMany({
        where: {
          ...whereClause,
          date: dateFilter.timestamp
        }
      })
    ]);

    // Calculate key metrics
    const avgParentEngagement = parentEngagementMetrics.length > 0
      ? parentEngagementMetrics.reduce((sum, p) => sum + p.engagementScore, 0) / parentEngagementMetrics.length
      : 0;

    const avgCameraUptime = cameraPerformance.length > 0
      ? cameraPerformance.reduce((sum, c) => sum + c.uptimePercentage, 0) / cameraPerformance.length
      : 0;

    const totalOccupancy = trafficPatterns.reduce((sum, t) => sum + t.totalOccupancy, 0);

    // Create executive summary
    const executiveSummary = {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalEvents,
      incidentCount,
      alertCount,
      avgParentEngagement: Math.round(avgParentEngagement * 100) / 100,
      avgCameraUptime: Math.round(avgCameraUptime * 100) / 100,
      totalOccupancy,
      safetyScore: calculateSafetyScore(incidentCount, alertCount, totalEvents, avgCameraUptime)
    };

    // Create sections based on report type
    const sections = createReportSections(reportType, {
      parentEngagementMetrics,
      trafficPatterns,
      cameraPerformance,
      incidentCount,
      alertCount,
      totalEvents
    });

    // Create metrics object
    const metrics = {
      safety: {
        safetyScore: executiveSummary.safetyScore,
        incidentRate: totalEvents > 0 ? (incidentCount / totalEvents) * 100 : 0,
        alertRate: totalEvents > 0 ? (alertCount / totalEvents) * 100 : 0
      },
      performance: {
        cameraUptime: avgCameraUptime,
        averageResponseTime: 0, // TODO: Calculate from incident data
        operationalEfficiency: 0 // TODO: Calculate based on metrics
      },
      engagement: {
        parentEngagement: avgParentEngagement,
        averageSessionDuration: parentEngagementMetrics.length > 0
          ? parentEngagementMetrics.reduce((sum, p) => sum + p.averageSessionDuration, 0) / parentEngagementMetrics.length
          : 0
      }
    };

    // Update report with generated data
    await prisma.safetyReport.update({
      where: { id: reportId },
      data: {
        status: 'COMPLETED',
        executiveSummary,
        sections,
        metrics,
        deliveryStatus: 'PENDING'
      }
    });

    // Log analytics event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'BUSINESS_METRIC',
        category: 'ANALYTICS',
        description: `Safety report generated: ${reportType}`,
        venueId: venueId || '',
        metadata: {
          reportId,
          reportType,
          period: `${startDate.toISOString()} to ${endDate.toISOString()}`
        },
        
      }
    });

  } catch (error) {
    console.error('Error generating report data:', error);
    
    // Update report status to failed
    await prisma.safetyReport.update({
      where: { id: reportId },
      data: {
        status: 'FAILED',
        sections: {},
        metrics: {}
      }
    });
  }
}

// Helper function to calculate safety score
function calculateSafetyScore(
  incidentCount: number,
  alertCount: number,
  totalEvents: number,
  cameraUptime: number
): number {
  if (totalEvents === 0) return 100;
  
  const incidentWeight = 0.4;
  const alertWeight = 0.3;
  const cameraWeight = 0.3;
  
  const incidentScore = Math.max(0, 100 - (incidentCount / totalEvents) * 1000);
  const alertScore = Math.max(0, 100 - (alertCount / totalEvents) * 500);
  const cameraScore = cameraUptime;
  
  return Math.round(
    (incidentScore * incidentWeight + alertScore * alertWeight + cameraScore * cameraWeight)
  );
}

// Helper function to create report sections
function createReportSections(reportType: string, data: any) {
  const sections: any = {};
  
  switch (reportType) {
    case 'DAILY_SUMMARY':
    case 'WEEKLY_SUMMARY':
    case 'MONTHLY_SUMMARY':
      sections.summary = {
        title: 'Executive Summary',
        content: 'Summary of key safety metrics and events'
      };
      sections.incidents = {
        title: 'Incident Analysis',
        content: `Total incidents: ${data.incidentCount}`
      };
      sections.performance = {
        title: 'Performance Metrics',
        content: 'Camera and system performance data'
      };
      break;
      
    case 'INCIDENT_ANALYSIS':
      sections.overview = {
        title: 'Incident Overview',
        content: `Analysis of ${data.incidentCount} incidents`
      };
      sections.trends = {
        title: 'Incident Trends',
        content: 'Incident patterns and trends analysis'
      };
      sections.recommendations = {
        title: 'Recommendations',
        content: 'Action items to prevent future incidents'
      };
      break;
      
    case 'PERFORMANCE_REVIEW':
      sections.metrics = {
        title: 'Key Performance Indicators',
        content: 'Overall system performance metrics'
      };
      sections.cameras = {
        title: 'Camera Performance',
        content: 'Individual camera performance analysis'
      };
      sections.optimization = {
        title: 'Optimization Opportunities',
        content: 'Areas for performance improvement'
      };
      break;
      
    default:
      sections.general = {
        title: 'Report Content',
        content: 'Generated report content'
      };
  }
  
  return sections;
}
