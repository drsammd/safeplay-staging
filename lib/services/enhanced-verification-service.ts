

import { prisma } from '@/lib/db';
import { awsTextractService } from './aws-textract-service';
import { enhancedAWSTextractService } from './enhanced-aws-textract-service';
import { awsRekognitionService } from './aws-rekognition-service';
import { googlePlacesService } from './google-places-service';
import { verificationScoringService } from './verification-scoring-service';
import { verificationService } from './verification-service';
import { IdentityVerificationType, IdentityVerificationStatus, VerificationLevel, DocumentType } from '@prisma/client';

interface AutomatedVerificationResult {
  success: boolean;
  autoApproved: boolean;
  autoRejected: boolean;
  requiresManualReview: boolean;
  confidence: number;
  reason: string;
  verificationId?: string;
  error?: string;
}

// Phase 1.6 Enhanced Verification Result
interface EnhancedVerificationResult extends AutomatedVerificationResult {
  overallVerificationScore?: number;
  scoringBreakdown?: {
    documentScore: number;
    addressScore: number;
    photoScore: number;
  };
  addressComparison?: {
    matchScore: number;
    isMatch: boolean;
    differences: string[];
  };
  faceComparison?: {
    similarity: number;
    isMatch: boolean;
    qualityScore: number;
  };
  recommendations?: string[];
  riskFactors?: string[];
}

export class EnhancedVerificationService {
  
