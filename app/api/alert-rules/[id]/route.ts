
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

    const ruleId = params.id;

    const rule = await prisma.alertRule.findUnique({
      where: { id: ruleId },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            adminId: true,
          }
        }
      }
    });

    if (!rule) {
      return NextResponse.json({ error: "Alert rule not found" }, { status: 404 });
    }

    // Role-based access control
    if (session.user.role === "VENUE_ADMIN") {
      if (rule.venue.adminId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error fetching alert rule:", error);
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

    const ruleId = params.id;
    const data = await request.json();

    // Get existing rule
    const existingRule = await prisma.alertRule.findUnique({
      where: { id: ruleId },
      include: {
        venue: {
          select: {
            adminId: true
          }
        }
      }
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Alert rule not found" }, { status: 404 });
    }

    // Role-based access control
    if (session.user.role === "VENUE_ADMIN") {
      if (existingRule.venue.adminId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.conditions !== undefined) updateData.conditions = data.conditions;
    if (data.thresholds !== undefined) updateData.thresholds = data.thresholds;
    if (data.escalationRules !== undefined) updateData.escalationRules = data.escalationRules;
    if (data.notificationChannels !== undefined) updateData.notificationChannels = data.notificationChannels;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const updatedRule = await prisma.alertRule.update({
      where: { id: ruleId },
      data: updateData,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error("Error updating alert rule:", error);
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

    const ruleId = params.id;

    // Get existing rule
    const existingRule = await prisma.alertRule.findUnique({
      where: { id: ruleId },
      include: {
        venue: {
          select: {
            adminId: true
          }
        }
      }
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Alert rule not found" }, { status: 404 });
    }

    // Role-based access control
    if (session.user.role === "VENUE_ADMIN") {
      if (existingRule.venue.adminId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.alertRule.delete({
      where: { id: ruleId }
    });

    return NextResponse.json({ message: "Alert rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting alert rule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
