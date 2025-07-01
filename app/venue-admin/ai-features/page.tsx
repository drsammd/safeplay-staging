
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Progress } from '../../../components/ui/progress';
import { 
  Activity, 
  Brain, 
  Eye, 
  Mic, 
  Users, 
  Heart, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface AIFeatureStatus {
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  accuracy: number;
  lastUpdate: string;
  icon: React.ReactNode;
}

interface SafetyScore {
  type: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  lastCalculated: string;
}

interface RecentInsight {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  createdAt: string;
  actionRequired: boolean;
}

export default function AIFeaturesPage() {
  const { data: session } = useSession();
  const [aiFeatures, setAiFeatures] = useState<AIFeatureStatus[]>([]);
  const [safetyScores, setSafetyScores] = useState<SafetyScore[]>([]);
  const [recentInsights, setRecentInsights] = useState<RecentInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAIData();
  }, []);

  const fetchAIData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demonstration
      setAiFeatures([
        {
          name: 'Age Estimation',
          type: 'AGE_ESTIMATION',
          status: 'active',
          accuracy: 94.5,
          lastUpdate: '2 minutes ago',
          icon: <Eye className="h-5 w-5" />
        },
        {
          name: 'Emotion Detection',
          type: 'EMOTION_DETECTION',
          status: 'active',
          accuracy: 89.2,
          lastUpdate: '1 minute ago',
          icon: <Heart className="h-5 w-5" />
        },
        {
          name: 'Crowd Analysis',
          type: 'CROWD_DENSITY',
          status: 'active',
          accuracy: 92.8,
          lastUpdate: '30 seconds ago',
          icon: <Users className="h-5 w-5" />
        },
        {
          name: 'Behavior Detection',
          type: 'BEHAVIOR_PATTERN',
          status: 'active',
          accuracy: 87.3,
          lastUpdate: '1 minute ago',
          icon: <Activity className="h-5 w-5" />
        },
        {
          name: 'Voice Analysis',
          type: 'VOICE_PATTERN',
          status: 'inactive',
          accuracy: 0,
          lastUpdate: 'Not running',
          icon: <Mic className="h-5 w-5" />
        },
        {
          name: 'Visual Patterns',
          type: 'VISUAL_PATTERN',
          status: 'active',
          accuracy: 91.7,
          lastUpdate: '45 seconds ago',
          icon: <Brain className="h-5 w-5" />
        }
      ]);

      setSafetyScores([
        { type: 'Overall Venue', score: 92.5, trend: 'up', lastCalculated: '1 hour ago' },
        { type: 'Zone Safety', score: 88.3, trend: 'stable', lastCalculated: '2 hours ago' },
        { type: 'Child Wellbeing', score: 94.1, trend: 'up', lastCalculated: '30 minutes ago' },
        { type: 'Environmental', score: 86.7, trend: 'down', lastCalculated: '1 hour ago' }
      ]);

      setRecentInsights([
        {
          id: '1',
          title: 'Potential Bullying Pattern Detected',
          description: 'AI detected aggressive interaction pattern in Zone 3',
          severity: 'high',
          category: 'BEHAVIOR',
          createdAt: '5 minutes ago',
          actionRequired: true
        },
        {
          id: '2',
          title: 'High Engagement in Activity Zone',
          description: 'Children showing excellent engagement levels in art studio',
          severity: 'low',
          category: 'BEHAVIOR',
          createdAt: '15 minutes ago',
          actionRequired: false
        },
        {
          id: '3',
          title: 'Crowd Density Alert',
          description: 'Zone 2 approaching capacity limits - monitor closely',
          severity: 'medium',
          category: 'SAFETY',
          createdAt: '30 minutes ago',
          actionRequired: true
        }
      ]);

    } catch (error) {
      console.error('Error fetching AI data:', error);
      toast.error('Failed to load AI features data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced AI Features</h1>
          <p className="text-gray-600 mt-2">
            Advanced artificial intelligence for child safety and behavioral analysis
          </p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Configure AI Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">AI Features</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="safety">Safety Scores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active AI Features</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aiFeatures.filter(f => f.status === 'active').length}/{aiFeatures.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Features currently running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    aiFeatures
                      .filter(f => f.status === 'active')
                      .reduce((sum, f) => sum + f.accuracy, 0) /
                    aiFeatures.filter(f => f.status === 'active').length
                  )}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all active features
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">92.5</div>
                <p className="text-xs text-muted-foreground">
                  Overall venue safety
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {recentInsights.filter(i => i.actionRequired).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requiring attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Insights</CardTitle>
              <CardDescription>
                Latest insights generated by AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInsights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <div className="flex items-center space-x-2">
                          {getSeverityBadge(insight.severity)}
                          {insight.actionRequired && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              Action Required
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      <p className="text-xs text-gray-500">{insight.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiFeatures.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {feature.icon}
                      <span>{feature.name}</span>
                    </div>
                    {getStatusIcon(feature.status)}
                  </CardTitle>
                  <CardDescription>{getStatusBadge(feature.status)}</CardDescription>
                </CardHeader>
                <CardContent>
                  {feature.status === 'active' && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Accuracy</span>
                          <span>{feature.accuracy}%</span>
                        </div>
                        <Progress value={feature.accuracy} className="h-2" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Last update: {feature.lastUpdate}
                      </p>
                    </div>
                  )}
                  {feature.status === 'inactive' && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Feature is currently disabled</p>
                      <Button size="sm" className="w-full">
                        Enable Feature
                      </Button>
                    </div>
                  )}
                  {feature.status === 'error' && (
                    <div className="space-y-3">
                      <p className="text-sm text-red-600">Feature encountered an error</p>
                      <Button size="sm" variant="outline" className="w-full">
                        Restart Feature
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {recentInsights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold">{insight.title}</h3>
                        {getSeverityBadge(insight.severity)}
                        <Badge variant="outline">{insight.category}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{insight.description}</p>
                      <p className="text-sm text-gray-500">{insight.createdAt}</p>
                    </div>
                    {insight.actionRequired && (
                      <Button size="sm" className="ml-4">
                        Take Action
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safetyScores.map((score, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{score.type}</span>
                    {getTrendIcon(score.trend)}
                  </CardTitle>
                  <CardDescription>Last calculated: {score.lastCalculated}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold">{score.score}</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Out of 100</div>
                        <div className={`text-sm ${
                          score.score >= 90 ? 'text-green-600' :
                          score.score >= 75 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {score.score >= 90 ? 'Excellent' :
                           score.score >= 75 ? 'Good' :
                           'Needs Improvement'}
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={score.score} 
                      className="h-3"
                    />
                    <Button size="sm" variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
