
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/zones/optimization - Get optimization suggestions for zones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const optimizationType = searchParams.get('type') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const includeImplementationPlan = searchParams.get('includeImplementationPlan') === 'true';

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

    // Get comprehensive zone data for optimization analysis
    const zones = await prisma.floorPlanZone.findMany({
      where: {
        floorPlan: { venueId }
      },
      include: {
        zoneConfig: true,
        zoneAnalytics: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
        },
        capacityRecords: {
          orderBy: { recordDate: 'desc' },
          take: 7 // Last week
        },
        occupancyHistory: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
            }
          }
        },
        zoneViolations: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last month
            }
          }
        },
        enhancedAlerts: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last month
            }
          }
        },
        cameras: {
          select: {
            id: true,
            status: true,
            position: true
          }
        },
        evacuationRoutes: {
          where: { isActive: true }
        }
      }
    });

    // Generate optimization recommendations
    const optimizations = await generateOptimizationRecommendations(zones, optimizationType, priority);

    // Calculate ROI estimates
    const roiEstimates = await calculateROIEstimates(optimizations, zones);

    // Generate implementation plans if requested
    let implementationPlans = null;
    if (includeImplementationPlan) {
      implementationPlans = await generateImplementationPlans(optimizations);
    }

    // Calculate optimization scores
    const optimizationScores = await calculateOptimizationScores(zones);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      venueId,
      optimizationType,
      summary: {
        totalRecommendations: optimizations.length,
        highPriority: optimizations.filter(o => o.priority === 'HIGH').length,
        estimatedAnnualSavings: roiEstimates.totalEstimatedSavings,
        implementationCost: roiEstimates.totalImplementationCost,
        paybackPeriod: roiEstimates.averagePaybackPeriod
      },
      optimizations,
      scores: optimizationScores,
      roiEstimates,
      ...(includeImplementationPlan && { implementationPlans })
    });

  } catch (error) {
    console.error('Error generating optimization recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate optimization recommendations' },
      { status: 500 }
    );
  }
}

// POST /api/zones/optimization - Apply optimization or mark as implemented
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action, optimizationId, zoneId, parameters } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'apply_capacity_optimization':
        result = await applyCapacityOptimization(zoneId, parameters, session.user.id);
        break;
        
      case 'apply_flow_optimization':
        result = await applyFlowOptimization(zoneId, parameters, session.user.id);
        break;
        
      case 'apply_safety_optimization':
        result = await applySafetyOptimization(zoneId, parameters, session.user.id);
        break;
        
      case 'apply_layout_optimization':
        result = await applyLayoutOptimization(zoneId, parameters, session.user.id);
        break;
        
      case 'mark_implemented':
        result = await markOptimizationImplemented(optimizationId, session.user.id);
        break;
        
      case 'schedule_implementation':
        result = await scheduleOptimizationImplementation(optimizationId, parameters, session.user.id);
        break;
        
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      implementedBy: session.user.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error applying optimization:', error);
    return NextResponse.json(
      { error: 'Failed to apply optimization' },
      { status: 500 }
    );
  }
}

