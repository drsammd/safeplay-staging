
import { PrismaClient } from '@prisma/client';
import { enhancedRekognitionService } from '../aws/rekognition-service';
import { computerVisionService } from './computer-vision-service';
import { audioProcessingService } from './audio-processing-service';
import { 
  EnhancedDetectedFace, 
  AgeEstimationResult, 
  EmotionAnalysisResult,
  CrowdAnalysisResult,
  BehaviorAnalysisResult,
  VoiceAnalysisResult,
  VisualPatternResult
} from '../aws/types';

const prisma = new PrismaClient();

export interface AIAnalysisRequest {
  sessionId?: string;
  venueId: string;
  zoneId?: string;
  cameraId?: string;
  childId?: string;
  analysisTypes: string[];
  imageBuffer?: Buffer;
  audioBuffer?: Buffer;
  metadata?: any;
}

export interface AIAnalysisResponse {
  success: boolean;
  sessionId: string;
  results: {
    ageEstimation?: AgeEstimationResult;
    emotionDetection?: EmotionAnalysisResult;
    crowdDensity?: CrowdAnalysisResult;
    behaviorPattern?: BehaviorAnalysisResult;
    voicePattern?: VoiceAnalysisResult;
    visualPattern?: VisualPatternResult;
  };
  alerts: string[];
  recommendations: string[];
  error?: string;
}

export class AIOrchestrationService {
  private activeSessions = new Map<string, any>();
  
  /**
   * Start AI analysis session
   */
  async startAnalysisSession(
    venueId: string,
    sessionType: string = 'MULTI_MODAL',
    cameraId?: string
  ): Promise<string> {
    try {
      const session = await prisma.aIAnalysisSession.create({
        data: {
          sessionType: sessionType as any,
          venueId,
          cameraId,
          status: 'ACTIVE',
          startTime: new Date(),
        },
      });
      
      this.activeSessions.set(session.id, {
        ...session,
        frameCount: 0,
        lastProcessed: new Date(),
      });
      
      return session.id;
    } catch (error) {
      console.error('Error starting AI analysis session:', error);
      throw error;
    }
  }

  /**
   * Process comprehensive AI analysis
   */
  async processAIAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const sessionId = request.sessionId || await this.startAnalysisSession(
        request.venueId,
        'MULTI_MODAL',
        request.cameraId
      );

      const results: AIAnalysisResponse['results'] = {};
      const alerts: string[] = [];
      const recommendations: string[] = [];

      // Process each requested analysis type
      for (const analysisType of request.analysisTypes) {
        switch (analysisType) {
          case 'AGE_ESTIMATION':
            if (request.imageBuffer) {
              const result = await this.processAgeEstimation(request, sessionId);
              results.ageEstimation = result.data;
              alerts.push(...result.alerts);
              recommendations.push(...result.recommendations);
            }
            break;

          case 'EMOTION_DETECTION':
            if (request.imageBuffer) {
              const result = await this.processEmotionDetection(request, sessionId);
              results.emotionDetection = result.data;
              alerts.push(...result.alerts);
              recommendations.push(...result.recommendations);
            }
            break;

          case 'CROWD_DENSITY':
            if (request.imageBuffer) {
              const result = await this.processCrowdDensity(request, sessionId);
              results.crowdDensity = result.data;
              alerts.push(...result.alerts);
              recommendations.push(...result.recommendations);
            }
            break;

          case 'BEHAVIOR_PATTERN':
            if (request.imageBuffer) {
              const result = await this.processBehaviorPattern(request, sessionId);
              results.behaviorPattern = result.data;
              alerts.push(...result.alerts);
              recommendations.push(...result.recommendations);
            }
            break;

          case 'VOICE_PATTERN':
            if (request.audioBuffer) {
              const result = await this.processVoicePattern(request, sessionId);
              results.voicePattern = result.data;
              alerts.push(...result.alerts);
              recommendations.push(...result.recommendations);
            }
            break;

          case 'VISUAL_PATTERN':
            if (request.imageBuffer) {
              const result = await this.processVisualPattern(request, sessionId);
              results.visualPattern = result.data;
              alerts.push(...result.alerts);
              recommendations.push(...result.recommendations);
            }
            break;
        }
      }

