
import {
  RekognitionClient,
  CreateCollectionCommand,
  DeleteCollectionCommand,
  ListCollectionsCommand,
  IndexFacesCommand,
  DeleteFacesCommand,
  SearchFacesByImageCommand,
  DetectFacesCommand,
  DescribeCollectionCommand,
} from '@aws-sdk/client-rekognition';
import { rekognitionClient, AWS_CONFIG } from './config';
import {
  FaceDetectionResult,
  FaceRegistrationResult,
  FaceMatchResult,
  CollectionInfo,
  DetectedFace,
  EnhancedDetectedFace,
  AgeEstimationResult,
  EmotionAnalysisResult,
  AgeComplianceResult,
} from './types';

// AWS Error types for enhanced error handling
interface AWSError extends Error {
  name: string;
  code?: string;
  statusCode?: number;
  retryable?: boolean;
  $metadata?: any;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

// AWS Service wrapper with enhanced error handling
class AWSServiceWrapper {
  private static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static isRetryableError(error: AWSError): boolean {
    // AWS service temporarily unavailable
    if (error.name === 'ServiceUnavailableException') return true;
    if (error.name === 'InternalServerError') return true;
    if (error.name === 'ThrottlingException') return true;
    if (error.name === 'ProvisionedThroughputExceededException') return true;
    
    // Network/timeout errors
    if (error.code === 'ECONNRESET') return true;
    if (error.code === 'ETIMEDOUT') return true;
    if (error.code === 'ENOTFOUND') return true;
    
    // HTTP status codes that should be retried
    if (error.statusCode === 429) return true; // Too Many Requests
    if (error.statusCode === 500) return true; // Internal Server Error
    if (error.statusCode === 502) return true; // Bad Gateway
    if (error.statusCode === 503) return true; // Service Unavailable
    if (error.statusCode === 504) return true; // Gateway Timeout
    
    return false;
  }

  private static calculateDelay(attemptNumber: number, config: RetryConfig): number {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attemptNumber - 1);
    return Math.min(delay, config.maxDelay);
  }

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: AWSError | null = null;

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        const result = await operation();
        
        // Log successful retry
        if (attempt > 1) {
          console.log(`AWS operation succeeded on attempt ${attempt}:`, context);
        }
        
        return result;
      } catch (error) {
        lastError = error as AWSError;
        
        // Enhanced error logging
        console.error(`AWS operation failed (attempt ${attempt}/${config.maxRetries + 1}):`, {
          context,
          error: lastError.name,
          message: lastError.message,
          code: lastError.code,
          statusCode: lastError.statusCode,
          retryable: this.isRetryableError(lastError),
        });

        // Don't retry if this is the last attempt or error is not retryable
        if (attempt > config.maxRetries || !this.isRetryableError(lastError)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, config);
        console.log(`Retrying AWS operation in ${delay}ms:`, context);
        
        await this.sleep(delay);
      }
    }

    // Enhance error with context and retry information
    const enhancedError = new Error(`AWS operation failed after ${config.maxRetries + 1} attempts: ${lastError?.message}`) as AWSError;
    enhancedError.name = lastError?.name || 'AWSServiceError';
    enhancedError.code = lastError?.code;
    enhancedError.statusCode = lastError?.statusCode;
    enhancedError.stack = lastError?.stack;
    
    throw enhancedError;
  }

  static async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    // Simple circuit breaker implementation
    // In production, use a more sophisticated circuit breaker library
    
    try {
      return await this.executeWithRetry(operation, context);
    } catch (error) {
      // Log circuit breaker activation
      console.error('AWS Circuit Breaker activated for:', context);
      
      // Return graceful degradation response
      throw new Error(`AWS service temporarily unavailable: ${context}`);
    }
  }
}

export class RekognitionService {
  private client: RekognitionClient;

  constructor() {
    this.client = rekognitionClient;
  }