// Helper functions
async function generateOptimizationRecommendations(zones: any[], optimizationType: string, priority: string) {
  const recommendations = [];

  for (const zone of zones) {
    // Capacity optimization recommendations
    if (optimizationType === 'all' || optimizationType === 'capacity') {
      const capacityRecs = await generateCapacityOptimizations(zone);
      recommendations.push(...capacityRecs);
    }

    // Flow optimization recommendations
    if (optimizationType === 'all' || optimizationType === 'flow') {
      const flowRecs = await generateFlowOptimizations(zone);
      recommendations.push(...flowRecs);
    }

    // Safety optimization recommendations
    if (optimizationType === 'all' || optimizationType === 'safety') {
      const safetyRecs = await generateSafetyOptimizations(zone);
      recommendations.push(...safetyRecs);
    }

    // Layout optimization recommendations
    if (optimizationType === 'all' || optimizationType === 'layout') {
      const layoutRecs = await generateLayoutOptimizations(zone);
      recommendations.push(...layoutRecs);
    }

    // Technology optimization recommendations
    if (optimizationType === 'all' || optimizationType === 'technology') {
      const techRecs = await generateTechnologyOptimizations(zone);
      recommendations.push(...techRecs);
    }

    // Revenue optimization recommendations
    if (optimizationType === 'all' || optimizationType === 'revenue') {
      const revenueRecs = await generateRevenueOptimizations(zone);
      recommendations.push(...revenueRecs);
    }
  }

  // Filter by priority if specified
  const filteredRecommendations = priority === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.priority === priority.toUpperCase());

  // Sort by impact and priority
  return filteredRecommendations.sort((a, b) => {
    const priorityWeight: { [key: string]: number } = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const aPriority = priorityWeight[a.priority] || 0;
    const bPriority = priorityWeight[b.priority] || 0;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return b.impact - a.impact;
  });
}

async function generateCapacityOptimizations(zone: any) {
  const optimizations = [];
  const analytics = zone.zoneAnalytics || [];
  const capacity = zone.zoneConfig?.maxCapacity || 0;

  if (analytics.length > 0) {
    const avgUtilization = analytics.reduce((sum: number, a: any) => sum + a.utilizationRate, 0) / analytics.length;

    // Overutilization optimization
    if (avgUtilization > 0.9) {
      optimizations.push({
        id: `capacity_expansion_${zone.id}`,
        type: 'capacity',
        zoneId: zone.id,
        zoneName: zone.name,
        title: 'Increase Zone Capacity',
        description: `Zone is operating at ${Math.round(avgUtilization * 100)}% capacity. Consider expanding or optimizing layout.`,
        priority: avgUtilization > 0.95 ? 'CRITICAL' : 'HIGH',
        impact: 8.5,
        effort: 7,
        estimatedCost: 15000,
        estimatedSavings: 25000,
        paybackPeriod: 7.2,
        recommendations: [
          'Reconfigure zone layout for better space utilization',
          'Add overflow areas during peak times',
          'Implement dynamic capacity management',
          'Consider expansion if space permits'
        ],
        metrics: {
          currentUtilization: avgUtilization,
          targetUtilization: 0.85,
          expectedImprovement: '15-20% capacity increase'
        }
      });
    }

    // Underutilization optimization
    if (avgUtilization < 0.3) {
      optimizations.push({
        id: `space_reallocation_${zone.id}`,
        type: 'capacity',
        zoneId: zone.id,
        zoneName: zone.name,
        title: 'Optimize Underutilized Space',
        description: `Zone is only ${Math.round(avgUtilization * 100)}% utilized. Consider repurposing or downsizing.`,
        priority: 'MEDIUM',
        impact: 6,
        effort: 5,
        estimatedCost: 8000,
        estimatedSavings: 12000,
        paybackPeriod: 8,
        recommendations: [
          'Analyze zone purpose and visitor patterns',
          'Consider alternative activities or attractions',
          'Reduce maintenance costs for unused space',
          'Repurpose for revenue-generating activities'
        ],
        metrics: {
          currentUtilization: avgUtilization,
          targetUtilization: 0.6,
          expectedImprovement: 'Double current utilization'
        }
      });
    }

    // Queue management optimization
    const latestCapacity = zone.capacityRecords?.[0];
    if (latestCapacity?.queueLength > 5) {
      optimizations.push({
        id: `queue_management_${zone.id}`,
        type: 'capacity',
        zoneId: zone.id,
        zoneName: zone.name,
        title: 'Implement Advanced Queue Management',
        description: `Current queue length is ${latestCapacity.queueLength}. Optimize flow and reduce wait times.`,
        priority: 'HIGH',
        impact: 7.5,
        effort: 4,
        estimatedCost: 5000,
        estimatedSavings: 18000,
        paybackPeriod: 3.3,
        recommendations: [
          'Install digital queue management system',
          'Implement reservation and appointment scheduling',
          'Add entertainment or information for waiting visitors',
          'Optimize entry/exit flow patterns'
        ],
        metrics: {
          currentQueueLength: latestCapacity.queueLength,
          targetQueueLength: 2,
          expectedWaitTimeReduction: '60-70%'
        }
      });
    }
  }

  return optimizations;
}

