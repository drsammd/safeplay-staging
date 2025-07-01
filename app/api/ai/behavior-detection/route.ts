
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
    const behaviorType = formData.get('behaviorType') as string;
    const analysisType = formData.get('analysisType') as string || 'general';

    if (!imageFile) {
      return NextResponse.json({ 
        error: 'Image file is required' 
      }, { status: 400 });
    }

    // Convert image to buffer
    const imageArrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    let analysis;

    if (behaviorType && ['bullying', 'drowning', 'seizure', 'gait_abnormal', 'aggression'].includes(behaviorType)) {
      // Perform specific behavior detection
      analysis = await computerVisionService.detectSpecificBehavior(
        imageBuffer,
        behaviorType as any
      );
    } else {
      // Perform general behavior pattern analysis
      analysis = await computerVisionService.analyzeBehaviorPatterns(
        imageBuffer,
        analysisType
      );
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error in behavior detection:', error);
    return NextResponse.json(
      { error: 'Behavior detection failed', details: error.message },
      { status: 500 }
    );
  }
}
