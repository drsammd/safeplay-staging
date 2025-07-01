
// Common types for floor plan and camera management
// These types are designed to be compatible with Prisma generated types
// while providing flexibility for UI components

export interface FloorPlan {
  id: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileType?: string;
  originalFileName?: string;
  fileSize?: number;
  version?: number;
  isActive?: boolean;
  dimensions?: {
    width: number;
    height: number;
    scale?: number;
  };
  metadata?: Record<string, any>;
  venueId?: string;
  uploadedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
  cameras?: CameraDevice[] | SimpleCameraDevice[]; // Allow both comprehensive and simple camera arrays
  zones?: Zone[];
}

// Main Camera interface for comprehensive camera data
export interface CameraDevice {
  id?: string;
  name: string;
  model?: string;
  serialNumber?: string;
  ipAddress?: string;
  streamUrl?: string;
  status: CameraStatus | string; // Allow both enum and string for flexibility
  position?: { x: number; y: number };
  viewAngle?: number; // Made optional for compatibility
  viewDistance?: number; // Made optional for compatibility
  rotation?: number; // Made optional for compatibility
  height?: number; // Made optional for compatibility
  isRecordingEnabled?: boolean; // Made optional for compatibility
  isRecognitionEnabled?: boolean; // Made optional for compatibility
  recognitionThreshold?: number; // Made optional for compatibility
  specifications?: Record<string, any>;
  configuration?: Record<string, any>;
  venueId?: string;
  floorPlanId?: string;
  lastPing?: string;
  createdAt?: string;
  updatedAt?: string;
  venue?: {
    id: string;
    name: string;
  };
  floorPlan?: {
    id: string;
    name: string;
  };
  coverageAreas?: CameraCoverageArea[];
  recognitionZones?: CameraRecognitionZone[];
  cameraEvents?: CameraEvent[];
}

// Simplified camera interface for basic displays
export interface SimpleCameraDevice {
  id: string;
  name: string;
  status: string;
}

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  coordinates: Array<{ x: number; y: number }>;
  color: string;
  description?: string;
  metadata?: Record<string, any>;
  floorPlanId: string;
  createdAt?: string;
  updatedAt?: string;
  floorPlan?: {
    id: string;
    name: string;
  };
  cameras?: CameraDevice[];
}

export interface CameraCoverageArea {
  id: string;
  cameraId: string;
  area: Array<{ x: number; y: number }>;
  confidence: number;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CameraRecognitionZone {
  id: string;
  name: string;
  cameraId: string;
  coordinates: Array<{ x: number; y: number }>;
  isActive: boolean;
  recognitionTypes: string[];
  sensitivity: number;
  alertsEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CameraEvent {
  id: string;
  type: CameraEventType;
  description?: string;
  severity: CameraEventSeverity;
  metadata?: Record<string, any>;
  cameraId: string;
  venueId?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface CameraRecommendation {
  id: string;
  venueId: string;
  floorPlanId?: string;
  recommendationType: CameraRecommendationType;
  suggestedPosition: { x: number; y: number };
  reasoning: string;
  priority: CameraRecommendationPriority;
  coverageArea?: Array<{ x: number; y: number }>;
  estimatedCost?: number;
  status: CameraRecommendationStatus;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// Enums
export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR' | 'INACTIVE';

export type ZoneType = 
  | 'ENTRANCE'
  | 'EXIT'
  | 'PLAY_AREA'
  | 'RESTROOM'
  | 'FOOD_COURT'
  | 'OFFICE'
  | 'STORAGE'
  | 'EMERGENCY_EXIT'
  | 'HIGH_TRAFFIC'
  | 'RESTRICTED';

export type CameraEventType =
  | 'OFFLINE'
  | 'ONLINE'
  | 'ERROR'
  | 'MAINTENANCE_REQUIRED'
  | 'CONFIGURATION_CHANGED'
  | 'RECORDING_STARTED'
  | 'RECORDING_STOPPED'
  | 'MOTION_DETECTED'
  | 'FACE_DETECTED'
  | 'ALERT_TRIGGERED';

export type CameraEventSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type CameraRecommendationType =
  | 'COVERAGE_GAP'
  | 'BLIND_SPOT'
  | 'HIGH_TRAFFIC'
  | 'ENTRANCE_EXIT'
  | 'SECURITY_ENHANCEMENT'
  | 'REDUNDANCY';

export type CameraRecommendationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CameraRecommendationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';

// Type aliases for easier migration and backwards compatibility
export type Camera = CameraDevice; // Main alias for comprehensive camera data
export type FloorPlanViewerCamera = CameraDevice; // Backwards compatibility

// Helper type for camera creation/updates with required fields
export interface CameraInput {
  name: string;
  status: CameraStatus | string;
  position?: { x: number; y: number };
  viewAngle?: number;
  viewDistance?: number;
  rotation?: number;
  height?: number;
  isRecordingEnabled?: boolean;
  isRecognitionEnabled?: boolean;
  recognitionThreshold?: number;
  venueId?: string;
  floorPlanId?: string;
}

export interface CoverageData {
  floorPlan: {
    id: string;
    name: string;
    dimensions: { width: number; height: number };
  };
  cameras: Array<{
    cameraId: string;
    cameraName: string;
    coverage: {
      polygon: Array<{ x: number; y: number }>;
      area: number;
      percentage: number;
      blindSpots: Array<{
        type: string;
        position: { x: number; y: number };
        area: number;
      }>;
    } | null;
  }>;
  totalCoverage: {
    coveragePercentage: number;
    coveredArea: number;
    totalArea: number;
    uncoveredAreas: Array<{
      center: { x: number; y: number };
      size: number;
    }>;
  } | null;
}
