
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  CreditCard,
  PieChart,
  BarChart3,
  Target,
  Download,
  RefreshCw
} from 'lucide-react';

interface RevenueMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  averageOrderValue: number;
  totalTransactions: number;
  conversionRate: number;
  projectedRevenue: number;
}

interface RevenueSource {
  name: string;
  amount: number;
  percentage: number;
  growth: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  transactions: number;
  averageOrder: number;
}

const REVENUE_METRICS: RevenueMetrics = {
  totalRevenue: 45678,
  revenueGrowth: 12.5,
  averageOrderValue: 34.50,
  totalTransactions: 1324,
  conversionRate: 68.5,
  projectedRevenue: 52000
};

const REVENUE_SOURCES: RevenueSource[] = [
  { name: 'Admission Fees', amount: 28450, percentage: 62.3, growth: 15.2 },
  { name: 'Food & Beverages', amount: 12340, percentage: 27.0, growth: 8.7 },
  { name: 'Party Packages', amount: 3200, percentage: 7.0, growth: 22.1 },
  { name: 'Merchandise', amount: 1688, percentage: 3.7, growth: -5.3 }
];

const MONTHLY_REVENUE: MonthlyRevenue[] = [
  { month: 'Jan', revenue: 38500, transactions: 1120, averageOrder: 34.38 },
  { month: 'Feb', revenue: 41200, transactions: 1250, averageOrder: 32.96 },
  { month: 'Mar', revenue: 39800, transactions: 1180, averageOrder: 33.73 },
  { month: 'Apr', revenue: 42100, transactions: 1290, averageOrder: 32.64 },
  { month: 'May', revenue: 44300, transactions: 1350, averageOrder: 32.81 },
  { month: 'Jun', revenue: 45678, transactions: 1324, averageOrder: 34.50 }
];

interface RevenueAnalyticsProps {
  className?: string;
}

export default function RevenueAnalytics({ className = '' }: RevenueAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue Analytics</h2>
          <p className="text-gray-600">Track your venue's financial performance and growth</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(REVENUE_METRICS.totalRevenue)}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className={`flex items-center gap-1 mt-2 ${getGrowthColor(REVENUE_METRICS.revenueGrowth)}`}>
              {getGrowthIcon(REVENUE_METRICS.revenueGrowth)}
              <span className="text-sm font-medium">
                {REVENUE_METRICS.revenueGrowth}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Avg Order Value</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(REVENUE_METRICS.averageOrderValue)}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">5.2% increase</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Total Transactions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {REVENUE_METRICS.totalTransactions.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">8.3% growth</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {REVENUE_METRICS.conversionRate}%
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">2.1% improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Revenue Sources</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Revenue distribution across different sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {REVENUE_SOURCES.map((source, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{source.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{formatCurrency(source.amount)}</span>
                          <span className={`text-xs ${getGrowthColor(source.growth)}`}>
                            ({source.growth > 0 ? '+' : ''}{source.growth}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={source.percentage} className="flex-1 h-2" />
                        <span className="text-xs text-gray-600 w-12">{source.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Revenue performance over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MONTHLY_REVENUE.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{month.month}</p>
                          <p className="text-sm text-gray-600">{month.transactions} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(month.revenue)}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(month.averageOrder)} avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <div className="space-y-6">
            {REVENUE_SOURCES.map((source, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      <CardDescription>
                        {source.percentage}% of total revenue
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(source.amount)}</p>
                      <div className={`flex items-center gap-1 ${getGrowthColor(source.growth)}`}>
                        {getGrowthIcon(source.growth)}
                        <span className="text-sm font-medium">
                          {source.growth > 0 ? '+' : ''}{source.growth}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={source.percentage} className="h-3" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Contribution</p>
                        <p className="font-medium">{source.percentage}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Growth Rate</p>
                        <p className={`font-medium ${getGrowthColor(source.growth)}`}>
                          {source.growth > 0 ? '+' : ''}{source.growth}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-medium">{formatCurrency(source.amount)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends Analysis</CardTitle>
              <CardDescription>Historical performance and growth patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Trends Dashboard</h3>
                <p className="text-gray-600 mb-6">
                  Comprehensive revenue trend analysis with interactive charts and forecasting
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h4 className="font-medium mb-2">Growth Analysis</h4>
                    <p className="text-sm text-gray-600">Track revenue growth patterns and identify peak performance periods</p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <PieChart className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h4 className="font-medium mb-2">Seasonal Trends</h4>
                    <p className="text-sm text-gray-600">Understand seasonal variations and plan accordingly</p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <Target className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                    <h4 className="font-medium mb-2">Performance Metrics</h4>
                    <p className="text-sm text-gray-600">Key performance indicators and benchmark comparisons</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Projections</CardTitle>
              <CardDescription>Forecasted revenue based on current trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-blue-900">Next Month Projection</h3>
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-2">
                      {formatCurrency(REVENUE_METRICS.projectedRevenue)}
                    </p>
                    <p className="text-sm text-blue-700">
                      Based on current growth trends (+12.5%)
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-green-900">Quarterly Target</h3>
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-900 mb-2">
                      {formatCurrency(150000)}
                    </p>
                    <p className="text-sm text-green-700">
                      Progress: 76% complete
                    </p>
                    <Progress value={76} className="mt-2 h-2" />
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-medium mb-4">Revenue Forecast Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Current Month</p>
                      <p className="font-bold">{formatCurrency(REVENUE_METRICS.totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Next Month</p>
                      <p className="font-bold">{formatCurrency(REVENUE_METRICS.projectedRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Quarterly Goal</p>
                      <p className="font-bold">{formatCurrency(150000)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Annual Target</p>
                      <p className="font-bold">{formatCurrency(600000)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
