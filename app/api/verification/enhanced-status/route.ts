
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enhancedVerificationService } from '@/lib/services/enhanced-verification-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get enhanced verification status
    const baseStatus = await enhancedVerificationService.getVerificationStatusWithAnalysis(session.user.id);
    
    // Get the latest enhanced verification attempt
    const latestEnhancedVerification = await prisma.identityVerification.findFirst({
      where: { 
        userId: session.user.id,
        verificationMethod: 'AUTOMATED'
      },
      include: { 
        documentAnalysis: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    let enhancedData = null;
    if (latestEnhancedVerification) {
      enhancedData = {
        verificationId: latestEnhancedVerification.id,
        status: latestEnhancedVerification.status,
        overallScore: latestEnhancedVerification.overallVerificationScore,
        scoringBreakdown: latestEnhancedVerification.scoringBreakdown,
        
        // Address verification data
        addressComparison: {
          userAddress: latestEnhancedVerification.userEnteredAddress,
          extractedAddress: latestEnhancedVerification.extractedAddress,
          matchScore: latestEnhancedVerification.addressMatchScore,
          comparisonResult: latestEnhancedVerification.addressComparisonResult,
          googlePlacesData: latestEnhancedVerification.googlePlacesData
        },
        
        // Photo verification data  
        faceComparison: {
          similarity: latestEnhancedVerification.faceComparisonScore,
          comparisonResult: latestEnhancedVerification.faceComparisonResult,
          selfieQuality: latestEnhancedVerification.selfieQualityScore,
          documentPhotoQuality: latestEnhancedVerification.documentPhotoQualityScore
        },
        
        // Document analysis data
        documentAnalysis: latestEnhancedVerification.documentAnalysis ? {
          confidence: latestEnhancedVerification.documentAnalysis.confidence,
          authenticityScore: latestEnhancedVerification.documentAnalysis.authenticityScore,
          qualityScore: latestEnhancedVerification.documentAnalysis.qualityScore,
          fraudIndicators: latestEnhancedVerification.documentAnalysis.fraudIndicators,
          extractedAddressData: latestEnhancedVerification.documentAnalysis.extractedAddressData,
          addressExtractionConfidence: latestEnhancedVerification.documentAnalysis.addressExtractionConfidence,
          documentPhotoFaceDetection: latestEnhancedVerification.documentAnalysis.documentPhotoFaceDetection
        } : null,
        
        autoApprovalEligible: latestEnhancedVerification.autoApprovalEligible,
        verificationNotes: latestEnhancedVerification.verificationNotes,
        createdAt: latestEnhancedVerification.createdAt,
        verifiedAt: latestEnhancedVerification.verifiedAt,
        rejectionReason: latestEnhancedVerification.rejectionReason
      };
    }

    // Get verification history
    const verificationHistory = await prisma.identityVerification.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        status: true,
        documentType: true,
        verificationMethod: true,
        overallVerificationScore: true,
        addressMatchScore: true,
        faceComparisonScore: true,
        autoApprovalEligible: true,
        createdAt: true,
        verifiedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      ...baseStatus,
      enhanced: enhancedData,
      history: verificationHistory,
      
      // Summary metrics
      summary: {
        hasEnhancedVerification: !!enhancedData,
        latestOverallScore: enhancedData?.overallScore || 0,
        latestStatus: enhancedData?.status || 'NONE',
        addressVerified: enhancedData?.addressComparison?.matchScore ? enhancedData.addressComparison.matchScore > 0.8 : false,
        photoVerified: enhancedData?.faceComparison?.similarity ? enhancedData.faceComparison.similarity > 80 : false,
        documentVerified: enhancedData?.documentAnalysis?.confidence ? enhancedData.documentAnalysis.confidence > 0.8 : false
      }
    });

  } catch (error) {
    console.error('Enhanced verification status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