async function generateFlowOptimizations(zone: any) {
  const optimizations = [];
  const occupancyHistory = zone.occupancyHistory || [];

  if (occupancyHistory.length > 0) {
    // Analyze entry/exit patterns
    const entries = occupancyHistory.filter((h: any) => h.eventType === 'ENTRY').length;
    const exits = occupancyHistory.filter((h: any) => h.eventType === 'EXIT').length;
    const imbalance = Math.abs(entries - exits) / Math.max(entries, exits, 1);

    if (imbalance > 0.2) {
      optimizations.push({
        id: `flow_balance_${zone.id}`,
        type: 'flow',
        zoneId: zone.id,
        zoneName: zone.name,
        title: 'Balance Entry/Exit Flow',
        description: `Entry/exit imbalance detected (${entries} entries, ${exits} exits). Optimize traffic flow.`,
        priority: 'MEDIUM',
        impact: 6.5,
        effort: 3,
        estimatedCost: 3000,
        estimatedSavings: 8000,
        paybackPeriod: 4.5,
        recommendations: [
          'Analyze and optimize entry/exit point placement',
          'Implement directional signage and guides',
          'Add staff guidance during peak times',
          'Consider separate entry and exit points'
        ],
        metrics: {
          currentImbalance: Math.round(imbalance * 100),
          targetImbalance: 5,
          expectedFlowImprovement: '25-30%'
        }
      });
    }

    // Bottleneck detection
    const peakOccupancyEvents = occupancyHistory.filter((h: any) => 
      h.occupancyCount > (zone.zoneConfig?.maxCapacity || 0) * 0.8
    );

    if (peakOccupancyEvents.length > occupancyHistory.length * 0.3) {
      optimizations.push({
        id: `bottleneck_resolution_${zone.id}`,
        type: 'flow',
        zoneId: zone.id,
        zoneName: zone.name,
        title: 'Resolve Flow Bottlenecks',
        description: 'Frequent bottlenecks detected during peak usage. Optimize flow paths and circulation.',
        priority: 'HIGH',
        impact: 8,
        effort: 6,
        estimatedCost: 10000,
        estimatedSavings: 20000,
        paybackPeriod: 6,
        recommendations: [
          'Widen primary circulation paths',
          'Add alternative routes through the zone',
          'Implement crowd management protocols',
          'Install flow monitoring and guidance systems'
        ],
        metrics: {
          bottleneckFrequency: Math.round((peakOccupancyEvents.length / occupancyHistory.length) * 100),
          targetFrequency: 15,
          expectedFlowImprovement: '40-50%'
        }
      });
    }
  }

  return optimizations;
}

