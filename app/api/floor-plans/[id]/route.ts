
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const updateFloorPlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
    scale: z.number().optional(),
  }).optional(),
  
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

    const floorPlan = await prisma.floorPlan.findUnique({
      where: { id: params.id },
      include: {
        venue: {
          select: { id: true, name: true, adminId: true }
        },
        uploader: {
          select: { id: true, name: true, email: true }
        },
        cameras: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            coordinates: true,
            orientation: true,
            coverageArea: true,
            coverageAreas: true,
            position: true,
            isActive: true
          }
        },
        zones: true
      }
    });

    if (!floorPlan) {
      return NextResponse.json({ error: 'Floor plan not found' }, { status: 404 });
    }

    // Check access permissions
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      floorPlan.venue.adminId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(floorPlan);
  } catch (error) {
    console.error('Error fetching floor plan:', error);
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

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const floorPlan = await prisma.floorPlan.findUnique({
      where: { id: params.id },
      include: { venue: true }
    });

    if (!floorPlan) {
      return NextResponse.json({ error: 'Floor plan not found' }, { status: 404 });
    }

    // Check access permissions
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      floorPlan.venue.adminId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateFloorPlanSchema.parse(body);

    const updatedFloorPlan = await prisma.floorPlan.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        uploader: {
          select: { id: true, name: true, email: true }
        },
        cameras: true,
        zones: true
      }
    });

    return NextResponse.json(updatedFloorPlan);
  } catch (error) {
    console.error('Error updating floor plan:', error);
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

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const floorPlan = await prisma.floorPlan.findUnique({
      where: { id: params.id },
      include: { venue: true }
    });

    if (!floorPlan) {
      return NextResponse.json({ error: 'Floor plan not found' }, { status: 404 });
    }

    // Check access permissions
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      floorPlan.venue.adminId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.floorPlan.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting floor plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