      // Update session statistics
      await this.updateSessionStats(sessionId, true);

      // Generate AI insights if significant patterns detected
      await this.generateAIInsights(request.venueId, results, request.zoneId, request.childId);

      return {
        success: true,
        sessionId,
        results,
        alerts: [...new Set(alerts)], // Remove duplicates
        recommendations: [...new Set(recommendations)], // Remove duplicates
      };
    } catch (error: any) {
      console.error('Error in AI analysis processing:', error);
      
      if (request.sessionId) {
        await this.updateSessionStats(request.sessionId, false);
      }

      return {
        success: false,
        sessionId: request.sessionId || '',
        results: {},
        alerts: [],
        recommendations: [],
        error: error.message || 'AI analysis failed',
      };
    }
  }

  /**
   * Process age estimation analysis
   */
  private async processAgeEstimation(
    request: AIAnalysisRequest,
    sessionId: string
  ): Promise<{ data: any; alerts: string[]; recommendations: string[] }> {
    try {
      const analysis = await enhancedRekognitionService.performEnhancedFacialAnalysis(request.imageBuffer!);
      
      if (!analysis.success || analysis.faces.length === 0) {
        return { data: null, alerts: [], recommendations: [] };
      }

      const face = analysis.faces[0];
      const ageEstimation = face.AgeEstimation;
      
      if (!ageEstimation) {
        return { data: null, alerts: [], recommendations: [] };
      }

      // Check zone age compliance if zone is specified
      let zoneCompliant = true;
      let violationReason = '';
      
      if (request.zoneId) {
        const zoneConfig = await prisma.zoneConfiguration.findUnique({
          where: { zoneId: request.zoneId },
        });
        
        if (zoneConfig) {
          const { minAge, maxAge } = zoneConfig;
          if (minAge && ageEstimation.estimatedAge < minAge) {
            zoneCompliant = false;
            violationReason = `Too young for zone (${ageEstimation.estimatedAge} < ${minAge})`;
          }
          if (maxAge && ageEstimation.estimatedAge > maxAge) {
            zoneCompliant = false;
            violationReason = `Too old for zone (${ageEstimation.estimatedAge} > ${maxAge})`;
          }
        }
      }

      // Store analysis result
      const analysisRecord = await prisma.ageEstimationAnalysis.create({
        data: {
          sessionId,
          childId: request.childId,
          venueId: request.venueId,
          zoneId: request.zoneId,
          estimatedAge: ageEstimation.estimatedAge,
          ageRange: ageEstimation.ageRange,
          confidence: ageEstimation.confidence,
          ageGroupClassification: ageEstimation.ageGroup as any,
          zoneAccessCompliant: zoneCompliant,
          accessViolation: !zoneCompliant,
          violationReason,
          recommendations: enhancedRekognitionService.generateAgeRecommendations?.(
            ageEstimation.estimatedAge, 
            ageEstimation.ageGroup
          ) || [],
        },
      });

      const alerts: string[] = [];
      const recommendations: string[] = [];

      if (!zoneCompliant) {
        alerts.push(`Age compliance violation: ${violationReason}`);
        recommendations.push('Staff intervention required for age enforcement');
      }

      return { 
        data: ageEstimation, 
        alerts, 
        recommendations: [...recommendations, ...analysisRecord.recommendations] 
      };
    } catch (error) {
      console.error('Error in age estimation processing:', error);
      return { data: null, alerts: [], recommendations: [] };
    }
  }

  /**
   * Process emotion detection analysis
   */
  private async processEmotionDetection(
    request: AIAnalysisRequest,
    sessionId: string
  ): Promise<{ data: any; alerts: string[]; recommendations: string[] }> {
    try {
      const analysis = await enhancedRekognitionService.performEnhancedFacialAnalysis(request.imageBuffer!);
      
      if (!analysis.success || analysis.faces.length === 0) {
        return { data: null, alerts: [], recommendations: [] };
      }

      const face = analysis.faces[0];
      const emotionAnalysis = face.EmotionAnalysis;
      
      if (!emotionAnalysis) {
        return { data: null, alerts: [], recommendations: [] };
      }

      // Determine intervention type if needed
      let interventionType = null;
      if (emotionAnalysis.requiresIntervention) {
        if (emotionAnalysis.distressLevel === 'CRITICAL' || emotionAnalysis.distressLevel === 'SEVERE') {
          interventionType = 'EMERGENCY_RESPONSE';
        } else if (emotionAnalysis.distressLevel === 'HIGH') {
          interventionType = 'STAFF_ASSISTANCE';
        } else {
          interventionType = 'COMFORT_SUPPORT';
        }
      }

      // Store analysis result
      const analysisRecord = await prisma.emotionDetectionAnalysis.create({
        data: {
          sessionId,
          childId: request.childId,
          venueId: request.venueId,
          zoneId: request.zoneId,
          primaryEmotion: emotionAnalysis.primaryEmotion as any,
          emotionConfidence: emotionAnalysis.primaryConfidence,
          emotionIntensity: emotionAnalysis.emotionIntensity as any,
          allEmotions: emotionAnalysis.allEmotions,
          distressLevel: emotionAnalysis.distressLevel as any,
          elationLevel: emotionAnalysis.elationLevel as any,
          requiresIntervention: emotionAnalysis.requiresIntervention,
          interventionType: interventionType as any,
          emotionalState: this.determineEmotionalState(emotionAnalysis) as any,
        },
      });

      const alerts: string[] = [];
      const recommendations: string[] = [];

      if (emotionAnalysis.requiresIntervention) {
        alerts.push(`Emotional intervention required: ${emotionAnalysis.primaryEmotion} (${emotionAnalysis.distressLevel} distress)`);
        
        switch (interventionType) {
          case 'EMERGENCY_RESPONSE':
            recommendations.push('Emergency emotional support required');
            recommendations.push('Contact parents immediately');
            break;
          case 'STAFF_ASSISTANCE':
            recommendations.push('Staff assistance needed for emotional support');
            recommendations.push('Monitor child closely');
            break;
          case 'COMFORT_SUPPORT':
            recommendations.push('Provide comfort and reassurance');
            break;
        }
      }

      return { data: emotionAnalysis, alerts, recommendations };
    } catch (error) {
      console.error('Error in emotion detection processing:', error);
      return { data: null, alerts: [], recommendations: [] };
    }
  }

  /**
   * Process crowd density analysis
   */
  private async processCrowdDensity(
    request: AIAnalysisRequest,
    sessionId: string
  ): Promise<{ data: any; alerts: string[]; recommendations: string[] }> {
    try {
      // Get zone capacity for analysis
      let zoneCapacity = undefined;
      if (request.zoneId) {
        const zoneConfig = await prisma.zoneConfiguration.findUnique({
          where: { zoneId: request.zoneId },
        });
        zoneCapacity = zoneConfig?.maxCapacity || undefined;
      }

      const analysis = await computerVisionService.analyzeCrowdDensity(
        request.imageBuffer!,
        zoneCapacity
      );

      if (!analysis.success) {
        return { data: null, alerts: [], recommendations: [] };
      }

      // Store analysis result
      await prisma.crowdDensityAnalysis.create({
        data: {
          sessionId,
          venueId: request.venueId,
          zoneId: request.zoneId,
          cameraId: request.cameraId,
          totalPeopleCount: analysis.totalPeopleCount,
          childrenCount: analysis.childrenCount,
          adultsCount: analysis.adultsCount,
          densityLevel: analysis.densityLevel as any,
          densityScore: analysis.densityScore,
          capacityUtilization: analysis.capacityUtilization,
          overcrowdingDetected: analysis.overcrowdingDetected,
          riskLevel: analysis.riskLevel as any,
          recommendations: analysis.recommendations,
        },
      });

      const alerts: string[] = [];
      
      if (analysis.overcrowdingDetected) {
        alerts.push(`Overcrowding detected: ${analysis.totalPeopleCount} people (${Math.round(analysis.capacityUtilization * 100)}% capacity)`);
      }
      
      if (analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'CRITICAL') {
        alerts.push(`High crowd risk level: ${analysis.riskLevel}`);
      }

      return { data: analysis, alerts, recommendations: analysis.recommendations };
    } catch (error) {
      console.error('Error in crowd density processing:', error);
      return { data: null, alerts: [], recommendations: [] };
    }
  }

  /**
   * Process behavior pattern analysis
   */
  private async processBehaviorPattern(
    request: AIAnalysisRequest,
    sessionId: string
  ): Promise<{ data: any; alerts: string[]; recommendations: string[] }> {
    try {
      const analysis = await computerVisionService.analyzeBehaviorPatterns(request.imageBuffer!);

      if (!analysis.success) {
        return { data: null, alerts: [], recommendations: [] };
      }

      // Store analysis result
      await prisma.behaviorPatternAnalysis.create({
        data: {
          sessionId,
          childId: request.childId,
          venueId: request.venueId,
          zoneId: request.zoneId,
          cameraId: request.cameraId,
          behaviorType: analysis.behaviorType as any,
          detectionConfidence: analysis.detectionConfidence,
          severityLevel: analysis.severityLevel as any,
          riskAssessment: analysis.riskAssessment as any,
          immediateIntervention: analysis.immediateIntervention,
          emergencyResponse: analysis.emergencyResponse,
          behaviorDescription: analysis.behaviorDescription,
        },
      });

      const alerts: string[] = [];
      
      if (analysis.emergencyResponse) {
        alerts.push(`EMERGENCY: ${analysis.behaviorType} detected - immediate response required`);
      } else if (analysis.immediateIntervention) {
        alerts.push(`Intervention required: ${analysis.behaviorType} detected`);
      }

      return { data: analysis, alerts, recommendations: analysis.recommendations };
    } catch (error) {
      console.error('Error in behavior pattern processing:', error);
      return { data: null, alerts: [], recommendations: [] };
    }
  }

  /**
   * Process voice pattern analysis
   */
  private async processVoicePattern(
    request: AIAnalysisRequest,
    sessionId: string
  ): Promise<{ data: any; alerts: string[]; recommendations: string[] }> {
    try {
      const analysis = await audioProcessingService.analyzeVoicePatterns(request.audioBuffer!);

      if (!analysis.success) {
        return { data: null, alerts: [], recommendations: [] };
      }

      // Store analysis result
      await prisma.voicePatternAnalysis.create({
        data: {
          sessionId,
          childId: request.childId,
          venueId: request.venueId,
          zoneId: request.zoneId,
          voiceType: analysis.voiceType as any,
          emotionalState: analysis.emotionalState as any,
          intensityLevel: analysis.intensityLevel as any,
          confidenceLevel: analysis.confidenceLevel,
          distressDetected: analysis.distressDetected,
          helpCallDetected: analysis.helpCallDetected,
          panicDetected: analysis.panicDetected,
          transcription: analysis.transcription,
          volumeLevel: 65.0, // Default volume level
        },
      });

      const alerts: string[] = [];
      
      if (analysis.helpCallDetected) {
        alerts.push('Help call detected - immediate assistance required');
      }
      
      if (analysis.panicDetected) {
        alerts.push('Panic situation detected in audio - emergency response needed');
      }
      
      if (analysis.distressDetected) {
        alerts.push('Vocal distress detected - check child welfare');
      }

      return { data: analysis, alerts, recommendations: analysis.recommendations };
    } catch (error) {
      console.error('Error in voice pattern processing:', error);
      return { data: null, alerts: [], recommendations: [] };
    }
  }

  /**
   * Process visual pattern analysis
   */
  private async processVisualPattern(
    request: AIAnalysisRequest,
    sessionId: string
  ): Promise<{ data: any; alerts: string[]; recommendations: string[] }> {
    try {
      const analysis = await computerVisionService.analyzeVisualPatterns(request.imageBuffer!);

      if (!analysis.success) {
        return { data: null, alerts: [], recommendations: [] };
      }

      // Store analysis result
      await prisma.visualPatternAnalysis.create({
        data: {
          sessionId,
          childId: request.childId,
          venueId: request.venueId,
          zoneId: request.zoneId,
          cameraId: request.cameraId,
          patternType: analysis.patternType as any,
          detectionConfidence: analysis.detectionConfidence,
          engagementLevel: analysis.engagementLevel as any,
          comfortLevel: analysis.comfortLevel as any,
          anxietyLevel: analysis.anxietyLevel as any,
          visualDistressSignals: analysis.visualDistressSignals,
          happinessIndicators: analysis.happinessIndicators,
        },
      });

      const alerts: string[] = [];
      
      if (analysis.visualDistressSignals) {
        alerts.push('Visual distress signals detected');
      }
      
      if (analysis.anxietyLevel === 'HIGH' || analysis.anxietyLevel === 'SEVERE') {
        alerts.push(`High anxiety level detected: ${analysis.anxietyLevel}`);
      }

      return { data: analysis, alerts, recommendations: analysis.recommendations };
    } catch (error) {
      console.error('Error in visual pattern processing:', error);
      return { data: null, alerts: [], recommendations: [] };
    }
  }

  /**
   * Generate AI insights based on analysis results
   */
  private async generateAIInsights(
    venueId: string, 
    results: any, 
    zoneId?: string, 
    childId?: string
  ): Promise<void> {
    try {
      const insights: string[] = [];
      
      // Generate insights based on combined results
      if (results.emotionDetection?.requiresIntervention && results.behaviorPattern?.immediateIntervention) {
        insights.push('Multiple distress indicators detected - high priority intervention needed');
      }
      
      if (results.crowdDensity?.overcrowdingDetected && results.behaviorPattern?.riskAssessment === 'HIGH') {
        insights.push('Overcrowding combined with behavioral risks - consider crowd control measures');
      }
      
      // Create AI insights for significant patterns
      for (const insight of insights) {
        await prisma.aIInsight.create({
          data: {
            insightType: 'RISK_ASSESSMENT',
            title: 'Multi-modal AI Analysis Alert',
            description: insight,
            confidence: 0.85,
            severity: 'HIGH',
            category: 'SAFETY',
            venueId,
            zoneId,
            childId,
            timeframe: { 
              start: new Date().toISOString(),
              duration: '5_minutes' 
            },
            dataPoints: Object.keys(results).length,
            trendDirection: 'STABLE',
            riskLevel: 'HIGH',
            actionRequired: true,
            actionPriority: 'HIGH',
            recommendations: ['Immediate staff response', 'Monitor situation closely'],
            sourceData: results,
            analysisMethod: 'multi_modal_ai_fusion',
          },
        });
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  }

  /**
   * Update session statistics
   */
  private async updateSessionStats(sessionId: string, success: boolean): Promise<void> {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (sessionData) {
        sessionData.frameCount += 1;
        sessionData.lastProcessed = new Date();
      }

      await prisma.aIAnalysisSession.update({
        where: { id: sessionId },
        data: {
          totalFramesProcessed: { increment: 1 },
          successfulAnalyses: success ? { increment: 1 } : undefined,
          failedAnalyses: success ? undefined : { increment: 1 },
        },
      });
    } catch (error) {
      console.error('Error updating session stats:', error);
    }
  }

  /**
   * Stop analysis session
   */
  async stopAnalysisSession(sessionId: string): Promise<void> {
    try {
      await prisma.aIAnalysisSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          endTime: new Date(),
        },
      });
      
      this.activeSessions.delete(sessionId);
    } catch (error) {
      console.error('Error stopping analysis session:', error);
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<any> {
    try {
      return await prisma.aIAnalysisSession.findUnique({
        where: { id: sessionId },
        include: {
          ageAnalyses: true,
          emotionAnalyses: true,
          crowdAnalyses: true,
          behaviorAnalyses: true,
          voiceAnalyses: true,
          visualAnalyses: true,
        },
      });
    } catch (error) {
      console.error('Error getting session stats:', error);
      return null;
    }
  }

  // Helper methods

  private determineEmotionalState(emotionAnalysis: EmotionAnalysisResult): string {
    if (emotionAnalysis.requiresIntervention) {
      return 'DISTRESSED';
    }
    if (emotionAnalysis.elationLevel === 'HIGH' || emotionAnalysis.elationLevel === 'EXTREME') {
      return 'ELEVATED';
    }
    if (emotionAnalysis.distressLevel === 'MODERATE' || emotionAnalysis.distressLevel === 'HIGH') {
      return 'DECLINING';
    }
    return 'STABLE';
  }
}

// Export singleton instance
export const aiOrchestrationService = new AIOrchestrationService();
