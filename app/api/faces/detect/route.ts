
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
    const { imageUrl, venueId, detectEmotions = true, detectAge = true } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Verify venue access if provided
    if (venueId) {
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
    }

    // Perform face detection
    const detectionResult = await enhancedRekognitionService.detectFaces(imageUrl);

    if (!detectionResult.success) {
      return NextResponse.json(
        { error: detectionResult.error },
        { status: 400 }
      );
    }

    // Enhanced analysis if requested
    let enhancedAnalysis = null;
    if (detectEmotions || detectAge) {
      const analysisResult = await enhancedRekognitionService.performEnhancedFacialAnalysis(imageUrl);
      if (analysisResult.success) {
        enhancedAnalysis = analysisResult.analysis;
      }
    }

    // Process detections
    const processedDetections = detectionResult.detections?.map((face: any, index: number) => {
      // Fixed: add explicit types for parameters
      const faceData: any = {
        id: `face_${index}`,
        confidence: face.confidence,
        boundingBox: face.boundingBox
      };

      if (enhancedAnalysis) {
        // Add emotion data if available
        if (enhancedAnalysis.emotions) {
          faceData.emotions = enhancedAnalysis.emotions.map((emotion: any) => ({
            // Fixed: add explicit type for emotion parameter
            type: emotion.type,
            confidence: emotion.confidence
          }));
          
          // Get dominant emotion
          const dominantEmotion = enhancedAnalysis.emotions.reduce((prev: any, current: any) => 
            (current.confidence > prev.confidence) ? current : prev
          );
          faceData.dominantEmotion = dominantEmotion;
        }

        // Add age data if available
        if (enhancedAnalysis.ageRange) {
          faceData.ageRange = enhancedAnalysis.ageRange;
          faceData.estimatedAge = (enhancedAnalysis.ageRange.low + enhancedAnalysis.ageRange.high) / 2;
        }

        // Add other attributes
        if (enhancedAnalysis.attributes) {
          faceData.attributes = enhancedAnalysis.attributes;
        }
      }

      return faceData;
    }) || [];

    // Calculate face landmarks if available (mock implementation)
    const landmarks = processedDetections.map((face: any) => ({
      // Fixed: add explicit type for face parameter
      faceId: face.id,
      landmarks: [
        // Mock landmark data - in real implementation this would come from Rekognition
        { type: 'leftEye', x: Math.random() * 100, y: Math.random() * 100 },
        { type: 'rightEye', x: Math.random() * 100, y: Math.random() * 100 },
        { type: 'nose', x: Math.random() * 100, y: Math.random() * 100 },
        { type: 'mouth', x: Math.random() * 100, y: Math.random() * 100 }
      ].map((landmark: any) => ({
        // Fixed: add explicit type for landmark parameter
        type: landmark.type,
        x: landmark.x,
        y: landmark.y
      }))
    }));

    // Calculate statistics
    const stats = {
      totalFaces: processedDetections.length,
      averageConfidence: processedDetections.reduce((sum: number, face: any) => 
        // Fixed: add explicit types for sum and face parameters
        sum + face.confidence, 0) / (processedDetections.length || 1),
      averageAge: processedDetections.filter((face: any) => face.estimatedAge)
        // Fixed: add explicit type for face parameter
        .reduce((sum: number, face: any) => sum + face.estimatedAge, 0) / 
        (processedDetections.filter((face: any) => face.estimatedAge).length || 1),
      emotionDistribution: processedDetections
        .filter((face: any) => face.dominantEmotion)
        // Fixed: add explicit type for face parameter
        .reduce((acc: any, face: any) => {
          const emotion = face.dominantEmotion.type;
          acc[emotion] = (acc[emotion] || 0) + 1;
          return acc;
        }, {})
    };

    return NextResponse.json({
      success: true,
      detections: processedDetections,
      landmarks,
      statistics: stats,
      enhancedAnalysis,
      metadata: {
        imageUrl,
        venueId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now()
      }
    });

  } catch (error) {
    console.error('Error in face detection:', error);
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
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent face detection results for the venue
    const where: any = {};
    if (venueId) {
      where.venueId = venueId;
    }

    // In a real implementation, this would fetch from a face detection results table
    // For now, return empty results
    return NextResponse.json({
      success: true,
      detections: [],
      pagination: {
        total: 0,
        limit,
        hasMore: false
      }
    });

  } catch (error) {
    console.error('Error fetching face detections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