async function generateSafetyOptimizations(zone: any) {
  const optimizations = [];
  const violations = zone.zoneViolations || [];
  const alerts = zone.enhancedAlerts || [];

  // High violation rate optimization
  if (violations.length > 10) { // More than 10 violations in the last month
    const severityDistribution = violations.reduce((acc: any, v: any) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {});

    optimizations.push({
      id: `safety_improvement_${zone.id}`,
      type: 'safety',
      zoneId: zone.id,
      zoneName: zone.name,
      title: 'Enhance Safety Measures',
      description: `${violations.length} safety violations detected in the last month. Implement preventive measures.`,
      priority: severityDistribution.CRITICAL > 0 ? 'CRITICAL' : 'HIGH',
      impact: 9,
      effort: 5,
      estimatedCost: 12000,
      estimatedSavings: 30000,
      paybackPeriod: 4.8,
      recommendations: [
        'Increase safety monitoring and patrols',
        'Install additional safety equipment and signage',
        'Implement proactive safety protocols',
        'Enhance staff training on safety procedures'
      ],
      metrics: {
        currentViolations: violations.length,
        targetViolations: 3,
        expectedReduction: '70-80%'
      }
    });
  }

  // Camera coverage optimization
  const cameras = zone.cameras || [];
  const onlineCameras = cameras.filter((c: any) => c.status === 'ONLINE').length;
  const cameraCoverage = cameras.length > 0 ? onlineCameras / cameras.length : 0;

  if (cameraCoverage < 0.8) {
    optimizations.push({
      id: `camera_optimization_${zone.id}`,
      type: 'safety',
      zoneId: zone.id,
      zoneName: zone.name,
      title: 'Improve Camera Coverage',
      description: `Only ${Math.round(cameraCoverage * 100)}% of cameras are online. Optimize surveillance coverage.`,
      priority: 'MEDIUM',
      impact: 7,
      effort: 3,
      estimatedCost: 5000,
      estimatedSavings: 15000,
      paybackPeriod: 4,
      recommendations: [
        'Repair or replace offline cameras',
        'Add cameras in blind spots',
        'Implement redundant monitoring systems',
        'Regular maintenance schedule for camera systems'
      ],
      metrics: {
        currentCoverage: Math.round(cameraCoverage * 100),
        targetCoverage: 95,
        expectedImprovement: 'Complete zone surveillance'
      }
    });
  }

  return optimizations;
}

async function generateLayoutOptimizations(zone: any) {
  const optimizations = [];
  const analytics = zone.zoneAnalytics || [];

  if (analytics.length > 0) {
    const avgStayTime = analytics.reduce((sum: number, a: any) => sum + a.averageStayTime, 0) / analytics.length;
    const avgUtilization = analytics.reduce((sum: number, a: any) => sum + a.utilizationRate, 0) / analytics.length;

    // Short stay time with high utilization - layout issue
    if (avgStayTime < 15 && avgUtilization > 0.7) {
      optimizations.push({
        id: `layout_engagement_${zone.id}`,
        type: 'layout',
        zoneId: zone.id,
        zoneName: zone.name,
        title: 'Optimize Layout for Engagement',
        description: `Average stay time is only ${Math.round(avgStayTime)} minutes despite high utilization. Improve layout to increase engagement.`,
        priority: 'MEDIUM',
        impact: 6.5,
        effort: 7,
        estimatedCost: 18000,
        estimatedSavings: 25000,
        paybackPeriod: 8.6,
        recommendations: [
          'Redesign zone layout for better visitor experience',
          'Add engaging activities and attractions',
          'Improve wayfinding and zone navigation',
          'Create comfortable rest and observation areas'
        ],
        metrics: {
          currentStayTime: Math.round(avgStayTime),
          targetStayTime: 25,
          expectedIncrease: '65-70%'
        }
      });
    }

    // Low efficiency score
    const avgEfficiency = analytics.reduce((sum: number, a: any) => sum + (a.efficiencyScore || 0), 0) / analytics.length;
    if (avgEfficiency < 3) {
      optimizations.push({
        id: `layout_efficiency_${zone.id}`,
        type: 'layout',
        zoneId: zone.id,
        zoneName: zone.name,
        title: 'Improve Operational Efficiency',
        description: `Efficiency score is ${avgEfficiency.toFixed(1)}/5. Optimize layout for better operations.`,
        priority: 'MEDIUM',
        impact: 7,
        effort: 6,
        estimatedCost: 15000,
        estimatedSavings: 22000,
        paybackPeriod: 8.2,
        recommendations: [
          'Streamline operational workflows within the zone',
          'Optimize equipment and storage placement',
          'Improve staff movement and accessibility',
          'Implement efficient cleaning and maintenance protocols'
        ],
        metrics: {
          currentEfficiency: avgEfficiency.toFixed(1),
          targetEfficiency: 4.2,
          expectedImprovement: '40-50%'
        }
      });
    }
  }

  return optimizations;
}

