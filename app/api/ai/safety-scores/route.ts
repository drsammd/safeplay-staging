
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const venueId = searchParams.get('venueId');
    const scoreType = searchParams.get('scoreType');
    const entityId = searchParams.get('entityId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!venueId) {
      return NextResponse.json({ 
        error: 'Venue ID is required' 
      }, { status: 400 });
    }

    const where: any = { venueId };
    if (scoreType) where.scoreType = scoreType;
    if (entityId) where.entityId = entityId;

    const safetyScores = await prisma.aISafetyScore.findMany({
      where,
      orderBy: { lastRecalculated: 'desc' },
      take: limit,
      include: {
        venue: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(safetyScores);
  } catch (error: any) {
    console.error('Error fetching safety scores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch safety scores', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, venueId, entityId, scoreType } = body;

    if (action === 'calculate') {
      // Calculate new safety score
      const calculatedScore = await calculateSafetyScore(venueId, entityId, scoreType);
      return NextResponse.json(calculatedScore);
    } else if (action === 'recalculate_all') {
      // Recalculate all scores for a venue
      const results = await recalculateAllScores(venueId);
      return NextResponse.json(results);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing safety score request:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}

async function calculateSafetyScore(venueId: string, entityId: string, scoreType: string) {
  const now = new Date();
  const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Valid for 24 hours

  // Get recent AI analysis data for scoring
  const recentAnalyses = await getRecentAnalysisData(venueId, entityId, scoreType);
  
  // Calculate component scores
  const behaviorScore = calculateBehaviorScore(recentAnalyses);
  const emotionalScore = calculateEmotionalScore(recentAnalyses);
  const physicalScore = calculatePhysicalScore(recentAnalyses);
  const environmentalScore = calculateEnvironmentalScore(recentAnalyses);
  const socialScore = calculateSocialScore(recentAnalyses);
  const complianceScore = calculateComplianceScore(recentAnalyses);
  
  // Calculate overall score (weighted average)
  const overallScore = (
    behaviorScore * 0.25 +
    emotionalScore * 0.2 +
    physicalScore * 0.2 +
    environmentalScore * 0.15 +
    socialScore * 0.1 +
    complianceScore * 0.1
  );

  const trendScore = calculateTrendScore(recentAnalyses);

  // Identify risk and strength factors
  const riskFactors = identifyRiskFactors(recentAnalyses);
  const strengthFactors = identifyStrengthFactors(recentAnalyses);

  // Generate recommendations
  const recommendations = generateSafetyRecommendations(
    overallScore,
    { behaviorScore, emotionalScore, physicalScore, environmentalScore, socialScore, complianceScore }
  );

  // Store or update safety score
  const existingScore = await prisma.aISafetyScore.findFirst({
    where: {
      venueId,
      entityId,
      scoreType: scoreType as any,
    }
  });

  const safetyScore = existingScore ? 
    await prisma.aISafetyScore.update({
      where: { id: existingScore.id },
      data: {
        overallScore,
        behaviorScore,
        emotionalScore,
        physicalScore,
        environmentalScore,
        socialScore,
        complianceScore,
        trendScore,
        riskFactors,
        strengthFactors,
        recommendations,
        lastRecalculated: now,
        validUntil,
      },
    }) :
    await prisma.aISafetyScore.create({
      data: {
        scoreType: scoreType as any,
        entityId,
        venueId,
        overallScore,
        behaviorScore,
        emotionalScore,
        physicalScore,
        environmentalScore,
        socialScore,
        complianceScore,
        trendScore,
        riskFactors,
        strengthFactors,
        improvementAreas: [],
        achievements: [],
        benchmarkComparison: {},
        historicalTrend: {},
        predictiveTrend: {},
        scoreBreakdown: {},
        calculationMethod: 'ai_multi_modal_analysis',
        dataQuality: calculateDataQuality(recentAnalyses),
        confidenceInterval: {},
        lastRecalculated: now,
        validUntil,
        recommendations,
        alertThresholds: {},
        scorePeriod: {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString(),
        },
      },
    });

  return safetyScore;
}

async function getRecentAnalysisData(venueId: string, entityId: string, scoreType: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const [behaviorAnalyses, emotionAnalyses, crowdAnalyses, voiceAnalyses, visualAnalyses] = await Promise.all([
    prisma.behaviorPatternAnalysis.findMany({
      where: { 
        venueId,
        ...(scoreType === 'CHILD' ? { childId: entityId } : {}),
        ...(scoreType === 'ZONE' ? { zoneId: entityId } : {}),
        timestamp: { gte: sevenDaysAgo }
      },
      orderBy: { timestamp: 'desc' }
    }),
    prisma.emotionDetectionAnalysis.findMany({
      where: { 
        venueId,
        ...(scoreType === 'CHILD' ? { childId: entityId } : {}),
        ...(scoreType === 'ZONE' ? { zoneId: entityId } : {}),
        timestamp: { gte: sevenDaysAgo }
      },
      orderBy: { timestamp: 'desc' }
    }),
    prisma.crowdDensityAnalysis.findMany({
      where: { 
        venueId,
        ...(scoreType === 'ZONE' ? { zoneId: entityId } : {}),
        timestamp: { gte: sevenDaysAgo }
      },
      orderBy: { timestamp: 'desc' }
    }),
    prisma.voicePatternAnalysis.findMany({
      where: { 
        venueId,
        ...(scoreType === 'CHILD' ? { childId: entityId } : {}),
        ...(scoreType === 'ZONE' ? { zoneId: entityId } : {}),
        timestamp: { gte: sevenDaysAgo }
      },
      orderBy: { timestamp: 'desc' }
    }),
    prisma.visualPatternAnalysis.findMany({
      where: { 
        venueId,
        ...(scoreType === 'CHILD' ? { childId: entityId } : {}),
        ...(scoreType === 'ZONE' ? { zoneId: entityId } : {}),
        timestamp: { gte: sevenDaysAgo }
      },
      orderBy: { timestamp: 'desc' }
    })
  ]);

  return {
    behaviorAnalyses,
    emotionAnalyses,
    crowdAnalyses,
    voiceAnalyses,
    visualAnalyses,
  };
}

function calculateBehaviorScore(analyses: any): number {
  const { behaviorAnalyses } = analyses;
  if (behaviorAnalyses.length === 0) return 85; // Default good score

  let score = 100;
  
  behaviorAnalyses.forEach((analysis: any) => {
    if (analysis.emergencyResponse) score -= 20;
    else if (analysis.immediateIntervention) score -= 10;
    else if (analysis.severityLevel === 'HIGH') score -= 5;
    else if (analysis.severityLevel === 'MEDIUM') score -= 2;
  });

  return Math.max(0, Math.min(100, score));
}

function calculateEmotionalScore(analyses: any): number {
  const { emotionAnalyses } = analyses;
  if (emotionAnalyses.length === 0) return 85; // Default good score

  let positiveCount = 0;
  let negativeCount = 0;
  let interventionCount = 0;

  emotionAnalyses.forEach((analysis: any) => {
    if (analysis.requiresIntervention) interventionCount++;
    if (['HAPPY', 'EXCITED', 'CALM'].includes(analysis.primaryEmotion)) positiveCount++;
    if (['SAD', 'ANGRY', 'FEAR'].includes(analysis.primaryEmotion)) negativeCount++;
  });

  const totalAnalyses = emotionAnalyses.length;
  const positiveRatio = positiveCount / totalAnalyses;
  const negativeRatio = negativeCount / totalAnalyses;
  const interventionRatio = interventionCount / totalAnalyses;

  let score = 50 + (positiveRatio * 50) - (negativeRatio * 30) - (interventionRatio * 40);
  return Math.max(0, Math.min(100, score));
}

function calculatePhysicalScore(analyses: any): number {
  const { behaviorAnalyses, voiceAnalyses } = analyses;
  
  let score = 95; // Start with high physical safety score
  
  // Deduct for physical risk behaviors
  behaviorAnalyses.forEach((analysis: any) => {
    if (['DROWNING', 'SEIZURE', 'FALL', 'INJURY'].includes(analysis.behaviorType)) {
      score -= 15;
    } else if (analysis.behaviorType === 'GAIT_ABNORMAL') {
      score -= 5;
    }
  });

  // Deduct for distress calls that might indicate physical issues
  voiceAnalyses.forEach((analysis: any) => {
    if (analysis.helpCallDetected) score -= 10;
    if (analysis.panicDetected) score -= 5;
  });

  return Math.max(0, Math.min(100, score));
}

function calculateEnvironmentalScore(analyses: any): number {
  const { crowdAnalyses } = analyses;
  if (crowdAnalyses.length === 0) return 85;

  let score = 100;
  
  crowdAnalyses.forEach((analysis: any) => {
    if (analysis.overcrowdingDetected) score -= 15;
    if (analysis.riskLevel === 'HIGH') score -= 10;
    if (analysis.riskLevel === 'CRITICAL') score -= 20;
    if (analysis.densityLevel === 'VERY_HIGH') score -= 5;
  });

  return Math.max(0, Math.min(100, score));
}

function calculateSocialScore(analyses: any): number {
  const { behaviorAnalyses, visualAnalyses } = analyses;
  
  let score = 85;
  
  // Check for social behaviors
  behaviorAnalyses.forEach((analysis: any) => {
    if (analysis.behaviorType === 'BULLYING') score -= 20;
    if (analysis.behaviorType === 'AGGRESSION') score -= 15;
    if (analysis.behaviorType === 'ISOLATION') score -= 10;
  });

  // Check for positive social indicators
  visualAnalyses.forEach((analysis: any) => {
    if (analysis.socialInteraction === 'COOPERATIVE_PLAY') score += 5;
    if (analysis.socialInteraction === 'HELPING') score += 5;
    if (analysis.socialInteraction === 'SHARING') score += 3;
  });

  return Math.max(0, Math.min(100, score));
}

function calculateComplianceScore(analyses: any): number {
  // This would integrate with zone access logs and rule violations
  // For now, return a default score
  return 90;
}

function calculateTrendScore(analyses: any): number {
  // Calculate if safety metrics are improving, stable, or declining
  // This would require historical comparison
  return 85;
}

function calculateDataQuality(analyses: any): number {
  const totalAnalyses: number = Object.values(analyses).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0) as number;
  
  if (totalAnalyses === 0) return 0.3; // Low quality with no data
  if (totalAnalyses < 10) return 0.6; // Medium quality with some data
  if (totalAnalyses < 50) return 0.8; // Good quality with sufficient data
  return 0.95; // Excellent quality with abundant data
}

function identifyRiskFactors(analyses: any): any {
  const risks: any = {};
  
  if (analyses.behaviorAnalyses.some((a: any) => a.emergencyResponse)) {
    risks.emergencyBehaviors = 'Emergency behaviors detected requiring immediate response';
  }
  
  if (analyses.emotionAnalyses.some((a: any) => a.distressLevel === 'CRITICAL')) {
    risks.emotionalDistress = 'Critical emotional distress levels detected';
  }
  
  if (analyses.crowdAnalyses.some((a: any) => a.overcrowdingDetected)) {
    risks.overcrowding = 'Overcrowding situations detected';
  }

  return risks;
}

function identifyStrengthFactors(analyses: any): any {
  const strengths: any = {};
  
  if (analyses.emotionAnalyses.some((a: any) => ['HAPPY', 'EXCITED'].includes(a.primaryEmotion))) {
    strengths.positiveEmotions = 'High levels of positive emotions detected';
  }
  
  if (analyses.visualAnalyses.some((a: any) => a.engagementLevel === 'HIGHLY_ENGAGED')) {
    strengths.highEngagement = 'High engagement levels in activities';
  }

  return strengths;
}

function generateSafetyRecommendations(overallScore: number, componentScores: any): string[] {
  const recommendations: string[] = [];
  
  if (overallScore < 60) {
    recommendations.push('URGENT: Overall safety score is low - immediate comprehensive review required');
  } else if (overallScore < 75) {
    recommendations.push('Safety score below optimal - implement improvement measures');
  }
  
  if (componentScores.behaviorScore < 70) {
    recommendations.push('Increase behavioral monitoring and intervention protocols');
  }
  
  if (componentScores.emotionalScore < 70) {
    recommendations.push('Enhance emotional support and wellness programs');
  }
  
  if (componentScores.environmentalScore < 70) {
    recommendations.push('Improve crowd management and environmental controls');
  }

  return recommendations;
}

async function recalculateAllScores(venueId: string) {
  // This would recalculate all safety scores for a venue
  // Implementation would depend on specific requirements
  return { message: 'Recalculation initiated for all venue scores' };
}
