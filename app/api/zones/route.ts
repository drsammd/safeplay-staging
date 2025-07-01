
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/zones - Get zones for a venue with optional filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const floorPlanId = searchParams.get('floorPlanId');
    const zoneType = searchParams.get('type');
    const includeConfig = searchParams.get('includeConfig') === 'true';
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 });
    }

    // Check if user has access to this venue
    if (session.user.role === 'VENUE_ADMIN') {
      const venue = await prisma.venue.findFirst({
        where: { id: venueId, adminId: session.user.id }
      });
      if (!venue) {
        return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
      }
    }

    const whereClause: any = {
      floorPlan: {
        venueId: venueId
      }
    };

    if (floorPlanId) {
      whereClause.floorPlanId = floorPlanId;
    }

    if (zoneType) {
      whereClause.type = zoneType;
    }

    const zones = await prisma.floorPlanZone.findMany({
      where: whereClause,
      include: {
        floorPlan: {
          select: {
            id: true,
            name: true,
            venueId: true
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
        zoneConfig: includeConfig,
        accessRules: includeConfig ? {
          where: { isActive: true },
          orderBy: { priority: 'asc' }
        } : false,
        capacityRecords: includeAnalytics ? {
          orderBy: { recordDate: 'desc' },
          take: 1
        } : false,
        zoneAnalytics: includeAnalytics ? {
          orderBy: { date: 'desc' },
          take: 7 // Last 7 days
        } : false,
        occupancyHistory: includeAnalytics ? {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: { timestamp: 'desc' }
        } : false,
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
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Add computed fields for real-time data
    const enrichedZones = zones.map(zone => {
      const latestCapacity = zone.capacityRecords?.[0];
      const currentOccupancy = latestCapacity?.currentOccupancy ?? 0;
      const maxCapacity = zone.zoneConfig?.maxCapacity ?? 0;
      const utilizationRate = maxCapacity > 0 ? (currentOccupancy / maxCapacity) * 100 : 0;

      return {
        ...zone,
        currentOccupancy,
        maxCapacity,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        capacityStatus: latestCapacity?.capacityStatus ?? 'NORMAL',
        activeAlerts: zone._count?.enhancedAlerts ?? 0,
        recentSightings: zone._count?.childSightings ?? 0,
        unresolvedViolations: zone._count?.zoneViolations ?? 0,
        isAtCapacity: utilizationRate >= 100,
        isNearCapacity: utilizationRate >= 85,
        lastUpdated: latestCapacity?.lastUpdated ?? zone.updatedAt
      };
    });

    return NextResponse.json({
      zones: enrichedZones,
      metadata: {
        total: zones.length,
        includeConfig,
        includeAnalytics,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}

// POST /api/zones - Create a new zone
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      type,
      coordinates,
      color,
      description,
      floorPlanId,
      parentZoneId,
      configuration
    } = body;

    // Validate required fields
    if (!name || !type || !coordinates || !floorPlanId) {
      return NextResponse.json({
        error: 'Missing required fields: name, type, coordinates, floorPlanId'
      }, { status: 400 });
    }

    // Verify floor plan exists and user has access
    const floorPlan = await prisma.floorPlan.findFirst({
      where: { id: floorPlanId },
      include: { venue: true }
    });

    if (!floorPlan) {
      return NextResponse.json({ error: 'Floor plan not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    // Create zone with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the zone
      const zone = await tx.floorPlanZone.create({
        data: {
          name,
          type,
          coordinates,
          color: color || '#3B82F6',
          description,
          floorPlanId,
          parentZoneId,
          metadata: {
            createdBy: session.user.id,
            createdAt: new Date().toISOString()
          }
        }
      });

      // Create zone configuration if provided
      if (configuration) {
        await tx.zoneConfiguration.create({
          data: {
            zoneId: zone.id,
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

      // Create initial capacity record
      await tx.zoneCapacityRecord.create({
        data: {
          zoneId: zone.id,
          currentOccupancy: 0,
          maxCapacity: configuration?.maxCapacity || 0,
          utilizationRate: 0.0,
          capacityStatus: 'EMPTY',
          recordDate: new Date()
        }
      });

      return zone;
    });

    // Fetch the complete zone with relations
    const completeZone = await prisma.floorPlanZone.findUnique({
      where: { id: result.id },
      include: {
        floorPlan: {
          select: {
            id: true,
            name: true,
            venueId: true
          }
        },
        zoneConfig: true,
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
      zone: completeZone,
      message: 'Zone created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating zone:', error);
    return NextResponse.json(
      { error: 'Failed to create zone' },
      { status: 500 }
    );
  }
}
