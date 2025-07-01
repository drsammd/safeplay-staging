
// AWS Rekognition Types
export interface BoundingBox {
  Width: number;
  Height: number;
  Left: number;
  Top: number;
}

export interface Landmark {
  Type: string;
  X: number;
  Y: number;
}

export interface Emotion {
  Type: string;
  Confidence: number;
}

export interface AgeRange {
  Low: number;
  High: number;
}

export interface FaceQuality {
  Brightness: number;
  Sharpness: number;
}

export interface DetectedFace {
  BoundingBox: BoundingBox;
  Confidence: number;
  Landmarks?: Landmark[];
  Pose?: {
    Roll: number;
    Yaw: number;
    Pitch: number;
  };
  Quality?: FaceQuality;
  Emotions?: Emotion[];
  AgeRange?: AgeRange;
  Smile?: {
    Value: boolean;
    Confidence: number;
  };
  Eyeglasses?: {
    Value: boolean;
    Confidence: number;
  };
  Sunglasses?: {
    Value: boolean;
    Confidence: number;
  };
  Gender?: {
    Value: string;
    Confidence: number;
  };
  Beard?: {
    Value: boolean;
    Confidence: number;
  };
  Mustache?: {
    Value: boolean;
    Confidence: number;
  };
  EyesOpen?: {
    Value: boolean;
    Confidence: number;
  };
  MouthOpen?: {
    Value: boolean;
    Confidence: number;
  };
}

export interface FaceMatch {
  Similarity: number;
  Face: {
    FaceId: string;
    BoundingBox: BoundingBox;
    ImageId?: string;
    ExternalImageId?: string;
    Confidence: number;
  };
}

export interface FaceRecord {
  Face: {
    FaceId: string;
    BoundingBox: BoundingBox;
    ImageId: string;
    ExternalImageId?: string;
    Confidence: number;
  };
  FaceDetail: DetectedFace;
}

// Service Response Types
export interface FaceDetectionResult {
  success: boolean;
  faces: DetectedFace[];
  faceCount: number;
  error?: string;
}

export interface FaceRegistrationResult {
  success: boolean;
  faceId?: string;
  faceRecord?: FaceRecord;
  imageId?: string;
  confidence?: number;
  error?: string;
}

export interface FaceMatchResult {
  success: boolean;
  matches: FaceMatch[];
  unmatched: DetectedFace[];
  confidence?: number;
  error?: string;
}

export interface CollectionInfo {
  collectionId: string;
  faceCount: number;
  creationTimestamp: Date;
  faceModelVersion: string;
}

// Image Processing Types
export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  imageKey?: string;
  bucket?: string;
  error?: string;
}

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Face Recognition Event Types
export interface FaceRecognitionEventData {
  eventType: 'FACE_DETECTED' | 'FACE_MATCHED' | 'FACE_UNMATCHED' | 'MULTIPLE_FACES';
  confidence: number;
  matchedFaceId?: string;
  sourceImageUrl: string;
  sourceImageKey: string;
  boundingBox?: BoundingBox;
  recognitionData?: any;
  processingTime?: number;
}

// Enhanced AI Features Types

export interface EnhancedDetectedFace extends DetectedFace {
  AgeEstimation?: AgeEstimationResult;
  EmotionAnalysis?: EmotionAnalysisResult;
  OverallConfidence?: number;
}

export interface AgeEstimationResult {
  estimatedAge: number;
  ageRange: {
    min: number;
    max: number;
  };
  ageGroup: string;
  confidence: number;
}

export interface EmotionAnalysisResult {
  primaryEmotion: string;
  primaryConfidence: number;
  allEmotions: Record<string, number>;
  emotionIntensity: string;
  distressLevel: string;
  elationLevel: string;
  requiresIntervention: boolean;
}

export interface AgeComplianceResult {
  compliant: boolean;
  violation: boolean;
  reason: string;
  estimatedAge: number | null;
  ageGroup?: string;
  confidence: number;
  recommendations?: string[];
}

export interface CrowdAnalysisResult {
  success: boolean;
  totalPeopleCount: number;
  childrenCount: number;
  adultsCount: number;
  densityLevel: string;
  densityScore: number;
  capacityUtilization: number;
  overcrowdingDetected: boolean;
  riskLevel: string;
  recommendations: string[];
  error?: string;
}

export interface BehaviorAnalysisResult {
  success: boolean;
  behaviorType: string;
  behaviorSubtype?: string;
  detectionConfidence: number;
  severityLevel: string;
  riskAssessment: string;
  immediateIntervention: boolean;
  emergencyResponse: boolean;
  behaviorDescription: string;
  recommendations: string[];
  error?: string;
}

export interface VoiceAnalysisResult {
  success: boolean;
  voiceType: string;
  emotionalState: string;
  intensityLevel: string;
  confidenceLevel: number;
  distressDetected: boolean;
  helpCallDetected: boolean;
  panicDetected: boolean;
  transcription?: string;
  recommendations: string[];
  error?: string;
}

export interface VisualPatternResult {
  success: boolean;
  patternType: string;
  patternSubtype?: string;
  detectionConfidence: number;
  engagementLevel: string;
  comfortLevel: string;
  anxietyLevel: string;
  visualDistressSignals: boolean;
  happinessIndicators: boolean;
  recommendations: string[];
  error?: string;
}
