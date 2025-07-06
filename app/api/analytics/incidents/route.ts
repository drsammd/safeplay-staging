
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const incidentReportSchema = z.object({
  title: z.string(),
  description: z.string(),
  incidentType: z.enum([
    'INJURY', 'MEDICAL_EMERGENCY', 'MISSING_CHILD', 'UNAUTHORIZED_ACCESS',
    'EQUIPMENT_FAILURE', 'SECURITY_BREACH', 'EVACUATION', 'BEHAVIORAL_INCIDENT',
    'PROPERTY_DAMAGE', 'ENVIRONMENTAL_HAZARD', 'SYSTEM_FAILURE', 'STAFF_INCIDENT',
    'PARENT_COMPLAINT', 'SAFETY_VIOLATION', 'REGULATORY_ISSUE', 'OTHER'
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'CATASTROPHIC']).optional(),
  venueId: z.string(),
  childId: z.string().optional(),
  assignedTo: z.string().optional(),
  location: z.any().optional(),
  zoneId: z.string().optional(),
  cameraId: z.string().optional(),
  involvedPersons: z.any(),
  witnesses: z.any().optional(),
  evidenceUrls: z.array(z.string()).optional(),
  timeline: z.any(),
  incidentOccurredAt: z.string().datetime(),
  rootCause: z.string().optional(),
  contributingFactors: z.any().optional(),
  responseActions: z.any().optional(),
  preventiveActions: z.any().optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().datetime().optional(),
  followUpNotes: z.string().optional(),
  regulatoryNotification: z.boolean().optional(),
  insuranceClaim: z.boolean().optional(),
  parentNotified: z.boolean().optional(),
  authorityNotified: z.boolean().optional(),
  metadata: z.any().optional()
});

// POST /api/analytics/incidents - Create incident report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = incidentReportSchema.parse(body);

    // Verify venue access
    const venue = await prisma.venue.findFirst({
      where: {
        id: data.venueId,
        OR: [
          { adminId: session.user.id },
          session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' }
        ]
      } as any
    });

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 404 });
    }

    // Generate unique incident number
    const year = new Date().getFullYear();
    const lastIncident = await prisma.incidentReport.findFirst({
      where: {
        incidentNumber: {
          startsWith: `INC-${year}-`
        } as any
      },
      orderBy: { incidentNumber: 'desc' }
    });

    let incidentNumber;
    if (lastIncident) {
      const lastNumber = parseInt(lastIncident.incidentNumber.split('-')[2]);
      incidentNumber = `INC-${year}-${String(lastNumber + 1).padStart(4, '0')}`;
    } else {
      incidentNumber = `INC-${year}-0001`;
    }

    const incident = await prisma.incidentReport.create({
      data: {
        ...data,
        incidentNumber,
        reportedBy: session.user.id,
        incidentOccurredAt: new Date(data.incidentOccurredAt),
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        evidenceUrls: data.evidenceUrls || [],
        severity: data.severity || 'MEDIUM',
        status: 'REPORTED',
        involvedPersons: data.involvedPersons || [],
        timeline: data.timeline || [],
        responseActions: data.responseActions || {}
      } as any
    });

    // Log analytics event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'INCIDENT_REPORTED',
        category: 'SAFETY',
        description: `Incident reported: ${data.title}`,
        venueId: data.venueId,
        childId: data.childId,
        userId: session.user.id,
        metadata: {
          incidentId: incident.id,
          incidentType: data.incidentType,
          severity: data.severity || 'MEDIUM'
        },
        
      } as any
    });

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error creating incident report:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/analytics/incidents - Get incident reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const incidentType = searchParams.get('incidentType');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
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
        } as any
      });

      if (!venue) {
        return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 404 });
      } as any

      where.venueId = venueId;
    } else if (session.user.role !== 'SUPER_ADMIN') {
      // Non-admin users can only see their venue incidents
      const userVenues = await prisma.venue.findMany({
        where: { adminId: session.user.id },
        select: { id: true }
      });
      where.venueId = { in: userVenues.map(v => v.id) };
    }

    if (incidentType) where.incidentType = incidentType;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.incidentOccurredAt = {};
      if (startDate) where.incidentOccurredAt.gte = new Date(startDate);
      if (endDate) where.incidentOccurredAt.lte = new Date(endDate);
    }

    const [incidents, total] = await Promise.all([
      prisma.incidentReport.findMany({
        where,
        include: {
          venue: { select: { name: true } },
          child: { select: { firstName: true, lastName: true } },
          reporter: { select: { name: true } },
          assignee: { select: { name: true } },
          zone: { select: { name: true } },
          camera: { select: { name: true } }
        },
        orderBy: { incidentOccurredAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.incidentReport.count({ where })
    ]);

    return NextResponse.json({
      incidents,
      total,
      limit,
      offset,
      hasMore: offset + incidents.length < total
    });
  } catch (error) {
    console.error('Error fetching incident reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/analytics/incidents/[id] - Update incident report
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const incidentId = url.pathname.split('/').pop();
    
    if (!incidentId) {
      return NextResponse.json({ error: 'Incident ID required' }, { status: 400 });
    }

    const body = await request.json();
    const updateData = incidentReportSchema.partial().parse(body);

    // Find existing incident and verify access
    const existingIncident = await prisma.incidentReport.findFirst({
      where: {
        id: incidentId,
        venue: {
          OR: [
            { adminId: session.user.id },
            session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' }
          ]
        } as any
      } as any
    });

    if (!existingIncident) {
      return NextResponse.json({ error: 'Incident not found or access denied' }, { status: 404 });
    }

    const incident = await prisma.incidentReport.update({
      where: { id: incidentId },
      data: {
        ...updateData,
        incidentOccurredAt: updateData.incidentOccurredAt ? new Date(updateData.incidentOccurredAt) : undefined,
        followUpDate: updateData.followUpDate ? new Date(updateData.followUpDate) : undefined
      } as any
    });

    // Log analytics event for status changes
    if ((updateData as any).status && (updateData as any).status !== (existingIncident as any).status) {
      await prisma.analyticsEvent.create({
        data: {
          eventType: (updateData as any).status === 'RESOLVED' ? 'INCIDENT_RESOLVED' : 'USER_ACTION',
          category: 'OPERATIONAL',
          description: `Incident status changed to ${(updateData as any).status}`,
          venueId: existingIncident.venueId,
          userId: session.user.id,
          metadata: {
            incidentId: incident.id,
            oldStatus: (existingIncident as any).status,
            newStatus: (updateData as any).status
          },
          
        } as any
      });
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error updating incident report:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
