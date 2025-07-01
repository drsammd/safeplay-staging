
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { audioProcessingService } from '../../../../lib/services/audio-processing-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const analysisType = formData.get('analysisType') as string || 'emotion_detection';

    if (!audioFile) {
      return NextResponse.json({ 
        error: 'Audio file is required' 
      }, { status: 400 });
    }

    // Convert audio to buffer
    const audioArrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    let analysis;

    switch (analysisType) {
      case 'distress_detection':
        analysis = await audioProcessingService.detectDistressCalls(audioBuffer);
        break;
      case 'emotional_state':
        analysis = await audioProcessingService.analyzeEmotionalState(audioBuffer);
        break;
      default:
        analysis = await audioProcessingService.analyzeVoicePatterns(audioBuffer, analysisType);
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error in voice analysis:', error);
    return NextResponse.json(
      { error: 'Voice analysis failed', details: error.message },
      { status: 500 }
    );
  }
}
