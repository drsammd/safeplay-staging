
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EnhancedAlertType, NotificationChannel } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const alertType = searchParams.get('alertType') as EnhancedAlertType | null;
    const isActive = searchParams.get('isActive');

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
        return NextResponse.json({ rules: [] });
      }
    } else if (session.user.role === "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Apply filters
    if (venueId && session.user.role === "COMPANY_ADMIN") {
      where.venueId = venueId;
    }

    if (alertType) {
      where.alertType = alertType;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const rules = await prisma.alertRule.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: [
        { alertType: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Error fetching alert rules:", error);
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

    // Only admins can create alert rules
    if (session.user.role === "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.alertType || !data.venueId) {
      return NextResponse.json(
        { error: "Missing required fields: name, alertType, venueId" },
        { status: 400 }
      );
    }

    // Role-based validation
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

    // Validate notification channels
    if (data.notificationChannels && Array.isArray(data.notificationChannels)) {
      const validChannels = Object.values(NotificationChannel);
      const invalidChannels = data.notificationChannels.filter(
        (channel: string) => !validChannels.includes(channel as NotificationChannel)
      );
      
      if (invalidChannels.length > 0) {
        return NextResponse.json(
          { error: `Invalid notification channels: ${invalidChannels.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const rule = await prisma.alertRule.create({
      data: {
        name: data.name,
        description: data.description,
        alertType: data.alertType,
        venueId: data.venueId,
        isActive: data.isActive !== false, // Default to true
        conditions: data.conditions || {},
        thresholds: data.thresholds || {},
        escalationRules: data.escalationRules || {},
        notificationChannels: data.notificationChannels || [NotificationChannel.IN_APP],
        metadata: data.metadata,
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating alert rule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
