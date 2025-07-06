
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { DateRangePicker } from '@/components/ui/date-range-picker';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Users, Shield, AlertTriangle, CheckCircle, Target, Brain, Zap } from 'lucide-react';

interface ZoneAnalytics {
  zoneId: string;
  zoneName: string;
  zoneType: string;
  analytics: {
    avgUtilization: number;
    totalEntries: number;
    totalExits: number;
    avgStayTime: number;
    safetyScore: number;
    totalViolations: number;
    totalRevenue: number;
  };
  currentMetrics: {
    violations: number;
    activeAlerts: number;
  };
}

interface PerformanceRanking {
  zoneId: string;
  zoneName: string;
  zoneType: string;
  score: number;
  metrics: {
    utilization: number;
    safety: number;
    efficiency: number;
    revenue: number;
    violations: number;
  };
}

interface OptimizationRecommendation {
  id: string;
  type: string;
  zoneId: string;
  zoneName: string;
  title: string;
  description: string;
  priority: string;
  impact: number;
  effort: number;
  estimatedCost: number;
  estimatedSavings: number;
  paybackPeriod: number;
  recommendations: string[];
  metrics: any;
}

interface Insight {
  type: string;
  title: string;
  message: string;
  zones: string[];
  actionable: boolean;
  recommendation: string;
}

