
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/zones/[zoneId]/evacuation - Get evacuation routes for a zone
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
    const includeAlternatives = searchParams.get('includeAlternatives') === 'true';
    const routeType = searchParams.get('routeType'); // 'primary' | 'secondary' | 'emergency'

    // Verify zone exists and user has access
    const zone = await prisma.floorPlanZone.findUnique({
      where: { id: zoneId },
      include: {
        floorPlan: {
          include: { venue: true }
        }
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    // Build filter conditions
    const whereClause: any = {
      fromZoneId: zoneId,
      isActive: true
    };

    if (routeType === 'primary') {
      whereClause.isPrimary = true;
    }

    // Get evacuation routes
    const evacuationRoutes = await prisma.evacuationRoute.findMany({
      where: whereClause,
      include: {
        toZone: {
          select: {
            id: true,
            name: true,
            type: true,
            coordinates: true
          }
        },
        routeAssignments: {
          where: {
            status: {
              in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS']
            }
          },
          select: {
            id: true,
            childId: true,
            staffId: true,
            status: true,
            priority: true,
            estimatedTime: true
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { distance: 'asc' }
      ]
    });

    // Get alternative routes if requested
    let alternativeRoutes: any[] = [];
    if (includeAlternatives) {
      alternativeRoutes = await prisma.evacuationRoute.findMany({
        where: {
          fromZoneId: { not: zoneId },
          toZone: {
            floorPlanId: zone.floorPlanId
          },
          isActive: true
        },
        include: {
          fromZone: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          toZone: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        },
        orderBy: { distance: 'asc' }
      });
    }

    // Calculate route statistics
    const routeStats = {
      totalRoutes: evacuationRoutes.length,
      primaryRoutes: evacuationRoutes.filter(r => r.isPrimary).length,
      activeAssignments: evacuationRoutes.reduce((sum, r) => sum + r.routeAssignments.length, 0),
      averageDistance: evacuationRoutes.length > 0 
        ? evacuationRoutes.reduce((sum, r) => sum + r.distance, 0) / evacuationRoutes.length 
        : 0,
      averageTime: evacuationRoutes.length > 0
        ? evacuationRoutes.reduce((sum, r) => sum + r.estimatedTime, 0) / evacuationRoutes.length
        : 0,
      totalCapacity: evacuationRoutes.reduce((sum, r) => sum + r.maxCapacity, 0)
    };

    // Check route readiness
    const routeReadiness = await assessRouteReadiness(evacuationRoutes);

    return NextResponse.json({
      zoneInfo: {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        venueId: zone.floorPlan.venueId
      },
      evacuationRoutes,
      ...(includeAlternatives && { alternativeRoutes }),
      statistics: routeStats,
      readiness: routeReadiness,
      recommendations: generateEvacuationRecommendations(evacuationRoutes, zone)
    });

  } catch (error) {
    console.error('Error fetching evacuation routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evacuation routes' },
      { status: 500 }
    );
  }
}

// POST /api/zones/[zoneId]/evacuation - Create evacuation route
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
        }
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    const {
      name,
      toZoneId,
      routePath,
      distance,
      estimatedTime,
      maxCapacity,
      isPrimary,
      isAccessible,
      hazardLevel,
      lighting,
      signage,
      emergencyContacts,
      alternativeRoutes,
      weatherDependency,
      specialRequirements
    } = body;

    // Validate required fields
    if (!name || !toZoneId || !routePath || !distance || !estimatedTime || !maxCapacity) {
      return NextResponse.json({
        error: 'Missing required fields: name, toZoneId, routePath, distance, estimatedTime, maxCapacity'
      }, { status: 400 });
    }

    // Verify destination zone exists
    const destinationZone = await prisma.floorPlanZone.findUnique({
      where: { id: toZoneId }
    });

    if (!destinationZone) {
      return NextResponse.json({ error: 'Destination zone not found' }, { status: 404 });
    }

    // Create evacuation route
    const evacuationRoute = await prisma.evacuationRoute.create({
      data: {
        name,
        fromZoneId: zoneId,
        toZoneId,
        routePath,
        distance,
        estimatedTime,
        maxCapacity,
        isPrimary: isPrimary || false,
        isAccessible: isAccessible !== false, // Default to true
        hazardLevel: hazardLevel || 'NONE',
        lighting: lighting !== false, // Default to true
        signage: signage !== false, // Default to true
        obstacleStatus: 'CLEAR',
        emergencyContacts,
        alternativeRoutes: alternativeRoutes || [],
        weatherDependency: weatherDependency || false,
        specialRequirements,
        metadata: {
          createdBy: session.user.id,
          createdAt: new Date().toISOString()
        }
      }
    });

    // Fetch the complete route with relations
    const completeRoute = await prisma.evacuationRoute.findUnique({
      where: { id: evacuationRoute.id },
      include: {
        fromZone: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        toZone: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    return NextResponse.json({
      evacuationRoute: completeRoute,
      message: 'Evacuation route created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating evacuation route:', error);
    return NextResponse.json(
      { error: 'Failed to create evacuation route' },
      { status: 500 }
    );
  }
}

// Helper functions
async function assessRouteReadiness(routes: any[]) {
  let totalRoutes = routes.length;
  let readyRoutes = 0;
  let issues = [];

  for (const route of routes) {
    let routeReady = true;
    
    if (route.obstacleStatus !== 'CLEAR') {
      routeReady = false;
      issues.push({
        routeId: route.id,
        routeName: route.name,
        issue: `Route has obstacles: ${route.obstacleStatus}`,
        severity: 'HIGH'
      });
    }
    
    if (!route.lighting) {
      routeReady = false;
      issues.push({
        routeId: route.id,
        routeName: route.name,
        issue: 'Inadequate lighting',
        severity: 'MEDIUM'
      });
    }
    
    if (!route.signage) {
      routeReady = false;
      issues.push({
        routeId: route.id,
        routeName: route.name,
        issue: 'Missing emergency signage',
        severity: 'HIGH'
      });
    }
    
    if (route.lastInspection) {
      const daysSinceInspection = Math.floor((Date.now() - new Date(route.lastInspection).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceInspection > 30) {
        routeReady = false;
        issues.push({
          routeId: route.id,
          routeName: route.name,
          issue: `Route not inspected for ${daysSinceInspection} days`,
          severity: 'MEDIUM'
        });
      }
    } else {
      issues.push({
        routeId: route.id,
        routeName: route.name,
        issue: 'Route never inspected',
        severity: 'HIGH'
      });
    }
    
    if (routeReady) readyRoutes++;
  }

  return {
    readyRoutes,
    totalRoutes,
    readinessPercentage: totalRoutes > 0 ? Math.round((readyRoutes / totalRoutes) * 100) : 0,
    issues,
    overallStatus: readyRoutes === totalRoutes ? 'READY' : 
                   readyRoutes > totalRoutes * 0.7 ? 'MOSTLY_READY' : 'NOT_READY'
  };
}

function generateEvacuationRecommendations(routes: any[], zone: any) {
  const recommendations = [];
  
  if (routes.length === 0) {
    recommendations.push({
      type: 'critical',
      message: 'No evacuation routes defined for this zone. This is a critical safety issue.',
      action: 'Create evacuation routes immediately',
      priority: 'IMMEDIATE'
    });
    return recommendations;
  }
  
  const primaryRoutes = routes.filter(r => r.isPrimary);
  if (primaryRoutes.length === 0) {
    recommendations.push({
      type: 'warning',
      message: 'No primary evacuation route designated.',
      action: 'Designate at least one primary evacuation route',
      priority: 'HIGH'
    });
  }
  
  const accessibleRoutes = routes.filter(r => r.isAccessible);
  if (accessibleRoutes.length === 0) {
    recommendations.push({
      type: 'warning',
      message: 'No wheelchair accessible evacuation routes.',
      action: 'Ensure at least one route is wheelchair accessible',
      priority: 'HIGH'
    });
  }
  
  const totalCapacity = routes.reduce((sum, r) => sum + r.maxCapacity, 0);
  const zoneCapacity = zone.zoneConfig?.maxCapacity || 0;
  
  if (totalCapacity < zoneCapacity) {
    recommendations.push({
      type: 'warning',
      message: `Evacuation capacity (${totalCapacity}) is less than zone capacity (${zoneCapacity}).`,
      action: 'Increase evacuation route capacity or add additional routes',
      priority: 'MEDIUM'
    });
  }
  
  const highHazardRoutes = routes.filter(r => r.hazardLevel === 'HIGH' || r.hazardLevel === 'EXTREME');
  if (highHazardRoutes.length > 0) {
    recommendations.push({
      type: 'info',
      message: `${highHazardRoutes.length} evacuation routes have high hazard levels.`,
      action: 'Review and mitigate hazards or provide alternative routes',
      priority: 'MEDIUM'
    });
  }
  
  return recommendations;
}
