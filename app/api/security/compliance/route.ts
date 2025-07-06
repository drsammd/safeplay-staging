
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ComplianceReportType, ComplianceStandard, ComplianceStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/security/compliance - Get compliance reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow venue admin or company admin to access compliance reports
    if (session.user.role === 'PARENT') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const reportType = searchParams.get('reportType') as ComplianceReportType | null;
    const standard = searchParams.get('standard') as ComplianceStandard | null;
    const status = searchParams.get('status') as ComplianceStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (session.user.role === 'VENUE_ADMIN' && venueId) {
      where.venueId = venueId;
    }

    if (reportType) where.reportType = reportType;
    if (standard) where.standard = standard;
    if (status) where.status = status;

    const complianceReports = await prisma.complianceReport.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      complianceReports,
      pagination: {
        limit,
        offset,
        total: await prisma.complianceReport.count({ where }),
      },
    });
  } catch (error) {
    console.error('Error fetching compliance reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance reports' },
      { status: 500 }
    );
  }
}

// POST /api/security/compliance - Generate compliance report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow venue admin or company admin to generate compliance reports
    if (session.user.role === 'PARENT') {
      return NextResponse.json(
        { error: 'Only venue administrators can generate compliance reports' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      reportType,
      standard,
      venueId,
      period,
      startDate,
      endDate,
      areas = [],
      confidentialityLevel = 'INTERNAL',
    } = body;

    // Validate required fields
    if (!reportType || !standard || !period || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: reportType, standard, period, startDate, endDate' },
        { status: 400 }
      );
    }

    // Generate compliance report (simplified simulation)
    const generateComplianceData = () => {
      const findings = [];
      const violations = [];
      const recommendations = [];

      // Simulate compliance checks based on standard
      switch (standard) {
        case 'COPPA':
          findings.push({
            area: 'Child Data Protection',
            status: 'COMPLIANT',
            score: 95,
            details: 'Proper consent mechanisms in place',
          });
          findings.push({
            area: 'Data Retention',
            status: 'PARTIALLY_COMPLIANT',
            score: 75,
            details: 'Some historical data retention beyond required period',
          });
          break;

        case 'GDPR':
          findings.push({
            area: 'Data Processing',
            status: 'COMPLIANT',
            score: 90,
            details: 'Lawful basis established for all processing activities',
          });
          findings.push({
            area: 'Individual Rights',
            status: 'COMPLIANT',
            score: 88,
            details: 'Data subject rights procedures implemented',
          });
          break;

        case 'PCI_DSS':
          findings.push({
            area: 'Payment Data Security',
            status: 'COMPLIANT',
            score: 92,
            details: 'Payment card data properly encrypted',
          });
          break;

        default:
          findings.push({
            area: 'General Security',
            status: 'COMPLIANT',
            score: 85,
            details: 'Security controls meet industry standards',
          });
      } as any

      const overallScore = findings.reduce((sum, finding) => sum + finding.score, 0) / findings.length;

      if (overallScore < 80) {
        violations.push({
          type: 'MINOR',
          description: 'Some areas require improvement',
          remediation: 'Implement recommended security controls',
        });
      } as any

      recommendations.push({
        priority: 'HIGH',
        title: 'Regular Security Training',
        description: 'Conduct quarterly security awareness training for all staff',
      });

      return {
        overallScore,
        findings,
        violations,
        recommendations,
      };
    };

    const complianceData = generateComplianceData();

    const complianceReport = await prisma.complianceReport.create({
      data: {
        reportType,
        standard,
        venueId,
        period,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'COMPLIANT',
        overallScore: complianceData.overallScore,
        complianceLevel: complianceData.overallScore >= 90 ? 'ADVANCED' : complianceData.overallScore >= 80 ? 'INTERMEDIATE' : 'BASIC',
        areas,
        findings: complianceData.findings,
        violations: complianceData.violations,
        recommendations: complianceData.recommendations,
        actionPlan: [],
        confidentialityLevel,
        version: '1.0',
      },
      include: {
        venue: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      complianceReport,
      message: 'Compliance report generated successfully',
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}
