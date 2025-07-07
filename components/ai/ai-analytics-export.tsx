
'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar, 
  Filter,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface ExportOptions {
  format: 'CSV' | 'PDF' | 'JSON';
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'custom';
  startDate?: string;
  endDate?: string;
  includeMetrics: {
    ageEstimation: boolean;
    emotionDetection: boolean;
    crowdAnalysis: boolean;
    behaviorDetection: boolean;
    voiceAnalysis: boolean;
    visualPatterns: boolean;
    safetyScores: boolean;
    insights: boolean;
  };
  includeCharts: boolean;
  includeRawData: boolean;
  anonymizeData: boolean;
}

interface AIAnalyticsExportProps {
  trigger?: React.ReactNode;
  onExportComplete?: (exportData: any) => void;
}

const defaultExportOptions: ExportOptions = {
  format: 'PDF',
  dateRange: 'month',
  includeMetrics: {
    ageEstimation: true,
    emotionDetection: true,
    crowdAnalysis: true,
    behaviorDetection: true,
    voiceAnalysis: false,
    visualPatterns: true,
    safetyScores: true,
    insights: true,
  },
  includeCharts: true,
  includeRawData: false,
  anonymizeData: true,
};

export function AIAnalyticsExport({ trigger, onExportComplete }: AIAnalyticsExportProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ExportOptions>(defaultExportOptions);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    try {
      setLoading(true);
      setProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Prepare export data
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          dateRange: options.dateRange,
          startDate: options.startDate,
          endDate: options.endDate,
          format: options.format,
          venue: 'Demo Venue', // Would be dynamic
          generatedBy: 'AI Analytics System',
        },
        summary: {
          totalEvents: 1247,
          averageSafetyScore: 92.5,
          alertsGenerated: 23,
          featuresActive: Object.values(options.includeMetrics).filter(Boolean).length,
        },
        metrics: {},
        insights: [],
        charts: [],
      };

      // Add selected metrics
      if (options.includeMetrics.ageEstimation) {
        exportData.metrics.ageEstimation = {
          totalDetections: 856,
          averageAccuracy: 94.5,
          ageDistribution: {
            '0-5': 234,
            '6-10': 312,
            '11-15': 298,
            '16+': 12,
          },
        };
      }

      if (options.includeMetrics.emotionDetection) {
        exportData.metrics.emotionDetection = {
          totalDetections: 1203,
          averageAccuracy: 89.2,
          emotionDistribution: {
            happy: 567,
            neutral: 423,
            excited: 156,
            sad: 34,
            angry: 23,
          },
          negativeEmotionAlerts: 12,
        };
      }

      if (options.includeMetrics.crowdAnalysis) {
        exportData.metrics.crowdAnalysis = {
          averageOccupancy: 68.3,
          peakOccupancy: 94.2,
          capacityAlerts: 8,
          busyPeriods: [
            { time: '10:00-12:00', occupancy: 85.6 },
            { time: '14:00-16:00', occupancy: 91.2 },
          ],
        };
      }

      if (options.includeMetrics.behaviorDetection) {
        exportData.metrics.behaviorDetection = {
          totalAnalyses: 2341,
          averageAccuracy: 87.3,
          behaviorAlerts: 15,
          patterns: {
            positive: 2198,
            neutral: 128,
            concerning: 15,
          },
        };
      }

      if (options.includeMetrics.safetyScores) {
        exportData.metrics.safetyScores = {
          overallVenue: 92.5,
          zoneSafety: 88.3,
          childWellbeing: 94.1,
          environmental: 86.7,
          trend: 'improving',
        };
      }

      if (options.includeMetrics.insights) {
        exportData.insights = [
          {
            id: '1',
            title: 'Peak Activity Periods Identified',
            description: 'Analysis shows consistent high activity between 2-4 PM',
            severity: 'low',
            category: 'BEHAVIOR',
            actionRequired: false,
          },
          {
            id: '2',
            title: 'Improved Safety Scores',
            description: 'Overall safety scores have improved by 8% this month',
            severity: 'low',
            category: 'SAFETY',
            actionRequired: false,
          },
          {
            id: '3',
            title: 'Crowd Management Effective',
            description: 'No capacity violations detected in the past week',
            severity: 'low',
            category: 'SAFETY',
            actionRequired: false,
          },
        ];
      }

      // Simulate API call
      const response = await fetch('/api/ai/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options, data: exportData }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const result = await response.json();
        
        // Create download link
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: options.format === 'JSON' ? 'application/json' : 'text/plain' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-analytics-${options.dateRange}-${Date.now()}.${options.format.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Analytics report exported successfully as ${options.format}`);
        onExportComplete?.(exportData);
        setOpen(false);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics report');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const updateMetric = (metric: keyof ExportOptions['includeMetrics'], value: boolean) => {
    setOptions(prev => ({
      ...prev,
      includeMetrics: {
        ...prev.includeMetrics,
        [metric]: value,
      },
    }));
  };

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case 'today': return 'Today';
      case 'week': return 'Last 7 days';
      case 'month': return 'Last 30 days';
      case 'quarter': return 'Last 90 days';
      case 'custom': return 'Custom range';
      default: return range;
    }
  };

  const selectedMetricsCount = Object.values(options.includeMetrics).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span>Export AI Analytics Report</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Format</CardTitle>
              <CardDescription>Choose the format for your analytics report</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={options.format} onValueChange={(value: any) => setOptions({...options, format: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>PDF Report (Recommended)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CSV">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>CSV Data</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="JSON">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>JSON Data</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Date Range</CardTitle>
              <CardDescription>Select the time period for your report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={options.dateRange} onValueChange={(value: any) => setOptions({...options, dateRange: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                  <SelectItem value="quarter">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>

              {options.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={options.startDate || ''}
                      onChange={(e) => setOptions({...options, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={options.endDate || ''}
                      onChange={(e) => setOptions({...options, endDate: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metrics Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Include Metrics</span>
                <Badge variant="outline">
                  {selectedMetricsCount} selected
                </Badge>
              </CardTitle>
              <CardDescription>Choose which AI metrics to include in your report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ageEstimation"
                      checked={options.includeMetrics.ageEstimation}
                      onCheckedChange={(checked) => updateMetric('ageEstimation', !!checked)}
                    />
                    <Label htmlFor="ageEstimation">Age Estimation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emotionDetection"
                      checked={options.includeMetrics.emotionDetection}
                      onCheckedChange={(checked) => updateMetric('emotionDetection', !!checked)}
                    />
                    <Label htmlFor="emotionDetection">Emotion Detection</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="crowdAnalysis"
                      checked={options.includeMetrics.crowdAnalysis}
                      onCheckedChange={(checked) => updateMetric('crowdAnalysis', !!checked)}
                    />
                    <Label htmlFor="crowdAnalysis">Crowd Analysis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="behaviorDetection"
                      checked={options.includeMetrics.behaviorDetection}
                      onCheckedChange={(checked) => updateMetric('behaviorDetection', !!checked)}
                    />
                    <Label htmlFor="behaviorDetection">Behavior Detection</Label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="voiceAnalysis"
                      checked={options.includeMetrics.voiceAnalysis}
                      onCheckedChange={(checked) => updateMetric('voiceAnalysis', !!checked)}
                    />
                    <Label htmlFor="voiceAnalysis">Voice Analysis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="visualPatterns"
                      checked={options.includeMetrics.visualPatterns}
                      onCheckedChange={(checked) => updateMetric('visualPatterns', !!checked)}
                    />
                    <Label htmlFor="visualPatterns">Visual Patterns</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="safetyScores"
                      checked={options.includeMetrics.safetyScores}
                      onCheckedChange={(checked) => updateMetric('safetyScores', !!checked)}
                    />
                    <Label htmlFor="safetyScores">Safety Scores</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insights"
                      checked={options.includeMetrics.insights}
                      onCheckedChange={(checked) => updateMetric('insights', !!checked)}
                    />
                    <Label htmlFor="insights">AI Insights</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Options</CardTitle>
              <CardDescription>Customize your report content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={options.includeCharts}
                  onCheckedChange={(checked) => setOptions({...options, includeCharts: !!checked})}
                />
                <Label htmlFor="includeCharts">Include charts and visualizations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRawData"
                  checked={options.includeRawData}
                  onCheckedChange={(checked) => setOptions({...options, includeRawData: !!checked})}
                />
                <Label htmlFor="includeRawData">Include raw data tables</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymizeData"
                  checked={options.anonymizeData}
                  onCheckedChange={(checked) => setOptions({...options, anonymizeData: !!checked})}
                />
                <Label htmlFor="anonymizeData">Anonymize personal data</Label>
              </div>
            </CardContent>
          </Card>

          {/* Export Progress */}
          {loading && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating report...</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Processing {getDateRangeLabel(options.dateRange)} data with {selectedMetricsCount} metrics
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Format:</span>
                  <Badge variant="outline">{options.format}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Date Range:</span>
                  <span>{getDateRangeLabel(options.dateRange)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metrics:</span>
                  <span>{selectedMetricsCount} selected</span>
                </div>
                <div className="flex justify-between">
                  <span>Charts:</span>
                  <span>{options.includeCharts ? 'Included' : 'Excluded'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Privacy:</span>
                  <span>{options.anonymizeData ? 'Anonymized' : 'Full data'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loading || selectedMetricsCount === 0}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