async function generateTechnologyOptimizations(zone: any) {
  const optimizations = [];

  // Smart monitoring system
  if (!zone.zoneConfig?.alertThresholds || Object.keys(zone.zoneConfig.alertThresholds).length === 0) {
    optimizations.push({
      id: `smart_monitoring_${zone.id}`,
      type: 'technology',
      zoneId: zone.id,
      zoneName: zone.name,
      title: 'Implement Smart Monitoring',
      description: 'No automated monitoring thresholds configured. Implement intelligent monitoring system.',
      priority: 'MEDIUM',
      impact: 7.5,
      effort: 4,
      estimatedCost: 8000,
      estimatedSavings: 18000,
      paybackPeriod: 5.3,
      recommendations: [
        'Install IoT sensors for real-time monitoring',
        'Configure automated alert thresholds',
        'Implement predictive analytics',
        'Add mobile app integration for staff'
      ],
      metrics: {
        currentAutomation: 0,
        targetAutomation: 85,
        expectedEfficiency: '50-60% improvement'
      }
    });
  }

  // Access control optimization
  if (zone.zoneConfig?.isRestrictedAccess && (!zone.accessRules || zone.accessRules.length === 0)) {
    optimizations.push({
      id: `access_control_${zone.id}`,
      type: 'technology',
      zoneId: zone.id,
      zoneName: zone.name,
      title: 'Automated Access Control',
      description: 'Restricted zone lacks automated access control. Implement digital access management.',
      priority: 'HIGH',
      impact: 8,
      effort: 5,
      estimatedCost: 12000,
      estimatedSavings: 20000,
      paybackPeriod: 7.2,
      recommendations: [
        'Install automated access control systems',
        'Implement biometric or card-based access',
        'Add real-time access monitoring',
        'Configure rule-based access permissions'
      ],
      metrics: {
        currentAutomation: 0,
        targetAutomation: 95,
        expectedSecurity: '80-90% improvement'
      }
    });
  }

  return optimizations;
}

async function generateRevenueOptimizations(zone: any) {
  const optimizations = [];
  const analytics = zone.zoneAnalytics || [];

  if (analytics.length > 0) {
    const avgRevenue = analytics.reduce((sum: number, a: any) => sum + a.revenueGenerated, 0) / analytics.length;
    const avgUtilization = analytics.reduce((sum: number, a: any) => sum + a.utilizationRate, 0) / analytics.length;

    // High utilization but low revenue
    if (avgUtilization > 0.6 && avgRevenue < 500) {
      optimizations.push({
        id: `revenue_enhancement_${zone.id}`,
        type: 'revenue',
        zoneId: zone.id,
        zoneName: zone.name,
        title: 'Enhance Revenue Generation',
        description: `Zone has ${Math.round(avgUtilization * 100)}% utilization but low revenue ($${Math.round(avgRevenue)}/day). Add revenue opportunities.`,
        priority: 'MEDIUM',
        impact: 8,
        effort: 6,
        estimatedCost: 10000,
        estimatedSavings: 45000,
        paybackPeriod: 2.7,
        recommendations: [
          'Add premium experiences or activities',
          'Implement dynamic pricing strategies',
          'Introduce merchandise and food services',
          'Create photo and memory capture opportunities'
        ],
        metrics: {
          currentRevenue: Math.round(avgRevenue),
          targetRevenue: 1200,
          expectedIncrease: '140-160%'
        }
      });
    }

    // Upselling opportunities
    const avgStayTime = analytics.reduce((sum: number, a: any) => sum + a.averageStayTime, 0) / analytics.length;
    if (avgStayTime > 30 && avgRevenue < 800) {
      optimizations.push({
        id: `upselling_${zone.id}`,
        type: 'revenue',
        zoneId: zone.id,
        zoneName: zone.name,
        title: 'Implement Upselling Strategies',
        description: `Visitors spend ${Math.round(avgStayTime)} minutes but revenue is only $${Math.round(avgRevenue)}. Optimize upselling.`,
        priority: 'LOW',
        impact: 6,
        effort: 3,
        estimatedCost: 3000,
        estimatedSavings: 15000,
        paybackPeriod: 2.4,
        recommendations: [
          'Train staff in upselling techniques',
          'Add point-of-sale displays and promotions',
          'Implement loyalty and reward programs',
          'Create bundled experience packages'
        ],
        metrics: {
          currentConversion: 25,
          targetConversion: 45,
          expectedRevenue: '80% increase'
        }
      });
    }
  }

  return optimizations;
}

