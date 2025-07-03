
import AWS from 'aws-sdk';
import { awsConfig } from './config';
import { prisma } from '../db';

export interface DetectionResult {
  success: boolean;
  detections?: Array<{
    childId: string;
    confidence: number;
    boundingBox: {
      left: number;
      top: number;
      width: number;
      height: number;
    };
  }>;
  warnings?: string[];
  error?: string;
}

export interface TaggingResult {
  success: boolean;
  taggedChildren?: Array<{
    childId: string;
    confidence: number;
  }>;
  error?: string;
}

export interface FacialAnalysisResult {
  success: boolean;
  analysis?: {
    ageRange?: { low: number; high: number };
    emotions?: Array<{ type: string; confidence: number }>;
    attributes?: any;
  };
  error?: string;
}

export interface AgeComplianceResult {
  success: boolean;
  compliant?: boolean;
  estimatedAge?: number;
  requiredAge?: number;
  error?: string;
}

export class EnhancedRekognitionService {
  private rekognition: AWS.Rekognition;

  constructor() {
    this.rekognition = new AWS.Rekognition(awsConfig);
  }

  // Detect faces in an image (enhanced for compatibility)
  async detectFaces(imageInput: string | Buffer): Promise<DetectionResult & { faces?: any[] }> {
    try {
      let imageBuffer: Buffer;
      
      if (typeof imageInput === 'string') {
        // Download image and convert to buffer
        const response = await fetch(imageInput);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        // Already a buffer
        imageBuffer = imageInput;
      }

      const params = {
        Image: {
          Bytes: imageBuffer
        },
        Attributes: ['ALL']
      };

      const result = await this.rekognition.detectFaces(params).promise();
      
      const detections = result.FaceDetails?.map(face => ({
        childId: '', // Will be populated by face matching
        confidence: face.Confidence || 0,
        boundingBox: {
          left: face.BoundingBox?.Left || 0,
          top: face.BoundingBox?.Top || 0,
          width: face.BoundingBox?.Width || 0,
          height: face.BoundingBox?.Height || 0
        }
      })) || [];

      // Return both the standard format and compatibility format
      return {
        success: true,
        detections,
        faces: result.FaceDetails || [], // For compatibility with existing code
        warnings: [] // No warnings for successful detection
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Face detection failed',
        warnings: []
      };
    }
  }

  // Search for faces in collections
  async searchFacesByImage(
    imageUrl: string,
    collectionId: string,
    threshold: number = 80
  ): Promise<DetectionResult> {
    try {
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();

      const params = {
        CollectionId: collectionId,
        Image: {
          Bytes: Buffer.from(imageBuffer)
        },
        FaceMatchThreshold: threshold,
        MaxFaces: 10
      };

      const result = await this.rekognition.searchFacesByImage(params).promise();
      
      const detections = result.FaceMatches?.map(match => ({
        childId: match.Face?.ExternalImageId || '',
        confidence: match.Similarity || 0,
        boundingBox: {
          left: match.Face?.BoundingBox?.Left || 0,
          top: match.Face?.BoundingBox?.Top || 0,
          width: match.Face?.BoundingBox?.Width || 0,
          height: match.Face?.BoundingBox?.Height || 0
        }
      })) || [];

      return {
        success: true,
        detections
      };
    } catch (error) {
      console.error('Face search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Face search failed'
      };
    }
  }

  // Add missing method: performEnhancedFacialAnalysis
  async performEnhancedFacialAnalysis(imageUrl: string): Promise<FacialAnalysisResult> {
    try {
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();

      const params = {
        Image: {
          Bytes: Buffer.from(imageBuffer)
        },
        Attributes: ['ALL']
      };

      const result = await this.rekognition.detectFaces(params).promise();
      
      if (!result.FaceDetails || result.FaceDetails.length === 0) {
        return {
          success: false,
          error: 'No faces detected in image'
        };
      }

      const face = result.FaceDetails[0];
      
      return {
        success: true,
        analysis: {
          ageRange: face.AgeRange ? { 
            low: face.AgeRange.Low || 0, 
            high: face.AgeRange.High || 0 
          } : undefined,
          emotions: face.Emotions?.map(emotion => ({
            type: emotion.Type || 'UNKNOWN',
            confidence: emotion.Confidence || 0
          })) || [],
          attributes: {
            gender: face.Gender,
            smile: face.Smile,
            eyeglasses: face.Eyeglasses,
            sunglasses: face.Sunglasses,
            beard: face.Beard,
            mustache: face.Mustache
          }
        }
      };
    } catch (error) {
      console.error('Enhanced facial analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Enhanced facial analysis failed'
      };
    }
  }

