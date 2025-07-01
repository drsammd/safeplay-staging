
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const updateCameraSchema = z.object({
  name: z.string().min(1).optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  ipAddress: z.string().optional(),
  streamUrl: z.string().url().optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR', 'INACTIVE']).optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const camera = await prisma.camera.findUnique({
      where: { id: params.id },
      include: {
        venue: {
          select: { id: true, name: true, adminId: true }
        },
        floorPlan: {
          select: { id: true, name: true, fileUrl: true }
        },
        coverageAreas: true,
        recognitionZones: true,
        cameraEvents: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }

    // Check access permissions
    if (
      session.user.role !== 'COMPANY_ADMIN' &&
      camera.venue.adminId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(camera);
  } catch (error) {
    console.error('Error fetching camera:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const camera = await prisma.camera.findUnique({
      where: { id: params.id },
      include: { venue: true }
    });

    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }

    // Check access permissions
    if (
      session.user.role !== 'COMPANY_ADMIN' &&
      camera.venue.adminId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateCameraSchema.parse(body);

    const updatedCamera = await prisma.camera.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        lastPing: validatedData.status === 'ONLINE' ? new Date() : camera.lastPing
      },
      include: {
        venue: {
          select: { id: true, name: true }
        },
        floorPlan: {
          select: { id: true, name: true }
        },
        coverageAreas: true,
        recognitionZones: true
      }
    });

    // Log camera update event
    await prisma.cameraEvent.create({
      data: {
        type: 'CONFIGURATION_CHANGED',
        description: 'Camera configuration updated',
        severity: 'INFO',
        cameraId: camera.id,
        venueId: camera.venueId,
        metadata: {
          action: 'updated',
          user: session.user.id,
          changes: validatedData
        }
      }
    });

    return NextResponse.json(updatedCamera);
  } catch (error) {
    console.error('Error updating camera:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const camera = await prisma.camera.findUnique({
      where: { id: params.id },
      include: { venue: true }
    });

    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }

    // Check access permissions
    if (
      session.user.role !== 'COMPANY_ADMIN' &&
      camera.venue.adminId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.camera.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting camera:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
