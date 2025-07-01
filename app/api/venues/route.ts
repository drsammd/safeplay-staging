
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const venues = await prisma.venue.findMany({
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            children: true,
            memories: true,
            alerts: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(venues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      adminId,
      capacity,
      ageGroups,
      operatingHours,
      cameraConfig,
      alertSettings
    } = body;

    const venue = await prisma.venue.create({
      data: {
        name,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        adminId,
        capacity: parseInt(capacity),
        ageGroups: ageGroups || [],
        operatingHours: operatingHours || {},
        cameraConfig: cameraConfig || {},
        alertSettings: alertSettings || {},
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(venue);
  } catch (error) {
    console.error("Error creating venue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
