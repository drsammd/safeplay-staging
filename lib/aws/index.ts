
// Export all AWS services and utilities
export * from './config';
export * from './types';
export * from './s3-service';

// Export rekognition service types and classes (excluding conflicting interfaces)
export type { 
  DetectionResult, 
  TaggingResult, 
  FacialAnalysisResult
} from './rekognition-service';

export { 
  EnhancedRekognitionService 
} from './rekognition-service';

// Re-export services as named exports
export { s3Service } from './s3-service';
export { enhancedRekognitionService } from './rekognition-service';

// Re-export configuration utilities
export { validateAWSConfig, isAWSAvailable, getAWSConfigStatus, isDevelopmentMode } from './config';
