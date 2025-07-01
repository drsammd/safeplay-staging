
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Brain, 
  Heart, 
  TrendingUp, 
  Shield, 
  Eye, 
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface AIInsightCard {
  id: string;
  type: 'safety' | 'emotion' | 'behavior' | 'engagement';
  title: string;
  description: string;
  score?: number;
  trend: 'up' | 'down' | 'stable';
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  recommendations?: string[];
}

interface ChildAIInsightsProps {
  childId: string;
  venueId: string;
}

export default function ChildAIInsights({ childId, venueId }: ChildAIInsightsProps) {
  const [insights, setInsights] = useState<AIInsightCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    fetchAIInsights();
  }, [childId, venueId]);

  const fetchAIInsights = async () => {
    try {
      setIsLoading(true);
      
      // Mock AI insights for demonstration
      const mockInsights: AIInsightCard[] = [
        {
          id: '1',
          type: 'emotion',
          title: 'Positive Emotional State',
          description: 'Your child is showing consistently happy and engaged emotions today',
          score: 94,
          trend: 'up',
          severity: 'low',
          timestamp: '2 minutes ago',
          recommendations: [
            'Current activities are well-suited for your child',
            'Continue encouraging participation in group activities'
          ]
        },
        {
          id: '2',
          type: 'behavior',
          title: 'High Engagement Level',
          description: 'AI detected excellent focus and participation in learning activities',
          score: 89,
          trend: 'up',
          severity: 'low',
          timestamp: '15 minutes ago',
          recommendations: [
            'Your child is thriving in the current environment',
            'Consider similar activities for home learning'
          ]
        },
        {
          id: '3',
          type: 'safety',
          title: 'Safe Play Environment',
          description: 'All safety metrics are optimal in your child\'s current zone',
          score: 96,
          trend: 'stable',
          severity: 'low',
          timestamp: '30 minutes ago',
          recommendations: [
            'Zone safety protocols are working effectively',
            'Your child is in a secure environment'
          ]
        }
      ];

      setInsights(mockInsights);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'safety':
        return <Shield className="h-5 w-5 text-green-600" />;
      case 'emotion':
        return <Heart className="h-5 w-5 text-pink-600" />;
      case 'behavior':
        return <Brain className="h-5 w-5 text-purple-600" />;
      case 'engagement':
        return <Eye className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      case 'stable':
        return <TrendingUp className="h-4 w-4 text-gray-500 rotate-90" />;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">Attention</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Notice</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Positive</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>AI Insights</span>
        </CardTitle>
        <CardDescription>
          Real-time intelligence about your child's wellbeing and activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getInsightIcon(insight.type)}
                  <div>
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(insight.trend)}
                  {getSeverityBadge(insight.severity)}
                </div>
              </div>

              {insight.score && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Wellbeing Score</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${insight.score}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{insight.score}/100</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{insight.timestamp}</span>
                {insight.recommendations && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDetails(
                      showDetails === insight.id ? null : insight.id
                    )}
                  >
                    {showDetails === insight.id ? 'Hide' : 'View'} Details
                  </Button>
                )}
              </div>

              {showDetails === insight.id && insight.recommendations && (
                <div className="border-t pt-3 mt-3">
                  <h5 className="font-medium text-sm mb-2">AI Recommendations:</h5>
                  <ul className="space-y-1">
                    {insight.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm text-blue-900">About AI Insights</h4>
              <p className="text-sm text-blue-700 mt-1">
                Our AI continuously monitors your child's emotional state, behavior patterns, 
                and engagement levels to ensure their safety and wellbeing. All analysis is 
                privacy-protected and designed to enhance your child's experience.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
