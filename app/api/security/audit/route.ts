
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SecurityEventType, SecurityCategory, SecuritySeverity } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/security/audit - Get security audit logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow venue admin or company admin to access audit logs
    if (session.user.role === 'PARENT') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const eventType = searchParams.get('eventType') as SecurityEventType | null;
    const severity = searchParams.get('severity') as SecuritySeverity | null;
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (session.user.role === 'VENUE_ADMIN' && venueId) {
      where.venueId = venueId;
    }

    if (eventType) where.eventType = eventType;
    if (severity) where.severity = severity;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const auditLogs = await prisma.securityAuditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    // Aggregate statistics
    const stats = await prisma.securityAuditLog.groupBy({
      by: ['eventType', 'severity'],
      where,
      _count: true,
    });

    const aggregatedStats = {
      totalEvents: auditLogs.length,
      byEventType: {} as { [key: string]: number },
      bySeverity: {} as { [key: string]: number },
      alerts: auditLogs.filter(log => log.alertTriggered).length,
      investigations: auditLogs.filter(log => log.investigationRequired).length,
    };

    stats.forEach(stat => {
      aggregatedStats.byEventType[stat.eventType] = (aggregatedStats.byEventType[stat.eventType] || 0) + stat._count;
      aggregatedStats.bySeverity[stat.severity] = (aggregatedStats.bySeverity[stat.severity] || 0) + stat._count;
    });

    return NextResponse.json({
      auditLogs,
      stats: aggregatedStats,
      pagination: {
        limit,
        offset,
        total: await prisma.securityAuditLog.count({ where }),
      },
    });
  } catch (error) {
    console.error('Error fetching security audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security audit logs' },
      { status: 500 }
    );
  }
}

// POST /api/security/audit - Create security audit log
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventType,
      category,
      severity = 'LOW',
      source,
      targetResource,
      action,
      result = 'SUCCESS',
      venueId,
      childId,
      ipAddress,
      userAgent,
      deviceInfo,
      location,
      requestData,
      responseCode,
      responseTime,
      dataAccessed,
      dataModified,
      sensitiveDataInvolved = false,
      riskScore = 0,
    } = body;

    // Validate required fields
    if (!eventType || !category || !source || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, category, source, action' },
        { status: 400 }
      );
    }

    // Calculate risk score based on event details
    let calculatedRiskScore = riskScore;
    if (sensitiveDataInvolved) calculatedRiskScore += 20;
    if (severity === 'HIGH' || severity === 'CRITICAL') calculatedRiskScore += 30;
    if (result === 'FAILURE') calculatedRiskScore += 15;

    // Determine if alert should be triggered
    const alertTriggered = calculatedRiskScore > 50 || severity === 'CRITICAL';
    const investigationRequired = calculatedRiskScore > 70 || alertTriggered;

    const auditLog = await prisma.securityAuditLog.create({
      data: {
        eventType,
        category,
        severity,
        source,
        userId: session.user.id,
        venueId,
        childId,
        targetResource,
        action,
        result,
        ipAddress,
        userAgent,
        deviceInfo,
        location,
        requestData,
        responseCode,
        responseTime,
        dataAccessed,
        dataModified,
        sensitiveDataInvolved,
        riskScore: calculatedRiskScore,
        alertTriggered,
        investigationRequired,
        correlatedEvents: [], // Would be populated by correlation engine
        metadata: {
          source: 'api_audit',
          version: '1.0',
          sessionId: session.user.id,
        },
      },
    });

    // If alert is triggered, create notification (in production, this would use a proper alerting system)
    if (alertTriggered) {
      // Log high-priority security event for monitoring
      console.warn('Security Alert Triggered:', {
        eventType,
        severity,
        riskScore: calculatedRiskScore,
        userId: session.user.id,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      auditLog: {
        id: auditLog.id,
        eventType: auditLog.eventType,
        severity: auditLog.severity,
        riskScore: auditLog.riskScore,
        alertTriggered: auditLog.alertTriggered,
        investigationRequired: auditLog.investigationRequired,
      },
      message: 'Security audit log created successfully',
    });
  } catch (error) {
    console.error('Error creating security audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create security audit log' },
      { status: 500 }
    );
  }
}
