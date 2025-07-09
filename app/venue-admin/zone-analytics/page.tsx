
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Activity,
  Target,
  Zap,
  PieChart,
  Calendar,
  Download
} from 'lucide-react';

interface ZoneAnalytics {
  id: string;
  name: string;
  type: string;
  totalVisitors: number;
  averageStayTime: number;
  peakHours: string[];
  utilizationRate: number;
  revenueGenerated: number;
  satisfactionScore: number;
  incidentRate: number;
  popularityTrend: number;
}

interface TimeSlotData {
  hour: string;
  visitors: number;
  capacity: number;
  utilization: number;
}

const ZONE_ANALYTICS: ZoneAnalytics[] = [
  {
    id: '1',
    name: 'Main Play Area',
    type: 'PLAY_AREA',
    totalVisitors: 1247,
    averageStayTime: 45,
    peakHours: ['11:00-12:00', '15:00-16:00'],
    utilizationRate: 78,
    revenueGenerated: 3450,
    satisfactionScore: 88,
    incidentRate: 0.02,
    popularityTrend: 12
  },
  {
    id: '2',
    name: 'Toddler Zone',
    type: 'TODDLER_AREA',
    totalVisitors: 456,
    averageStayTime: 35,
    peakHours: ['10:00-11:00', '14:00-15:00'],
    utilizationRate: 65,
    revenueGenerated: 1890,
    satisfactionScore: 92,
    incidentRate: 0.01,
    popularityTrend: 8
  },
  {
    id: '3',
    name: 'Party Room A',
    type: 'PARTY_ROOM',
    totalVisitors: 234,
    averageStayTime: 120,
    peakHours: ['13:00-14:00', '16:00-17:00'],
    utilizationRate: 45,
    revenueGenerated: 2100,
    satisfactionScore: 85,
    incidentRate: 0.00,
    popularityTrend: -5
  },
  {
    id: '4',
    name: 'Food Court',
    type: 'FOOD_COURT',
    totalVisitors: 890,
    averageStayTime: 25,
    peakHours: ['12:00-13:00', '17:00-18:00'],
    utilizationRate: 82,
    revenueGenerated: 4200,
    satisfactionScore: 79,
    incidentRate: 0.03,
    popularityTrend: 15
  }
];

const HOURLY_DATA: TimeSlotData[] = [
  { hour: '09:00', visitors: 45, capacity: 200, utilization: 23 },
  { hour: '10:00', visitors: 78, capacity: 200, utilization: 39 },
  { hour: '11:00', visitors: 145, capacity: 200, utilization: 73 },
  { hour: '12:00', visitors: 189, capacity: 200, utilization: 95 },
  { hour: '13:00', visitors: 167, capacity: 200, utilization: 84 },
  { hour: '14:00', visitors: 198, capacity: 200, utilization: 99 },
  { hour: '15:00', visitors: 176, capacity: 200, utilization: 88 },
  { hour: '16:00', visitors: 156, capacity: 200, utilization: 78 },
  { hour: '17:00', visitors: 134, capacity: 200, utilization: 67 },
  { hour: '18:00', visitors: 98, capacity: 200, utilization: 49 }
];

export default function ZoneAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

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

    setLoading(false);
  }, [session, status, router]);

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return '↗';
    if (trend < 0) return '↘';
    return '→';
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredZones = selectedZone === 'all' ? ZONE_ANALYTICS : ZONE_ANALYTICS.filter(z => z.id === selectedZone);

  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading zone analytics...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Zone Analytics</h1>
          <p className="text-gray-600">Detailed analytics and insights for all zones</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {ZONE_ANALYTICS.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => alert('Export feature coming soon!')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Total Visitors</p>
                <p className="text-2xl font-bold text-blue-600">
                  {ZONE_ANALYTICS.reduce((sum, zone) => sum + zone.totalVisitors, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Avg Utilization</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(ZONE_ANALYTICS.reduce((sum, zone) => sum + zone.utilizationRate, 0) / ZONE_ANALYTICS.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Avg Stay Time</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(ZONE_ANALYTICS.reduce((sum, zone) => sum + zone.averageStayTime, 0) / ZONE_ANALYTICS.length)}min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Revenue</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${ZONE_ANALYTICS.reduce((sum, zone) => sum + zone.revenueGenerated, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Zone Overview</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredZones.map((zone) => (
              <Card key={zone.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                    <Badge variant="outline">{zone.type.replace('_', ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Utilization */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Utilization</span>
                        <span className={`font-medium ${getUtilizationColor(zone.utilizationRate)}`}>
                          {zone.utilizationRate}%
                        </span>
                      </div>
                      <Progress value={zone.utilizationRate} className="h-2" />
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600">Visitors</span>
                        </div>
                        <p className="font-medium">{zone.totalVisitors}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600">Avg Stay</span>
                        </div>
                        <p className="font-medium">{zone.averageStayTime}min</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600">Revenue</span>
                        </div>
                        <p className="font-medium">${zone.revenueGenerated}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600">Satisfaction</span>
                        </div>
                        <p className="font-medium">{zone.satisfactionScore}%</p>
                      </div>
                    </div>

                    {/* Trend */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Trend</span>
                      <span className={`text-sm font-medium ${getTrendColor(zone.popularityTrend)}`}>
                        {getTrendIcon(zone.popularityTrend)} {Math.abs(zone.popularityTrend)}%
                      </span>
                    </div>

                    {/* Peak Hours */}
                    <div className="space-y-1">
                      <span className="text-sm text-gray-600">Peak Hours</span>
                      <div className="flex flex-wrap gap-1">
                        {zone.peakHours.map((hour) => (
                          <Badge key={hour} variant="secondary" className="text-xs">
                            {hour}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="utilization" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Utilization</CardTitle>
                <CardDescription>Real-time utilization throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {HOURLY_DATA.map((data) => (
                    <div key={data.hour} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-12">{data.hour}</span>
                        <div className="flex-1 w-32">
                          <Progress value={data.utilization} className="h-2" />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{data.visitors}</span>
                        <span className="text-xs text-gray-500">/{data.capacity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zone Comparison</CardTitle>
                <CardDescription>Compare utilization across all zones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ZONE_ANALYTICS.map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-24 truncate">{zone.name}</span>
                        <div className="flex-1 w-32">
                          <Progress value={zone.utilizationRate} className="h-2" />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${getUtilizationColor(zone.utilizationRate)}`}>
                          {zone.utilizationRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators by zone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {ZONE_ANALYTICS.map((zone) => (
                    <div key={zone.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{zone.name}</h4>
                        <Badge variant="outline">{zone.type.replace('_', ' ')}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Revenue</p>
                          <p className="font-medium">${zone.revenueGenerated}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Satisfaction</p>
                          <p className="font-medium">{zone.satisfactionScore}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Incidents</p>
                          <p className="font-medium">{(zone.incidentRate * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trends Analysis</CardTitle>
                <CardDescription>Performance trends and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                  <p className="text-gray-600 mb-4">
                    Comprehensive trend analysis and predictive insights
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium">Growth Trends</h4>
                      <p className="text-sm text-gray-600">Track visitor growth patterns</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <PieChart className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium">Revenue Analysis</h4>
                      <p className="text-sm text-gray-600">Analyze revenue by zone and time</p>
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