  // Add missing method: analyzeAgeCompliance
  async analyzeAgeCompliance(
    imageUrl: string, 
    requiredAge: number = 13
  ): Promise<AgeComplianceResult> {
    try {
      const analysisResult = await this.performEnhancedFacialAnalysis(imageUrl);
      
      if (!analysisResult.success || !analysisResult.analysis?.ageRange) {
        return {
          success: false,
          error: 'Could not analyze age from image'
        };
      }

      const ageRange = analysisResult.analysis.ageRange;
      const estimatedAge = (ageRange.low + ageRange.high) / 2;
      const compliant = estimatedAge >= requiredAge;

      return {
        success: true,
        compliant,
        estimatedAge,
        requiredAge
      };
    } catch (error) {
      console.error('Age compliance analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Age compliance analysis failed'
      };
    }
  }

  // detectAndTagChildren method
  async detectAndTagChildren({
    fileUrl,
    mediaType,
    venueId,
    childCollectionIds
  }: {
    fileUrl: string;
    mediaType: string;
    venueId: string;
    childCollectionIds: Array<{
      childId: string;
      collectionId: string;
    }>;
  }): Promise<TaggingResult> {
    try {
      const taggedChildren: Array<{ childId: string; confidence: number }> = [];

      // For each collection, search for faces
      for (const { childId, collectionId } of childCollectionIds) {
        try {
          const searchResult = await this.searchFacesByImage(
            fileUrl,
            collectionId,
            75 // Lower threshold for better detection
          );

          if (searchResult.success && searchResult.detections) {
            for (const detection of searchResult.detections) {
              if (detection.confidence > 75) {
                taggedChildren.push({
                  childId,
                  confidence: detection.confidence
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error searching in collection ${collectionId}:`, error);
          // Continue with other collections
        }
      }

      // Remove duplicates and keep highest confidence
      const uniqueTaggedChildren = taggedChildren.reduce((acc, current) => {
        const existing = acc.find(item => item.childId === current.childId);
        if (!existing || current.confidence > existing.confidence) {
          return [...acc.filter(item => item.childId !== current.childId), current];
        }
        return acc;
      }, [] as Array<{ childId: string; confidence: number }>);

      return {
        success: true,
        taggedChildren: uniqueTaggedChildren
      };
    } catch (error) {
      console.error('Error in detectAndTagChildren:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to detect and tag children'
      };
    }
  }

  // Create face collection
  async createCollection(collectionId: string): Promise<{ success: boolean; collectionId?: string; error?: string }> {
    try {
      await this.rekognition.createCollection({
        CollectionId: collectionId
      }).promise();

      return { success: true, collectionId };
    } catch (error) {
      console.error('Create collection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create collection'
      };
    }
  }

  // Index face to collection
  async indexFace(
    imageUrl: string,
    collectionId: string,
    externalImageId: string
  ): Promise<{ success: boolean; faceId?: string; confidence?: number; error?: string }> {
    try {
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();

      const params = {
        CollectionId: collectionId,
        Image: {
          Bytes: Buffer.from(imageBuffer)
        },
        ExternalImageId: externalImageId,
        MaxFaces: 1,
        QualityFilter: 'AUTO' as const,
        DetectionAttributes: ['ALL' as const]
      };

      const result = await this.rekognition.indexFaces(params).promise();
      
      const faceRecord = result.FaceRecords?.[0];
      const faceId = faceRecord?.Face?.FaceId;
      const confidence = faceRecord?.Face?.Confidence || 0;

      return {
        success: true,
        faceId,
        confidence
      };
    } catch (error) {
      console.error('Index face error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to index face'
      };
    }
  }

  // Delete face from collection
  async deleteFace(collectionId: string, faceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.rekognition.deleteFaces({
        CollectionId: collectionId,
        FaceIds: [faceId]
      }).promise();

      return { success: true };
    } catch (error) {
      console.error('Delete face error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete face'
      };
    }
  }

  // List faces in collection
  async listFaces(collectionId: string) {
    try {
      const result = await this.rekognition.listFaces({
        CollectionId: collectionId
      }).promise();

      return {
        success: true,
        faces: result.Faces || []
      };
    } catch (error) {
      console.error('List faces error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list faces'
      };
    }
  }

  // Add missing method: getCollectionInfo (for compatibility)
  async getCollectionInfo(collectionId: string) {
    try {
      const listResult = await this.listFaces(collectionId);
      return {
        success: listResult.success,
        collectionId,
        faceCount: listResult.faces?.length || 0,
        faces: listResult.faces || [],
        error: listResult.error
      };
    } catch (error) {
      console.error('Get collection info error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get collection info'
      };
    }
  }

  // Add missing method: deleteCollection (for compatibility)
  async deleteCollection(collectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.rekognition.deleteCollection({
        CollectionId: collectionId
      }).promise();

      return { success: true };
    } catch (error) {
      console.error('Delete collection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete collection'
      };
    }
  }
}

export const enhancedRekognitionService = new EnhancedRekognitionService();
