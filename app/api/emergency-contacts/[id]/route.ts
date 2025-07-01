
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contactId = params.id;

    const contact = await prisma.emergencyContact.findUnique({
      where: { id: contactId },
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

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Role-based access control
    if (session.user.role === "PARENT") {
      // Parents can only see their own contacts or contacts for their children
      const hasAccess = contact.userId === session.user.id || 
        (contact.child && await prisma.child.findFirst({
          where: { 
            id: contact.child.id,
            parentId: session.user.id 
          }
        }));
      
      if (!hasAccess) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "VENUE_ADMIN") {
      // Venue admins can see venue contacts and child contacts for their venue
      if (contact.venue) {
        const venue = await prisma.venue.findFirst({
          where: { 
            adminId: session.user.id,
            id: contact.venue.id 
          }
        });
        if (!venue) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } else if (contact.child) {
        // Check if child is at their venue
        const child = await prisma.child.findFirst({
          where: { 
            id: contact.child.id,
            currentVenue: {
              adminId: session.user.id
            }
          }
        });
        if (!child) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching emergency contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contactId = params.id;
    const data = await request.json();

    // Get existing contact
    const existingContact = await prisma.emergencyContact.findUnique({
      where: { id: contactId },
      include: {
        child: true,
        venue: true
      }
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Role-based access control (same as GET)
    if (session.user.role === "PARENT") {
      const hasAccess = existingContact.userId === session.user.id || 
        (existingContact.child && await prisma.child.findFirst({
          where: { 
            id: existingContact.child.id,
            parentId: session.user.id 
          }
        }));
      
      if (!hasAccess) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "VENUE_ADMIN") {
      if (existingContact.venue) {
        const venue = await prisma.venue.findFirst({
          where: { 
            adminId: session.user.id,
            id: existingContact.venue.id 
          }
        });
        if (!venue) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
    }

    // Handle primary contact logic
    if (data.isPrimary && data.isPrimary !== existingContact.isPrimary) {
      const updateWhere: any = { isPrimary: true };
      
      if (existingContact.childId) {
        updateWhere.childId = existingContact.childId;
      } else if (existingContact.venueId) {
        updateWhere.venueId = existingContact.venueId;
      } else if (existingContact.userId) {
        updateWhere.userId = existingContact.userId;
      }
      
      await prisma.emergencyContact.updateMany({
        where: updateWhere,
        data: { isPrimary: false }
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.relationship !== undefined) updateData.relationship = data.relationship;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.isPrimary !== undefined) updateData.isPrimary = data.isPrimary;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.availableHours !== undefined) updateData.availableHours = data.availableHours;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedContact = await prisma.emergencyContact.update({
      where: { id: contactId },
      data: updateData,
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

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error("Error updating emergency contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contactId = params.id;

    // Get existing contact
    const existingContact = await prisma.emergencyContact.findUnique({
      where: { id: contactId },
      include: {
        child: true,
        venue: true
      }
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Role-based access control (same as GET)
    if (session.user.role === "PARENT") {
      const hasAccess = existingContact.userId === session.user.id || 
        (existingContact.child && await prisma.child.findFirst({
          where: { 
            id: existingContact.child.id,
            parentId: session.user.id 
          }
        }));
      
      if (!hasAccess) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "VENUE_ADMIN") {
      if (existingContact.venue) {
        const venue = await prisma.venue.findFirst({
          where: { 
            adminId: session.user.id,
            id: existingContact.venue.id 
          }
        });
        if (!venue) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
    }

    await prisma.emergencyContact.delete({
      where: { id: contactId }
    });

    return NextResponse.json({ message: "Emergency contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting emergency contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
