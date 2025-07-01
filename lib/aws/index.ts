
// Export all AWS services and utilities
export * from './config';
export * from './types';
export * from './s3-service';
export * from './rekognition-service';

// Re-export services as named exports
export { s3Service } from './s3-service';
export { rekognitionService, enhancedRekognitionService } from './rekognition-service';

// Re-export configuration utilities
export { validateAWSConfig, isAWSAvailable, getAWSConfigStatus, isDevelopmentMode } from './config';
