
export interface KioskConfig {
  id: string;
  kioskId: string;
  name: string;
  location: string;
  kioskType: 'CHECK_IN_TERMINAL' | 'CHECK_OUT_TERMINAL' | 'DUAL_PURPOSE' | 'MOBILE_TABLET';
  venueId: string;
  ipAddress?: string;
  macAddress?: string;
  capabilities: KioskCapability[];
  settings: KioskSettings;
  status: KioskStatus;
}

export interface KioskSettings {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  timeout: number; // seconds
  maxSessionDuration: number; // minutes
  enableBiometric: boolean;
  enableQRScanning: boolean;
  enablePhotoCapture: boolean;
  enableVoiceInstructions: boolean;
  autoLogout: boolean;
  requireParentConfirmation: boolean;
  allowEmergencyAccess: boolean;
  displaySettings: {
    brightness: number;
    orientation: 'portrait' | 'landscape';
    screensaver: boolean;
    screensaverTimeout: number;
  };
  security: {
    encryptData: boolean;
    requirePin: boolean;
    maxFailedAttempts: number;
    lockoutDuration: number;
  };
}

export type KioskCapability = 
  | 'QR_SCANNING'
  | 'PHOTO_CAPTURE'
  | 'BIOMETRIC_SCAN'
  | 'TOUCHSCREEN'
  | 'VOICE_INSTRUCTIONS'
  | 'PRINTER'
  | 'CARD_READER'
  | 'EMERGENCY_BUTTON';

export type KioskStatus = 
  | 'ONLINE'
  | 'OFFLINE'
  | 'IDLE'
  | 'BUSY'
  | 'MAINTENANCE'
  | 'ERROR'
  | 'UPDATING';

export interface KioskSession {
  id: string;
  sessionId: string;
  kioskId: string;
  sessionType: 'CHECK_IN' | 'CHECK_OUT' | 'REGISTRATION' | 'EMERGENCY';
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ERROR';
  startTime: string;
  endTime?: string;
  duration?: number;
  parentId?: string;
  childrenIds: string[];
  language: string;
  steps: KioskSessionStep[];
  currentStep?: string;
  completedSteps: string[];
  metadata?: Record<string, any>;
}

export interface KioskSessionStep {
  id: string;
  name: string;
  title: string;
  description: string;
  type: 'WELCOME' | 'QR_SCAN' | 'PHOTO_CAPTURE' | 'CONFIRMATION' | 'COMPLETION';
  required: boolean;
  completed: boolean;
  data?: Record<string, any>;
  error?: string;
}

export interface KioskMetrics {
  kioskId: string;
  timestamp: string;
  systemMetrics: {
    cpuUsage: number;
    memoryUsed: number;
    diskUsage: number;
    temperature: number;
    batteryLevel?: number;
    networkStatus: 'connected' | 'disconnected' | 'limited';
  };
  performanceMetrics: {
    responseTime: number;
    errorRate: number;
    uptime: number;
    sessionsCompleted: number;
    sessionsErrored: number;
  };
  usageMetrics: {
    totalSessions: number;
    dailySessions: number;
    averageSessionDuration: number;
    peakUsageHours: string[];
    mostUsedFeatures: string[];
  };
}

export class KioskManager {
  private static readonly DEFAULT_SETTINGS: KioskSettings = {
    language: 'en',
    theme: 'light',
    timeout: 30,
    maxSessionDuration: 10,
    enableBiometric: false,
    enableQRScanning: true,
    enablePhotoCapture: true,
    enableVoiceInstructions: false,
    autoLogout: true,
    requireParentConfirmation: true,
    allowEmergencyAccess: true,
    displaySettings: {
      brightness: 80,
      orientation: 'portrait',
      screensaver: true,
      screensaverTimeout: 300,
    },
    security: {
      encryptData: true,
      requirePin: false,
      maxFailedAttempts: 3,
      lockoutDuration: 300,
    },
  };

  /**
   * Create a new kiosk configuration
   */
  static createKioskConfig(
    kioskData: Partial<KioskConfig>
  ): KioskConfig {
    const defaultCapabilities: KioskCapability[] = [
      'QR_SCANNING',
      'TOUCHSCREEN',
      'PHOTO_CAPTURE',
    ];

    return {
      id: kioskData.id || this.generateKioskId(),
      kioskId: kioskData.kioskId || this.generateKioskId(),
      name: kioskData.name || 'New Kiosk',
      location: kioskData.location || 'Unknown Location',
      kioskType: kioskData.kioskType || 'CHECK_IN_TERMINAL',
      venueId: kioskData.venueId || '',
      ipAddress: kioskData.ipAddress,
      macAddress: kioskData.macAddress,
      capabilities: kioskData.capabilities || defaultCapabilities,
      settings: { ...this.DEFAULT_SETTINGS, ...kioskData.settings },
      status: kioskData.status || 'OFFLINE',
    };
  }

