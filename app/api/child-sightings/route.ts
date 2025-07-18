
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
// SightingType removed as it doesn't exist in schema

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const venueId = searchParams.get('venueId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sightingType = searchParams.get('sightingType');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let where: any = {};

    // Role-based access control
    if (session.user.role === "VENUE_ADMIN") {
      const venue = await prisma.venue.findFirst({
        where: { adminId: session.user.id },
        select: { id: true }
      });
      
      if (venue) {
        where.venueId = venue.id;
      } else {
        return NextResponse.json({ sightings: [], total: 0 });
      }
    } else if (session.user.role === "PARENT") {
      const userChildren = await prisma.child.findMany({
        where: { parentId: session.user.id },
        select: { id: true }
      });
      
      where.childId = {
        in: userChildren.map(child => child.id)
      };
    }

    // Apply filters
    if (childId) {
      // Verify access to this child
      if (session.user.role === "PARENT") {
        const child = await prisma.child.findFirst({
          where: { 
            id: childId,
            parentId: session.user.id 
          }
        });
        if (!child) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
      where.childId = childId;
    }

    if (venueId && session.user.role === "SUPER_ADMIN") {
      where.venueId = venueId;
    }

    if (startDate) {
      where.timestamp = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.timestamp = { 
        ...where.timestamp,
        lte: new Date(endDate) 
      };
    }

    if (sightingType) {
      where.sightingType = sightingType;
    }

    // Get total count
    const total = await prisma.childSighting.count({ where });

    // Get sightings with relations
    const sightings = await prisma.childSighting.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
          }
        },
        zone: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        recognitionEvent: {
          select: {
            id: true,
            eventType: true,
            confidence: true,
            recognitionData: true,
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });

    return NextResponse.json({
      sightings,
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error("Error fetching child sightings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only system/admin users can create sightings directly
    if (session.user.role === "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.childId || !data.venueId || data.confidence === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: childId, venueId, confidence" },
        { status: 400 }
      );
    }

    // Verify venue access for venue admins
    if (session.user.role === "VENUE_ADMIN") {
      const venue = await prisma.venue.findFirst({
        where: { 
          adminId: session.user.id,
          id: data.venueId 
        }
      });
      
      if (!venue) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Create the sighting
    const sighting = await prisma.childSighting.create({
      data: {
        childId: data.childId as string,
        venueId: data.venueId as string,
        floorPlanZoneId: data.floorPlanZoneId as string || null,
        position: data.position || null,
        confidence: data.confidence as number,
        boundingBox: data.boundingBox || null,
        imageUrl: data.imageUrl as string || null,
        imageKey: data.imageKey as string || null,
        recognitionEventId: data.recognitionEventId as string || null,
        sightingType: data.sightingType as string || 'DETECTED',
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      } as any,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
          }
        },
        zone: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      }
    });

    // TODO: Trigger real-time updates and alert checking

    return NextResponse.json(sighting, { status: 201 });
  } catch (error) {
    console.error("Error creating child sighting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
