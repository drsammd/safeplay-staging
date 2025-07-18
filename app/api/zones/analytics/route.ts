
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/zones/analytics - Get zone analytics across multiple zones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const period = searchParams.get('period') || '7'; // days
    const zoneIds = searchParams.get('zoneIds')?.split(',');
    const includeComparisons = searchParams.get('includeComparisons') === 'true';
    const includeForecasts = searchParams.get('includeForecasts') === 'true';

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

    const daysBack = parseInt(period);
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Build zone filter
    let zoneFilter: any = {
      floorPlan: { venueId }
    };

    if (zoneIds && zoneIds.length > 0) {
      zoneFilter.id = { in: zoneIds };
    }

    // Get zones with their analytics
    const zones = await prisma.floorPlanZone.findMany({
      where: zoneFilter,
      include: {
        configuration: {
          select: {
            maxCapacity: true,
            safetyLevel: true,
            priorityLevel: true
          }
        },
        zoneAnalytics: {
          where: {
            date: { gte: startDate }
          },
          orderBy: { date: 'desc' }
        },
        capacityRecords: {
          where: {
            recordDate: { gte: startDate }
          },
          orderBy: { recordDate: 'desc' }
        },
        _count: {
          select: {
            zoneViolations: {
              where: {
                timestamp: { gte: startDate }
              }
            },
            enhancedAlerts: {
              where: {
                createdAt: { gte: startDate },
                status: 'ACTIVE'
              }
            }
          }
        }
      }
    });

    // Calculate aggregated analytics
    const aggregatedAnalytics = calculateAggregatedAnalytics(zones, daysBack);

    // Generate zone performance rankings
    const performanceRankings = generatePerformanceRankings(zones);

    // Get utilization trends
    const utilizationTrends = calculateUtilizationTrends(zones, daysBack);

    // Get safety metrics
    const safetyMetrics = calculateSafetyMetrics(zones, daysBack);

    // Generate insights and recommendations
    const insights = generateZoneInsights(zones, aggregatedAnalytics);
    const recommendations = generateZoneRecommendations(zones, aggregatedAnalytics);

    let comparisons = null;
    if (includeComparisons) {
      comparisons = await generateZoneComparisons(zones, daysBack);
    }

    let forecasts = null;
    if (includeForecasts) {
      forecasts = generateUtilizationForecasts(zones);
    }

    return NextResponse.json({
      analytics: {
        period: daysBack,
        totalZones: zones.length,
        aggregated: aggregatedAnalytics,
        byZone: zones.map(zone => ({
          id: zone.id,
          name: zone.name,
          type: zone.type,
          maxCapacity: zone.configuration?.maxCapacity || 0,
          analytics: summarizeZoneAnalytics(zone.zoneAnalytics),
          currentMetrics: {
            violations: zone._count.zoneViolations,
            activeAlerts: zone._count.enhancedAlerts
          }
        }))
      },
      performance: {
        rankings: performanceRankings,
        trends: utilizationTrends
      },
      safety: safetyMetrics,
      insights,
      recommendations,
      ...(includeComparisons && { comparisons }),
      ...(includeForecasts && { forecasts }),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching zone analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zone analytics' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateAggregatedAnalytics(zones: any[], daysBack: number) {
  const allAnalytics = zones.flatMap(zone => zone.zoneAnalytics);
  
  if (allAnalytics.length === 0) {
    return {
      totalEntries: 0,
      totalExits: 0,
      averageUtilization: 0,
      averageStayTime: 0,
      totalViolations: 0,
      totalAlerts: 0,
      averageSafetyScore: 0,
      totalRevenue: 0
    };
  }

  return {
    totalEntries: allAnalytics.reduce((sum, a) => sum + a.totalEntries, 0),
    totalExits: allAnalytics.reduce((sum, a) => sum + a.totalExits, 0),
    averageUtilization: allAnalytics.reduce((sum, a) => sum + a.utilizationRate, 0) / allAnalytics.length,
    averageStayTime: allAnalytics.reduce((sum, a) => sum + a.averageStayTime, 0) / allAnalytics.length,
    totalViolations: allAnalytics.reduce((sum, a) => sum + a.totalViolations, 0),
    totalAlerts: allAnalytics.reduce((sum, a) => sum + a.alertsGenerated, 0),
    averageSafetyScore: allAnalytics.reduce((sum, a) => sum + (a.safetyScore || 0), 0) / allAnalytics.length,
    totalRevenue: allAnalytics.reduce((sum, a) => sum + a.revenueGenerated, 0),
    totalDays: daysBack,
    avgPerDay: {
      entries: allAnalytics.reduce((sum, a) => sum + a.totalEntries, 0) / daysBack,
      exits: allAnalytics.reduce((sum, a) => sum + a.totalExits, 0) / daysBack,
      violations: allAnalytics.reduce((sum, a) => sum + a.totalViolations, 0) / daysBack,
      alerts: allAnalytics.reduce((sum, a) => sum + a.alertsGenerated, 0) / daysBack,
      revenue: allAnalytics.reduce((sum, a) => sum + a.revenueGenerated, 0) / daysBack
    }
  };
}

function generatePerformanceRankings(zones: any[]) {
  return zones.map(zone => {
    const analytics = zone.zoneAnalytics;
    if (analytics.length === 0) {
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        score: 0,
        metrics: {}
      };
    }

    const avgUtilization = analytics.reduce((sum: number, a: any) => sum + a.utilizationRate, 0) / analytics.length;
    const avgSafetyScore = analytics.reduce((sum: number, a: any) => sum + (a.safetyScore || 0), 0) / analytics.length;
    const avgEfficiencyScore = analytics.reduce((sum: number, a: any) => sum + (a.efficiencyScore || 0), 0) / analytics.length;
    const totalRevenue = analytics.reduce((sum: number, a: any) => sum + a.revenueGenerated, 0);
    const totalViolations = analytics.reduce((sum: number, a: any) => sum + a.totalViolations, 0);

    // Calculate composite performance score (0-100)
    const utilizationScore = Math.min(avgUtilization * 100, 100);
    const safetyScore = avgSafetyScore * 20; // Assuming safety score is 0-5
    const efficiencyScore = avgEfficiencyScore * 20; // Assuming efficiency score is 0-5
    const violationPenalty = Math.min(totalViolations * 2, 20); // Max 20 point penalty

    const compositeScore = Math.max(0, (utilizationScore * 0.3 + safetyScore * 0.4 + efficiencyScore * 0.3) - violationPenalty);

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      zoneType: zone.type,
      score: Math.round(compositeScore),
      metrics: {
        utilization: Math.round(avgUtilization * 100),
        safety: Math.round(avgSafetyScore * 10) / 10,
        efficiency: Math.round(avgEfficiencyScore * 10) / 10,
        revenue: totalRevenue,
        violations: totalViolations
      }
    };
  }).sort((a, b) => b.score - a.score);
}

