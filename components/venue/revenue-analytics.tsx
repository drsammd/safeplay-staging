
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Camera,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface RevenueData {
  period: string;
  totalRevenue: number;
  venueEarnings: number;
  safeplayEarnings: number;
  photoSales: number;
  videoSales: number;
  subscriptionRevenue: number;
  transactions: number;
}

interface PayoutData {
  id: string;
  amount: number;
  status: string;
  initiatedAt: string;
  completedAt: string | null;
  description: string;
}

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#80D8C3', '#A19AD3'];

export default function RevenueAnalytics() {
  const [timeRange, setTimeRange] = useState('30days');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    venueEarnings: 0,
    growthRate: 0,
    transactionCount: 0,
  });

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, fetch from API
      const mockData: RevenueData[] = generateMockRevenueData(timeRange);
      const mockPayouts: PayoutData[] = generateMockPayouts();
      
      setRevenueData(mockData);
      setPayouts(mockPayouts);
      
      // Calculate total stats
      const total = mockData.reduce((acc, item) => ({
        totalRevenue: acc.totalRevenue + item.totalRevenue,
        venueEarnings: acc.venueEarnings + item.venueEarnings,
        transactionCount: acc.transactionCount + item.transactions,
      }), { totalRevenue: 0, venueEarnings: 0, transactionCount: 0 });

      setTotalStats({
        ...total,
        growthRate: Math.random() * 20 - 10, // Mock growth rate
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockRevenueData = (range: string): RevenueData[] => {
    const days = range === '7days' ? 7 : range === '30days' ? 30 : 90;
    const data: RevenueData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const baseRevenue = Math.random() * 500 + 100;
      const venueShare = baseRevenue * 0.3;
      
      data.push({
        period: format(date, 'MMM dd'),
        totalRevenue: baseRevenue,
        venueEarnings: venueShare,
        safeplayEarnings: baseRevenue - venueShare,
        photoSales: Math.random() * 200 + 50,
        videoSales: Math.random() * 150 + 30,
        subscriptionRevenue: Math.random() * 200 + 100,
        transactions: Math.floor(Math.random() * 20 + 5),
      });
    }

    return data;
  };

  const generateMockPayouts = (): PayoutData[] => {
    return [
      {
        id: '1',
        amount: 1250.75,
        status: 'PAID',
        initiatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Weekly payout - Mar 18-24',
      },
      {
        id: '2',
        amount: 890.25,
        status: 'IN_TRANSIT',
        initiatedAt: new Date().toISOString(),
        completedAt: null,
        description: 'Weekly payout - Mar 25-31',
      },
    ];
  };

  const getRevenueBreakdown = () => {
    if (!revenueData.length) return [];
    
    const totals = revenueData.reduce((acc, item) => ({
      photoSales: acc.photoSales + item.photoSales,
      videoSales: acc.videoSales + item.videoSales,
      subscriptionRevenue: acc.subscriptionRevenue + item.subscriptionRevenue,
    }), { photoSales: 0, videoSales: 0, subscriptionRevenue: 0 });

    return [
      { name: 'Photo Sales', value: totals.photoSales },
      { name: 'Video Sales', value: totals.videoSales },
      { name: 'Subscription Revenue', value: totals.subscriptionRevenue },
    ];
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Revenue Analytics</h2>
          <p className="text-gray-600">Track your venue's earnings and revenue sharing</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="90days">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              Your Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalStats.venueEarnings)}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              {totalStats.growthRate >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={totalStats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(totalStats.growthRate).toFixed(1)}%
              </span>
              <span>vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalStats.totalRevenue)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Your share: 30%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStats.transactionCount}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Avg: {formatCurrency(totalStats.totalRevenue / totalStats.transactionCount || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              Revenue Share
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30%</div>
            <div className="text-sm text-gray-500 mt-1">
              Default rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>Daily revenue and your earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(value as number), name]}
                    labelStyle={{ fontSize: 12 }}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line 
                    type="monotone" 
                    dataKey="totalRevenue" 
                    stroke="#60B5FF" 
                    strokeWidth={2}
                    name="Total Revenue"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="venueEarnings" 
                    stroke="#80D8C3" 
                    strokeWidth={2}
                    name="Your Earnings"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
                <CardDescription>Breakdown by revenue type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getRevenueBreakdown()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: $${value?.toFixed(0) || '0'}`}
                    >
                      {getRevenueBreakdown().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Transaction Volume</CardTitle>
                <CardDescription>Number of transactions per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <Tooltip 
                      labelStyle={{ fontSize: 12 }}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="transactions" fill="#A19AD3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payouts</CardTitle>
              <CardDescription>Your payment history and pending transfers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{payout.description}</p>
                        <p className="text-sm text-gray-500">
                          Initiated {format(new Date(payout.initiatedAt), 'MMM dd, yyyy')}
                          {payout.completedAt && (
                            <> • Completed {format(new Date(payout.completedAt), 'MMM dd, yyyy')}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(payout.amount)}</p>
                      <Badge className={getStatusColor(payout.status)}>
                        {payout.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
