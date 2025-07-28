
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAWSConfigStatus, validateAWSConfig, isAWSAvailable } from '@/lib/aws/config';
import { enhancedRekognitionService } from '@/lib/aws/rekognition-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/system/aws-status - Check AWS and face recognition system status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and venue admins can check system status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, managedVenues: true }
    });

    if (user?.role !== 'SUPER_ADMIN' && !user?.managedVenues?.length) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('🔍 Starting AWS system status check...');

    // 1. Basic AWS Configuration Check
    const awsConfigStatus = getAWSConfigStatus();
    const awsValidation = validateAWSConfig();
    const isAwsAvailable = isAWSAvailable();

    // 2. AWS Rekognition Connection Test
    let rekognitionStatus = {
      connected: false,
      collections: [],
      error: null,
      permissionsOk: false
    };

    try {
      // Test basic connection
      const collections = await enhancedRekognitionService.listFaces('test-connection');
      rekognitionStatus.connected = false; // This should fail for test collection
      rekognitionStatus.error = 'Test collection access failed (expected)';
    } catch (error) {
      if (error.name === 'AccessDeniedException') {
        rekognitionStatus.error = 'AWS permissions not configured';
        rekognitionStatus.permissionsOk = false;
      } else if (error.name === 'ResourceNotFoundException') {
        // This is actually good - means we can connect but collection doesn't exist
        rekognitionStatus.connected = true;
        rekognitionStatus.permissionsOk = false; // Still need ListCollections permission
        rekognitionStatus.error = 'Connected but missing ListCollections permission';
      } else {
        rekognitionStatus.error = error.message;
      }
    }

    // 3. Check existing face collections
    let collectionsStatus = {
      totalCollections: 0,
      venueCollections: [],
      orphanedCollections: [],
      error: null
    };

    try {
      // Try to list collections (this is what's failing)
      const listResult = await enhancedRekognitionService.getCollectionInfo('dummy');
      // This will fail, but we can still check database
    } catch (error) {
      collectionsStatus.error = error.message;
    }

    // Check database collections
    const venuesWithCollections = await prisma.venue.findMany({
      where: {
        faceCollectionId: { not: null }
      },
      select: {
        id: true,
        name: true,
        faceCollectionId: true,
        faceRecognitionEnabled: true,
        _count: {
          select: {
            children: {
              where: {
                biometricId: { not: null }
              }
            }
          }
        }
      }
    });

    collectionsStatus.venueCollections = venuesWithCollections.map(venue => ({
      venueId: venue.id,
      venueName: venue.name,
      collectionId: venue.faceCollectionId,
      enabled: venue.faceRecognitionEnabled,
      enrolledChildren: venue._count.children
    }));

    // 4. Face Recognition System Status
    const faceRecognitionStatus = {
      totalEnrolledChildren: await prisma.child.count({
        where: { biometricId: { not: null } }
      }),
      enabledChildren: await prisma.child.count({
        where: { faceRecognitionEnabled: true }
      }),
      recentEvents: await prisma.faceRecognitionEvent.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      demoMode: !rekognitionStatus.connected || !rekognitionStatus.permissionsOk
    };

    // 5. Overall System Health
    const systemHealth = {
      awsCredentials: awsConfigStatus.accessKeyConfigured && awsConfigStatus.secretKeyConfigured,
      awsConnection: awsConfigStatus.isAvailable,
      rekognitionPermissions: rekognitionStatus.permissionsOk,
      faceCollections: collectionsStatus.venueCollections.length > 0,
      overallStatus: 'unknown'
    };

    // Determine overall status
    if (systemHealth.awsCredentials && systemHealth.rekognitionPermissions && systemHealth.faceCollections) {
      systemHealth.overallStatus = 'operational';
    } else if (systemHealth.awsCredentials && systemHealth.awsConnection) {
      systemHealth.overallStatus = 'partial'; // Credentials work but permissions needed
    } else {
      systemHealth.overallStatus = 'demo'; // Running in demo mode
    }

    // 6. Recommendations
    const recommendations = [];
    
    if (!systemHealth.awsCredentials) {
      recommendations.push({
        type: 'critical',
        title: 'AWS Credentials Missing',
        description: 'AWS credentials are not properly configured',
        action: 'Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables'
      });
    }

    if (!rekognitionStatus.permissionsOk && systemHealth.awsCredentials) {
      recommendations.push({
        type: 'critical',
        title: 'AWS Permissions Required',
        description: 'AWS Rekognition permissions are not configured',
        action: 'Add Rekognition permissions to IAM role (see setup guide)'
      });
    }

    if (systemHealth.faceCollections === false && rekognitionStatus.permissionsOk) {
      recommendations.push({
        type: 'warning',
        title: 'No Face Collections',
        description: 'No venues have face collections configured',
        action: 'Run face collection setup script'
      });
    }

    if (faceRecognitionStatus.demoMode) {
      recommendations.push({
        type: 'info',
        title: 'Demo Mode Active',
        description: 'Face recognition is running in demo mode',
        action: 'Configure AWS permissions for full functionality'
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      aws: {
        config: awsConfigStatus,
        validation: awsValidation,
        available: isAwsAvailable
      },
      rekognition: rekognitionStatus,
      collections: collectionsStatus,
      faceRecognition: faceRecognitionStatus,
      systemHealth,
      recommendations,
      setupGuide: '/AWS_REKOGNITION_SETUP_GUIDE.md'
    });

  } catch (error) {
    console.error('Error in system/aws-status GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check system status',
      details: error.message
    }, { status: 500 });
  }
}
