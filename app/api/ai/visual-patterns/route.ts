
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { computerVisionService } from '../../../../lib/services/computer-vision-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const focusAreas = formData.get('focusAreas') ? 
      JSON.parse(formData.get('focusAreas') as string) : 
      ['facial_expression', 'body_language'];

    if (!imageFile) {
      return NextResponse.json({ 
        error: 'Image file is required' 
      }, { status: 400 });
    }

    // Convert image to buffer
    const imageArrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Perform visual pattern analysis
    const analysis = await computerVisionService.analyzeVisualPatterns(
      imageBuffer,
      focusAreas
    );

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error in visual pattern analysis:', error);
    return NextResponse.json(
      { error: 'Visual pattern analysis failed', details: error.message },
      { status: 500 }
    );
  }
}