  /**
   * Create a new face collection for a child
   */
  async createCollection(childId: string): Promise<{ success: boolean; collectionId?: string; error?: string }> {
    try {
      const collectionId = `${AWS_CONFIG.rekognitionCollectionPrefix}${childId}`;
      
      await AWSServiceWrapper.executeWithRetry(
        async () => {
          const command = new CreateCollectionCommand({
            CollectionId: collectionId,
          });
          return await this.client.send(command);
        },
        `createCollection-${childId}`
      );

      return {
        success: true,
        collectionId,
      };
    } catch (error: any) {
      console.error('Error creating collection:', error);
      
      // Handle specific AWS errors
      if (error.name === 'ResourceAlreadyExistsException') {
        return {
          success: false,
          error: 'Face collection already exists for this child',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to create face collection',
      };
    }
  }

  /**
   * Delete a face collection
   */
  async deleteCollection(collectionId: string): Promise<boolean> {
    try {
      const command = new DeleteCollectionCommand({
        CollectionId: collectionId,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting collection:', error);
      return false;
    }
  }

  /**
   * Get collection information
   */
  async getCollectionInfo(collectionId: string): Promise<CollectionInfo | null> {
    try {
      const command = new DescribeCollectionCommand({
        CollectionId: collectionId,
      });

      const response = await this.client.send(command);

      return {
        collectionId,
        faceCount: response.FaceCount || 0,
        creationTimestamp: response.CreationTimestamp || new Date(),
        faceModelVersion: response.FaceModelVersion || '',
      };
    } catch (error) {
      console.error('Error getting collection info:', error);
      return null;
    }
  }

  /**
   * Detect faces in an image
   */
  async detectFaces(imageBuffer: Buffer): Promise<FaceDetectionResult> {
    try {
      const response = await AWSServiceWrapper.executeWithRetry(
        async () => {
          const command = new DetectFacesCommand({
            Image: {
              Bytes: imageBuffer,
            },
            Attributes: ['ALL'], // Include all face attributes
          });
          return await this.client.send(command);
        },
        'detectFaces'
      );

      const faces = response.FaceDetails || [];

      return {
        success: true,
        faces: faces as DetectedFace[],
        faceCount: faces.length,
      };
    } catch (error: any) {
      console.error('Error detecting faces:', error);
      return {
        success: false,
        faces: [],
        faceCount: 0,
        error: error.message || 'Face detection failed',
      };
    }
  }

  /**
   * Register a face in a collection
   */
  async registerFace(
    collectionId: string,
    imageBuffer: Buffer,
    externalImageId?: string
  ): Promise<FaceRegistrationResult> {
    try {
      const command = new IndexFacesCommand({
        CollectionId: collectionId,
        Image: {
          Bytes: imageBuffer,
        },
        ExternalImageId: externalImageId,
        MaxFaces: 1, // Only index the primary face
        QualityFilter: 'AUTO',
        DetectionAttributes: ['ALL'],
      });

      const response = await this.client.send(command);
      
      if (!response.FaceRecords || response.FaceRecords.length === 0) {
        return {
          success: false,
          error: 'No face detected in the image',
        };
      }

      const faceRecord = response.FaceRecords[0];
      
      return {
        success: true,
        faceId: faceRecord.Face?.FaceId,
        faceRecord: faceRecord as any,
        imageId: faceRecord.Face?.ImageId,
        confidence: faceRecord.Face?.Confidence,
      };
    } catch (error: any) {
      console.error('Error registering face:', error);
      return {
        success: false,
        error: error.message || 'Face registration failed',
      };
    }
  }

  /**
   * Remove a face from a collection
   */
  async removeFace(collectionId: string, faceId: string): Promise<boolean> {
    try {
      const command = new DeleteFacesCommand({
        CollectionId: collectionId,
        FaceIds: [faceId],
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error removing face:', error);
      return false;
    }
  }

  /**
   * Search for matching faces in a collection
   */
  async searchFaces(
    collectionId: string,
    imageBuffer: Buffer,
    maxFaces: number = 10
  ): Promise<FaceMatchResult> {
    try {
      const response = await AWSServiceWrapper.executeWithRetry(
        async () => {
          const command = new SearchFacesByImageCommand({
            CollectionId: collectionId,
            Image: {
              Bytes: imageBuffer,
            },
            MaxFaces: maxFaces,
            FaceMatchThreshold: AWS_CONFIG.faceMatchThreshold,
          });
          return await this.client.send(command);
        },
        `searchFaces-${collectionId}`
      );
      
      // Also detect all faces in the image for unmatched faces
      const detectionResult = await this.detectFaces(imageBuffer);
      
      return {
        success: true,
        matches: (response.FaceMatches || [])
          .filter(match => match.Face && match.Face.FaceId)
          .map(match => ({
            Similarity: match.Similarity || 0,
            Face: {
              FaceId: match.Face!.FaceId!,
              BoundingBox: {
                Width: match.Face!.BoundingBox!.Width || 0,
                Height: match.Face!.BoundingBox!.Height || 0,
                Left: match.Face!.BoundingBox!.Left || 0,
                Top: match.Face!.BoundingBox!.Top || 0
              },
              ImageId: match.Face!.ImageId,
              ExternalImageId: match.Face!.ExternalImageId,
              Confidence: match.Face!.Confidence || 0
            }
          })),
        unmatched: detectionResult.faces,
        confidence: response.FaceMatches?.[0]?.Similarity || 0,
      };
    } catch (error: any) {
      console.error('Error searching faces:', error);
      
      // If no faces found, it's not necessarily an error
      if (error.name === 'InvalidParameterException' && error.message?.includes('no face')) {
        return {
          success: true,
          matches: [],
          unmatched: [],
        };
      }

      return {
        success: false,
        matches: [],
        unmatched: [],
        error: error.message || 'Face search failed',
      };
    }
  }

  /**
   * Validate image quality for face recognition
   */
  async validateFaceImage(imageBuffer: Buffer): Promise<{
    valid: boolean;
    faces: DetectedFace[];
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const detectionResult = await this.detectFaces(imageBuffer);
      
      if (!detectionResult.success) {
        errors.push(detectionResult.error || 'Face detection failed');
        return { valid: false, faces: [], errors, warnings };
      }

      const faces = detectionResult.faces;

      // Check if any faces were detected
      if (faces.length === 0) {
        errors.push('No faces detected in the image');
        return { valid: false, faces, errors, warnings };
      }

      // Check for multiple faces
      if (faces.length > 1) {
        warnings.push(`Multiple faces detected (${faces.length}). Only the primary face will be used.`);
      }

      // Check face quality
      const primaryFace = faces[0];
      
      if (primaryFace.Confidence < AWS_CONFIG.faceDetectionThreshold) {
        errors.push(`Face detection confidence too low (${primaryFace.Confidence.toFixed(1)}%). Please use a clearer image.`);
      }

      // Check face quality attributes
      if (primaryFace.Quality) {
        if (primaryFace.Quality.Brightness < 50) {
          warnings.push('Image appears to be too dark. Consider using better lighting.');
        }
        if (primaryFace.Quality.Sharpness < 50) {
          warnings.push('Image appears to be blurry. Please use a sharper image.');
        }
      }

      // Check face pose
      if (primaryFace.Pose) {
        const { Roll, Yaw, Pitch } = primaryFace.Pose;
        if (Math.abs(Roll) > 30 || Math.abs(Yaw) > 30 || Math.abs(Pitch) > 30) {
          warnings.push('Face appears to be at an angle. Front-facing photos work best.');
        }
      }

      return {
        valid: errors.length === 0,
        faces,
        errors,
        warnings,
      };
    } catch (error) {
      console.error('Error validating face image:', error);
      errors.push('Image validation failed');
      return { valid: false, faces: [], errors, warnings };
    }
  }
}

// Export singleton instance
export const rekognitionService = new RekognitionService();

// Enhanced AI Features Service Extensions
export class EnhancedRekognitionService extends RekognitionService {
  private enhancedClient: RekognitionClient;
  
  constructor() {
    super();
    this.enhancedClient = rekognitionClient; // Initialize client
  }
  
  /**
   * Perform comprehensive facial analysis including age estimation and emotion detection
   */
  async performEnhancedFacialAnalysis(imageBuffer: Buffer): Promise<{
    success: boolean;
    faces: EnhancedDetectedFace[];
    faceCount: number;
    error?: string;
  }> {
    try {
      const command = new DetectFacesCommand({
        Image: {
          Bytes: imageBuffer,
        },
        Attributes: ['ALL'], // Include all face attributes including age and emotions
      });

      const response = await this.enhancedClient.send(command);
      const faces = response.FaceDetails || [];

      const enhancedFaces: EnhancedDetectedFace[] = faces.map(face => ({
        ...face,
        // Enhanced processing for age estimation
        AgeEstimation: this.processAgeEstimation(face.AgeRange),
        // Enhanced processing for emotion detection
        EmotionAnalysis: this.processEmotionAnalysis(face.Emotions || []),
        // Overall confidence score
        OverallConfidence: face.Confidence || 0,
      })) as EnhancedDetectedFace[];

      return {
        success: true,
        faces: enhancedFaces,
        faceCount: enhancedFaces.length,
      };
    } catch (error: any) {
      console.error('Error in enhanced facial analysis:', error);
      return {
        success: false,
        faces: [],
        faceCount: 0,
        error: error.message || 'Enhanced facial analysis failed',
      };
    }
  }

  /**
   * Tag children in media using facial recognition across multiple collections
   */
  async tagChildrenInMedia(
    imageBuffer: Buffer,
    venueId: string,
    childCollectionIds: string[]
  ): Promise<{
    success: boolean;
    taggedChildren: Array<{
      childId: string;
      confidence: number;
      boundingBox: any;
      faceMatch: boolean;
    }>;
    unrecognizedFaces: Array<{
      boundingBox: any;
      confidence: number;
    }>;
    error?: string;
  }> {
    try {
      // First detect all faces in the image
      const faceDetectionResult = await this.performEnhancedFacialAnalysis(imageBuffer);
      
      if (!faceDetectionResult.success) {
        return {
          success: false,
          taggedChildren: [],
          unrecognizedFaces: [],
          error: faceDetectionResult.error,
        };
      }

      const taggedChildren: Array<{
        childId: string;
        confidence: number;
        boundingBox: any;
        faceMatch: boolean;
      }> = [];

      const unrecognizedFaces: Array<{
        boundingBox: any;
        confidence: number;
      }> = [];

      // For each detected face, try to match against all child collections
      for (const face of faceDetectionResult.faces) {
        let matched = false;
        let bestMatch: { childId: string; confidence: number } | null = null;

        // Search each child collection for face matches
        for (const collectionId of childCollectionIds) {
          try {
            const searchCommand = new SearchFacesByImageCommand({
              CollectionId: collectionId,
              Image: { Bytes: imageBuffer },
              MaxFaces: 1,
              FaceMatchThreshold: AWS_CONFIG.faceMatchThreshold,
            });

            const searchResult = await this.enhancedClient.send(searchCommand);
            
            if (searchResult.FaceMatches && searchResult.FaceMatches.length > 0) {
              const match = searchResult.FaceMatches[0];
              const confidence = match.Similarity || 0;
              
              if (!bestMatch || confidence > bestMatch.confidence) {
                bestMatch = {
                  childId: collectionId.replace(AWS_CONFIG.rekognitionCollectionPrefix, ''),
                  confidence,
                };
              }
            }
          } catch (searchError) {
            console.warn(`Search failed for collection ${collectionId}:`, searchError);
            // Continue with other collections
          }
        }

        // If we found a match above threshold, add to tagged children
        if (bestMatch && bestMatch.confidence >= AWS_CONFIG.faceMatchThreshold) {
          taggedChildren.push({
            childId: bestMatch.childId,
            confidence: bestMatch.confidence,
            boundingBox: face.BoundingBox,
            faceMatch: true,
          });
          matched = true;
        }

        // If no match found, add to unrecognized faces
        if (!matched) {
          unrecognizedFaces.push({
            boundingBox: face.BoundingBox,
            confidence: face.Confidence || 0,
          });
        }
      }

      return {
        success: true,
        taggedChildren,
        unrecognizedFaces,
      };
    } catch (error: any) {
      console.error('Error tagging children in media:', error);
      return {
        success: false,
        taggedChildren: [],
        unrecognizedFaces: [],
        error: error.message || 'Media tagging failed',
      };
    }
  }

  /**
   * Batch process multiple media files for child tagging
   */
  async batchTagMedia(
    mediaFiles: Array<{ id: string; buffer: Buffer; metadata: any }>,
    venueId: string,
    childCollectionIds: string[]
  ): Promise<{
    success: boolean;
    results: Array<{
      mediaId: string;
      taggedChildren: string[];
      confidence: number;
      processingTime: number;
    }>;
    error?: string;
  }> {
    try {
      const results: Array<{
        mediaId: string;
        taggedChildren: string[];
        confidence: number;
        processingTime: number;
      }> = [];

      for (const mediaFile of mediaFiles) {
        const startTime = Date.now();
        
        const taggingResult = await this.tagChildrenInMedia(
          mediaFile.buffer,
          venueId,
          childCollectionIds
        );

        const processingTime = Date.now() - startTime;

        if (taggingResult.success) {
          const avgConfidence = taggingResult.taggedChildren.length > 0
            ? taggingResult.taggedChildren.reduce((sum, child) => sum + child.confidence, 0) / taggingResult.taggedChildren.length
            : 0;

          results.push({
            mediaId: mediaFile.id,
            taggedChildren: taggingResult.taggedChildren.map(child => child.childId),
            confidence: avgConfidence,
            processingTime,
          });
        } else {
          results.push({
            mediaId: mediaFile.id,
            taggedChildren: [],
            confidence: 0,
            processingTime,
          });
        }
      }

      return {
        success: true,
        results,
      };
    } catch (error: any) {
      console.error('Error in batch media tagging:', error);
      return {
        success: false,
        results: [],
        error: error.message || 'Batch media tagging failed',
      };
    }
  }

  /**
   * Process age estimation with additional classification
   */
  private processAgeEstimation(ageRange?: any): AgeEstimationResult {
    if (!ageRange) {
      return {
        estimatedAge: 0,
        ageRange: { min: 0, max: 0 },
        ageGroup: 'UNKNOWN',
        confidence: 0,
      };
    }

    const estimatedAge = Math.round((ageRange.Low + ageRange.High) / 2);
    const ageGroup = this.classifyAgeGroup(estimatedAge);
    
    return {
      estimatedAge,
      ageRange: {
        min: ageRange.Low,
        max: ageRange.High,
      },
      ageGroup,
      confidence: this.calculateAgeConfidence(ageRange),
    };
  }

  /**
   * Classify age into predefined groups
   */
  private classifyAgeGroup(age: number): string {
    if (age <= 2) return 'INFANT';
    if (age <= 4) return 'TODDLER';
    if (age <= 6) return 'PRESCHOOL';
    if (age <= 12) return 'CHILD';
    if (age <= 18) return 'TEEN';
    if (age <= 25) return 'YOUNG_ADULT';
    if (age <= 65) return 'ADULT';
    return 'SENIOR';
  }

  /**
   * Calculate age confidence based on range width
   */
  private calculateAgeConfidence(ageRange: any): number {
    const rangeWidth = ageRange.High - ageRange.Low;
    // Narrower range = higher confidence
    return Math.max(0.1, 1.0 - (rangeWidth / 100));
  }

  /**
   * Process emotion detection with enhanced analysis
   */
  private processEmotionAnalysis(emotions: any[]): EmotionAnalysisResult {
    if (!emotions || emotions.length === 0) {
      return {
        primaryEmotion: 'NEUTRAL',
        primaryConfidence: 0,
        allEmotions: {},
        emotionIntensity: 'LOW',
        distressLevel: 'NONE',
        elationLevel: 'NONE',
        requiresIntervention: false,
      };
    }

    // Sort emotions by confidence
    const sortedEmotions = emotions
      .filter(emotion => emotion.Confidence > 10) // Filter out low confidence emotions
      .sort((a, b) => b.Confidence - a.Confidence);

    const primaryEmotion = sortedEmotions[0];
    const primaryEmotionType = this.mapAwsEmotionToCustom(primaryEmotion?.Type || 'CALM');
    const primaryConfidence = (primaryEmotion?.Confidence || 0) / 100;

    // Create emotion map
    const allEmotions: Record<string, number> = {};
    emotions.forEach(emotion => {
      allEmotions[this.mapAwsEmotionToCustom(emotion.Type)] = emotion.Confidence / 100;
    });

    // Analyze emotion intensity
    const emotionIntensity = this.calculateEmotionIntensity(primaryConfidence);
    
    // Assess distress and elation levels
    const distressLevel = this.assessDistressLevel(allEmotions);
    const elationLevel = this.assessElationLevel(allEmotions);
    
    // Determine if intervention is required
    const requiresIntervention = this.determineInterventionNeed(
      primaryEmotionType,
      primaryConfidence,
      distressLevel
    );

    return {
      primaryEmotion: primaryEmotionType,
      primaryConfidence,
      allEmotions,
      emotionIntensity,
      distressLevel,
      elationLevel,
      requiresIntervention,
    };
  }

  /**
   * Map AWS emotion types to custom emotion types
   */
  private mapAwsEmotionToCustom(awsEmotion: string): string {
    const emotionMap: Record<string, string> = {
      'HAPPY': 'HAPPY',
      'SAD': 'SAD',
      'ANGRY': 'ANGRY',
      'CONFUSED': 'CONFUSED',
      'DISGUSTED': 'DISGUST',
      'SURPRISED': 'SURPRISE',
      'CALM': 'CALM',
      'FEAR': 'FEAR',
    };
    
    return emotionMap[awsEmotion] || 'NEUTRAL';
  }

  /**
   * Calculate emotion intensity based on confidence
   */
  private calculateEmotionIntensity(confidence: number): string {
    if (confidence >= 0.9) return 'VERY_HIGH';
    if (confidence >= 0.7) return 'HIGH';
    if (confidence >= 0.5) return 'MEDIUM';
    if (confidence >= 0.3) return 'LOW';
    return 'VERY_LOW';
  }

  /**
   * Assess distress level based on emotion analysis
   */
  private assessDistressLevel(emotions: Record<string, number>): string {
    const distressEmotions = ['SAD', 'ANGRY', 'FEAR', 'DISGUST'];
    let maxDistressScore = 0;

    distressEmotions.forEach(emotion => {
      if (emotions[emotion]) {
        maxDistressScore = Math.max(maxDistressScore, emotions[emotion]);
      }
    });

    if (maxDistressScore >= 0.8) return 'CRITICAL';
    if (maxDistressScore >= 0.6) return 'SEVERE';
    if (maxDistressScore >= 0.4) return 'HIGH';
    if (maxDistressScore >= 0.2) return 'MODERATE';
    if (maxDistressScore > 0) return 'MILD';
    return 'NONE';
  }

  /**
   * Assess elation level based on emotion analysis
   */
  private assessElationLevel(emotions: Record<string, number>): string {
    const positiveEmotions = ['HAPPY', 'SURPRISE', 'EXCITED'];
    let maxElationScore = 0;

    positiveEmotions.forEach(emotion => {
      if (emotions[emotion]) {
        maxElationScore = Math.max(maxElationScore, emotions[emotion]);
      }
    });

    if (maxElationScore >= 0.9) return 'EXTREME';
    if (maxElationScore >= 0.7) return 'HIGH';
    if (maxElationScore >= 0.5) return 'MODERATE';
    if (maxElationScore >= 0.2) return 'MILD';
    return 'NONE';
  }

  /**
   * Determine if intervention is required based on emotional state
   */
  private determineInterventionNeed(
    primaryEmotion: string,
    confidence: number,
    distressLevel: string
  ): boolean {
    // High confidence distressing emotions require intervention
    if (['SAD', 'ANGRY', 'FEAR'].includes(primaryEmotion) && confidence > 0.7) {
      return true;
    }

    // Critical or severe distress levels always require intervention
    if (['CRITICAL', 'SEVERE'].includes(distressLevel)) {
      return true;
    }

    return false;
  }

  /**
   * Analyze age compliance for zone access
   */
  async analyzeAgeCompliance(
    imageBuffer: Buffer,
    zoneAgeRestrictions: { minAge?: number; maxAge?: number }
  ): Promise<AgeComplianceResult> {
    try {
      const analysis = await this.performEnhancedFacialAnalysis(imageBuffer);
      
      if (!analysis.success || analysis.faces.length === 0) {
        return {
          compliant: false,
          violation: true,
          reason: 'No face detected for age verification',
          estimatedAge: null,
          confidence: 0,
        };
      }

      const face = analysis.faces[0]; // Analyze primary face
      const ageEstimation = face.AgeEstimation;
      
      if (!ageEstimation) {
        return {
          compliant: false,
          violation: true,
          reason: 'Age estimation failed',
          estimatedAge: null,
          confidence: 0,
        };
      }

      const { estimatedAge } = ageEstimation;
      const { minAge, maxAge } = zoneAgeRestrictions;

      let compliant = true;
      let reason = 'Age requirements met';

      if (minAge && estimatedAge < minAge) {
        compliant = false;
        reason = `Too young for this zone (estimated: ${estimatedAge}, minimum: ${minAge})`;
      }

      if (maxAge && estimatedAge > maxAge) {
        compliant = false;
        reason = `Too old for this zone (estimated: ${estimatedAge}, maximum: ${maxAge})`;
      }

      return {
        compliant,
        violation: !compliant,
        reason,
        estimatedAge,
        ageGroup: ageEstimation.ageGroup,
        confidence: ageEstimation.confidence,
        recommendations: this.generateAgeRecommendations(estimatedAge, ageEstimation.ageGroup),
      };
    } catch (error: any) {
      console.error('Error in age compliance analysis:', error);
      return {
        compliant: false,
        violation: true,
        reason: 'Age compliance analysis failed',
        estimatedAge: null,
        confidence: 0,
      };
    }
  }

  /**
   * Generate age-appropriate recommendations
   */
  public generateAgeRecommendations(estimatedAge: number, ageGroup: string): string[] {
    const recommendations: string[] = [];

    switch (ageGroup) {
      case 'INFANT':
      case 'TODDLER':
        recommendations.push('Requires constant adult supervision');
        recommendations.push('Soft play area recommended');
        recommendations.push('Avoid small parts and choking hazards');
        break;
      case 'PRESCHOOL':
        recommendations.push('Adult supervision recommended');
        recommendations.push('Age-appropriate educational activities');
        recommendations.push('Structured play sessions');
        break;
      case 'CHILD':
        recommendations.push('Group activities suitable');
        recommendations.push('Moderate supervision sufficient');
        recommendations.push('Skill-building activities recommended');
        break;
      case 'TEEN':
        recommendations.push('Independent activities suitable');
        recommendations.push('Social interaction opportunities');
        recommendations.push('Challenge-based activities');
        break;
      default:
        recommendations.push('Standard safety protocols apply');
    }

    return recommendations;
  }
}

// Create enhanced service instance
export const enhancedRekognitionService = new EnhancedRekognitionService();
