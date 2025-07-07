
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// Mock AI settings storage (in production, this would be in a database)
let aiSettings = {
  ageEstimation: {
    enabled: true,
    accuracy: 94.5,
    confidenceThreshold: 85,
    updateInterval: 30,
  },
  emotionDetection: {
    enabled: true,
    accuracy: 89.2,
    confidenceThreshold: 80,
    alertOnNegative: true,
    negativeThreshold: 70,
  },
  crowdAnalysis: {
    enabled: true,
    accuracy: 92.8,
    maxCapacity: 50,
    alertThreshold: 80,
    updateInterval: 60,
  },
  behaviorDetection: {
    enabled: true,
    accuracy: 87.3,
    aggressionDetection: true,
    bullyingDetection: true,
    alertSensitivity: 75,
  },
  voiceAnalysis: {
    enabled: false,
    accuracy: 0,
    stressDetection: false,
    volumeMonitoring: false,
    alertThreshold: 80,
  },
  visualPatterns: {
    enabled: true,
    accuracy: 91.7,
    motionTracking: true,
    objectRecognition: true,
    updateInterval: 45,
  },
  general: {
    dataRetention: 30,
    privacyMode: false,
    parentNotifications: true,
    realTimeAlerts: true,
    analyticsEnabled: true,
  },
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      settings: aiSettings,
    });
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings data is required' },
        { status: 400 }
      );
    }

    // Validate settings structure
    const requiredSections = [
      'ageEstimation',
      'emotionDetection', 
      'crowdAnalysis',
      'behaviorDetection',
      'voiceAnalysis',
      'visualPatterns',
      'general'
    ];

    for (const section of requiredSections) {
      if (!settings[section]) {
        return NextResponse.json(
          { error: `Missing required section: ${section}` },
          { status: 400 }
        );
      }
    }

    // Update settings (in production, save to database)
    aiSettings = { ...aiSettings, ...settings };

    // Log the settings update
    console.log('AI settings updated:', {
      userId: session.user.id,
      timestamp: new Date().toISOString(),
      updatedSections: Object.keys(settings),
    });

    return NextResponse.json({
      success: true,
      message: 'AI settings updated successfully',
      settings: aiSettings,
    });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to update AI settings' },
      { status: 500 }
    );
  }
}
