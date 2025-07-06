
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
    const zoneId = searchParams.get('zoneId');
    const childId = searchParams.get('childId');
    const insightType = searchParams.get('insightType');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!venueId) {
      return NextResponse.json({ 
        error: 'Venue ID is required' 
      }, { status: 400 });
    }

    const where: any = { venueId };
    if (zoneId) where.zoneId = zoneId;
    if (childId) where.childId = childId;
    if (insightType) where.insightType = insightType;
    if (category) where.category = category;

    const [insights, total] = await Promise.all([
      prisma.aIInsight.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
        include: {
          venue: {
            select: { name: true }
          },
          zone: {
            select: { name: true }
          },
          child: {
            select: { firstName: true, lastName: true }
          }
        }
      }),
      prisma.aIInsight.count({ where })
    ]);

    return NextResponse.json({
      insights,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error: any) {
    console.error('Error fetching AI insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights', details: error.message },
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
      insightType,
      title,
      description,
      confidence,
      severity,
      category,
      venueId,
      zoneId,
      childId,
      timeframe,
      dataPoints,
      trendDirection,
      riskLevel,
      actionRequired,
      actionPriority,
      recommendations,
      preventiveMeasures,
      sourceData,
      analysisMethod,
    } = body;

    if (!venueId || !insightType || !title || !description) {
      return NextResponse.json({ 
        error: 'Required fields: venueId, insightType, title, description' 
      }, { status: 400 });
    }

    const insight = await prisma.aIInsight.create({
      data: {
        insightType,
        title,
        description,
        confidence: confidence || 0.8,
        severity: severity || 'MEDIUM',
        category: category || 'SAFETY',
        venueId,
        zoneId,
        childId,
        timeframe: timeframe || {},
        dataPoints: dataPoints || 1,
        trendDirection: trendDirection || 'STABLE',
        riskLevel: riskLevel || 'LOW',
        actionRequired: actionRequired || false,
        actionPriority: actionPriority || 'NORMAL',
        recommendations: recommendations || [],
        preventiveMeasures: preventiveMeasures || [],
        sourceData: sourceData || {},
        analysisMethod: analysisMethod || 'manual',
      },
    });

    return NextResponse.json(insight);
  } catch (error: any) {
    console.error('Error creating AI insight:', error);
    return NextResponse.json(
      { error: 'Failed to create insight', details: error.message },
      { status: 500 }
    );
  }
}