  /**
   * Generate unique kiosk ID
   */
  static generateKioskId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `KIOSK_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Generate session ID
   */
  static generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `SESSION_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Create a new kiosk session
   */
  static createSession(
    kioskId: string,
    sessionType: KioskSession['sessionType'],
    options: Partial<KioskSession> = {}
  ): KioskSession {
    const sessionId = this.generateSessionId();
    const steps = this.generateSessionSteps(sessionType);

    return {
      id: options.id || sessionId,
      sessionId,
      kioskId,
      sessionType,
      status: 'ACTIVE',
      startTime: new Date().toISOString(),
      parentId: options.parentId,
      childrenIds: options.childrenIds || [],
      language: options.language || 'en',
      steps,
      currentStep: steps[0]?.id,
      completedSteps: [],
      metadata: options.metadata || {},
    };
  }

  /**
   * Generate session steps based on session type
   */
  static generateSessionSteps(sessionType: KioskSession['sessionType']): KioskSessionStep[] {
    const baseSteps: KioskSessionStep[] = [
      {
        id: 'welcome',
        name: 'WELCOME',
        title: 'Welcome to SafePlay',
        description: 'Welcome to our secure check-in system',
        type: 'WELCOME',
        required: true,
        completed: false,
      },
    ];

    switch (sessionType) {
      case 'CHECK_IN':
        return [
          ...baseSteps,
          {
            id: 'qr_scan',
            name: 'QR_SCAN',
            title: 'Scan QR Code',
            description: 'Please scan your child\'s QR code',
            type: 'QR_SCAN',
            required: true,
            completed: false,
          },
          {
            id: 'photo_capture',
            name: 'PHOTO_CAPTURE',
            title: 'Photo Verification',
            description: 'Take a photo for verification',
            type: 'PHOTO_CAPTURE',
            required: false,
            completed: false,
          },
          {
            id: 'confirmation',
            name: 'CONFIRMATION',
            title: 'Confirm Check-in',
            description: 'Please confirm the check-in details',
            type: 'CONFIRMATION',
            required: true,
            completed: false,
          },
          {
            id: 'completion',
            name: 'COMPLETION',
            title: 'Check-in Complete',
            description: 'Your child has been successfully checked in',
            type: 'COMPLETION',
            required: true,
            completed: false,
          },
        ];

      case 'CHECK_OUT':
        return [
          ...baseSteps,
          {
            id: 'qr_scan',
            name: 'QR_SCAN',
            title: 'Scan QR Code',
            description: 'Please scan your pickup authorization code',
            type: 'QR_SCAN',
            required: true,
            completed: false,
          },
          {
            id: 'confirmation',
            name: 'CONFIRMATION',
            title: 'Confirm Check-out',
            description: 'Please confirm the check-out details',
            type: 'CONFIRMATION',
            required: true,
            completed: false,
          },
          {
            id: 'completion',
            name: 'COMPLETION',
            title: 'Check-out Complete',
            description: 'Your child has been successfully checked out',
            type: 'COMPLETION',
            required: true,
            completed: false,
          },
        ];

      case 'REGISTRATION':
        return [
          ...baseSteps,
          {
            id: 'photo_capture',
            name: 'PHOTO_CAPTURE',
            title: 'Registration Photo',
            description: 'Take a registration photo',
            type: 'PHOTO_CAPTURE',
            required: true,
            completed: false,
          },
          {
            id: 'confirmation',
            name: 'CONFIRMATION',
            title: 'Confirm Registration',
            description: 'Please confirm the registration details',
            type: 'CONFIRMATION',
            required: true,
            completed: false,
          },
          {
            id: 'completion',
            name: 'COMPLETION',
            title: 'Registration Complete',
            description: 'Registration has been completed successfully',
            type: 'COMPLETION',
            required: true,
            completed: false,
          },
        ];

      case 'EMERGENCY':
        return [
          {
            id: 'emergency',
            name: 'EMERGENCY',
            title: 'Emergency Access',
            description: 'Emergency access activated',
            type: 'WELCOME',
            required: true,
            completed: false,
          },
          {
            id: 'completion',
            name: 'COMPLETION',
            title: 'Emergency Processed',
            description: 'Emergency access has been granted',
            type: 'COMPLETION',
            required: true,
            completed: false,
          },
        ];

      default:
        return baseSteps;
    }
  }

