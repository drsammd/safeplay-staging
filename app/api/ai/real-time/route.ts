
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

    const body = await request.json();
    const { action, sessionId, venueId, cameraId, analysisTypes } = body;

    switch (action) {
      case 'start_session':
        if (!venueId) {
          return NextResponse.json({ 
            error: 'Venue ID is required to start session' 
          }, { status: 400 });
        }
        
        const newSessionId = await aiOrchestrationService.startAnalysisSession(
          venueId,
          'MULTI_MODAL',
          cameraId
        );
        
        return NextResponse.json({ sessionId: newSessionId, status: 'started' });

      case 'stop_session':
        if (!sessionId) {
          return NextResponse.json({ 
            error: 'Session ID is required to stop session' 
          }, { status: 400 });
        }
        
        await aiOrchestrationService.stopAnalysisSession(sessionId);
        return NextResponse.json({ status: 'stopped' });

      case 'get_status':
        if (!sessionId) {
          return NextResponse.json({ 
            error: 'Session ID is required to get status' 
          }, { status: 400 });
        }
        
        const stats = await aiOrchestrationService.getSessionStats(sessionId);
        return NextResponse.json(stats);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in real-time AI processing:', error);
    return NextResponse.json(
      { error: 'Real-time processing failed', details: error.message },
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

    // Return available analysis types and their descriptions
    const analysisTypes = [
      {
        type: 'AGE_ESTIMATION',
        description: 'Real-time age estimation and zone compliance',
        inputTypes: ['image'],
        outputFormat: 'age_analysis'
      },
      {
        type: 'EMOTION_DETECTION',
        description: 'Emotion recognition and distress detection',
        inputTypes: ['image'],
        outputFormat: 'emotion_analysis'
      },
      {
        type: 'CROWD_DENSITY',
        description: 'Crowd density and overcrowding detection',
        inputTypes: ['image'],
        outputFormat: 'crowd_analysis'
      },
      {
        type: 'BEHAVIOR_PATTERN',
        description: 'Behavioral pattern recognition and risk assessment',
        inputTypes: ['image', 'video'],
        outputFormat: 'behavior_analysis'
      },
      {
        type: 'VOICE_PATTERN',
        description: 'Voice analysis and distress call detection',
        inputTypes: ['audio'],
        outputFormat: 'voice_analysis'
      },
      {
        type: 'VISUAL_PATTERN',
        description: 'Visual pattern analysis and body language',
        inputTypes: ['image'],
        outputFormat: 'visual_analysis'
      }
    ];

    return NextResponse.json({
      availableAnalysisTypes: analysisTypes,
      supportedFormats: {
        image: ['jpg', 'jpeg', 'png'],
        audio: ['wav', 'mp3', 'aac'],
        video: ['mp4', 'avi', 'mov']
      },
      realTimeCapabilities: {
        maxConcurrentSessions: 10,
        maxFrameRate: 30,
        maxResolution: '1920x1080',
        supportedStreams: ['rtmp', 'webrtc', 'hls']
      }
    });
  } catch (error: any) {
    console.error('Error getting real-time AI info:', error);
    return NextResponse.json(
      { error: 'Failed to get real-time info', details: error.message },
      { status: 500 }
    );
  }
}
