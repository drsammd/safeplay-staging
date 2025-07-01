
import { prisma } from '../db';
import { computerVisionService } from './computer-vision-service';
import { 
  FriendshipStatus, 
  ChildFriendship, 
  FriendshipInteraction 
} from '@prisma/client';

export interface FriendshipAnalysisData {
  child1Id: string;
  child2Id: string;
  interactionType: string;
  duration: number;
  location?: string;
  timestamp: Date;
  metadata?: any;
}

export interface FriendshipDetectionResult {
  success: boolean;
  friendshipId?: string;
  confidence: number;
  interactionAnalysis: {
    type: string;
    duration: number;
    quality: 'positive' | 'neutral' | 'negative';
    activities: string[];
  };
  recommendation: 'create_friendship' | 'update_existing' | 'ignore';
  error?: string;
}

export interface CompatibilityScore {
  overall: number;
  factors: {
    ageCompatibility: number;
    interactionFrequency: number;
    activityAlignment: number;
    positiveInteractions: number;
  };
}

export class FriendshipDetectionService {
  /**
   * Analyze interaction between two children to detect potential friendship
   */
  async analyzeChildInteraction(
    analysisData: FriendshipAnalysisData
  ): Promise<FriendshipDetectionResult> {
    try {
      const { child1Id, child2Id, interactionType, duration, location, timestamp, metadata } = analysisData;

      // Ensure consistent ordering for friendship lookup
      const [firstChildId, secondChildId] = [child1Id, child2Id].sort();

      // Check if friendship already exists
      const existingFriendship = await prisma.childFriendship.findUnique({
        where: {
          child1Id_child2Id: {
            child1Id: firstChildId,
            child2Id: secondChildId,
          },
        },
        include: {
          interactions: {
            orderBy: { detectedAt: 'desc' },
            take: 10,
          },
        },
      });

      // Analyze interaction quality using computer vision
      const interactionAnalysis = await this.analyzeInteractionQuality(
        interactionType,
        duration,
        metadata
      );

      // Calculate confidence score based on various factors
      const confidence = this.calculateFriendshipConfidence(
        interactionAnalysis,
        existingFriendship?.interactions || [],
        duration
      );

      // Determine recommendation
      const recommendation = this.determineFriendshipRecommendation(
        confidence,
        existingFriendship,
        interactionAnalysis
      );

      // Create or update friendship if confidence is high enough
      let friendshipId: string | undefined;
      
      if (recommendation === 'create_friendship') {
        const newFriendship = await this.createFriendship(
          firstChildId,
          secondChildId,
          confidence,
          interactionAnalysis.activities
        );
        friendshipId = newFriendship.id;
      } else if (recommendation === 'update_existing' && existingFriendship) {
        await this.updateFriendship(existingFriendship.id, interactionAnalysis, confidence);
        friendshipId = existingFriendship.id;
      }

      // Record the interaction
      if (friendshipId) {
        await this.recordInteraction(
          friendshipId,
          interactionType,
          duration,
          location,
          confidence,
          metadata
        );
      }

      return {
        success: true,
        friendshipId,
        confidence,
        interactionAnalysis,
        recommendation,
      };
    } catch (error: any) {
      console.error('Error analyzing child interaction:', error);
      return {
        success: false,
        confidence: 0,
        interactionAnalysis: {
          type: 'unknown',
          duration: 0,
          quality: 'neutral',
          activities: [],
        },
        recommendation: 'ignore',
        error: error.message || 'Friendship analysis failed',
      };
    }
  }

  /**
   * Analyze interaction quality using computer vision and behavioral analysis
   */
  private async analyzeInteractionQuality(
    interactionType: string,
    duration: number,
    metadata?: any
  ): Promise<{
    type: string;
    duration: number;
    quality: 'positive' | 'neutral' | 'negative';
    activities: string[];
  }> {
    try {
      // Use computer vision service to analyze interaction quality
      const activities: string[] = [];
      let quality: 'positive' | 'neutral' | 'negative' = 'neutral';

      // Analyze based on interaction type and duration
      if (interactionType === 'playing_together') {
        activities.push('collaborative_play');
        quality = duration > 300 ? 'positive' : 'neutral'; // 5+ minutes is positive
      } else if (interactionType === 'shared_activity') {
        activities.push('structured_activity');
        quality = 'positive';
      } else if (interactionType === 'conversation') {
        activities.push('social_interaction');
        quality = duration > 120 ? 'positive' : 'neutral'; // 2+ minutes is positive
      }

      // Analyze metadata for additional insights
      if (metadata?.emotions) {
        const positiveEmotions = ['happy', 'excited', 'laughing'];
        const hasPositiveEmotions = metadata.emotions.some((emotion: any) => 
          positiveEmotions.includes(emotion.type) && emotion.confidence > 0.7
        );
        if (hasPositiveEmotions) {
          quality = 'positive';
        }
      }

      // Analyze body language if available
      if (metadata?.bodyLanguage) {
        const positiveBodyLanguage = ['facing_each_other', 'close_proximity', 'synchronized_movement'];
        const hasPositiveBodyLanguage = metadata.bodyLanguage.some((gesture: any) =>
          positiveBodyLanguage.includes(gesture.type) && gesture.confidence > 0.6
        );
        if (hasPositiveBodyLanguage) {
          activities.push('positive_engagement');
          quality = 'positive';
        }
      }

      return {
        type: interactionType,
        duration,
        quality,
        activities,
      };
    } catch (error) {
      console.error('Error analyzing interaction quality:', error);
      return {
        type: interactionType,
        duration,
        quality: 'neutral',
        activities: [],
      };
    }
  }

