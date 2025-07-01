
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../lib/db';
import { friendshipDetectionService } from '../../../../lib/services/friendship-detection-service';

// GET /api/messaging/friendships - Get child friendships and recommendations
export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const includeRecommendations = searchParams.get('recommendations') === 'true';

    if (!childId) {
      return NextResponse.json(
        { error: 'childId is required' },
        { status: 400 }
      );
    }

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: session.user.id,
      },
    });

    if (!child) {
      return NextResponse.json({ error: 'Child not found or access denied' }, { status: 404 });
    }

    // Get existing friendships
    const friendships = await prisma.childFriendship.findMany({
      where: {
        OR: [
          { child1Id: childId },
          { child2Id: childId },
        ],
      },
      include: {
        child1: {
          include: { parent: { select: { id: true, name: true } } },
        },
        child2: {
          include: { parent: { select: { id: true, name: true } } },
        },
        interactions: {
          orderBy: { detectedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { lastInteractionAt: 'desc' },
    });

    const formattedFriendships = friendships.map(friendship => {
      const friend = friendship.child1Id === childId ? friendship.child2 : friendship.child1;
      
      return {
        id: friendship.id,
        friend: {
          id: friend.id,
          name: `${friend.firstName} ${friend.lastName}`,
          parent: friend.parent,
        },
        status: friendship.status,
        confidenceScore: friendship.confidenceScore,
        interactionCount: friendship.interactionCount,
        totalInteractionTime: friendship.totalInteractionTime,
        lastInteractionAt: friendship.lastInteractionAt,
        sharedActivities: friendship.sharedActivities,
        recentInteractions: friendship.interactions,
        detectedAt: friendship.detectedAt,
        confirmedAt: friendship.confirmedAt,
      };
    });

    let recommendations: any[] = [];
    if (includeRecommendations) {
      recommendations = await friendshipDetectionService.getFriendshipRecommendations(
        childId,
        5
      );
    }

    return NextResponse.json({
      success: true,
      friendships: formattedFriendships,
      recommendations: includeRecommendations ? recommendations : undefined,
    });
  } catch (error: any) {
    console.error('Error getting friendships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messaging/friendships - Analyze child interaction for friendship detection
export async function POST(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { child1Id, child2Id, interactionType, duration, location, metadata } = body;

    if (!child1Id || !child2Id || !interactionType || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: child1Id, child2Id, interactionType, duration' },
        { status: 400 }
      );
    }

    // Verify user has access to at least one of the children
    const userChildren = await prisma.child.findMany({
      where: {
        parentId: session.user.id,
        id: { in: [child1Id, child2Id] },
      },
    });

    if (userChildren.length === 0) {
      return NextResponse.json({ error: 'Access denied to children' }, { status: 403 });
    }

    // Analyze the interaction
    const result = await friendshipDetectionService.analyzeChildInteraction({
      child1Id,
      child2Id,
      interactionType,
      duration,
      location,
      timestamp: new Date(),
      metadata,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error analyzing child interaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