async function calculateROIEstimates(optimizations: any[], zones: any[]) {
  const totalCost = optimizations.reduce((sum, opt) => sum + opt.estimatedCost, 0);
  const totalSavings = optimizations.reduce((sum, opt) => sum + opt.estimatedSavings, 0);
  const avgPayback = optimizations.length > 0 
    ? optimizations.reduce((sum, opt) => sum + opt.paybackPeriod, 0) / optimizations.length 
    : 0;

  return {
    totalImplementationCost: totalCost,
    totalEstimatedSavings: totalSavings,
    netBenefit: totalSavings - totalCost,
    averagePaybackPeriod: Math.round(avgPayback * 10) / 10,
    roi: totalCost > 0 ? Math.round(((totalSavings - totalCost) / totalCost) * 100) : 0,
    costBreakdown: optimizations.reduce((acc: any, opt) => {
      acc[opt.type] = (acc[opt.type] || 0) + opt.estimatedCost;
      return acc;
    }, {}),
    savingsBreakdown: optimizations.reduce((acc: any, opt) => {
      acc[opt.type] = (acc[opt.type] || 0) + opt.estimatedSavings;
      return acc;
    }, {})
  };
}

async function generateImplementationPlans(optimizations: any[]) {
  const plans: { [key: string]: any } = {};

  optimizations.forEach(opt => {
    plans[opt.id] = {
      optimizationId: opt.id,
      title: opt.title,
      phases: generateImplementationPhases(opt),
      timeline: calculateImplementationTimeline(opt),
      resources: calculateRequiredResources(opt),
      risks: identifyImplementationRisks(opt),
      success_criteria: defineSuccessCriteria(opt)
    };
  });

  return plans;
}

async function calculateOptimizationScores(zones: any[]) {
  const scores: { [key: string]: any } = {};

  zones.forEach(zone => {
    const analytics = zone.zoneAnalytics || [];
    const avgUtilization = analytics.length > 0 
      ? analytics.reduce((sum: number, a: any) => sum + a.utilizationRate, 0) / analytics.length 
      : 0;
    const avgSafety = analytics.length > 0 
      ? analytics.reduce((sum: number, a: any) => sum + (a.safetyScore || 0), 0) / analytics.length 
      : 0;
    const avgEfficiency = analytics.length > 0 
      ? analytics.reduce((sum: number, a: any) => sum + (a.efficiencyScore || 0), 0) / analytics.length 
      : 0;

    scores[zone.id] = {
      zoneName: zone.name,
      currentScores: {
        utilization: Math.round(avgUtilization * 100),
        safety: Math.round(avgSafety * 20), // Convert to 0-100 scale
        efficiency: Math.round(avgEfficiency * 20), // Convert to 0-100 scale
        overall: Math.round((avgUtilization * 100 + avgSafety * 20 + avgEfficiency * 20) / 3)
      },
      optimizationPotential: calculateOptimizationPotential(avgUtilization, avgSafety, avgEfficiency),
      priorityLevel: calculatePriorityLevel(avgUtilization, avgSafety, avgEfficiency)
    };
  });

  return scores;
}

