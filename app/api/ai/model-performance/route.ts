
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
    const modelType = searchParams.get('modelType');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (venueId) where.venueId = venueId;
    if (modelType) where.modelType = modelType;

    const modelPerformance = await prisma.aIModelPerformance.findMany({
      where,
      orderBy: { evaluationDate: 'desc' },
      take: limit,
      include: {
        venue: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(modelPerformance);
  } catch (error: any) {
    console.error('Error fetching model performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model performance', details: error.message },
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
    const {
      modelName,
      modelVersion,
      modelType,
      venueId,
      accuracy,
      precision,
      recall,
      f1Score,
      processingTime,
      throughput,
      resourceUsage,
      errorRate,
      falsePositiveRate,
      falseNegativeRate,
      notes
    } = body;

    if (!modelName || !modelVersion || !modelType) {
      return NextResponse.json({ 
        error: 'Model name, version, and type are required' 
      }, { status: 400 });
    }

    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics({
      accuracy, precision, recall, f1Score, errorRate, falsePositiveRate, falseNegativeRate
    });

    const modelPerformance = await prisma.aIModelPerformance.create({
      data: {
        modelName,
        modelVersion,
        modelType: modelType as any,
        venueId,
        accuracy: accuracy || 0,
        precision: precision || 0,
        recall: recall || 0,
        f1Score: f1Score || 0,
        processingTime: processingTime || 0,
        throughput: throughput || 0,
        resourceUsage: resourceUsage || {},
        errorRate: errorRate || 0,
        falsePositiveRate: falsePositiveRate || 0,
        falseNegativeRate: falseNegativeRate || 0,
        confidenceDistribution: {},
        calibrationScore: performanceMetrics.calibrationScore,
        driftDetection: performanceMetrics.driftDetected,
        driftScore: performanceMetrics.driftScore,
        performanceTrend: {},
        comparisonBaseline: {},
        businessImpact: {},
        needsRetraining: performanceMetrics.needsRetraining,
        recommendations: performanceMetrics.recommendations,
        evaluatedBy: session.user?.email,
        notes,
      },
    });

    return NextResponse.json(modelPerformance);
  } catch (error: any) {
    console.error('Error creating model performance record:', error);
    return NextResponse.json(
      { error: 'Failed to create performance record', details: error.message },
      { status: 500 }
    );
  }
}

function calculatePerformanceMetrics(metrics: any) {
  const { accuracy, precision, recall, f1Score, errorRate, falsePositiveRate, falseNegativeRate } = metrics;
  
  // Calculate calibration score (how well-calibrated the model predictions are)
  const calibrationScore = accuracy > 0 ? Math.min(accuracy + precision + recall, 3) / 3 : 0;
  
  // Detect model drift (simplified logic)
  const driftScore = errorRate > 0.1 ? (errorRate - 0.1) * 10 : 0;
  const driftDetected = driftScore > 0.3;
  
  // Determine if retraining is needed
  const needsRetraining = accuracy < 0.8 || f1Score < 0.75 || driftDetected;
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (accuracy < 0.8) {
    recommendations.push('Model accuracy below threshold - consider retraining with more data');
  }
  
  if (precision < 0.8) {
    recommendations.push('High false positive rate - adjust model threshold or retrain');
  }
  
  if (recall < 0.8) {
    recommendations.push('High false negative rate - critical for safety applications');
  }
  
  if (driftDetected) {
    recommendations.push('Model drift detected - immediate retraining recommended');
  }
  
  if (errorRate > 0.05) {
    recommendations.push('Error rate above acceptable level for safety-critical applications');
  }

  return {
    calibrationScore,
    driftScore,
    driftDetected,
    needsRetraining,
    recommendations,
  };
}
