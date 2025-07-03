
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { enhancedRekognitionService } from '@/lib/aws/rekognition-service';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, venueId, threshold = 80 } = body;

    if (!imageUrl || !venueId) {
      return NextResponse.json(
        { error: 'Image URL and venue ID are required' },
        { status: 400 }
      );
    }

    // Verify venue access
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        OR: [
          { adminId: session.user.id },
          { children: { some: { parentId: session.user.id } } }
        ]
      }
    });

    if (!venue) {
      return NextResponse.json({ error: 'Access denied to venue' }, { status: 403 });
    }

    // Get children with face recognition enabled
    const children = await prisma.child.findMany({
      where: {
        currentVenueId: venueId,
        faceRecognitionEnabled: true,
        biometricId: { not: null }
      },
      include: {
        faceCollection: {
          select: { id: true }
        }
      }
    });

    if (children.length === 0) {
      return NextResponse.json({
        success: true,
        matches: [],
        message: 'No children with face recognition enabled found in venue'
      });
    }

    const recognitionResults = [];

    // Search for each child in their face collection
    for (const child of children) {
      if (!child.faceCollection) continue;

      try {
        const searchResult = await enhancedRekognitionService.searchFacesByImage(
          imageUrl,
          child.faceCollection.id,
          threshold
        );

        if (searchResult.success && searchResult.detections) {
          for (const detection of searchResult.detections) {
            if (detection.confidence >= threshold) {
              recognitionResults.push({
                childId: child.id,
                childName: `${child.firstName} ${child.lastName}`,
                confidence: detection.confidence,
                boundingBox: detection.boundingBox,
                collectionId: child.faceCollection.id
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error recognizing child ${child.id}:`, error);
        // Continue with other children
      }
    }

    // Sort by confidence (highest first)
    recognitionResults.sort((a, b) => b.confidence - a.confidence);

    // Remove duplicates (same child detected multiple times)
    const uniqueResults = recognitionResults.reduce((acc: any[], current) => {
      const existing = acc.find(item => item.childId === current.childId);
      if (!existing || current.confidence > existing.confidence) {
        return [...acc.filter(item => item.childId !== current.childId), current];
      }
      return acc;
    }, []);

    // Create recognition events for successful matches - fix field names
    for (const match of uniqueResults) {
      try {
        await prisma.faceRecognitionEvent.create({
          data: {
            childId: match.childId,
            venueId,
            sourceImageUrl: imageUrl, // Fixed: use sourceImageUrl instead of imageUrl
            sourceImageKey: imageUrl, // Use imageUrl as key for now
            confidence: match.confidence,
            boundingBox: match.boundingBox,
            eventType: 'FACE_MATCHED', // Fixed: use eventType instead of recognitionType
            recognitionData: {
              threshold,
              collectionId: match.collectionId,
              matchedAt: new Date().toISOString()
            }
          }
        });
      } catch (error) {
        console.error('Error creating recognition event:', error);
        // Continue processing
      }
    }

    // Enhanced face analysis for additional insights
    const enhancedAnalysis = await enhancedRekognitionService.performEnhancedFacialAnalysis(imageUrl);

    // Process results with additional face information
    const processedMatches = uniqueResults.map((match: any) => {
      const result: any = {
        childId: match.childId,
        childName: match.childName,
        confidence: match.confidence,
        boundingBox: match.boundingBox,
        recognitionTimestamp: new Date().toISOString()
      };

      // Add enhanced analysis if available
      if (enhancedAnalysis.success && enhancedAnalysis.analysis) {
        result.enhancedData = {
          ageRange: enhancedAnalysis.analysis.ageRange,
          emotions: enhancedAnalysis.analysis.emotions,
          attributes: enhancedAnalysis.analysis.attributes
        };
      }

      return result;
    });

    return NextResponse.json({
      success: true,
      matches: processedMatches,
      statistics: {
        totalMatches: processedMatches.length,
        averageConfidence: processedMatches.length > 0 
          ? processedMatches.reduce((sum: number, match: any) => sum + match.confidence, 0) / processedMatches.length 
          : 0,
        highConfidenceMatches: processedMatches.filter((match: any) => match.confidence >= 90).length
      },
      metadata: {
        imageUrl,
        venueId,
        threshold,
        timestamp: new Date().toISOString(),
        childrenSearched: children.length
      }
    });

  } catch (error) {
    console.error('Error in face recognition:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const childId = searchParams.get('childId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!venueId) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = { venueId };
    if (childId) {
      where.childId = childId;
    }

    // Get recognition events - fix field references
    const events = await prisma.faceRecognitionEvent.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }, // Fixed: use createdAt instead of timestamp
      skip: offset,
      take: limit
    });

    const totalCount = await prisma.faceRecognitionEvent.count({ where });

    return NextResponse.json({
      success: true,
      events: events.map(event => ({
        id: event.id,
        childId: event.childId,
        childName: event.child ? `${event.child.firstName} ${event.child.lastName}` : 'Unknown', // Fixed: child relation exists
        childPhoto: event.child?.profilePhoto,
        confidence: event.confidence,
        boundingBox: event.boundingBox,
        imageUrl: event.sourceImageUrl, // Fixed: use sourceImageUrl
        timestamp: event.createdAt, // Fixed: use createdAt instead of timestamp
        eventType: event.eventType, // Fixed: use eventType instead of recognitionType
        processingTime: event.processingTime
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit
      }
    });

  } catch (error) {
    console.error('Error fetching recognition events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
