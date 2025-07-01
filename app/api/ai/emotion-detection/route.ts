
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { enhancedRekognitionService } from '../../../../lib/aws/rekognition-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ 
        error: 'Image file is required' 
      }, { status: 400 });
    }

    // Convert image to buffer
    const imageArrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Perform enhanced facial analysis for emotion detection
    const analysis = await enhancedRekognitionService.performEnhancedFacialAnalysis(imageBuffer);

    if (!analysis.success) {
      return NextResponse.json({
        success: false,
        error: analysis.error || 'Emotion detection failed',
      });
    }

    // Extract emotion analysis from each detected face
    const emotionResults = analysis.faces.map(face => ({
      boundingBox: face.BoundingBox,
      confidence: face.Confidence,
      emotionAnalysis: face.EmotionAnalysis,
    }));

    return NextResponse.json({
      success: true,
      faceCount: analysis.faceCount,
      emotions: emotionResults,
    });
  } catch (error: any) {
    console.error('Error in emotion detection:', error);
    return NextResponse.json(
      { error: 'Emotion detection failed', details: error.message },
      { status: 500 }
    );
  }
}
