
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('🔍 Fetching memories for user:', session.user.id);

    // First, get user's children
    const userChildren = await prisma.child.findMany({
      where: {
        parentId: session.user.id
      },
      select: {
        id: true
      }
    });

    const childIds = userChildren.map(child => child.id);
    console.log('👶 User children IDs:', childIds);

    // If user has no children, return empty array
    if (childIds.length === 0) {
      console.log('ℹ️ User has no children, returning empty memories');
      return NextResponse.json([]);
    }

    // Fetch available memories for purchase ONLY for user's children
    const memories = await prisma.memory.findMany({
      where: {
        status: 'AVAILABLE', // Only show available memories as "memories to purchase"
        childId: {
          in: childIds // Only show memories for user's children
        }
      },
      include: {
        child: true, // Include child info to get name
        venue: true  // Include venue info to get name
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to recent memories
    });

    console.log('✅ Found unpurchased memories:', memories.length);

    // Transform data for frontend
    const transformedMemories = memories.map(memory => ({
      id: memory.id,
      childName: memory.child ? `${memory.child.firstName} ${memory.child.lastName}` : 'Unknown Child',
      type: memory.type || 'PHOTO',
      venue: memory.venue ? memory.venue.name : 'Unknown Venue',
      capturedAt: memory.capturedAt ? new Date(memory.capturedAt).toLocaleString() : 'Unknown Time',
      thumbnailUrl: memory.thumbnailUrl || "https://i.pinimg.com/originals/0d/da/2a/0dda2a030fa1fc656aaf681644cbde64.jpg",
      price: memory.price || 2.99,
      purchased: memory.status === 'PURCHASED'
    }));

    return NextResponse.json(transformedMemories);
  } catch (error) {
    console.error("Error fetching memories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { childId, venueId, type, price, thumbnailUrl, fileName, fileUrl } = await request.json();

    // Validate required fields
    if (!childId || !venueId || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: "Child ID, venue ID, file name, and file URL are required" },
        { status: 400 }
      );
    }

    // Create new memory
    const memory = await prisma.memory.create({
      data: {
        type: type || 'PHOTO',
        fileName,
        fileUrl,
        thumbnailUrl: thumbnailUrl || null,
        price: price || 2.99,
        status: 'AVAILABLE',
        capturedAt: new Date(),
        childId,
        venueId
      },
      include: {
        child: true,
        venue: true
      }
    });

    console.log('✅ Created memory:', memory.id);

    // Return transformed memory data
    const transformedMemory = {
      id: memory.id,
      childName: memory.child ? `${memory.child.firstName} ${memory.child.lastName}` : 'Unknown Child',
      type: memory.type,
      venue: memory.venue ? memory.venue.name : 'Unknown Venue',
      capturedAt: new Date(memory.capturedAt).toLocaleString(),
      thumbnailUrl: memory.thumbnailUrl || "https://cdn.pixabay.com/photo/2014/04/29/17/43/children-playing-334531_960_720.jpg",
      price: memory.price,
      purchased: memory.status === 'PURCHASED'
    };

    return NextResponse.json(transformedMemory);
  } catch (error) {
    console.error("Error creating memory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