  // Phase 1.6 Enhanced Verification with Address & Photo Comparison
  async initiateEnhancedIdentityVerification(
    userId: string,
    documentType: DocumentType,
    documentImages: Buffer[],
    selfieImage: Buffer,
    userEnteredAddress: string,
    documentMetadata: any,
    riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
  ): Promise<EnhancedVerificationResult> {
    try {
      // Create identity verification record
      const verification = await prisma.identityVerification.create({
        data: {
          userId,
          verificationType: 'AUTOMATED_SCREENING',
          status: 'UNDER_REVIEW',
          documentType,
          verificationMethod: 'AUTOMATED',
          documentImages: [],
          verificationMetadata: documentMetadata,
          userEnteredAddress: { address: userEnteredAddress }
        }
      });

      if (documentImages.length === 0) {
        return {
          success: false,
          autoApproved: false,
          autoRejected: true,
          requiresManualReview: false,
          confidence: 0,
          reason: 'No document images provided',
          error: 'No document images provided'
        };
      }

      const primaryImage = documentImages[0];
      const fileName = `primary_document_${Date.now()}.jpg`;
      
      // Run enhanced document analysis with address extraction
      const analysisResult = await enhancedAWSTextractService.analyzeDocumentWithAddressExtraction(
        verification.id,
        documentType,
        primaryImage,
        fileName
      );

      if (!analysisResult.success) {
        await prisma.identityVerification.update({
          where: { id: verification.id },
          data: {
            status: 'REQUIRES_RESUBMISSION',
            rejectionReason: analysisResult.error || 'Enhanced analysis failed'
          }
        });

        return {
          success: false,
          autoApproved: false,
          autoRejected: true,
          requiresManualReview: false,
          confidence: 0,
          reason: analysisResult.error || 'Enhanced analysis failed',
          error: analysisResult.error
        };
      }

      // Perform address comparison if we have extracted address
      let addressComparison: any = null;
      if (analysisResult.extractedAddress?.fullAddress && userEnteredAddress) {
        try {
          addressComparison = await googlePlacesService.compareAddresses(
            userEnteredAddress,
            analysisResult.extractedAddress.fullAddress
          );
        } catch (error) {
          console.error('Address comparison error:', error);
        }
      }

      // Perform face comparison if we have selfie
      let faceComparison: any = null;
      if (selfieImage && primaryImage) {
        try {
          faceComparison = await awsRekognitionService.performEnhancedFaceComparison(
            primaryImage, // License photo
            selfieImage,  // Selfie
            riskTolerance === 'LOW' // Strict mode for low risk tolerance
          );
        } catch (error) {
          console.error('Face comparison error:', error);
        }
      }

      // Calculate comprehensive verification score
      const scoringInput = {
        documentConfidence: analysisResult.confidence,
        documentAuthenticity: analysisResult.authenticityScore,
        documentQuality: analysisResult.qualityScore,
        fraudIndicators: analysisResult.fraudIndicators,
        
        addressMatchScore: addressComparison?.matchScore,
        addressConfidence: addressComparison?.confidence,
        userAddressValid: addressComparison?.userStandardized ? true : false,
        extractedAddressValid: addressComparison?.extractedStandardized ? true : false,
        
        faceComparisonScore: faceComparison?.comparisonResult?.similarity,
        faceComparisonConfidence: faceComparison?.comparisonResult?.confidence,
        licensePhotoQuality: faceComparison?.licenseAnalysis?.qualityScore,
        selfieQuality: faceComparison?.selfieAnalysis?.qualityScore,
        singleFaceInLicense: faceComparison?.licenseAnalysis?.faceCount === 1,
        singleFaceInSelfie: faceComparison?.selfieAnalysis?.faceCount === 1,
        appropriateContent: faceComparison?.licenseModeration?.isAppropriate && faceComparison?.selfieModeration?.isAppropriate,
        
        documentType: documentType as any,
        verificationPurpose: 'IDENTITY_VERIFICATION' as any,
        riskTolerance,
        country: 'US'
      };

      const scoringResult = verificationScoringService.calculateVerificationScore(scoringInput);

      // Update verification record with all Phase 1.6 data
      await prisma.identityVerification.update({
        where: { id: verification.id },
        data: {
          status: scoringResult.autoApprovalEligible ? 'APPROVED' : 
                 scoringResult.autoRejectionEligible ? 'REJECTED' : 'UNDER_REVIEW',
          confidence: analysisResult.confidence,
          extractedAddress: analysisResult.extractedAddress as any,
          addressMatchScore: addressComparison?.matchScore,
          addressComparisonResult: addressComparison,
          googlePlacesData: addressComparison?.userStandardized,
          faceComparisonScore: faceComparison?.comparisonResult?.similarity,
          faceComparisonResult: faceComparison?.comparisonResult,
          selfieQualityScore: faceComparison?.selfieAnalysis?.qualityScore,
          documentPhotoQualityScore: faceComparison?.licenseAnalysis?.qualityScore,
          overallVerificationScore: scoringResult.overallScore,
          scoringBreakdown: scoringResult.scoringBreakdown,
          autoApprovalEligible: scoringResult.autoApprovalEligible,
          verificationNotes: scoringResult.recommendations?.join('; '),
          verifiedAt: scoringResult.autoApprovalEligible ? new Date() : undefined,
          rejectionReason: scoringResult.autoRejectionEligible ? scoringResult.riskFactors?.join('; ') : undefined
        }
      });

      // Create audit log
      await this.createVerificationAuditLog(
        userId,
        'identity_enhanced',
        'enhanced_analysis_completed',
        'COMPLETED',
        null,
        {
          overallScore: scoringResult.overallScore,
          addressMatch: addressComparison?.isMatch,
          faceMatch: faceComparison?.comparisonResult?.isMatch,
          autoApprovalEligible: scoringResult.autoApprovalEligible
        },
        scoringResult.confidence,
        true
      );

      // If auto-approved, update user verification status
      if (scoringResult.autoApprovalEligible) {
        await this.updateUserVerificationStatus(userId, true);
      }

      return {
        success: true,
        autoApproved: scoringResult.autoApprovalEligible,
        autoRejected: scoringResult.autoRejectionEligible,
        requiresManualReview: scoringResult.requiresManualReview,
        confidence: scoringResult.confidence,
        reason: scoringResult.autoApprovalEligible ? 'Automatically approved based on comprehensive verification' :
                scoringResult.autoRejectionEligible ? scoringResult.riskFactors?.join('; ') || 'Verification failed' :
                'Requires manual review based on verification criteria',
        verificationId: verification.id,
        overallVerificationScore: scoringResult.overallScore,
        scoringBreakdown: {
          documentScore: scoringResult.scoringBreakdown.documentScore,
          addressScore: scoringResult.scoringBreakdown.addressScore,
          photoScore: scoringResult.scoringBreakdown.photoScore
        },
        addressComparison: addressComparison ? {
          matchScore: addressComparison.matchScore,
          isMatch: addressComparison.isMatch,
          differences: addressComparison.differences
        } : undefined,
        faceComparison: faceComparison ? {
          similarity: faceComparison.comparisonResult.similarity,
          isMatch: faceComparison.comparisonResult.isMatch,
          qualityScore: faceComparison.overallQualityScore
        } : undefined,
        recommendations: scoringResult.recommendations,
        riskFactors: scoringResult.riskFactors
      };

    } catch (error) {
      console.error('Enhanced identity verification error:', error);
      
      await this.createVerificationAuditLog(
        userId,
        'identity_enhanced',
        'enhanced_analysis_failed',
        'FAILED',
        null,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        success: false,
        autoApproved: false,
        autoRejected: false,
        requiresManualReview: true,
        confidence: 0,
        reason: 'System error during enhanced verification',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async initiateAutomatedIdentityVerification(
    userId: string,
    documentType: DocumentType,
    documentImages: Buffer[],
    documentMetadata: any
  ): Promise<AutomatedVerificationResult> {
    try {
      // Create identity verification record
      const verification = await prisma.identityVerification.create({
        data: {
          userId,
          verificationType: 'AUTOMATED_SCREENING',
          status: 'UNDER_REVIEW',
          documentType,
          verificationMethod: 'AUTOMATED',
          documentImages: [], // Will be updated after upload
          verificationMetadata: documentMetadata
        }
      });

      // Analyze the primary document image
      if (documentImages.length === 0) {
        return {
          success: false,
          autoApproved: false,
          autoRejected: true,
          requiresManualReview: false,
          confidence: 0,
          reason: 'No document images provided',
          error: 'No document images provided'
        };
      }

      const primaryImage = documentImages[0];
      const fileName = `primary_document_${Date.now()}.jpg`;
      
      // Run automated analysis
      const analysisResult = await awsTextractService.analyzeDocument(
        verification.id,
        documentType,
        primaryImage,
        fileName
      );

      if (!analysisResult.success) {
        await prisma.identityVerification.update({
          where: { id: verification.id },
          data: {
            status: 'REQUIRES_RESUBMISSION',
            rejectionReason: analysisResult.error || 'Automated analysis failed'
          }
        });

        return {
          success: false,
          autoApproved: false,
          autoRejected: true,
          requiresManualReview: false,
          confidence: 0,
          reason: analysisResult.error || 'Automated analysis failed',
          error: analysisResult.error
        };
      }

      // Create audit log
      await this.createVerificationAuditLog(
        userId,
        'identity',
        'automated_analysis_completed',
        'COMPLETED',
        null,
        {
          confidence: analysisResult.confidence,
          authenticityScore: analysisResult.authenticityScore,
          fraudIndicators: analysisResult.fraudIndicators
        },
        analysisResult.confidence,
        true
      );

      // Determine verification outcome
      const outcome = this.determineVerificationOutcome(analysisResult);
      
      // Update verification status
      await prisma.identityVerification.update({
        where: { id: verification.id },
        data: {
          status: outcome.autoApproved ? 'APPROVED' : 
                 outcome.autoRejected ? 'REJECTED' : 'UNDER_REVIEW',
          confidence: analysisResult.confidence,
          verificationNotes: outcome.reason,
          verifiedAt: outcome.autoApproved ? new Date() : undefined,
          rejectionReason: outcome.autoRejected ? outcome.reason : undefined
        }
      });

      // If auto-approved, update user verification status
      if (outcome.autoApproved) {
        await this.updateUserVerificationStatus(userId, true);
      }

      return {
        ...outcome,
        success: true,
        verificationId: verification.id
      };

    } catch (error) {
      console.error('Automated identity verification error:', error);
      
      await this.createVerificationAuditLog(
        userId,
        'identity',
        'automated_analysis_failed',
        'FAILED',
        null,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        success: false,
        autoApproved: false,
        autoRejected: false,
        requiresManualReview: true,
        confidence: 0,
        reason: 'System error during automated verification',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private determineVerificationOutcome(analysisResult: any): {
    autoApproved: boolean;
    autoRejected: boolean;
    requiresManualReview: boolean;
    confidence: number;
    reason: string;
  } {
    const { confidence, authenticityScore, fraudIndicators, qualityScore } = analysisResult;

    // Auto-approval criteria
    if (
      confidence >= 0.9 &&
      authenticityScore >= 0.85 &&
      qualityScore >= 0.8 &&
      fraudIndicators.length === 0
    ) {
      return {
        autoApproved: true,
        autoRejected: false,
        requiresManualReview: false,
        confidence,
        reason: 'Document passed all automated verification checks with high confidence'
      };
    }

    // Auto-rejection criteria
    if (
      confidence < 0.5 ||
      authenticityScore < 0.3 ||
      qualityScore < 0.4 ||
      fraudIndicators.length > 2
    ) {
      return {
        autoApproved: false,
        autoRejected: true,
        requiresManualReview: false,
        confidence,
        reason: `Document failed automated verification: ${fraudIndicators.length > 0 ? fraudIndicators.join(', ') : 'Low quality or confidence scores'}`
      };
    }

    // Manual review required
    let reviewReason = 'Requires manual review due to: ';
    const reasons = [];
    
    if (confidence < 0.9) reasons.push('moderate confidence score');
    if (authenticityScore < 0.85) reasons.push('authenticity concerns');
    if (qualityScore < 0.8) reasons.push('image quality issues');
    if (fraudIndicators.length > 0) reasons.push(`potential fraud indicators (${fraudIndicators.length})`);

    return {
      autoApproved: false,
      autoRejected: false,
      requiresManualReview: true,
      confidence,
      reason: reviewReason + reasons.join(', ')
    };
  }

  async manualReviewOverride(
    identityVerificationId: string,
    adminUserId: string,
    decision: 'APPROVE' | 'REJECT',
    notes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const verification = await prisma.identityVerification.findUnique({
        where: { id: identityVerificationId },
        include: { user: true }
      });

      if (!verification) {
        return { success: false, error: 'Verification not found' };
      }

      const newStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      
      await prisma.identityVerification.update({
        where: { id: identityVerificationId },
        data: {
          status: newStatus,
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
          verificationNotes: notes,
          verifiedAt: decision === 'APPROVE' ? new Date() : undefined,
          rejectionReason: decision === 'REJECT' ? notes : undefined
        }
      });

      // Create audit log
      await this.createVerificationAuditLog(
        verification.userId,
        'identity',
        'manual_review_completed',
        newStatus,
        { status: verification.status },
        { status: newStatus, notes, reviewedBy: adminUserId },
        undefined,
        false,
        adminUserId
      );

      // Update user verification status if approved
      if (decision === 'APPROVE') {
        await this.updateUserVerificationStatus(verification.userId, true);
      }

      return { success: true };
    } catch (error) {
      console.error('Manual review override error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async updateUserVerificationStatus(userId: string, identityVerified: boolean) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneVerified: true, twoFactorEnabled: true, verificationLevel: true }
    });

    if (!user) return;

    const newLevel = this.calculateVerificationLevel(
      user.phoneVerified,
      identityVerified,
      user.twoFactorEnabled
    );

    await prisma.user.update({
      where: { id: userId },
      data: {
        identityVerified,
        identityVerifiedAt: identityVerified ? new Date() : undefined,
        verificationLevel: newLevel
      }
    });

    // Create verification history record
    await this.createVerificationHistoryRecord(
      userId,
      user.verificationLevel,
      newLevel,
      identityVerified ? 'Identity verification completed' : 'Identity verification status updated'
    );
  }

  private calculateVerificationLevel(
    phoneVerified: boolean,
    identityVerified: boolean,
    twoFactorEnabled: boolean
  ): VerificationLevel {
    if (phoneVerified && identityVerified && twoFactorEnabled) {
      return 'FULL_VERIFIED';
    } else if (phoneVerified && identityVerified) {
      return 'IDENTITY_VERIFIED';
    } else if (phoneVerified) {
      return 'PHONE_VERIFIED';
    } else {
      return 'UNVERIFIED';
    }
  }

  async getVerificationStatusWithAnalysis(userId: string) {
    const baseStatus = await verificationService.getUserVerificationStatus(userId);
    
    // Get latest document analysis
    const latestIdentityVerification = await prisma.identityVerification.findFirst({
      where: { userId },
      include: { documentAnalysis: true },
      orderBy: { createdAt: 'desc' }
    });

    return {
      ...baseStatus,
      documentAnalysis: latestIdentityVerification?.documentAnalysis,
      automatedAnalysisAvailable: !!latestIdentityVerification?.documentAnalysis,
      lastAnalysisDate: latestIdentityVerification?.documentAnalysis?.processedAt
    };
  }

  async getPendingManualReviews(limit = 50) {
    return await prisma.identityVerification.findMany({
      where: {
        status: 'UNDER_REVIEW',
        documentAnalysis: {
          requiresManualReview: true
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        documentAnalysis: true
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    });
  }

  async getVerificationAnalytics(dateFrom?: Date, dateTo?: Date) {
    const whereClause = {
      createdAt: {
        gte: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to 30 days
        lte: dateTo || new Date()
      }
    };

    const [
      totalVerifications,
      autoApprovedCount,
      autoRejectedCount,
      manualReviewCount,
      avgProcessingTime
    ] = await Promise.all([
      prisma.identityVerification.count({ where: whereClause }),
      
      prisma.documentAnalysis.count({
        where: {
          ...whereClause,
          autoApproved: true
        }
      }),
      
      prisma.documentAnalysis.count({
        where: {
          ...whereClause,
          autoRejected: true
        }
      }),
      
      prisma.documentAnalysis.count({
        where: {
          ...whereClause,
          requiresManualReview: true
        }
      }),
      
      prisma.documentAnalysis.aggregate({
        where: {
          ...whereClause,
          processedAt: { not: null }
        },
        _avg: {
          confidence: true
        }
      })
    ]);

    return {
      totalVerifications,
      autoApprovedCount,
      autoRejectedCount,
      manualReviewCount,
      automationRate: totalVerifications > 0 ? 
        ((autoApprovedCount + autoRejectedCount) / totalVerifications) * 100 : 0,
      averageConfidence: avgProcessingTime._avg.confidence || 0
    };
  }

  private async createVerificationAuditLog(
    userId: string,
    verificationType: string,
    action: string,
    status: string,
    previousValue?: any,
    newValue?: any,
    confidence?: number,
    automated = false,
    reviewedBy?: string
  ) {
    await prisma.verificationAuditLog.create({
      data: {
        userId,
        verificationType,
        action,
        status,
        previousValue,
        newValue,
        confidence,
        automated,
        reviewedBy,
        timestamp: new Date()
      }
    });
  }

  private async createVerificationHistoryRecord(
    userId: string,
    previousLevel: VerificationLevel,
    newLevel: VerificationLevel,
    reason: string,
    changedBy?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneVerified: true, identityVerified: true, twoFactorEnabled: true }
    });

    await prisma.verificationStatusHistory.create({
      data: {
        userId,
        previousLevel,
        newLevel,
        changeReason: reason,
        changedBy,
        phoneVerified: user?.phoneVerified || false,
        identityVerified: user?.identityVerified || false,
        twoFactorEnabled: user?.twoFactorEnabled || false
      }
    });
  }
}

export const enhancedVerificationService = new EnhancedVerificationService();

