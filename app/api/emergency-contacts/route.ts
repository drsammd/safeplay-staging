
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
// EmergencyContactType enum removed as it doesn't exist in schema

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
    const contactType = searchParams.get('contactType') as EmergencyContactType | null;

    let where: any = {
      isActive: true
    };

    // Role-based access control
    if (session.user.role === "PARENT") {
      // Parents can only see their own emergency contacts
      const userChildren = await prisma.child.findMany({
        where: { parentId: session.user.id },
        select: { id: true }
      });
      
      where.OR = [
        { userId: session.user.id },
        { childId: { in: userChildren.map(child => child.id) } }
      ];
    } else if (session.user.role === "VENUE_ADMIN") {
      // Venue admins can see venue staff contacts and child contacts for their venue
      const venue = await prisma.venue.findFirst({
        where: { adminId: session.user.id },
        select: { id: true }
      });
      
      if (venue) {
        where.OR = [
          { venueId: venue.id },
          { child: { currentVenueId: venue.id } }
        ];
      } else {
        return NextResponse.json({ contacts: [] });
      }
    }

    // Apply filters
    if (childId) {
      if (session.user.role === "PARENT") {
        // Verify parent owns this child
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

    if (venueId && session.user.role !== "PARENT") {
      where.venueId = venueId;
    }

    if (contactType) {
      where.contactType = contactType;
    }

    const contacts = await prisma.emergencyContact.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Error fetching emergency contacts:", error);
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

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.relationship || !data.phoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields: name, relationship, phoneNumber" },
        { status: 400 }
      );
    }

    // Role-based validation
    if (session.user.role === "PARENT") {
      // Parents can only create contacts for their children
      if (data.childId) {
        const child = await prisma.child.findFirst({
          where: { 
            id: data.childId,
            parentId: session.user.id 
          }
        });
        if (!child) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } else {
        // Set the parent as the user for personal contacts
        data.userId = session.user.id;
      }
    } else if (session.user.role === "VENUE_ADMIN") {
      // Venue admins can create venue staff contacts
      if (data.venueId) {
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
    }

    // Handle primary contact logic
    if (data.isPrimary) {
      // Unset other primary contacts for the same context
      const updateWhere: any = { isPrimary: true };
      
      if (data.childId) {
        updateWhere.childId = data.childId;
      } else if (data.venueId) {
        updateWhere.venueId = data.venueId;
      } else if (data.userId) {
        updateWhere.userId = data.userId;
      }
      
      await prisma.emergencyContact.updateMany({
        where: updateWhere,
        data: { isPrimary: false }
      });
    }

    const contact = await prisma.emergencyContact.create({
      data: {
        name: data.name,
        relationship: data.relationship,
        phone: data.phoneNumber,
        email: data.email,
        isPrimary: data.isPrimary || false,
        availability: data.availableHours,
        childId: data.childId,
        venueId: data.venueId,
        userId: data.userId,
        // contactType field removed as it doesn't exist in schema
        
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      }
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating emergency contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
