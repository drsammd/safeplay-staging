
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/zones/[zoneId] - Get specific zone details
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
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';
    const daysBack = parseInt(searchParams.get('daysBack') || '7');

    const zone = await prisma.floorPlanZone.findUnique({
      where: { id: zoneId },
      include: {
        floorPlan: {
          select: {
            id: true,
            name: true,
            venueId: true,
            venue: {
              select: {
                id: true,
                name: true,
                adminId: true
              }
            }
          }
        },
        zoneConfig: true,
        accessRules: {
          where: { isActive: true },
          orderBy: { priority: 'asc' }
        },
        cameras: {
          select: {
            id: true,
            name: true,
            status: true,
            position: true,
            viewAngle: true,
            viewDistance: true
          }
        },
        parentZone: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        subZones: {
          select: {
            id: true,
            name: true,
            type: true,
            zoneConfig: {
              select: {
                maxCapacity: true,
                isRestrictedAccess: true
              }
            }
          }
        },
        capacityRecords: {
          orderBy: { recordDate: 'desc' },
          take: 1
        },
        occupancyHistory: includeHistory ? {
          where: {
            timestamp: {
              gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { timestamp: 'desc' }
        } : false,
        zoneAnalytics: includeAnalytics ? {
          where: {
            date: {
              gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { date: 'desc' }
        } : false,
        evacuationRoutes: {
          where: { isActive: true },
          include: {
            toZone: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        },
        evacuationDestinations: {
          where: { isActive: true },
          include: {
            fromZone: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        },
        emergencyProcedures: {
          where: { isActive: true },
          orderBy: { priorityLevel: 'desc' }
        },
        _count: {
          select: {
            childSightings: {
              where: {
                timestamp: {
                  gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                }
              }
            },
            zoneViolations: {
              where: {
                isResolved: false
              }
            },
            enhancedAlerts: {
              where: {
                status: 'ACTIVE'
              }
            },
            accessLogs: {
              where: {
                entryTime: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
              }
            }
          }
        }
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    // Check user access
    if (session.user.role === 'VENUE_ADMIN' && zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    // Calculate current status
    const latestCapacity = zone.capacityRecords?.[0];
    const currentOccupancy = latestCapacity?.currentOccupancy ?? 0;
    const maxCapacity = zone.zoneConfig?.maxCapacity ?? 0;
    const utilizationRate = maxCapacity > 0 ? (currentOccupancy / maxCapacity) * 100 : 0;

    // Get recent activity summary
    const recentActivity = {
      currentOccupancy,
      maxCapacity,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      capacityStatus: latestCapacity?.capacityStatus ?? 'NORMAL',
      activeAlerts: zone._count?.enhancedAlerts ?? 0,
      recentSightings: zone._count?.childSightings ?? 0,
      unresolvedViolations: zone._count?.zoneViolations ?? 0,
      dailyAccess: zone._count?.accessLogs ?? 0,
      isAtCapacity: utilizationRate >= 100,
      isNearCapacity: utilizationRate >= 85,
      lastUpdated: latestCapacity?.lastUpdated ?? zone.updatedAt
    };

    // Calculate analytics summary if requested
    let analyticsSummary = null;
    if (includeAnalytics && zone.zoneAnalytics && zone.zoneAnalytics.length > 0) {
      const analytics = zone.zoneAnalytics;
      const totalDays = analytics.length;
      
      analyticsSummary = {
        averageUtilization: analytics.reduce((sum, a) => sum + a.utilizationRate, 0) / totalDays,
        averageStayTime: analytics.reduce((sum, a) => sum + a.averageStayTime, 0) / totalDays,
        totalViolations: analytics.reduce((sum, a) => sum + a.totalViolations, 0),
        totalAlerts: analytics.reduce((sum, a) => sum + a.alertsGenerated, 0),
        averageSafetyScore: analytics.reduce((sum, a) => sum + (a.safetyScore || 0), 0) / totalDays,
        peakOccupancyRecord: Math.max(...analytics.map(a => a.peakOccupancy)),
        totalRevenue: analytics.reduce((sum, a) => sum + a.revenueGenerated, 0),
        trends: {
          utilizationTrend: calculateTrend(analytics.slice(-7).map(a => a.utilizationRate)),
          safetyTrend: calculateTrend(analytics.slice(-7).map(a => a.safetyScore || 0)),
          violationTrend: calculateTrend(analytics.slice(-7).map(a => a.totalViolations))
        }
      };
    }

    const enrichedZone = {
      ...zone,
      recentActivity,
      analyticsSummary,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({ zone: enrichedZone });

  } catch (error) {
    console.error('Error fetching zone details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zone details' },
      { status: 500 }
    );
  }
}

// PUT /api/zones/[zoneId] - Update zone
export async function PUT(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { zoneId } = params;
    const body = await request.json();

    // Verify zone exists and user has access
    const existingZone = await prisma.floorPlanZone.findUnique({
      where: { id: zoneId },
      include: {
        floorPlan: {
          include: { venue: true }
        }
      }
    });

    if (!existingZone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && existingZone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    const {
      name,
      type,
      coordinates,
      color,
      description,
      parentZoneId,
      configuration
    } = body;

    // Update zone with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update zone basic info
      const updatedZone = await tx.floorPlanZone.update({
        where: { id: zoneId },
        data: {
          ...(name && { name }),
          ...(type && { type }),
          ...(coordinates && { coordinates }),
          ...(color && { color }),
          ...(description !== undefined && { description }),
          ...(parentZoneId !== undefined ? { parentZoneId } : {}),
          metadata: {
            ...(existingZone?.metadata && typeof existingZone.metadata === 'object' ? existingZone.metadata : {}),
            lastModifiedBy: session.user.id,
            lastModifiedAt: new Date().toISOString()
          }
        }
      });

      // Update configuration if provided
      if (configuration) {
        await tx.zoneConfiguration.upsert({
          where: { zoneId },
          update: {
            ...(configuration.maxCapacity !== undefined && { maxCapacity: configuration.maxCapacity }),
            ...(configuration.minStaffRequired !== undefined && { minStaffRequired: configuration.minStaffRequired }),
            ...(configuration.maxAge !== undefined && { maxAge: configuration.maxAge }),
            ...(configuration.minAge !== undefined && { minAge: configuration.minAge }),
            ...(configuration.requiresAdultSupervision !== undefined && { requiresAdultSupervision: configuration.requiresAdultSupervision }),
            ...(configuration.isRestrictedAccess !== undefined && { isRestrictedAccess: configuration.isRestrictedAccess }),
            ...(configuration.accessPermissions && { accessPermissions: configuration.accessPermissions }),
            ...(configuration.operatingHours && { operatingHours: configuration.operatingHours }),
            ...(configuration.priorityLevel && { priorityLevel: configuration.priorityLevel }),
            ...(configuration.safetyLevel && { safetyLevel: configuration.safetyLevel }),
            ...(configuration.hazardLevel && { hazardLevel: configuration.hazardLevel }),
            ...(configuration.evacuationPriority !== undefined && { evacuationPriority: configuration.evacuationPriority }),
            ...(configuration.allowedActivities && { allowedActivities: configuration.allowedActivities }),
            ...(configuration.prohibitedItems && { prohibitedItems: configuration.prohibitedItems }),
            ...(configuration.requiredEquipment && { requiredEquipment: configuration.requiredEquipment }),
            ...(configuration.alertThresholds && { alertThresholds: configuration.alertThresholds }),
            ...(configuration.environmentSettings && { environmentSettings: configuration.environmentSettings }),
            ...(configuration.complianceRequirements && { complianceRequirements: configuration.complianceRequirements }),
            metadata: {
              lastConfiguredBy: session.user.id,
              lastConfiguredAt: new Date().toISOString()
            }
          },
          create: {
            zoneId,
            maxCapacity: configuration.maxCapacity || 0,
            minStaffRequired: configuration.minStaffRequired || 0,
            maxAge: configuration.maxAge,
            minAge: configuration.minAge,
            requiresAdultSupervision: configuration.requiresAdultSupervision || false,
            isRestrictedAccess: configuration.isRestrictedAccess || false,
            accessPermissions: configuration.accessPermissions || [],
            operatingHours: configuration.operatingHours,
            priorityLevel: configuration.priorityLevel || 'NORMAL',
            safetyLevel: configuration.safetyLevel || 'STANDARD',
            hazardLevel: configuration.hazardLevel || 'NONE',
            evacuationPriority: configuration.evacuationPriority || 1,
            allowedActivities: configuration.allowedActivities || [],
            prohibitedItems: configuration.prohibitedItems || [],
            requiredEquipment: configuration.requiredEquipment || [],
            alertThresholds: configuration.alertThresholds || {},
            environmentSettings: configuration.environmentSettings,
            complianceRequirements: configuration.complianceRequirements,
            metadata: {
              configuredBy: session.user.id,
              configuredAt: new Date().toISOString()
            }
          }
        });
      }

      return updatedZone;
    });

    // Fetch the updated zone with relations
    const updatedZone = await prisma.floorPlanZone.findUnique({
      where: { id: zoneId },
      include: {
        floorPlan: {
          select: {
            id: true,
            name: true,
            venueId: true
          }
        },
        zoneConfig: true,
        accessRules: {
          where: { isActive: true }
        },
        parentZone: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        subZones: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    return NextResponse.json({
      zone: updatedZone,
      message: 'Zone updated successfully'
    });

  } catch (error) {
    console.error('Error updating zone:', error);
    return NextResponse.json(
      { error: 'Failed to update zone' },
      { status: 500 }
    );
  }
}

// DELETE /api/zones/[zoneId] - Delete zone
export async function DELETE(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { zoneId } = params;

    // Verify zone exists and user has access
    const zone = await prisma.floorPlanZone.findUnique({
      where: { id: zoneId },
      include: {
        floorPlan: {
          include: { venue: true }
        },
        subZones: true
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    // Check if zone has sub-zones
    if (zone.subZones && zone.subZones.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete zone with sub-zones. Please delete sub-zones first.'
      }, { status: 400 });
    }

    // Delete zone (cascade will handle related records)
    await prisma.floorPlanZone.delete({
      where: { id: zoneId }
    });

    return NextResponse.json({
      message: 'Zone deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting zone:', error);
    return NextResponse.json(
      { error: 'Failed to delete zone' },
      { status: 500 }
    );
  }
}

// Helper function to calculate trends
function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 2) return 'stable';
  
  const first = values[0];
  const last = values[values.length - 1];
  const difference = last - first;
  const threshold = first * 0.05; // 5% threshold
  
  if (difference > threshold) return 'increasing';
  if (difference < -threshold) return 'decreasing';
  return 'stable';
}
