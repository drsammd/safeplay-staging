
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { options, data } = body;

    if (!options || !data) {
      return NextResponse.json(
        { error: 'Export options and data are required' },
        { status: 400 }
      );
    }

    // Generate export based on format
    let exportContent: string;
    let contentType: string;
    let fileExtension: string;

    switch (options.format) {
      case 'CSV':
        exportContent = generateCSVExport(data, options);
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      
      case 'JSON':
        exportContent = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      
      case 'PDF':
        exportContent = generatePDFContent(data, options);
        contentType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      
      default:
        return NextResponse.json(
          { error: 'Unsupported export format' },
          { status: 400 }
        );
    }

    // Log the export
    console.log('AI analytics export generated:', {
      userId: session.user.id,
      format: options.format,
      dateRange: options.dateRange,
      metricsCount: Object.keys(options.includeMetrics).filter(k => options.includeMetrics[k]).length,
      timestamp: new Date().toISOString(),
    });

    // Return export data
    return NextResponse.json({
      success: true,
      export: {
        content: exportContent,
        contentType,
        filename: `ai-analytics-${options.dateRange}-${Date.now()}.${fileExtension}`,
        size: exportContent.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating AI analytics export:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}

function generateCSVExport(data: any, options: any): string {
  const lines: string[] = [];
  
  // Header
  lines.push('AI Analytics Export Report');
  lines.push(`Generated: ${data.metadata.exportDate}`);
  lines.push(`Date Range: ${data.metadata.dateRange}`);
  lines.push(`Venue: ${data.metadata.venue}`);
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push('Metric,Value');
  lines.push(`Total Events,${data.summary.totalEvents}`);
  lines.push(`Average Safety Score,${data.summary.averageSafetyScore}`);
  lines.push(`Alerts Generated,${data.summary.alertsGenerated}`);
  lines.push(`Features Active,${data.summary.featuresActive}`);
  lines.push('');

  // Metrics
  if (options.includeMetrics.ageEstimation && data.metrics.ageEstimation) {
    lines.push('AGE ESTIMATION');
    lines.push('Metric,Value');
    lines.push(`Total Detections,${data.metrics.ageEstimation.totalDetections}`);
    lines.push(`Average Accuracy,${data.metrics.ageEstimation.averageAccuracy}%`);
    lines.push('Age Group,Count');
    Object.entries(data.metrics.ageEstimation.ageDistribution).forEach(([age, count]) => {
      lines.push(`${age},${count}`);
    });
    lines.push('');
  }

  if (options.includeMetrics.emotionDetection && data.metrics.emotionDetection) {
    lines.push('EMOTION DETECTION');
    lines.push('Metric,Value');
    lines.push(`Total Detections,${data.metrics.emotionDetection.totalDetections}`);
    lines.push(`Average Accuracy,${data.metrics.emotionDetection.averageAccuracy}%`);
    lines.push('Emotion,Count');
    Object.entries(data.metrics.emotionDetection.emotionDistribution).forEach(([emotion, count]) => {
      lines.push(`${emotion},${count}`);
    });
    lines.push('');
  }

  if (options.includeMetrics.crowdAnalysis && data.metrics.crowdAnalysis) {
    lines.push('CROWD ANALYSIS');
    lines.push('Metric,Value');
    lines.push(`Average Occupancy,${data.metrics.crowdAnalysis.averageOccupancy}%`);
    lines.push(`Peak Occupancy,${data.metrics.crowdAnalysis.peakOccupancy}%`);
    lines.push(`Capacity Alerts,${data.metrics.crowdAnalysis.capacityAlerts}`);
    lines.push('');
  }

  // Insights
  if (options.includeMetrics.insights && data.insights.length > 0) {
    lines.push('AI INSIGHTS');
    lines.push('Title,Description,Severity,Category,Action Required');
    data.insights.forEach((insight: any) => {
      lines.push(`"${insight.title}","${insight.description}",${insight.severity},${insight.category},${insight.actionRequired}`);
    });
  }

  return lines.join('\n');
}

function generatePDFContent(data: any, options: any): string {
  // In a real implementation, you would use a PDF library like jsPDF or PDFKit
  // For now, return a formatted text representation
  const content = [
    '='.repeat(60),
    'AI ANALYTICS EXPORT REPORT',
    '='.repeat(60),
    '',
    `Generated: ${new Date(data.metadata.exportDate).toLocaleString()}`,
    `Date Range: ${data.metadata.dateRange}`,
    `Venue: ${data.metadata.venue}`,
    `Format: ${data.metadata.format}`,
    '',
    'EXECUTIVE SUMMARY',
    '-'.repeat(40),
    `Total Events Processed: ${data.summary.totalEvents.toLocaleString()}`,
    `Overall Safety Score: ${data.summary.averageSafetyScore}/100`,
    `Alerts Generated: ${data.summary.alertsGenerated}`,
    `Active AI Features: ${data.summary.featuresActive}`,
    '',
  ];

  // Add metrics sections
  if (options.includeMetrics.ageEstimation && data.metrics.ageEstimation) {
    content.push(
      'AGE ESTIMATION ANALYSIS',
      '-'.repeat(40),
      `Total Detections: ${data.metrics.ageEstimation.totalDetections.toLocaleString()}`,
      `Average Accuracy: ${data.metrics.ageEstimation.averageAccuracy}%`,
      '',
      'Age Distribution:',
      ...Object.entries(data.metrics.ageEstimation.ageDistribution).map(
        ([age, count]) => `  ${age}: ${count} children`
      ),
      ''
    );
  }

  if (options.includeMetrics.emotionDetection && data.metrics.emotionDetection) {
    content.push(
      'EMOTION DETECTION ANALYSIS',
      '-'.repeat(40),
      `Total Detections: ${data.metrics.emotionDetection.totalDetections.toLocaleString()}`,
      `Average Accuracy: ${data.metrics.emotionDetection.averageAccuracy}%`,
      `Negative Emotion Alerts: ${data.metrics.emotionDetection.negativeEmotionAlerts}`,
      '',
      'Emotion Distribution:',
      ...Object.entries(data.metrics.emotionDetection.emotionDistribution).map(
        ([emotion, count]) => `  ${emotion}: ${count} detections`
      ),
      ''
    );
  }

  if (options.includeMetrics.crowdAnalysis && data.metrics.crowdAnalysis) {
    content.push(
      'CROWD ANALYSIS',
      '-'.repeat(40),
      `Average Occupancy: ${data.metrics.crowdAnalysis.averageOccupancy}%`,
      `Peak Occupancy: ${data.metrics.crowdAnalysis.peakOccupancy}%`,
      `Capacity Alerts: ${data.metrics.crowdAnalysis.capacityAlerts}`,
      '',
      'Busy Periods:',
      ...data.metrics.crowdAnalysis.busyPeriods.map(
        (period: any) => `  ${period.time}: ${period.occupancy}% occupancy`
      ),
      ''
    );
  }

  if (options.includeMetrics.safetyScores && data.metrics.safetyScores) {
    content.push(
      'SAFETY SCORES',
      '-'.repeat(40),
      `Overall Venue Safety: ${data.metrics.safetyScores.overallVenue}/100`,
      `Zone Safety: ${data.metrics.safetyScores.zoneSafety}/100`,
      `Child Wellbeing: ${data.metrics.safetyScores.childWellbeing}/100`,
      `Environmental Safety: ${data.metrics.safetyScores.environmental}/100`,
      `Trend: ${data.metrics.safetyScores.trend}`,
      ''
    );
  }

  // Add insights
  if (options.includeMetrics.insights && data.insights.length > 0) {
    content.push(
      'AI INSIGHTS & RECOMMENDATIONS',
      '-'.repeat(40)
    );
    
    data.insights.forEach((insight: any, index: number) => {
      content.push(
        `${index + 1}. ${insight.title}`,
        `   ${insight.description}`,
        `   Severity: ${insight.severity.toUpperCase()} | Category: ${insight.category}`,
        `   Action Required: ${insight.actionRequired ? 'YES' : 'NO'}`,
        ''
      );
    });
  }

  content.push(
    '='.repeat(60),
    'End of Report',
    `Generated by SafePlay AI Analytics System`,
    `Report ID: ${data.metadata.exportDate}`,
    '='.repeat(60)
  );

  return content.join('\n');
}