// Implementation helper functions
async function applyCapacityOptimization(zoneId: string, parameters: any, userId: string) {
  // Update zone configuration with new capacity settings
  return await prisma.zoneConfiguration.upsert({
    where: { zoneId },
    update: {
      maxCapacity: parameters.newCapacity,
      alertThresholds: parameters.alertThresholds,
      metadata: {
        lastOptimized: new Date().toISOString(),
        optimizedBy: userId,
        optimizationType: 'capacity'
      }
    },
    create: {
      zoneId,
      maxCapacity: parameters.newCapacity,
      alertThresholds: parameters.alertThresholds,
      metadata: {
        optimized: new Date().toISOString(),
        optimizedBy: userId,
        optimizationType: 'capacity'
      }
    }
  });
}

async function applyFlowOptimization(zoneId: string, parameters: any, userId: string) {
  // Implementation would update zone layout and flow configurations
  return { message: 'Flow optimization applied', parameters };
}

async function applySafetyOptimization(zoneId: string, parameters: any, userId: string) {
  // Implementation would update safety configurations and thresholds
  return { message: 'Safety optimization applied', parameters };
}

async function applyLayoutOptimization(zoneId: string, parameters: any, userId: string) {
  // Implementation would update zone layout configuration
  return { message: 'Layout optimization applied', parameters };
}

async function markOptimizationImplemented(optimizationId: string, userId: string) {
  // In a real implementation, this would track optimization implementation status
  return { 
    optimizationId, 
    status: 'implemented', 
    implementedBy: userId, 
    implementedAt: new Date().toISOString() 
  };
}

async function scheduleOptimizationImplementation(optimizationId: string, parameters: any, userId: string) {
  // Implementation would schedule optimization for future implementation
  return { 
    optimizationId, 
    status: 'scheduled', 
    scheduledFor: parameters.scheduledDate,
    scheduledBy: userId 
  };
}

// Additional helper functions
function generateImplementationPhases(optimization: any): any[] {
  return [
    { phase: 1, name: 'Planning', duration: '1-2 weeks', tasks: ['Assess current state', 'Plan implementation'] },
    { phase: 2, name: 'Implementation', duration: '2-4 weeks', tasks: ['Execute changes', 'Test systems'] },
    { phase: 3, name: 'Validation', duration: '1 week', tasks: ['Validate results', 'Fine-tune'] }
  ];
}

function calculateImplementationTimeline(optimization: any): string {
  return `${optimization.effort * 1.5} weeks`;
}

function calculateRequiredResources(optimization: any): any {
  return {
    budget: optimization.estimatedCost,
    staff: Math.ceil(optimization.effort / 2),
    equipment: optimization.type === 'technology' ? 'High' : 'Medium'
  };
}

function identifyImplementationRisks(optimization: any): string[] {
  return [
    'Implementation delays',
    'Budget overruns',
    'User resistance to change'
  ];
}

function defineSuccessCriteria(optimization: any): string[] {
  return [
    `Achieve ${optimization.metrics?.expectedImprovement || 'target improvement'}`,
    'No service disruption during implementation',
    'ROI achieved within projected timeframe'
  ];
}

function calculateOptimizationPotential(utilization: number, safety: number, efficiency: number): number {
  const maxPossible = 100;
  const current = (utilization * 100 + safety * 20 + efficiency * 20) / 3;
  return Math.round((maxPossible - current) / maxPossible * 100);
}

function calculatePriorityLevel(utilization: number, safety: number, efficiency: number): string {
  const avgScore = (utilization * 100 + safety * 20 + efficiency * 20) / 3;
  
  if (avgScore < 40) return 'CRITICAL';
  if (avgScore < 60) return 'HIGH';
  if (avgScore < 75) return 'MEDIUM';
  return 'LOW';
}
