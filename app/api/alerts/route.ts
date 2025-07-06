
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const venueId = searchParams.get('venueId');

    let where: any = {};

    if (session.user.role === "VENUE_ADMIN") {
      // Venue admins can only see alerts for their venue
      const venue = await prisma.venue.findFirst({
        where: { adminId: session.user.id },
        select: { id: true }
      });
      
      if (venue) {
        where.venueId = venue.id;
      }
    } else if (session.user.role === "PARENT") {
      // Parents can only see alerts for their children
      const userChildren = await prisma.child.findMany({
        where: { parentId: session.user.id },
        select: { id: true }
      });
      
      where.childId = {
        in: userChildren.map(child => child.id)
      };
    }

    if (status) {
      where.status = status;
    }

    if (venueId && session.user.role === "SUPER_ADMIN") {
      where.venueId = venueId;
    }

    const alerts = await prisma.alert.findMany({
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
