
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const createCameraSchema = z.object({
  name: z.string().min(1),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  ipAddress: z.string().optional(),
  streamUrl: z.string().url().optional(),
  venueId: z.string(),
  floorPlanId: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  viewAngle: z.number().min(0).max(360).optional(),
  viewDistance: z.number().min(0).optional(),
  rotation: z.number().min(0).max(360).optional(),
  height: z.number().min(0).optional(),
  specifications: z.record(z.any()).optional(),
  configuration: z.record(z.any()).optional(),
  isRecordingEnabled: z.boolean().optional(),
  isRecognitionEnabled: z.boolean().optional(),
  recognitionThreshold: z.number().min(0).max(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const floorPlanId = searchParams.get('floorPlanId');

    let whereClause: any = {};

    if (venueId) {
      whereClause.venueId = venueId;
      
      // Check access permissions
      const venue = await prisma.venue.findFirst({
        where: {
          id: venueId,
          OR: [
            { adminId: session.user.id },
            { admin: { role: 'SUPER_ADMIN' } }
          ]
        }
      });

      if (!venue && session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (floorPlanId) {
      whereClause.floorPlanId = floorPlanId;
    }

    const cameras = await prisma.camera.findMany({
      where: whereClause,
      include: {
        venue: {
          select: { id: true, name: true }
        },
        floorPlan: {
          select: { id: true, name: true }
        },
        coverageAreas: true,
        recognitionZones: true,
        cameraEvents: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(cameras);
  } catch (error) {
    console.error('Error fetching cameras:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const validatedData = createCameraSchema.parse(body);

    // Check if user has access to this venue
    const venue = await prisma.venue.findFirst({
      where: {
        id: validatedData.venueId,
        OR: [
          { adminId: session.user.id },
          { admin: { role: 'SUPER_ADMIN' } }
        ]
      }
    });

    if (!venue && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const camera = await prisma.camera.create({
      data: validatedData,
      include: {
        venue: {
          select: { id: true, name: true }
        },
        floorPlan: {
          select: { id: true, name: true }
        }
      }
    });

    // Log camera creation event
    await prisma.cameraEvent.create({
      data: {
        type: 'CONFIGURATION_CHANGED',
        description: 'Camera created and configured',
        severity: 'INFO',
        cameraId: camera.id,
        venueId: camera.venueId,
        metadata: {
          action: 'created',
          user: session.user.id
        }
      }
    });

    return NextResponse.json(camera, { status: 201 });
  } catch (error) {
    console.error('Error creating camera:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
