// @ts-nocheck

interface VerificationScoringInput {
  // Document analysis scores
  documentConfidence?: number; // 0-1 from Textract
  documentAuthenticity?: number; // 0-1 from Textract
  documentQuality?: number; // 0-1 from Textract
  fraudIndicators?: string[];

  // Address comparison scores
  addressMatchScore?: number; // 0-1 from address comparison
  addressConfidence?: number; // 0-1 from Google Places validation
  userAddressValid?: boolean;
  extractedAddressValid?: boolean;

  // Photo comparison scores
  faceComparisonScore?: number; // 0-100 from AWS Rekognition
  faceComparisonConfidence?: number; // 0-100 from AWS Rekognition
  licensePhotoQuality?: number; // 0-1 from face analysis
  selfieQuality?: number; // 0-1 from face analysis
  singleFaceInLicense?: boolean;
  singleFaceInSelfie?: boolean;
  appropriateContent?: boolean;

  // Document type and verification context
  documentType: 'DRIVERS_LICENSE' | 'PASSPORT' | 'NATIONAL_ID';
  verificationPurpose: 'IDENTITY_VERIFICATION' | 'AGE_VERIFICATION' | 'ADDRESS_VERIFICATION';
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  country?: string;
}

interface VerificationScoringResult {
  overallScore: number; // 0-1 composite score
  scoringBreakdown: {
    documentScore: number; // 0-1
    addressScore: number; // 0-1
    photoScore: number; // 0-1
    weightedComponents: {
      document: { score: number; weight: number; contribution: number };
      address: { score: number; weight: number; contribution: number };
      photo: { score: number; weight: number; contribution: number };
    };
  };
  autoApprovalEligible: boolean;
  autoRejectionEligible: boolean;
  requiresManualReview: boolean;
  confidence: number; // 0-1 confidence in the scoring
  recommendations: string[];
  riskFactors: string[];
  nextSteps: string[];
  thresholds: {
    autoApproval: number;
    autoRejection: number;
    manualReview: number;
  };
}

export class VerificationScoringService {
  
  calculateVerificationScore(input: VerificationScoringInput): VerificationScoringResult {
    // Define weights based on document type and verification purpose
    const weights = this.getVerificationWeights(input.documentType, input.verificationPurpose, input.riskTolerance);
    
    // Calculate individual component scores
    const documentScore = this.calculateDocumentScore(input);
    const addressScore = this.calculateAddressScore(input);
    const photoScore = this.calculatePhotoScore(input);
    
    // Calculate weighted overall score
    const weightedComponents = {
      document: {
        score: documentScore,
        weight: weights.document,
        contribution: documentScore * weights.document
      },
      address: {
        score: addressScore,
        weight: weights.address,
        contribution: addressScore * weights.address
      },
      photo: {
        score: photoScore,
        weight: weights.photo,
        contribution: photoScore * weights.photo
      }
    };
    
    const overallScore = weightedComponents.document.contribution + 
                        weightedComponents.address.contribution + 
                        weightedComponents.photo.contribution;
    
    // Calculate confidence in the scoring
    const confidence = this.calculateScoringConfidence(input, weightedComponents);
    
    // Get thresholds based on risk tolerance
    const thresholds = this.getVerificationThresholds(input.riskTolerance);
    
    // Determine approval/rejection/review status
    const autoApprovalEligible = this.isAutoApprovalEligible(input, overallScore, thresholds);
    const autoRejectionEligible = this.isAutoRejectionEligible(input, overallScore, thresholds);
    const requiresManualReview = !autoApprovalEligible && !autoRejectionEligible;
    
    // Generate recommendations and risk factors
    const recommendations = this.generateRecommendations(input, weightedComponents, overallScore);
    const riskFactors = this.identifyRiskFactors(input, weightedComponents);
    const nextSteps = this.generateNextSteps(autoApprovalEligible, autoRejectionEligible, requiresManualReview, riskFactors);
    
    return {
      overallScore,
      scoringBreakdown: {
        documentScore,
        addressScore,
        photoScore,
        weightedComponents
      },
      autoApprovalEligible,
      autoRejectionEligible,
      requiresManualReview,
      confidence,
      recommendations,
      riskFactors,
      nextSteps,
      thresholds
    };
  }

  private getVerificationWeights(
    documentType: string, 
    purpose: string, 
    riskTolerance: string
  ): { document: number; address: number; photo: number } {
    let baseWeights = { document: 0.4, address: 0.3, photo: 0.3 };
    
    // Adjust weights based on document type
    switch (documentType) {
      case 'DRIVERS_LICENSE':
        baseWeights = { document: 0.35, address: 0.35, photo: 0.30 }; // Address is important for DL
        break;
      case 'PASSPORT':
        baseWeights = { document: 0.45, address: 0.15, photo: 0.40 }; // Photo more important, address less
        break;
      case 'NATIONAL_ID':
        baseWeights = { document: 0.40, address: 0.25, photo: 0.35 };
        break;
    }
    
    // Adjust based on verification purpose
    switch (purpose) {
      case 'ADDRESS_VERIFICATION':
        baseWeights.address += 0.15;
        baseWeights.document -= 0.075;
        baseWeights.photo -= 0.075;
        break;
      case 'AGE_VERIFICATION':
        baseWeights.document += 0.10;
        baseWeights.address -= 0.05;
        baseWeights.photo -= 0.05;
        break;
    }
    
    // Adjust based on risk tolerance
    switch (riskTolerance) {
      case 'LOW': // More weight on photo verification for security
        baseWeights.photo += 0.05;
        baseWeights.address -= 0.025;
        baseWeights.document -= 0.025;
        break;
      case 'HIGH': // More weight on document authenticity
        baseWeights.document += 0.05;
        baseWeights.photo -= 0.025;
        baseWeights.address -= 0.025;
        break;
    }
    
    return baseWeights;
  }