function calculateUtilizationTrends(zones: any[], daysBack: number) {
  const trends: { [date: string]: number } = {};
  
  zones.forEach(zone => {
    zone.zoneAnalytics.forEach((analytics: any) => {
      const dateKey = analytics.date.toISOString().split('T')[0];
      if (!trends[dateKey]) {
        trends[dateKey] = 0;
      }
      trends[dateKey] += analytics.utilizationRate;
    });
  });

  // Average utilization per day across all zones
  Object.keys(trends).forEach(date => {
    trends[date] = trends[date] / zones.length;
  });

  return Object.entries(trends)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, utilization]) => ({
      date,
      utilization: Math.round(utilization * 100)
    }));
}

function calculateSafetyMetrics(zones: any[], daysBack: number) {
  const totalViolations = zones.reduce((sum, zone) => sum + zone._count.zoneViolations, 0);
  const totalAlerts = zones.reduce((sum, zone) => sum + zone._count.enhancedAlerts, 0);
  
  const allAnalytics = zones.flatMap(zone => zone.zoneAnalytics);
  const avgSafetyScore = allAnalytics.length > 0 
    ? allAnalytics.reduce((sum, a) => sum + (a.safetyScore || 0), 0) / allAnalytics.length 
    : 0;

  // Calculate safety trend
  const recentAnalytics = allAnalytics.slice(0, Math.floor(allAnalytics.length / 2));
  const olderAnalytics = allAnalytics.slice(Math.floor(allAnalytics.length / 2));
  
  const recentAvgSafety = recentAnalytics.length > 0 
    ? recentAnalytics.reduce((sum, a) => sum + (a.safetyScore || 0), 0) / recentAnalytics.length 
    : 0;
  const olderAvgSafety = olderAnalytics.length > 0 
    ? olderAnalytics.reduce((sum, a) => sum + (a.safetyScore || 0), 0) / olderAnalytics.length 
    : 0;

  let safetyTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (recentAvgSafety > olderAvgSafety * 1.05) safetyTrend = 'improving';
  else if (recentAvgSafety < olderAvgSafety * 0.95) safetyTrend = 'declining';

  return {
    overallSafetyScore: Math.round(avgSafetyScore * 10) / 10,
    totalViolations,
    totalAlerts,
    violationsPerDay: Math.round((totalViolations / daysBack) * 10) / 10,
    alertsPerDay: Math.round((totalAlerts / daysBack) * 10) / 10,
    safetyTrend,
    riskLevel: avgSafetyScore >= 4 ? 'LOW' : avgSafetyScore >= 3 ? 'MEDIUM' : 'HIGH'
  };
}

