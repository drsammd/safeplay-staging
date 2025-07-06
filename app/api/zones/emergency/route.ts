
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/zones/emergency - Get emergency procedures for venues
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const zoneId = searchParams.get('zoneId');
    const emergencyType = searchParams.get('emergencyType');
    const includeInactive = searchParams.get('includeInactive') === 'true';

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

    // Build filter conditions
    const whereClause: any = {
      zone: {
        floorPlan: { venueId }
      }
    };

    if (zoneId) {
      whereClause.zoneId = zoneId;
    }

    if (emergencyType) {
      whereClause.procedureType = emergencyType;
    }

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    // Get emergency procedures
    const procedures = await prisma.emergencyProcedure.findMany({
      where: whereClause,
      include: {
        zone: {
          select: {
            id: true,
            name: true,
            type: true,
            floorPlan: {
              select: {
                id: true,
                name: true,
                venueId: true
              }
            }
          }
        }
      },
      orderBy: [
        { priorityLevel: 'desc' },
        { procedureType: 'asc' },
        { name: 'asc' }
      ]
    });

    // Group procedures by type and zone
    const proceduresByType = procedures.reduce((acc: any, proc) => {
      if (!acc[proc.procedureType]) {
        acc[proc.procedureType] = [];
      }
      acc[proc.procedureType].push(proc);
      return acc;
    }, {});

    const proceduresByZone = procedures.reduce((acc: any, proc) => {
      if (!acc[proc.zoneId]) {
        acc[proc.zoneId] = {
          zone: proc.zone,
          procedures: []
        };
      }
      acc[proc.zoneId].procedures.push(proc);
      return acc;
    }, {});

    // Get emergency readiness statistics
    const readinessStats = await calculateEmergencyReadiness(procedures);

    // Get recently updated procedures
    const recentlyUpdated = procedures
      .filter(p => p.lastReviewed && p.lastReviewed > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(b.lastReviewed!).getTime() - new Date(a.lastReviewed!).getTime())
      .slice(0, 10);

    // Get procedures needing review
    const needingReview = procedures.filter(p => {
      if (!p.nextReviewDate) return true;
      return p.nextReviewDate < new Date();
    });

    return NextResponse.json({
      procedures,
      groupings: {
        byType: proceduresByType,
        byZone: proceduresByZone
      },
      statistics: {
        total: procedures.length,
        active: procedures.filter(p => p.isActive).length,
        byPriority: {
          immediate: procedures.filter(p => p.priorityLevel === 'IMMEDIATE').length,
          critical: procedures.filter(p => p.priorityLevel === 'CRITICAL').length,
          high: procedures.filter(p => p.priorityLevel === 'HIGH').length,
          medium: procedures.filter(p => p.priorityLevel === 'MEDIUM').length,
          low: procedures.filter(p => p.priorityLevel === 'LOW').length
        },
        readiness: readinessStats
      },
      alerts: {
        needingReview: needingReview.length,
        recentlyUpdated: recentlyUpdated.length
      },
      recentlyUpdated,
      needingReview
    });

  } catch (error) {
    console.error('Error fetching emergency procedures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emergency procedures' },
      { status: 500 }
    );
  }
}