  /**
   * Update session step
   */
  static updateSessionStep(
    session: KioskSession,
    stepId: string,
    updates: Partial<KioskSessionStep>
  ): KioskSession {
    const updatedSteps = session.steps.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    );

    const updatedCompletedSteps = updates.completed && !session.completedSteps.includes(stepId)
      ? [...session.completedSteps, stepId]
      : session.completedSteps;

    // Find next step if current step is completed
    let nextStep = session.currentStep;
    if (updates.completed) {
      const currentStepIndex = session.steps.findIndex(s => s.id === stepId);
      const nextStepIndex = currentStepIndex + 1;
      if (nextStepIndex < session.steps.length) {
        nextStep = session.steps[nextStepIndex].id;
      } else {
        nextStep = undefined; // Session complete
      }
    }

    return {
      ...session,
      steps: updatedSteps,
      completedSteps: updatedCompletedSteps,
      currentStep: nextStep,
      status: nextStep ? 'ACTIVE' : 'COMPLETED',
      endTime: nextStep ? session.endTime : new Date().toISOString(),
    };
  }

  /**
   * Calculate session duration
   */
  static calculateSessionDuration(session: KioskSession): number {
    const startTime = new Date(session.startTime).getTime();
    const endTime = session.endTime 
      ? new Date(session.endTime).getTime()
      : Date.now();
    
    return Math.round((endTime - startTime) / 1000); // Duration in seconds
  }

  /**
   * Validate kiosk configuration
   */
  static validateKioskConfig(config: KioskConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.kioskId) errors.push('Kiosk ID is required');
    if (!config.name) errors.push('Kiosk name is required');
    if (!config.location) errors.push('Location is required');
    if (!config.venueId) errors.push('Venue ID is required');

    if (config.ipAddress && !this.isValidIP(config.ipAddress)) {
      errors.push('Invalid IP address format');
    }

    if (config.macAddress && !this.isValidMAC(config.macAddress)) {
      errors.push('Invalid MAC address format');
    }

    if (config.capabilities.length === 0) {
      errors.push('At least one capability is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate IP address format
   */
  private static isValidIP(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  /**
   * Validate MAC address format
   */
  private static isValidMAC(mac: string): boolean {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  }

  /**
   * Generate kiosk metrics
   */
  static generateMetrics(kioskId: string): KioskMetrics {
    return {
      kioskId,
      timestamp: new Date().toISOString(),
      systemMetrics: {
        cpuUsage: Math.random() * 100,
        memoryUsed: Math.random() * 8,
        diskUsage: Math.random() * 100,
        temperature: 35 + Math.random() * 20,
        batteryLevel: Math.random() * 100,
        networkStatus: 'connected',
      },
      performanceMetrics: {
        responseTime: 100 + Math.random() * 500,
        errorRate: Math.random() * 5,
        uptime: 95 + Math.random() * 5,
        sessionsCompleted: Math.floor(Math.random() * 50),
        sessionsErrored: Math.floor(Math.random() * 5),
      },
      usageMetrics: {
        totalSessions: Math.floor(Math.random() * 1000),
        dailySessions: Math.floor(Math.random() * 100),
        averageSessionDuration: 120 + Math.random() * 180,
        peakUsageHours: ['10:00-12:00', '14:00-16:00'],
        mostUsedFeatures: ['QR_SCANNING', 'PHOTO_CAPTURE'],
      },
    };
  }

  /**
   * Check if kiosk is healthy
   */
  static isKioskHealthy(metrics: KioskMetrics): boolean {
    const { systemMetrics, performanceMetrics } = metrics;
    
    return (
      systemMetrics.cpuUsage < 90 &&
      systemMetrics.memoryUsed < 7 &&
      systemMetrics.temperature < 70 &&
      performanceMetrics.errorRate < 10 &&
      performanceMetrics.uptime > 90
    );
  }

  /**
   * Get kiosk status based on metrics
   */
  static getKioskStatusFromMetrics(metrics: KioskMetrics): KioskStatus {
    if (!this.isKioskHealthy(metrics)) {
      return 'ERROR';
    }

    if (metrics.performanceMetrics.uptime < 95) {
      return 'MAINTENANCE';
    }

    if (metrics.usageMetrics.dailySessions === 0) {
      return 'IDLE';
    }

    return 'ONLINE';
  }
}

export default KioskManager;