  /**
   * Calculate friendship confidence score based on various factors
   */
  private calculateFriendshipConfidence(
    interactionAnalysis: any,
    pastInteractions: FriendshipInteraction[],
    currentDuration: number
  ): number {
    let confidence = 0;

    // Base confidence from interaction quality
    if (interactionAnalysis.quality === 'positive') {
      confidence += 0.4;
    } else if (interactionAnalysis.quality === 'neutral') {
      confidence += 0.2;
    }

    // Duration factor (longer interactions are more meaningful)
    if (currentDuration > 600) { // 10+ minutes
      confidence += 0.3;
    } else if (currentDuration > 300) { // 5+ minutes
      confidence += 0.2;
    } else if (currentDuration > 120) { // 2+ minutes
      confidence += 0.1;
    }

    // Frequency factor (repeated interactions)
    const recentInteractions = pastInteractions.filter(
      interaction => new Date(interaction.detectedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    confidence += Math.min(recentInteractions.length * 0.1, 0.3);

    // Activity diversity factor
    const uniqueActivities = new Set(interactionAnalysis.activities);
    confidence += Math.min(uniqueActivities.size * 0.05, 0.2);

    return Math.min(confidence, 1.0);
  }

  /**
   * Determine what action to take based on analysis
   */
  private determineFriendshipRecommendation(
    confidence: number,
    existingFriendship: any,
    interactionAnalysis: any
  ): 'create_friendship' | 'update_existing' | 'ignore' {
    if (confidence < 0.5) {
      return 'ignore';
    }

    if (!existingFriendship && confidence >= 0.7) {
      return 'create_friendship';
    }

    if (existingFriendship && confidence >= 0.6) {
      return 'update_existing';
    }

    return 'ignore';
  }

  /**
   * Create new friendship record
   */
  private async createFriendship(
    child1Id: string,
    child2Id: string,
    confidence: number,
    activities: string[]
  ): Promise<ChildFriendship> {
    return await prisma.childFriendship.create({
      data: {
        child1Id,
        child2Id,
        status: FriendshipStatus.DETECTED,
        confidenceScore: confidence,
        sharedActivities: activities,
        interactionCount: 1,
        totalInteractionTime: 0,
        lastInteractionAt: new Date(),
      },
    });
  }

  /**
   * Update existing friendship record
   */
  private async updateFriendship(
    friendshipId: string,
    interactionAnalysis: any,
    confidence: number
  ): Promise<void> {
    await prisma.childFriendship.update({
      where: { id: friendshipId },
      data: {
        confidenceScore: Math.max(confidence, 0),
        sharedActivities: {
          push: interactionAnalysis.activities,
        },
        interactionCount: {
          increment: 1,
        },
        totalInteractionTime: {
          increment: interactionAnalysis.duration,
        },
        lastInteractionAt: new Date(),
      },
    });
  }

  /**
   * Record interaction details
   */
  private async recordInteraction(
    friendshipId: string,
    interactionType: string,
    duration: number,
    location?: string,
    confidence?: number,
    metadata?: any
  ): Promise<void> {
    await prisma.friendshipInteraction.create({
      data: {
        friendshipId,
        interactionType,
        duration,
        location,
        confidence: confidence || 0,
        metadata,
      },
    });
  }

  /**
   * Calculate family compatibility score
   */
  async calculateFamilyCompatibility(
    child1Id: string,
    child2Id: string
  ): Promise<CompatibilityScore> {
    try {
      // Get children with their parent information
      const [child1, child2] = await Promise.all([
        prisma.child.findUnique({
          where: { id: child1Id },
          include: { parent: true },
        }),
        prisma.child.findUnique({
          where: { id: child2Id },
          include: { parent: true },
        }),
      ]);

      if (!child1 || !child2) {
        throw new Error('Children not found');
      }

      // Calculate age compatibility (closer ages = higher score)
      const ageCompatibility = this.calculateAgeCompatibility(
        child1.dateOfBirth,
        child2.dateOfBirth
      );

      // Get friendship data for interaction frequency
      const friendship = await prisma.childFriendship.findFirst({
        where: {
          OR: [
            { child1Id: child1Id, child2Id: child2Id },
            { child1Id: child2Id, child2Id: child1Id },
          ],
        },
        include: { interactions: true },
      });

      const interactionFrequency = friendship 
        ? Math.min(friendship.interactionCount / 10, 1.0) 
        : 0;

      // Calculate activity alignment based on shared activities
      const activityAlignment = friendship
        ? Math.min(friendship.sharedActivities.length / 5, 1.0)
        : 0;

      // Calculate positive interactions ratio
      const positiveInteractions = friendship?.interactions
        ? friendship.interactions.filter(i => i.confidence > 0.7).length / friendship.interactions.length
        : 0;

      // Calculate overall score
      const overall = (
        ageCompatibility * 0.3 +
        interactionFrequency * 0.3 +
        activityAlignment * 0.2 +
        positiveInteractions * 0.2
      );

      return {
        overall,
        factors: {
          ageCompatibility,
          interactionFrequency,
          activityAlignment,
          positiveInteractions,
        },
      };
    } catch (error) {
      console.error('Error calculating family compatibility:', error);
      return {
        overall: 0,
        factors: {
          ageCompatibility: 0,
          interactionFrequency: 0,
          activityAlignment: 0,
          positiveInteractions: 0,
        },
      };
    }
  }

  /**
   * Calculate age compatibility score
   */
  private calculateAgeCompatibility(birthDate1: Date, birthDate2: Date): number {
    const age1 = this.calculateAge(birthDate1);
    const age2 = this.calculateAge(birthDate2);
    const ageDifference = Math.abs(age1 - age2);

    if (ageDifference <= 0.5) return 1.0;      // Within 6 months
    if (ageDifference <= 1.0) return 0.8;      // Within 1 year
    if (ageDifference <= 2.0) return 0.6;      // Within 2 years
    if (ageDifference <= 3.0) return 0.4;      // Within 3 years
    return 0.2;                                 // More than 3 years
  }

  /**
   * Calculate age in years
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get friendship recommendations for a child
   */
  async getFriendshipRecommendations(childId: string, limit: number = 5): Promise<Array<{
    childId: string;
    childName: string;
    compatibilityScore: number;
    sharedActivities: string[];
    reason: string;
  }>> {
    try {
      // Get all children in the same venue
      const child = await prisma.child.findUnique({
        where: { id: childId },
        include: { parent: true },
      });

      if (!child || !child.currentVenueId) {
        return [];
      }

      const potentialFriends = await prisma.child.findMany({
        where: {
          currentVenueId: child.currentVenueId,
          id: { not: childId },
          status: 'ACTIVE',
        },
        include: { parent: true },
      });

      const recommendations: Array<{
        childId: string;
        childName: string;
        compatibilityScore: number;
        sharedActivities: string[];
        reason: string;
      }> = [];

      for (const potentialFriend of potentialFriends) {
        const compatibility = await this.calculateFamilyCompatibility(
          childId,
          potentialFriend.id
        );

        if (compatibility.overall > 0.3) {
          // Check if they already have a friendship
          const existingFriendship = await prisma.childFriendship.findFirst({
            where: {
              OR: [
                { child1Id: childId, child2Id: potentialFriend.id },
                { child1Id: potentialFriend.id, child2Id: childId },
              ],
            },
          });

          let reason = '';
          if (compatibility.factors.ageCompatibility > 0.8) {
            reason = 'Similar age group';
          } else if (compatibility.factors.activityAlignment > 0.6) {
            reason = 'Shared interests';
          } else {
            reason = 'Good compatibility match';
          }

          recommendations.push({
            childId: potentialFriend.id,
            childName: `${potentialFriend.firstName} ${potentialFriend.lastName}`,
            compatibilityScore: compatibility.overall,
            sharedActivities: existingFriendship?.sharedActivities || [],
            reason,
          });
        }
      }

      // Sort by compatibility score and return top recommendations
      return recommendations
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting friendship recommendations:', error);
      return [];
    }
  }
}

// Export singleton instance
export const friendshipDetectionService = new FriendshipDetectionService();