  private calculateDocumentScore(input: VerificationScoringInput): number {
    let score = 0;
    let componentCount = 0;
    
    // Document confidence from Textract
    if (input.documentConfidence !== undefined) {
      score += input.documentConfidence * 0.4;
      componentCount++;
    }
    
    // Document authenticity score
    if (input.documentAuthenticity !== undefined) {
      score += input.documentAuthenticity * 0.35;
      componentCount++;
    }
    
    // Document quality score
    if (input.documentQuality !== undefined) {
      score += input.documentQuality * 0.25;
      componentCount++;
    }
    
    // Penalize for fraud indicators
    if (input.fraudIndicators && input.fraudIndicators.length > 0) {
      const penalty = Math.min(input.fraudIndicators.length * 0.1, 0.3);
      score -= penalty;
    }
    
    return componentCount > 0 ? Math.max(score / componentCount, 0) : 0;
  }

  private calculateAddressScore(input: VerificationScoringInput): number {
    let score = 0;
    let componentCount = 0;
    
    // Address match score between user input and extracted
    if (input.addressMatchScore !== undefined) {
      score += input.addressMatchScore * 0.5;
      componentCount++;
    }
    
    // Google Places validation confidence
    if (input.addressConfidence !== undefined) {
      score += input.addressConfidence * 0.3;
      componentCount++;
    }
    
    // Validity checks
    if (input.userAddressValid !== undefined) {
      score += (input.userAddressValid ? 1 : 0) * 0.1;
      componentCount++;
    }
    
    if (input.extractedAddressValid !== undefined) {
      score += (input.extractedAddressValid ? 1 : 0) * 0.1;
      componentCount++;
    }
    
    return componentCount > 0 ? score / componentCount : 0;
  }

  private calculatePhotoScore(input: VerificationScoringInput): number {
    let score = 0;
    let componentCount = 0;
    
    // Face comparison score (convert from 0-100 to 0-1)
    if (input.faceComparisonScore !== undefined) {
      score += (input.faceComparisonScore / 100) * 0.4;
      componentCount++;
    }
    
    // Face comparison confidence (convert from 0-100 to 0-1)
    if (input.faceComparisonConfidence !== undefined) {
      score += (input.faceComparisonConfidence / 100) * 0.2;
      componentCount++;
    }
    
    // Photo quality scores
    if (input.licensePhotoQuality !== undefined) {
      score += input.licensePhotoQuality * 0.15;
      componentCount++;
    }
    
    if (input.selfieQuality !== undefined) {
      score += input.selfieQuality * 0.15;
      componentCount++;
    }
    
    // Face count penalties
    if (input.singleFaceInLicense !== undefined) {
      score += (input.singleFaceInLicense ? 1 : 0) * 0.05;
      componentCount++;
    }
    
    if (input.singleFaceInSelfie !== undefined) {
      score += (input.singleFaceInSelfie ? 1 : 0) * 0.05;
      componentCount++;
    }
    
    // Content appropriateness
    if (input.appropriateContent !== undefined) {
      if (!input.appropriateContent) {
        score = 0; // Automatic zero for inappropriate content
      }
    }
    
    return componentCount > 0 ? score / componentCount : 0;
  }

  private calculateScoringConfidence(
    input: VerificationScoringInput, 
    components: any
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on number of available components
    const availableComponents = [
      input.documentConfidence,
      input.addressMatchScore,
      input.faceComparisonScore
    ].filter(score => score !== undefined).length;
    
    confidence += (availableComponents / 3) * 0.3;
    
    // Increase confidence for high-quality inputs
    if (input.documentQuality && input.documentQuality > 0.8) confidence += 0.1;
    if (input.licensePhotoQuality && input.licensePhotoQuality > 0.8) confidence += 0.05;
    if (input.selfieQuality && input.selfieQuality > 0.8) confidence += 0.05;
    
    // Decrease confidence for fraud indicators
    if (input.fraudIndicators && input.fraudIndicators.length > 0) {
      confidence -= input.fraudIndicators.length * 0.05;
    }
    
    return Math.max(Math.min(confidence, 1.0), 0);
  }