function summarizeZoneAnalytics(analytics: any[]) {
  if (analytics.length === 0) {
    return {
      avgUtilization: 0,
      totalEntries: 0,
      totalExits: 0,
      avgStayTime: 0,
      safetyScore: 0,
      totalViolations: 0
    };
  }

  return {
    avgUtilization: Math.round((analytics.reduce((sum, a) => sum + a.utilizationRate, 0) / analytics.length) * 100),
    totalEntries: analytics.reduce((sum, a) => sum + a.totalEntries, 0),
    totalExits: analytics.reduce((sum, a) => sum + a.totalExits, 0),
    avgStayTime: Math.round(analytics.reduce((sum, a) => sum + a.averageStayTime, 0) / analytics.length),
    safetyScore: Math.round((analytics.reduce((sum, a) => sum + (a.safetyScore || 0), 0) / analytics.length) * 10) / 10,
    totalViolations: analytics.reduce((sum, a) => sum + a.totalViolations, 0),
    totalRevenue: analytics.reduce((sum, a) => sum + a.revenueGenerated, 0)
  };
}

function generateZoneInsights(zones: any[], aggregatedAnalytics: any) {
  const insights = [];

  // High utilization zones
  const highUtilizationZones = zones.filter(zone => {
    const avgUtilization = zone.zoneAnalytics.length > 0 
      ? zone.zoneAnalytics.reduce((sum: number, a: any) => sum + a.utilizationRate, 0) / zone.zoneAnalytics.length 
      : 0;
    return avgUtilization > 0.8;
  });

  if (highUtilizationZones.length > 0) {
    insights.push({
      type: 'performance',
      title: 'High Utilization Zones',
      message: `${highUtilizationZones.length} zones are running at high utilization (>80%).`,
      zones: highUtilizationZones.map(z => z.name),
      actionable: true,
      recommendation: 'Consider capacity expansion or crowd management for these zones.'
    });
  }

  // Safety concerns
  const unsafeZones = zones.filter(zone => zone._count.zoneViolations > 5);
  if (unsafeZones.length > 0) {
    insights.push({
      type: 'safety',
      title: 'Safety Concerns',
      message: `${unsafeZones.length} zones have multiple safety violations.`,
      zones: unsafeZones.map(z => z.name),
      actionable: true,
      recommendation: 'Review safety protocols and increase monitoring for these zones.'
    });
  }

  // Revenue opportunities
  const lowRevenueZones = zones.filter(zone => {
    const totalRevenue = zone.zoneAnalytics.reduce((sum: number, a: any) => sum + a.revenueGenerated, 0);
    return totalRevenue < aggregatedAnalytics.totalRevenue * 0.1 / zones.length; // Less than 10% of average
  });

  if (lowRevenueZones.length > 0) {
    insights.push({
      type: 'revenue',
      title: 'Revenue Optimization Opportunity',
      message: `${lowRevenueZones.length} zones are generating below-average revenue.`,
      zones: lowRevenueZones.map(z => z.name),
      actionable: true,
      recommendation: 'Analyze zone usage patterns and consider new revenue-generating activities.'
    });
  }

  return insights;
}

