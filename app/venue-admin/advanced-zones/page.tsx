
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Zap, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Brain,
  Target,
  BarChart3,
  Activity
} from 'lucide-react';

interface AdvancedZone {
  id: string;
  name: string;
  type: string;
  aiOptimization: boolean;
  predictiveAnalytics: boolean;
  autoCapacityManagement: boolean;
  smartAlerts: boolean;
  efficiency: number;
  averageStayTime: number;
  satisfactionScore: number;
  incidents: number;
}

const ADVANCED_ZONES: AdvancedZone[] = [
  {
    id: '1',
    name: 'AI-Optimized Play Area',
    type: 'PLAY_AREA',
    aiOptimization: true,
    predictiveAnalytics: true,
    autoCapacityManagement: true,
    smartAlerts: true,
    efficiency: 89,
    averageStayTime: 45,
    satisfactionScore: 92,
    incidents: 2
  },
  {
    id: '2',
    name: 'Smart Toddler Zone',
    type: 'TODDLER_AREA',
    aiOptimization: true,
    predictiveAnalytics: false,
    autoCapacityManagement: true,
    smartAlerts: true,
    efficiency: 94,
    averageStayTime: 35,
    satisfactionScore: 96,
    incidents: 0
  },
  {
    id: '3',
    name: 'Adaptive Party Room',
    type: 'PARTY_ROOM',
    aiOptimization: false,
    predictiveAnalytics: true,
    autoCapacityManagement: false,
    smartAlerts: false,
    efficiency: 76,
    averageStayTime: 120,
    satisfactionScore: 88,
    incidents: 1
  }
];

export default function AdvancedZonesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [zones, setZones] = useState<AdvancedZone[]>(ADVANCED_ZONES);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Authorization check
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (!['VENUE_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(session.user?.role)) {
      router.push('/unauthorized');
      return;
    }

    // Initialize data
    setLoading(false);
  }, [session, status, router]);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFeatureStatus = (enabled: boolean) => {
    return enabled ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-gray-400" />
    );
  };

  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading advanced zones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Zone Intelligence</h1>
          <p className="text-gray-600">AI-powered zone optimization and analytics</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={() => alert('Feature coming soon!')}>
            <Brain className="h-4 w-4 mr-2" />
            AI Optimization
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Overall Efficiency</p>
                <p className="text-2xl font-bold text-blue-600">86%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Avg Satisfaction</p>
                <p className="text-2xl font-bold text-green-600">92%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">AI Zones Active</p>
                <p className="text-2xl font-bold text-purple-600">2/3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Total Incidents</p>
                <p className="text-2xl font-bold text-red-600">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Zone Overview</TabsTrigger>
          <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <Card key={zone.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                    <Badge variant="outline">{zone.type.replace('_', ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Efficiency Score */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Efficiency</span>
                        <span className={`font-medium ${getEfficiencyColor(zone.efficiency)}`}>
                          {zone.efficiency}%
                        </span>
                      </div>
                      <Progress value={zone.efficiency} className="h-2" />
                    </div>

                    {/* AI Features */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">AI Features</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          {getFeatureStatus(zone.aiOptimization)}
                          <span>AI Optimization</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getFeatureStatus(zone.predictiveAnalytics)}
                          <span>Predictive Analytics</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getFeatureStatus(zone.autoCapacityManagement)}
                          <span>Auto Capacity</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getFeatureStatus(zone.smartAlerts)}
                          <span>Smart Alerts</span>
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Stay:</span>
                        <span className="font-medium">{zone.averageStayTime}min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Satisfaction:</span>
                        <span className="font-medium">{zone.satisfactionScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Incidents:</span>
                        <span className="font-medium">{zone.incidents}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Analytics Dashboard</CardTitle>
                <CardDescription>Real-time insights from AI zone monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analytics Engine</h3>
                  <p className="text-gray-600 mb-4">
                    Advanced analytics dashboard with predictive insights and real-time monitoring
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium">Pattern Recognition</h4>
                      <p className="text-sm text-gray-600">Identifies usage patterns and peak times</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium">Predictive Modeling</h4>
                      <p className="text-sm text-gray-600">Forecasts capacity and demand</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-medium">Optimization Engine</h4>
                      <p className="text-sm text-gray-600">Automatically adjusts zone parameters</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Zone Optimization Settings</CardTitle>
                <CardDescription>Configure AI-powered zone optimization parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Optimization Engine</h3>
                  <p className="text-gray-600 mb-4">
                    Advanced optimization settings for AI-powered zone management
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-medium mb-4">Capacity Optimization</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Auto-adjust capacity:</span>
                          <span className="text-green-600">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Peak hour management:</span>
                          <span className="text-green-600">Active</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dynamic pricing:</span>
                          <span className="text-gray-600">Disabled</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-medium mb-4">Safety Optimization</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Crowd detection:</span>
                          <span className="text-green-600">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Incident prediction:</span>
                          <span className="text-green-600">Active</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Emergency routing:</span>
                          <span className="text-green-600">Enabled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
