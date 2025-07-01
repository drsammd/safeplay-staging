
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
    const minAge = formData.get('minAge') ? parseInt(formData.get('minAge') as string) : undefined;
    const maxAge = formData.get('maxAge') ? parseInt(formData.get('maxAge') as string) : undefined;

    if (!imageFile) {
      return NextResponse.json({ 
        error: 'Image file is required' 
      }, { status: 400 });
    }

    // Convert image to buffer
    const imageArrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Perform enhanced facial analysis
    const faceAnalysis = await enhancedRekognitionService.performEnhancedFacialAnalysis(imageBuffer);

    if (!faceAnalysis.success) {
      return NextResponse.json({
        success: false,
        error: faceAnalysis.error || 'Face analysis failed',
      });
    }

    // Check age compliance if restrictions provided
    let complianceResult = null;
    if (minAge !== undefined || maxAge !== undefined) {
      complianceResult = await enhancedRekognitionService.analyzeAgeCompliance(
        imageBuffer,
        { minAge, maxAge }
      );
    }

    return NextResponse.json({
      success: true,
      faceAnalysis,
      ageCompliance: complianceResult,
    });
  } catch (error: any) {
    console.error('Error in age estimation:', error);
    return NextResponse.json(
      { error: 'Age estimation failed', details: error.message },
      { status: 500 }
    );
  }
}
