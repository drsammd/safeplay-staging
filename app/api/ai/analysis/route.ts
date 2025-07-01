
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { aiOrchestrationService } from '../../../../lib/services/ai-orchestration-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const venueId = formData.get('venueId') as string;
    const zoneId = formData.get('zoneId') as string | null;
    const cameraId = formData.get('cameraId') as string | null;
    const childId = formData.get('childId') as string | null;
    const analysisTypes = JSON.parse(formData.get('analysisTypes') as string || '[]');
    
    const imageFile = formData.get('image') as File | null;
    const audioFile = formData.get('audio') as File | null;

    if (!venueId || !analysisTypes.length) {
      return NextResponse.json({ 
        error: 'Venue ID and analysis types are required' 
      }, { status: 400 });
    }

    // Convert files to buffers
    let imageBuffer: Buffer | undefined;
    let audioBuffer: Buffer | undefined;

    if (imageFile) {
      const imageArrayBuffer = await imageFile.arrayBuffer();
      imageBuffer = Buffer.from(imageArrayBuffer);
    }

    if (audioFile) {
      const audioArrayBuffer = await audioFile.arrayBuffer();
      audioBuffer = Buffer.from(audioArrayBuffer);
    }

    // Process AI analysis
    const result = await aiOrchestrationService.processAIAnalysis({
      venueId,
      zoneId: zoneId || undefined,
      cameraId: cameraId || undefined,
      childId: childId || undefined,
      analysisTypes,
      imageBuffer,
      audioBuffer,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json(
      { error: 'AI analysis failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Session ID is required' 
      }, { status: 400 });
    }

    const stats = await aiOrchestrationService.getSessionStats(sessionId);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error getting AI session stats:', error);
    return NextResponse.json(
      { error: 'Failed to get session stats', details: error.message },
      { status: 500 }
    );
  }
}
