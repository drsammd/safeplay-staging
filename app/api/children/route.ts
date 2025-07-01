
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

    console.log('🔍 Fetching children for user:', session.user.id);

    // Fetch user's children from database
    const children = await prisma.child.findMany({
      where: {
        parentId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('✅ Found children:', children.length);

    // Transform data for frontend
    const transformedChildren = children.map(child => {
      const currentDate = new Date();
      const birthDate = new Date(child.dateOfBirth);
      const age = currentDate.getFullYear() - birthDate.getFullYear();
      
      return {
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        age: age,
        status: "CHECKED_OUT", // Default status for now
        venue: null,
        checkInTime: null,
        profilePhoto: child.profilePhoto || "https://i.pinimg.com/originals/88/ed/d8/88edd897f7ed1ef75a69a5f6f6815c12.jpg",
        faceRecognitionEnabled: child.faceRecognitionEnabled || false,
        registeredFaces: 0
      };
    });

    return NextResponse.json(transformedChildren);
  } catch (error) {
    console.error("Error fetching children:", error);
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

    const { firstName, lastName, dateOfBirth, profilePhoto } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth) {
      return NextResponse.json(
        { error: "First name, last name, and date of birth are required" },
        { status: 400 }
      );
    }

    // Create new child
    const child = await prisma.child.create({
      data: {
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        profilePhoto: profilePhoto || null,
        parentId: session.user.id
      }
    });

    console.log('✅ Created child:', child.id);

    // Return transformed child data
    const currentDate = new Date();
    const birthDate = new Date(child.dateOfBirth);
    const age = currentDate.getFullYear() - birthDate.getFullYear();
    
    const transformedChild = {
      id: child.id,
      name: `${child.firstName} ${child.lastName}`,
      age: age,
      status: "CHECKED_OUT",
      venue: null,
      checkInTime: null,
      profilePhoto: child.profilePhoto || "https://i.pinimg.com/originals/eb/49/16/eb4916ee3b51ce01ba06d7cbd6254600.jpg",
      faceRecognitionEnabled: child.faceRecognitionEnabled || false,
      registeredFaces: 0
    };

    return NextResponse.json(transformedChild);
  } catch (error) {
    console.error("Error creating child:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
