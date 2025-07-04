// @ts-nocheck

import { RekognitionClient, CompareFacesCommand, DetectFacesCommand, DetectModerationLabelsCommand } from '@aws-sdk/client-rekognition';

interface FaceComparisonResult {
  similarity: number; // 0-100 scale
  confidence: number; // 0-100 scale
  isMatch: boolean;
  sourceImageQuality: {
    brightness: number;
    sharpness: number;
    confidence: number;
  };
  targetImageQuality: {
    brightness: number;
    sharpness: number;
    confidence: number;
  };
  boundingBoxes: {
    source: any;
    target: any;
  };
  landmarks: {
    source: any[];
    target: any[];
  };
  emotions: {
    source: any[];
    target: any[];
  };
  error?: string;
}

interface FaceDetectionResult {
  faces: any[];
  faceCount: number;
  hasMultipleFaces: boolean;
  qualityScore: number;
  confidence: number;
  error?: string;
}

interface ImageModerationResult {
  isAppropriate: boolean;
  moderationLabels: any[];
  confidence: number;
  error?: string;
}

export class AWSRekognitionService {
  private rekognitionClient: RekognitionClient;

  constructor() {
    this.rekognitionClient = new RekognitionClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
  }

  async compareFaces(
    sourceImageBuffer: Buffer,
    targetImageBuffer: Buffer,
    similarityThreshold: number = 80
  ): Promise<FaceComparisonResult> {
    try {
      const command = new CompareFacesCommand({
        SourceImage: {
          Bytes: sourceImageBuffer
        },
        TargetImage: {
          Bytes: targetImageBuffer
        },
        SimilarityThreshold: similarityThreshold,
        QualityFilter: 'AUTO'
      });

      const response = await this.rekognitionClient.send(command);

      if (!response.FaceMatches || response.FaceMatches.length === 0) {
        // No face matches found
        return {
          similarity: 0,
          confidence: 0,
          isMatch: false,
          sourceImageQuality: this.extractQualityInfo(response.SourceImageFace),
          targetImageQuality: { brightness: 0, sharpness: 0, confidence: 0 },
          boundingBoxes: {
            source: response.SourceImageFace?.BoundingBox,
            target: null
          },
          landmarks: {
            source: (response.SourceImageFace as any)?.Landmarks || [],
            target: []
          },
          emotions: {
            source: (response.SourceImageFace as any)?.Emotions || [],
            target: []
          },
          error: response.UnmatchedFaces && response.UnmatchedFaces.length > 0 
            ? 'Faces detected but no matches found' 
            : 'No faces detected in target image'
        };
      }

      // Get the best match
      const bestMatch = response.FaceMatches[0];
      const similarity = bestMatch.Similarity || 0;
      const confidence = bestMatch.Face?.Confidence || 0;

      return {
        similarity,
        confidence,
        isMatch: similarity >= similarityThreshold,
        sourceImageQuality: this.extractQualityInfo(response.SourceImageFace),
        targetImageQuality: this.extractQualityInfo(bestMatch.Face),
        boundingBoxes: {
          source: response.SourceImageFace?.BoundingBox,
          target: bestMatch.Face?.BoundingBox
        },
        landmarks: {
          source: (response.SourceImageFace as any)?.Landmarks || [],
          target: (bestMatch.Face as any)?.Landmarks || []
        },
        emotions: {
          source: (response.SourceImageFace as any)?.Emotions || [],
          target: (bestMatch.Face as any)?.Emotions || []
        }
      };

    } catch (error) {
      console.error('Face comparison error:', error);
      return {
        similarity: 0,
        confidence: 0,
        isMatch: false,
        sourceImageQuality: { brightness: 0, sharpness: 0, confidence: 0 },
        targetImageQuality: { brightness: 0, sharpness: 0, confidence: 0 },
        boundingBoxes: { source: null, target: null },
        landmarks: { source: [], target: [] },
        emotions: { source: [], target: [] },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async detectFaces(imageBuffer: Buffer): Promise<FaceDetectionResult> {
    try {
      const command = new DetectFacesCommand({
        Image: {
          Bytes: imageBuffer
        },
        Attributes: ['ALL'] // Get all facial attributes
      });

      const response = await this.rekognitionClient.send(command);
      const faces = response.FaceDetails || [];

      let totalQuality = 0;
      let totalConfidence = 0;

      for (const face of faces) {
        totalConfidence += face.Confidence || 0;
        if (face.Quality) {
          totalQuality += (face.Quality.Brightness || 0) + (face.Quality.Sharpness || 0);
        }
      }

      const averageQuality = faces.length > 0 ? totalQuality / (faces.length * 2) : 0;
      const averageConfidence = faces.length > 0 ? totalConfidence / faces.length : 0;

      return {
        faces,
        faceCount: faces.length,
        hasMultipleFaces: faces.length > 1,
        qualityScore: averageQuality / 100, // Normalize to 0-1
        confidence: averageConfidence / 100, // Normalize to 0-1
      };

    } catch (error) {
      console.error('Face detection error:', error);
      return {
        faces: [],
        faceCount: 0,
        hasMultipleFaces: false,
        qualityScore: 0,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async moderateImage(imageBuffer: Buffer): Promise<ImageModerationResult> {
    try {
      const command = new DetectModerationLabelsCommand({
        Image: {
          Bytes: imageBuffer
        },
        MinConfidence: 50
      });

      const response = await this.rekognitionClient.send(command);
      const moderationLabels = response.ModerationLabels || [];

      // Check for inappropriate content
      const inappropriateLabels = moderationLabels.filter(label => 
        (label.Confidence || 0) > 75 && 
        ['Explicit Nudity', 'Violence', 'Graphic Violence', 'Weapons'].includes(label.Name || '')
      );

      const totalConfidence = moderationLabels.length > 0 
        ? moderationLabels.reduce((sum, label) => sum + (label.Confidence || 0), 0) / moderationLabels.length
        : 100;

      return {
        isAppropriate: inappropriateLabels.length === 0,
        moderationLabels,
        confidence: totalConfidence / 100
      };

    } catch (error) {
      console.error('Image moderation error:', error);
      return {
        isAppropriate: true, // Default to appropriate if can't analyze
        moderationLabels: [],
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private extractQualityInfo(face: any): {
    brightness: number;
    sharpness: number;
    confidence: number;
  } {
    if (!face || !face.Quality) {
      return { brightness: 0, sharpness: 0, confidence: 0 };
    }

    return {
      brightness: face.Quality.Brightness || 0,
      sharpness: face.Quality.Sharpness || 0,
      confidence: face.Confidence || 0
    };
  }

  // Enhanced face comparison with additional quality checks
  async performEnhancedFaceComparison(
    licensePhotoBuffer: Buffer,
    selfieBuffer: Buffer,
    strictMode: boolean = true
  ): Promise<{
    comparisonResult: FaceComparisonResult;
    licenseAnalysis: FaceDetectionResult;
    selfieAnalysis: FaceDetectionResult;
    licenseModeration: ImageModerationResult;
    selfieModeration: ImageModerationResult;
    overallQualityScore: number;
    recommendations: string[];
    autoApprovalEligible: boolean;
  }> {
    try {
      // Run all analyses in parallel
      const [
        comparisonResult,
        licenseAnalysis,
        selfieAnalysis,
        licenseModeration,
        selfieModeration
      ] = await Promise.all([
        this.compareFaces(licensePhotoBuffer, selfieBuffer, strictMode ? 85 : 75),
        this.detectFaces(licensePhotoBuffer),
        this.detectFaces(selfieBuffer),
        this.moderateImage(licensePhotoBuffer),
        this.moderateImage(selfieBuffer)
      ]);

      const recommendations: string[] = [];
      
      // Quality checks and recommendations
      if (licenseAnalysis.faceCount === 0) {
        recommendations.push('No face detected in license photo');
      } else if (licenseAnalysis.faceCount > 1) {
        recommendations.push('Multiple faces detected in license photo');
      }

      if (selfieAnalysis.faceCount === 0) {
        recommendations.push('No face detected in selfie');
      } else if (selfieAnalysis.faceCount > 1) {
        recommendations.push('Multiple faces detected in selfie');
      }

      if (licenseAnalysis.qualityScore < 0.6) {
        recommendations.push('License photo quality is low');
      }

      if (selfieAnalysis.qualityScore < 0.6) {
        recommendations.push('Selfie quality is low');
      }

      if (!licenseModeration.isAppropriate || !selfieModeration.isAppropriate) {
        recommendations.push('Image contains inappropriate content');
      }

      // Calculate overall quality score
      const qualityFactors = [
        comparisonResult.confidence / 100,
        licenseAnalysis.qualityScore,
        selfieAnalysis.qualityScore,
        licenseModeration.confidence,
        selfieModeration.confidence
      ];

      const overallQualityScore = qualityFactors.reduce((sum, score) => sum + score, 0) / qualityFactors.length;

      // Determine auto-approval eligibility
      const autoApprovalEligible = 
        comparisonResult.isMatch &&
        comparisonResult.similarity >= (strictMode ? 85 : 75) &&
        licenseAnalysis.faceCount === 1 &&
        selfieAnalysis.faceCount === 1 &&
        licenseAnalysis.qualityScore >= 0.6 &&
        selfieAnalysis.qualityScore >= 0.6 &&
        licenseModeration.isAppropriate &&
        selfieModeration.isAppropriate &&
        overallQualityScore >= 0.7;

      return {
        comparisonResult,
        licenseAnalysis,
        selfieAnalysis,
        licenseModeration,
        selfieModeration,
        overallQualityScore,
        recommendations,
        autoApprovalEligible
      };

    } catch (error) {
      console.error('Enhanced face comparison error:', error);
      
      // Return safe defaults on error
      return {
        comparisonResult: {
          similarity: 0,
          confidence: 0,
          isMatch: false,
          sourceImageQuality: { brightness: 0, sharpness: 0, confidence: 0 },
          targetImageQuality: { brightness: 0, sharpness: 0, confidence: 0 },
          boundingBoxes: { source: null, target: null },
          landmarks: { source: [], target: [] },
          emotions: { source: [], target: [] },
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        licenseAnalysis: { faces: [], faceCount: 0, hasMultipleFaces: false, qualityScore: 0, confidence: 0 },
        selfieAnalysis: { faces: [], faceCount: 0, hasMultipleFaces: false, qualityScore: 0, confidence: 0 },
        licenseModeration: { isAppropriate: true, moderationLabels: [], confidence: 0 },
        selfieModeration: { isAppropriate: true, moderationLabels: [], confidence: 0 },
        overallQualityScore: 0,
        recommendations: ['Error during face comparison analysis'],
        autoApprovalEligible: false
      };
    }
  }
}

export const awsRekognitionService = new AWSRekognitionService();
