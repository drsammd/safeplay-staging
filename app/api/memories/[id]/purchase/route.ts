
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memoryId = params.id;

    // Verify the memory exists and belongs to the user's child
    const memory = await prisma.memory.findFirst({
      where: {
        id: memoryId,
        child: {
          parentId: session.user.id
        }
      },
      include: {
        child: true,
        venue: true
      }
    });

    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    if (memory.status === "PURCHASED") {
      return NextResponse.json({ error: "Memory already purchased" }, { status: 400 });
    }

    // In a real implementation, this would integrate with a payment processor
    // For demo purposes, we'll simulate a successful purchase
    const updatedMemory = await prisma.memory.update({
      where: { id: memoryId },
      data: {
        status: "PURCHASED",
        purchaserId: session.user.id,
        purchasedAt: new Date(),
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
        }
      }
    });

    return NextResponse.json({
      message: "Memory purchased successfully",
      memory: updatedMemory
    });
  } catch (error) {
    console.error("Error purchasing memory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