export default function ZoneAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [optimizations, setOptimizations] = useState<OptimizationRecommendation[]>([]);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [venues, setVenues] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30');
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (session.user?.role !== 'VENUE_ADMIN' && session.user?.role !== 'SUPER_ADMIN') {
      router.push('/unauthorized');
      return;
    }

    fetchVenues();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedVenue) {
      fetchAnalyticsData();
    }
  }, [selectedVenue, timeRange, analysisType]);

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venues');
      if (response.ok) {
        const data = await response.json();
        setVenues(data.venues || []);
        if (data.venues?.length > 0) {
          setSelectedVenue(data.venues[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      setError('Failed to load venues');
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch zone analytics
      const analyticsResponse = await fetch(`/api/zones/analytics?venueId=${selectedVenue}&period=${timeRange}&includeComparisons=true`);
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }

      // Fetch optimization recommendations
      const optimizationResponse = await fetch(`/api/zones/optimization?venueId=${selectedVenue}&includeImplementationPlan=true`);
      if (optimizationResponse.ok) {
        const optimizationData = await optimizationResponse.json();
        setOptimizations(optimizationData.optimizations || []);
      }

      // Fetch AI intelligence insights
      const intelligenceResponse = await fetch(`/api/zones/intelligence?venueId=${selectedVenue}&type=${analysisType}&horizon=${timeRange}&includeForecasts=true&includePredictive=true`);
      if (intelligenceResponse.ok) {
        const intelligenceData = await intelligenceResponse.json();
        setIntelligence(intelligenceData);
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyOptimization = async (optimizationId: string) => {
    try {
      const response = await fetch('/api/zones/optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_implemented',
          optimizationId
        })
      });

      if (response.ok) {
        toast.success('Optimization marked as implemented');
        fetchAnalyticsData();
      } else {
        throw new Error('Failed to apply optimization');
      }
    } catch (error) {
      console.error('Error applying optimization:', error);
      toast.error('Failed to apply optimization');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchAnalyticsData}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const utilizationData = analytics?.analytics?.byZone?.map((zone: any) => ({
    name: zone.name.substring(0, 15) + (zone.name.length > 15 ? '...' : ''),
    utilization: zone.analytics?.avgUtilization || 0,
    safety: zone.analytics?.safetyScore || 0,
    revenue: zone.analytics?.totalRevenue || 0
  })) || [];

  const performanceData = analytics?.performance?.rankings?.slice(0, 10).map((ranking: PerformanceRanking) => ({
    name: ranking.zoneName.substring(0, 12) + (ranking.zoneName.length > 12 ? '...' : ''),
    score: ranking.score,
    utilization: ranking.metrics.utilization,
    safety: ranking.metrics.safety,
    efficiency: ranking.metrics.efficiency
  })) || [];

  const trendsData = analytics?.performance?.trends?.map((trend: any) => ({
    date: trend.date,
    utilization: trend.utilization
  })) || [];

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zone Analytics & Intelligence</h1>
          <p className="text-gray-600">Advanced analytics and AI-powered insights for zone optimization</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedVenue} onValueChange={setSelectedVenue}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select venue" />
            </SelectTrigger>
            <SelectContent>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchAnalyticsData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(analytics.analytics.aggregated.averageUtilization * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Safety Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(analytics.safety.overallSafetyScore * 20)}/100
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Visits</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.analytics.aggregated.totalEntries.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.analytics.aggregated.totalRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="intelligence">AI Insights</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Zone Utilization Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Zone Utilization Overview</CardTitle>
                <CardDescription>Average utilization rates across all zones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={utilizationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="utilization" fill="#3B82F6" name="Utilization %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Utilization Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Utilization Trends</CardTitle>
                <CardDescription>Daily utilization trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="utilization" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Zone Performance Rankings */}
            <Card>
              <CardHeader>
                <CardTitle>Zone Performance Rankings</CardTitle>
                <CardDescription>Top performing zones by composite score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.performance?.rankings?.slice(0, 10).map((ranking: PerformanceRanking, index: number) => (
                    <div key={ranking.zoneId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{ranking.zoneName}</p>
                          <p className="text-sm text-gray-600">{ranking.zoneType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getScoreColor(ranking.score)}`}>
                          {ranking.score}
                        </p>
                        <p className="text-xs text-gray-500">Performance Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Safety Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Safety Overview</CardTitle>
                <CardDescription>Safety metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Safety Score</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round((analytics?.safety?.overallSafetyScore || 0) * 20)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Violations</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {analytics?.safety?.totalViolations || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Avg Response Time</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.round((analytics?.safety?.averageResponseTime || 0) / 60)}m
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Risk Level</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {analytics?.safety?.riskLevel || 'LOW'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-Metric Performance</CardTitle>
                <CardDescription>Utilization, safety, and efficiency by zone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="utilization" fill="#3B82F6" name="Utilization" />
                      <Bar dataKey="safety" fill="#10B981" name="Safety" />
                      <Bar dataKey="efficiency" fill="#F59E0B" name="Efficiency" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Zone Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Zone Type</CardTitle>
                <CardDescription>Average performance scores by zone category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.performance?.rankings?.reduce((acc: any[], ranking: PerformanceRanking) => {
                          const existing = acc.find(item => item.name === ranking.zoneType);
                          if (existing) {
                            existing.value += ranking.score;
                            existing.count += 1;
                          } else {
                            acc.push({ name: ranking.zoneType, value: ranking.score, count: 1 });
                          }
                          return acc;
                        }, []).map((item: any) => ({ ...item, value: Math.round(item.value / item.count) })) || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics?.performance?.rankings?.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Performance Table */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Detailed Performance Metrics</CardTitle>
                <CardDescription>Comprehensive performance breakdown by zone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Zone</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-center p-2">Score</th>
                        <th className="text-center p-2">Utilization</th>
                        <th className="text-center p-2">Safety</th>
                        <th className="text-center p-2">Efficiency</th>
                        <th className="text-center p-2">Revenue</th>
                        <th className="text-center p-2">Violations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics?.performance?.rankings?.map((ranking: PerformanceRanking) => (
                        <tr key={ranking.zoneId} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{ranking.zoneName}</td>
                          <td className="p-2">
                            <Badge variant="outline">{ranking.zoneType}</Badge>
                          </td>
                          <td className="p-2 text-center">
                            <span className={`font-bold ${getScoreColor(ranking.score)}`}>
                              {ranking.score}
                            </span>
                          </td>
                          <td className="p-2 text-center">{ranking.metrics.utilization}%</td>
                          <td className="p-2 text-center">{ranking.metrics.safety}/100</td>
                          <td className="p-2 text-center">{ranking.metrics.efficiency}/100</td>
                          <td className="p-2 text-center">{formatCurrency(ranking.metrics.revenue)}</td>
                          <td className="p-2 text-center">
                            <span className={ranking.metrics.violations > 5 ? 'text-red-600' : 'text-green-600'}>
                              {ranking.metrics.violations}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="mt-6">
          <div className="space-y-6">
            {/* AI Insights Summary */}
            {intelligence && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Brain className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">AI Insights</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {intelligence.insights?.patterns?.length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Target className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Confidence Score</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round((intelligence.metadata?.confidenceScore || 0) * 100)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Activity className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Data Points</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {intelligence.metadata?.dataPointsProcessed?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Insights and Patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                  <CardDescription>AI-generated insights from zone data analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {intelligence?.insights?.map((insight: Insight, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">{insight.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                            {insight.actionable && (
                              <p className="text-sm text-blue-600 mt-2">{insight.recommendation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">AI insights will appear here once data analysis is complete</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Predictive Analytics</CardTitle>
                  <CardDescription>Forecasts and trend predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Predictive analytics coming soon</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Advanced ML models for capacity forecasting and trend prediction
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="mt-6">
          <div className="space-y-6">
            {/* Optimization Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Total Recommendations</p>
                    <p className="text-2xl font-bold text-gray-900">{optimizations.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Potential Savings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(optimizations.reduce((sum, opt) => sum + opt.estimatedSavings, 0))}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Implementation Cost</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(optimizations.reduce((sum, opt) => sum + opt.estimatedCost, 0))}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Avg ROI</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {optimizations.length > 0 
                        ? Math.round(optimizations.reduce((sum, opt) => sum + ((opt.estimatedSavings - opt.estimatedCost) / opt.estimatedCost * 100), 0) / optimizations.length)
                        : 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Optimization Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
                <CardDescription>AI-powered recommendations to improve zone performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizations.map((optimization) => (
                    <div key={optimization.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{optimization.title}</h4>
                            <Badge className={getPriorityColor(optimization.priority)}>
                              {optimization.priority}
                            </Badge>
                            <Badge variant="outline">{optimization.type}</Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{optimization.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3 text-sm">
                            <div>
                              <p className="text-gray-600">Zone</p>
                              <p className="font-medium">{optimization.zoneName}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Impact</p>
                              <p className="font-medium">{optimization.impact}/10</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Effort</p>
                              <p className="font-medium">{optimization.effort}/10</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Cost</p>
                              <p className="font-medium">{formatCurrency(optimization.estimatedCost)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Payback</p>
                              <p className="font-medium">{optimization.paybackPeriod} months</p>
                            </div>
                          </div>

                          <div className="text-sm">
                            <p className="text-gray-600 mb-1">Recommendations:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                              {optimization.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Button 
                            size="sm" 
                            onClick={() => handleApplyOptimization(optimization.id)}
                            className="mb-2"
                          >
                            Apply
                          </Button>
                          <p className="text-xs text-center text-gray-500">
                            ROI: {Math.round(((optimization.estimatedSavings - optimization.estimatedCost) / optimization.estimatedCost) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {optimizations.length === 0 && (
                    <div className="text-center py-12">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No optimization recommendations available</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Check back later for AI-generated optimization suggestions
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