// POST /api/zones/emergency - Create emergency procedure
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

    const {
      zoneId,
      procedureType,
      name,
      description,
      stepByStepGuide,
      estimatedDuration,
      requiredPersonnel,
      requiredEquipment,
      priorityLevel,
      contactProcedure,
      evacuationInstructions,
      communicationProtocol,
      postEmergencySteps,
      trainingRequired,
      certificationRequired,
      parentProcedureId,
      relatedProcedures,
      complianceRequirements,
      successCriteria,
      failureProtocol,
      documentation,
      videoGuides
    } = body;

    // Validate required fields
    if (!zoneId || !procedureType || !name || !description || !stepByStepGuide) {
      return NextResponse.json({
        error: 'Missing required fields: zoneId, procedureType, name, description, stepByStepGuide'
      }, { status: 400 });
    }

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

    // Create emergency procedure
    const procedure = await prisma.emergencyProcedure.create({
      data: {
        zoneId,
        procedureType,
        name,
        description,
        stepByStepGuide,
        estimatedDuration: estimatedDuration || 30,
        requiredPersonnel: requiredPersonnel || 1,
        requiredEquipment: requiredEquipment || [],
        priorityLevel: priorityLevel || 'MEDIUM',
        contactProcedure,
        evacuationInstructions,
        communicationProtocol,
        postEmergencySteps,
        trainingRequired: trainingRequired !== false, // Default to true
        certificationRequired: certificationRequired || false,
        lastReviewed: new Date(),
        reviewedBy: session.user.id,
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Review yearly
        parentProcedureId,
        relatedProcedures: relatedProcedures || [],
        complianceRequirements,
        successCriteria,
        failureProtocol,
        documentation: documentation || [],
        videoGuides: videoGuides || [],
        metadata: {
          createdBy: session.user.id,
          createdAt: new Date().toISOString()
        }
      }
    });

    // Fetch the complete procedure with zone info
    const completeProcedure = await prisma.emergencyProcedure.findUnique({
      where: { id: procedure.id },
      include: {
        zone: {
          select: {
            id: true,
            name: true,
            type: true,
            floorPlan: {
              select: {
                id: true,
                name: true,
                venueId: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      procedure: completeProcedure,
      message: 'Emergency procedure created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating emergency procedure:', error);
    return NextResponse.json(
      { error: 'Failed to create emergency procedure' },
      { status: 500 }
    );
  }
}

// POST /api/zones/emergency/activate - Activate emergency procedure
async function POST_ACTIVATE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { procedureId, zoneId, emergencyType, severity, description, location } = body;

    // Validate required fields
    if (!procedureId && !zoneId) {
      return NextResponse.json({
        error: 'Either procedureId or zoneId is required'
      }, { status: 400 });
    }

    let procedure: any;
    if (procedureId) {
      // Get specific procedure
      procedure = await prisma.emergencyProcedure.findUnique({
        where: { id: procedureId },
        include: {
          zone: {
            include: {
              floorPlan: {
                include: { venue: true }
              }
            }
          }
        }
      });
    } else {
      // Find best matching procedure for zone and emergency type
      procedure = await prisma.emergencyProcedure.findFirst({
        where: {
          zoneId,
          procedureType: emergencyType,
          isActive: true
        },
        include: {
          zone: {
            include: {
              floorPlan: {
                include: { venue: true }
              }
            }
          }
        },
        orderBy: { priorityLevel: 'desc' }
      });
    }

    if (!procedure) {
      return NextResponse.json({ error: 'Emergency procedure not found' }, { status: 404 });
    }

    // Check access
    if (session.user.role === 'VENUE_ADMIN' && procedure.zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    // Activate emergency procedure with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create enhanced alert for the emergency
      const alert = await tx.enhancedAlert.create({
        data: {
          type: 'EMERGENCY_BROADCAST',
          subType: procedure.procedureType,
          title: `Emergency: ${procedure.name}`,
          description: description || `Emergency procedure activated for ${procedure.zone.name}`,
          severity: 'EMERGENCY',
          priority: 'URGENT',
          venueId: procedure.zone.floorPlan.venueId,
          floorPlanZoneId: procedure.zoneId,
          triggerData: {
            procedureId: procedure.id,
            emergencyType: procedure.procedureType,
            activatedBy: session.user.id,
            location
          },
          escalationLevel: 1,
          metadata: {
            emergencyActivation: true,
            procedure: {
              id: procedure.id,
              name: procedure.name,
              estimatedDuration: procedure.estimatedDuration,
              requiredPersonnel: procedure.requiredPersonnel
            }
          }
        }
      });

      // Generate incident number
      const year = new Date().getFullYear();
      const lastIncident = await tx.incidentReport.findFirst({
        where: { incidentNumber: { startsWith: `INC-${year}-` } },
        orderBy: { incidentNumber: 'desc' }
      });
      
      let incidentNumber: string;
      if (lastIncident) {
        const lastNumber = parseInt(lastIncident.incidentNumber.split('-')[2]);
        incidentNumber = `INC-${year}-${String(lastNumber + 1).padStart(4, '0')}`;
      } else {
        incidentNumber = `INC-${year}-0001`;
      }

      // Create incident report
      const incident = await tx.incidentReport.create({
        data: {
          incidentNumber,
          incidentType: mapEmergencyTypeToIncidentType(procedure.procedureType) as any,
          title: `Emergency: ${procedure.name}`,
          description: description || `Emergency procedure activated`,
          severity: 'CRITICAL',
          venueId: procedure.zone.floorPlan.venueId,
          zoneId: procedure.zoneId,
          reportedBy: session.user.id,
          location: location || procedure.zone.coordinates,
          involvedPersons: [],
          timeline: [
            {
              timestamp: new Date().toISOString(),
              event: 'Emergency procedure activated',
              performedBy: session.user.id
            }
          ],
          responseActions: {
            procedureActivated: procedure.name,
            activatedBy: session.user.id,
            activatedAt: new Date().toISOString()
          },
          incidentOccurredAt: new Date(),
          metadata: {
            emergencyProcedure: {
              id: procedure.id,
              name: procedure.name,
              type: procedure.procedureType
            },
            alertId: alert.id
          }
        }
      });

      // TODO: Trigger emergency notifications
      // TODO: Initiate evacuation routes if required
      // TODO: Contact emergency services if required
      // TODO: Activate communication protocols

      return { alert, incident, procedure };
    });

    return NextResponse.json({
      activated: true,
      procedure: result.procedure,
      alert: result.alert,
      incident: result.incident,
      message: 'Emergency procedure activated successfully',
      nextSteps: generateEmergencyNextSteps(result.procedure)
    });

  } catch (error) {
    console.error('Error activating emergency procedure:', error);
    return NextResponse.json(
      { error: 'Failed to activate emergency procedure' },
      { status: 500 }
    );
  }
}

// Helper functions
async function calculateEmergencyReadiness(procedures: any[]) {
  const total = procedures.length;
  if (total === 0) {
    return {
      readyCount: 0,
      readyPercentage: 0,
      issues: []
    };
  }

  let readyCount = 0;
  const issues = [];

  for (const proc of procedures) {
    let isReady = true;

    // Check if procedure needs review
    if (!proc.lastReviewed || (proc.nextReviewDate && proc.nextReviewDate < new Date())) {
      isReady = false;
      issues.push({
        procedureId: proc.id,
        procedureName: proc.name,
        issue: 'Procedure needs review',
        severity: 'MEDIUM'
      });
    }

    // Check if training is required but not documented
    if (proc.trainingRequired && (!proc.videoGuides || proc.videoGuides.length === 0)) {
      isReady = false;
      issues.push({
        procedureId: proc.id,
        procedureName: proc.name,
        issue: 'Training materials missing',
        severity: 'HIGH'
      });
    }

    // Check if documentation is missing
    if (!proc.documentation || proc.documentation.length === 0) {
      issues.push({
        procedureId: proc.id,
        procedureName: proc.name,
        issue: 'Missing documentation',
        severity: 'MEDIUM'
      });
    }

    if (isReady) readyCount++;
  }

  return {
    readyCount,
    readyPercentage: Math.round((readyCount / total) * 100),
    issues
  };
}

function mapEmergencyPriorityToAlertSeverity(priority: string): string {
  const mapping: { [key: string]: string } = {
    'IMMEDIATE': 'CRITICAL',
    'CRITICAL': 'CRITICAL', 
    'HIGH': 'HIGH',
    'MEDIUM': 'MEDIUM',
    'LOW': 'LOW'
  };
  return mapping[priority] || 'MEDIUM';
}

function mapEmergencyTypeToIncidentType(emergencyType: string): string {
  const mapping: { [key: string]: string } = {
    'FIRE': 'ENVIRONMENTAL_HAZARD',
    'MEDICAL_EMERGENCY': 'MEDICAL_EMERGENCY',
    'NATURAL_DISASTER': 'ENVIRONMENTAL_HAZARD',
    'SECURITY_THREAT': 'SECURITY_BREACH',
    'EVACUATION': 'EVACUATION',
    'MISSING_PERSON': 'MISSING_CHILD'
  };
  return mapping[emergencyType] || 'SECURITY_BREACH';
}

function mapEmergencyPriorityToIncidentSeverity(priority: string): string {
  const mapping: { [key: string]: string } = {
    'IMMEDIATE': 'CATASTROPHIC',
    'CRITICAL': 'CRITICAL',
    'HIGH': 'HIGH',
    'MEDIUM': 'MEDIUM',
    'LOW': 'LOW'
  };
  return mapping[priority] || 'MEDIUM';
}

function generateEmergencyNextSteps(procedure: any): string[] {
  const steps = [];
  
  // Add procedure-specific steps
  if (procedure.stepByStepGuide && typeof procedure.stepByStepGuide === 'object') {
    steps.push(...procedure.stepByStepGuide.steps || []);
  }
  
  // Add general emergency steps
  steps.push(
    'Ensure all staff are aware of the emergency',
    'Monitor emergency alert status',
    'Follow communication protocols',
    'Document all actions taken'
  );
  
  if (procedure.evacuationInstructions) {
    steps.push('Initiate evacuation procedures if required');
  }
  
  return steps;
}