function generateZoneRecommendations(zones: any[], aggregatedAnalytics: any) {
  const recommendations = [];

  // Capacity recommendations
  const overcrowdedZones = zones.filter(zone => {
    const maxCapacity = zone.configuration?.maxCapacity || 0;
    const avgOccupancy = zone.capacityRecords.length > 0 
      ? zone.capacityRecords.reduce((sum: number, r: any) => sum + r.currentOccupancy, 0) / zone.capacityRecords.length 
      : 0;
    return maxCapacity > 0 && avgOccupancy / maxCapacity > 0.9;
  });

  if (overcrowdedZones.length > 0) {
    recommendations.push({
      type: 'capacity',
      priority: 'HIGH',
      title: 'Capacity Expansion Needed',
      description: `${overcrowdedZones.length} zones are consistently at capacity.`,
      zones: overcrowdedZones.map(z => ({ id: z.id, name: z.name })),
      actions: [
        'Increase zone capacity limits',
        'Add overflow areas',
        'Implement queue management',
        'Consider time-based access controls'
      ]
    });
  }

  // Safety recommendations
  if (aggregatedAnalytics.averageSafetyScore < 3.5) {
    recommendations.push({
      type: 'safety',
      priority: 'CRITICAL',
      title: 'Safety Score Below Target',
      description: 'Overall safety score is below the recommended threshold.',
      actions: [
        'Review and update safety protocols',
        'Increase staff training',
        'Enhance monitoring systems',
        'Conduct safety audits'
      ]
    });
  }

  // Efficiency recommendations
  const underutilizedZones = zones.filter(zone => {
    const avgUtilization = zone.zoneAnalytics.length > 0 
      ? zone.zoneAnalytics.reduce((sum: number, a: any) => sum + a.utilizationRate, 0) / zone.zoneAnalytics.length 
      : 0;
    return avgUtilization < 0.3;
  });

  if (underutilizedZones.length > 0) {
    recommendations.push({
      type: 'efficiency',
      priority: 'MEDIUM',
      title: 'Underutilized Zones',
      description: `${underutilizedZones.length} zones have low utilization rates.`,
      zones: underutilizedZones.map(z => ({ id: z.id, name: z.name })),
      actions: [
        'Analyze usage patterns',
        'Consider zone repurposing',
        'Improve marketing for these areas',
        'Add attractive activities or features'
      ]
    });
  }

  return recommendations;
}

async function generateZoneComparisons(zones: any[], daysBack: number) {
  // Placeholder for zone comparison logic
  // This would compare similar zones across different time periods or venues
  return {
    periodComparison: 'Implementation pending',
    peerComparison: 'Implementation pending'
  };
}

function generateUtilizationForecasts(zones: any[]) {
  // Placeholder for forecasting logic
  // This would use historical data to predict future utilization
  return {
    nextWeek: 'Implementation pending',
    nextMonth: 'Implementation pending'
  };
}