  private getVerificationThresholds(riskTolerance: string): {
    autoApproval: number;
    autoRejection: number;
    manualReview: number;
  } {
    switch (riskTolerance) {
      case 'LOW':
        return { autoApproval: 0.92, autoRejection: 0.30, manualReview: 0.70 };
      case 'MEDIUM':
        return { autoApproval: 0.85, autoRejection: 0.35, manualReview: 0.65 };
      case 'HIGH':
        return { autoApproval: 0.75, autoRejection: 0.40, manualReview: 0.60 };
      default:
        return { autoApproval: 0.85, autoRejection: 0.35, manualReview: 0.65 };
    }
  }

  private isAutoApprovalEligible(
    input: VerificationScoringInput, 
    overallScore: number, 
    thresholds: any
  ): boolean {
    // Must meet overall score threshold
    if (overallScore < thresholds.autoApproval) return false;
    
    // Must have no fraud indicators
    if (input.fraudIndicators && input.fraudIndicators.length > 0) return false;
    
    // Must have appropriate content
    if (input.appropriateContent === false) return false;
    
    // Must have single faces in both photos (if applicable)
    if (input.singleFaceInLicense === false || input.singleFaceInSelfie === false) return false;
    
    // Minimum component scores for auto-approval
    const minDocumentScore = 0.7;
    const minPhotoScore = input.faceComparisonScore !== undefined ? 75 : undefined;
    
    if (input.documentConfidence !== undefined && input.documentConfidence < minDocumentScore) return false;
    if (minPhotoScore !== undefined && input.faceComparisonScore !== undefined && input.faceComparisonScore < minPhotoScore) return false;
    
    return true;
  }

  private isAutoRejectionEligible(
    input: VerificationScoringInput, 
    overallScore: number, 
    thresholds: any
  ): boolean {
    // Very low overall score
    if (overallScore < thresholds.autoRejection) return true;
    
    // Multiple fraud indicators
    if (input.fraudIndicators && input.fraudIndicators.length >= 3) return true;
    
    // Inappropriate content
    if (input.appropriateContent === false) return true;
    
    // Very poor face comparison
    if (input.faceComparisonScore !== undefined && input.faceComparisonScore < 40) return true;
    
    // Very poor document quality
    if (input.documentConfidence !== undefined && input.documentConfidence < 0.3) return true;
    
    return false;
  }

  private generateRecommendations(
    input: VerificationScoringInput, 
    components: any, 
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Document-related recommendations
    if (components.document.score < 0.6) {
      recommendations.push('Document quality is low - consider requesting higher quality images');
    }
    
    if (input.fraudIndicators && input.fraudIndicators.length > 0) {
      recommendations.push(`Fraud indicators detected: ${input.fraudIndicators.join(', ')}`);
    }
    
    // Address-related recommendations
    if (components.address.score < 0.6) {
      recommendations.push('Address verification failed - user may need to provide additional proof of address');
    }
    
    // Photo-related recommendations
    if (components.photo.score < 0.6) {
      recommendations.push('Photo comparison failed - request new selfie or document photo');
    }
    
    if (input.singleFaceInSelfie === false) {
      recommendations.push('Multiple faces detected in selfie - ensure only applicant is visible');
    }
    
    if (input.singleFaceInLicense === false) {
      recommendations.push('Multiple faces detected in license photo - may indicate fraudulent document');
    }
    
    // Overall recommendations
    if (overallScore < 0.5) {
      recommendations.push('Overall verification confidence is very low - manual review strongly recommended');
    } else if (overallScore < 0.7) {
      recommendations.push('Overall verification confidence is moderate - consider manual review');
    }
    
    return recommendations;
  }

  private identifyRiskFactors(input: VerificationScoringInput, components: any): string[] {
    const riskFactors: string[] = [];
    
    if (input.fraudIndicators && input.fraudIndicators.length > 0) {
      riskFactors.push(`Document fraud indicators (${input.fraudIndicators.length})`);
    }
    
    if (input.appropriateContent === false) {
      riskFactors.push('Inappropriate content detected');
    }
    
    if (input.faceComparisonScore !== undefined && input.faceComparisonScore < 60) {
      riskFactors.push('Low face comparison score');
    }
    
    if (input.addressMatchScore !== undefined && input.addressMatchScore < 0.5) {
      riskFactors.push('Address mismatch between user input and document');
    }
    
    if (components.document.score < 0.5) {
      riskFactors.push('Poor document quality or authenticity');
    }
    
    return riskFactors;
  }

  private generateNextSteps(
    autoApproval: boolean, 
    autoRejection: boolean, 
    manualReview: boolean,
    riskFactors: string[]
  ): string[] {
    const nextSteps: string[] = [];
    
    if (autoApproval) {
      nextSteps.push('Automatically approve verification');
      nextSteps.push('Update user verification status');
      nextSteps.push('Send approval notification');
    } else if (autoRejection) {
      nextSteps.push('Automatically reject verification');
      nextSteps.push('Send rejection notification with reasons');
      nextSteps.push('Allow resubmission with guidance');
    } else if (manualReview) {
      nextSteps.push('Queue for manual review');
      nextSteps.push('Notify review team');
      if (riskFactors.length > 0) {
        nextSteps.push(`Priority review due to: ${riskFactors.join(', ')}`);
      }
    }
    
    return nextSteps;
  }
}

export const verificationScoringService = new VerificationScoringService();
