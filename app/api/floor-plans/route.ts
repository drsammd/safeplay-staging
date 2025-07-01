
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const createFloorPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  fileType: z.enum(['DWG', 'PDF', 'PNG', 'JPG', 'JPEG', 'SVG']),
  originalFileName: z.string(),
  fileSize: z.number(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
    scale: z.number().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  venueId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 });
    }

    // Check if user has access to this venue
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        OR: [
          { adminId: session.user.id },
          { admin: { role: 'COMPANY_ADMIN' } }
        ]
      }
    });

    if (!venue && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const floorPlans = await prisma.floorPlan.findMany({
      where: { venueId },
      include: {
        uploader: {
          select: { id: true, name: true, email: true }
        },
        cameras: {
          select: { id: true, name: true, status: true, position: true }
        },
        zones: {
          select: { id: true, name: true, type: true, color: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(floorPlans);
  } catch (error) {
    console.error('Error fetching floor plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const validatedData = createFloorPlanSchema.parse(body);

    // Check if user has access to this venue
    const venue = await prisma.venue.findFirst({
      where: {
        id: validatedData.venueId,
        OR: [
          { adminId: session.user.id },
          { admin: { role: 'COMPANY_ADMIN' } }
        ]
      }
    });

    if (!venue && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Deactivate previous floor plans if this is set as active
    await prisma.floorPlan.updateMany({
      where: { venueId: validatedData.venueId, isActive: true },
      data: { isActive: false }
    });

    const floorPlan = await prisma.floorPlan.create({
      data: {
        ...validatedData,
        uploadedBy: session.user.id,
        isActive: true,
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(floorPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating floor plan:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
