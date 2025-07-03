
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Brain, 
  Eye,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface AnalyticsData {
  behaviorTrends: any[];
  emotionDistribution: any[];
  crowdDensityTrends: any[];
  safetyMetrics: any[];
  alerts: any[];
}

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

export default function AIAnalyticsPage() {
  const { data: session } = useSession();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedZone, setSelectedZone] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange, selectedZone]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demonstration
      const mockData: AnalyticsData = {
        behaviorTrends: [
          { date: '2024-01-01', normal: 85, hyperactive: 10, withdrawal: 3, aggression: 2 },
          { date: '2024-01-02', normal: 88, hyperactive: 8, withdrawal: 2, aggression: 2 },
          { date: '2024-01-03', normal: 82, hyperactive: 12, withdrawal: 4, aggression: 2 },
          { date: '2024-01-04', normal: 90, hyperactive: 6, withdrawal: 2, aggression: 2 },
          { date: '2024-01-05', normal: 87, hyperactive: 9, withdrawal: 3, aggression: 1 },
          { date: '2024-01-06', normal: 85, hyperactive: 11, withdrawal: 3, aggression: 1 },
          { date: '2024-01-07', normal: 89, hyperactive: 7, withdrawal: 3, aggression: 1 },
        ],
        emotionDistribution: [
          { name: 'Happy', value: 45, color: '#4CAF50' },
          { name: 'Excited', value: 25, color: '#FF9800' },
          { name: 'Calm', value: 15, color: '#2196F3' },
          { name: 'Neutral', value: 10, color: '#9E9E9E' },
          { name: 'Anxious', value: 3, color: '#FF5722' },
          { name: 'Sad', value: 2, color: '#9C27B0' }
        ],
        crowdDensityTrends: [
          { hour: '09:00', density: 25, capacity: 100 },
          { hour: '10:00', density: 45, capacity: 100 },
          { hour: '11:00', density: 70, capacity: 100 },
          { hour: '12:00', density: 85, capacity: 100 },
          { hour: '13:00', density: 90, capacity: 100 },
          { hour: '14:00', density: 95, capacity: 100 },
          { hour: '15:00', density: 80, capacity: 100 },
          { hour: '16:00', density: 60, capacity: 100 },
          { hour: '17:00', density: 40, capacity: 100 },
        ],
        safetyMetrics: [
          { date: '2024-01-01', safetyScore: 88, incidents: 2, interventions: 5 },
          { date: '2024-01-02', safetyScore: 92, incidents: 1, interventions: 3 },
          { date: '2024-01-03', safetyScore: 85, incidents: 3, interventions: 7 },
          { date: '2024-01-04', safetyScore: 94, incidents: 1, interventions: 2 },
          { date: '2024-01-05', safetyScore: 90, incidents: 2, interventions: 4 },
          { date: '2024-01-06', safetyScore: 87, incidents: 2, interventions: 6 },
          { date: '2024-01-07', safetyScore: 93, incidents: 1, interventions: 3 },
        ],
        alerts: [
          { date: '2024-01-07', critical: 0, high: 2, medium: 5, low: 8 },
          { date: '2024-01-06', critical: 1, high: 3, medium: 4, low: 7 },
          { date: '2024-01-05', critical: 0, high: 1, medium: 6, low: 9 },
          { date: '2024-01-04', critical: 0, high: 2, medium: 3, low: 6 },
          { date: '2024-01-03', critical: 1, high: 4, medium: 7, low: 8 },
          { date: '2024-01-02', critical: 0, high: 1, medium: 4, low: 5 },
          { date: '2024-01-01', critical: 0, high: 2, medium: 5, low: 7 },
        ]
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const metricCards: MetricCard[] = [
    {
      title: 'Avg Safety Score',
      value: '91.2',
      change: '+2.4%',
      trend: 'up',
      icon: <Activity className="h-5 w-5" />
    },
    {
      title: 'Behavior Incidents',
      value: '12',
      change: '-15%',
      trend: 'down',
      icon: <Brain className="h-5 w-5" />
    },
    {
      title: 'Positive Emotions',
      value: '85%',
      change: '+3.2%',
      trend: 'up',
      icon: <Eye className="h-5 w-5" />
    },
    {
      title: 'Peak Capacity',
      value: '95%',
      change: '+5%',
      trend: 'up',
      icon: <Users className="h-5 w-5" />
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
          <h1 className="text-3xl font-bold text-gray-900">AI Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Advanced insights from AI analysis and behavioral monitoring
          </p>
        </div>
        <div className="flex space-x-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricCards.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-1 text-xs">
                {getTrendIcon(metric.trend)}
                <span className={getTrendColor(metric.trend)}>{metric.change}</span>
                <span className="text-muted-foreground">from last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="behavior">Behavior Analysis</TabsTrigger>
          <TabsTrigger value="emotions">Emotion Tracking</TabsTrigger>
          <TabsTrigger value="crowd">Crowd Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Safety Metrics Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Safety Score Trends</CardTitle>
                <CardDescription>Daily safety score and incident tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData?.safetyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="safetyScore" 
                      stroke="#4CAF50" 
                      strokeWidth={2}
                      name="Safety Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="incidents" 
                      stroke="#FF5722" 
                      strokeWidth={2}
                      name="Incidents"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Alert Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Distribution</CardTitle>
                <CardDescription>Daily alert levels and frequencies</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData?.alerts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="critical" stackId="a" fill="#f44336" name="Critical" />
                    <Bar dataKey="high" stackId="a" fill="#ff9800" name="High" />
                    <Bar dataKey="medium" stackId="a" fill="#ffeb3b" name="Medium" />
                    <Bar dataKey="low" stackId="a" fill="#4caf50" name="Low" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Behavior Pattern Trends</CardTitle>
              <CardDescription>Daily behavior classification percentages</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData?.behaviorTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="normal" stackId="a" fill="#4CAF50" name="Normal" />
                  <Bar dataKey="hyperactive" stackId="a" fill="#FF9800" name="Hyperactive" />
                  <Bar dataKey="withdrawal" stackId="a" fill="#2196F3" name="Withdrawal" />
                  <Bar dataKey="aggression" stackId="a" fill="#F44336" name="Aggression" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emotions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Emotion Distribution</CardTitle>
                <CardDescription>Current emotional state breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.emotionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData?.emotionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emotion Insights</CardTitle>
                <CardDescription>Key emotional indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Positive Emotions</span>
                    <Badge className="bg-green-100 text-green-800">85%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">High Energy</span>
                    <Badge className="bg-orange-100 text-orange-800">25%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">Requires Attention</span>
                    <Badge className="bg-red-100 text-red-800">5%</Badge>
                  </div>
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Recommendations:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Continue current activities for positive engagement</li>
                      <li>• Monitor high-energy children for safety</li>
                      <li>• Provide additional support for anxious children</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="crowd" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Crowd Density Patterns</CardTitle>
              <CardDescription>Hourly capacity utilization and density trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData?.crowdDensityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="density" fill="#2196F3" name="Current Density" />
                  <Line type="monotone" dataKey="capacity" stroke="#FF5722" name="Max Capacity" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
