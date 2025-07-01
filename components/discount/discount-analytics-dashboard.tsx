
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Percent, 
  Tag,
  Download,
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { toast } from 'sonner';

interface AnalyticsData {
  overview: {
    totalCodes: number;
    activeCodes: number;
    totalUsages: number;
    successfulUsages: number;
    totalRevenue: number;
    totalDiscount: number;
    conversionRate: number;
    averageOrderValue: number;
  };
  topCodes: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
    totalUsages: number;
    successfulUsages: number;
    revenue: number;
    discount: number;
    conversionRate: number;
  }>;
  categoryStats: Array<{
    category: string;
    _count: { id: number };
    _sum: { currentUses: number };
  }>;
  usagesByDate: Array<{
    date: string;
    usages: number;
    successful_usages: number;
    revenue: number;
    discount: number;
  }>;
  trends: {
    revenueGrowth: number;
    usageGrowth: number;
    newCodesThisMonth: number;
  };
}

const CHART_COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363', '#80D8C3', '#A19AD3', '#72BF78'];

export default function DiscountAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCode, setSelectedCode] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (dateRange?.from) {
        params.append('startDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('endDate', dateRange.to.toISOString());
      }
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (selectedCode) {
        params.append('codeId', selectedCode);
      }

      const response = await fetch(`/api/discount-codes/analytics?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
      } else {
        toast.error(data.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedCategory, selectedCode]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (value < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const usageChartData = analytics.usagesByDate.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    usages: item.usages,
    successful: item.successful_usages,
    revenue: item.revenue
  }));

  const categoryChartData = analytics.categoryStats.map(item => ({
    name: item.category,
    codes: item._count.id,
    usages: item._sum.currentUses
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Discount Code Analytics</h1>
          <p className="text-muted-foreground">Track performance and impact of discount codes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <DatePickerWithRange
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="MARKETING">Marketing</SelectItem>
                <SelectItem value="PARTNER">Partner</SelectItem>
                <SelectItem value="RETENTION">Retention</SelectItem>
                <SelectItem value="SEASONAL">Seasonal</SelectItem>
                <SelectItem value="WELCOME">Welcome</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalCodes}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.activeCodes} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalUsages}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.successfulUsages} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.overview.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.overview.totalDiscount)} discounts given
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(analytics.overview.conversionRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              AOV: {formatCurrency(analytics.overview.averageOrderValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="performance">Top Performers</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Over Time</CardTitle>
              <CardDescription>Discount code usage and revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="usage" orientation="left" />
                    <YAxis yAxisId="revenue" orientation="right" />
                    <Tooltip />
                    <Line 
                      yAxisId="usage"
                      type="monotone" 
                      dataKey="usages" 
                      stroke="#60B5FF" 
                      strokeWidth={2}
                      name="Total Usage"
                    />
                    <Line 
                      yAxisId="usage"
                      type="monotone" 
                      dataKey="successful" 
                      stroke="#72BF78" 
                      strokeWidth={2}
                      name="Successful"
                    />
                    <Line 
                      yAxisId="revenue"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#FF9149" 
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Codes</CardTitle>
              <CardDescription>Best performing discount codes by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topCodes.map((code, index) => (
                  <div 
                    key={code.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {code.code}
                          </Badge>
                          <Badge variant="secondary">
                            {code.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{code.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(code.revenue)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {code.successfulUsages} uses • {formatPercent(code.conversionRate)} conversion
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Codes by Category</CardTitle>
                <CardDescription>Distribution of discount codes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="codes"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CHART_COLORS[index % CHART_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage by Category</CardTitle>
                <CardDescription>Code usage across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="usages" fill="#60B5FF" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

