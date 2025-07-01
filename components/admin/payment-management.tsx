
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Building2,
  CreditCard,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Eye
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VenuePaymentData {
  id: string;
  name: string;
  revenuePercentage: number;
  totalRevenue: number;
  venueEarnings: number;
  transactionCount: number;
  status: string;
  lastPayout: string | null;
  pendingAmount: number;
}

interface SubscriptionMetrics {
  totalSubscribers: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
}

export default function PaymentManagement() {
  const [venues, setVenues] = useState<VenuePaymentData[]>([]);
  const [subscriptionMetrics, setSubscriptionMetrics] = useState<SubscriptionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<VenuePaymentData | null>(null);
  const [newPercentage, setNewPercentage] = useState('');

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, fetch from API
      const mockVenues: VenuePaymentData[] = [
        {
          id: '1',
          name: 'Adventure Zone Family Fun',
          revenuePercentage: 30,
          totalRevenue: 15750.50,
          venueEarnings: 4725.15,
          transactionCount: 234,
          status: 'ENABLED',
          lastPayout: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          pendingAmount: 125.75,
        },
        {
          id: '2',
          name: 'Kids Paradise Play Center',
          revenuePercentage: 25,
          totalRevenue: 8920.25,
          venueEarnings: 2230.06,
          transactionCount: 156,
          status: 'PENDING',
          lastPayout: null,
          pendingAmount: 890.50,
        },
        {
          id: '3',
          name: 'Rainbow Playground',
          revenuePercentage: 35,
          totalRevenue: 12340.75,
          venueEarnings: 4319.26,
          transactionCount: 189,
          status: 'ENABLED',
          lastPayout: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          pendingAmount: 67.25,
        },
      ];

      const mockMetrics: SubscriptionMetrics = {
        totalSubscribers: 1247,
        activeSubscriptions: 1189,
        monthlyRecurringRevenue: 28750.50,
        churnRate: 4.6,
        newSubscriptions: 89,
        canceledSubscriptions: 12,
      };

      setVenues(mockVenues);
      setSubscriptionMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRevenuePercentage = async (venueId: string, newPercentage: number) => {
    try {
      // In real implementation, call API to update percentage
      console.log(`Updating venue ${venueId} to ${newPercentage}%`);
      
      // Update local state
      setVenues(venues.map(venue => 
        venue.id === venueId 
          ? { ...venue, revenuePercentage: newPercentage }
          : venue
      ));
      
      setSelectedVenue(null);
      setNewPercentage('');
    } catch (error) {
      console.error('Error updating revenue percentage:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ENABLED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'DISABLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ENABLED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'DISABLED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Payment Management</h2>
        <p className="text-gray-600">Manage venue revenue sharing and subscription analytics</p>
      </div>

      {/* Subscription Metrics */}
      {subscriptionMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Total Subscribers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptionMetrics.totalSubscribers.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">
                {subscriptionMetrics.activeSubscriptions} active
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                Monthly Recurring Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(subscriptionMetrics.monthlyRecurringRevenue)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                +{subscriptionMetrics.newSubscriptions} new this month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                Churn Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptionMetrics.churnRate}%</div>
              <div className="text-sm text-gray-500 mt-1">
                {subscriptionMetrics.canceledSubscriptions} canceled this month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-500" />
                Active Venues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{venues.length}</div>
              <div className="text-sm text-gray-500 mt-1">
                {venues.filter(v => v.status === 'ENABLED').length} enabled
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Venue Management */}
      <Tabs defaultValue="venues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="venues">Venue Revenue Sharing</TabsTrigger>
          <TabsTrigger value="analytics">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="venues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Venue Revenue Sharing</CardTitle>
              <CardDescription>
                Manage revenue sharing percentages and monitor venue earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {venues.map((venue) => (
                  <div key={venue.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{venue.name}</h4>
                          {getStatusIcon(venue.status)}
                          <Badge className={getStatusColor(venue.status)}>
                            {venue.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 space-x-4">
                          <span>Revenue Share: {venue.revenuePercentage}%</span>
                          <span>Transactions: {venue.transactionCount}</span>
                          <span>Pending: {formatCurrency(venue.pendingAmount)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-lg font-bold">
                        {formatCurrency(venue.venueEarnings)}
                      </div>
                      <div className="text-sm text-gray-500">
                        of {formatCurrency(venue.totalRevenue)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedVenue(venue);
                                setNewPercentage(venue.revenuePercentage.toString());
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Revenue Percentage</DialogTitle>
                              <DialogDescription>
                                Change the revenue sharing percentage for {venue.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="percentage">Revenue Percentage (%)</Label>
                                <Input
                                  id="percentage"
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={newPercentage}
                                  onChange={(e) => setNewPercentage(e.target.value)}
                                  placeholder="Enter percentage (0-50)"
                                />
                              </div>
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-blue-800">
                                  New breakdown: {newPercentage}% to venue, {100 - parseInt(newPercentage || '0')}% to SafePlay
                                </p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => {
                                  if (selectedVenue && newPercentage) {
                                    updateRevenuePercentage(selectedVenue.id, parseInt(newPercentage));
                                  }
                                }}
                                disabled={!newPercentage || parseInt(newPercentage) < 0 || parseInt(newPercentage) > 50}
                              >
                                Update Percentage
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', safeplay: 18000, venues: 7200 },
                    { month: 'Feb', safeplay: 22000, venues: 8800 },
                    { month: 'Mar', safeplay: 20000, venues: 8000 },
                    { month: 'Apr', safeplay: 25000, venues: 10000 },
                    { month: 'May', safeplay: 28000, venues: 11200 },
                    { month: 'Jun', safeplay: 32000, venues: 12800 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="safeplay" stroke="#60B5FF" strokeWidth={2} name="SafePlay Revenue" />
                    <Line type="monotone" dataKey="venues" stroke="#80D8C3" strokeWidth={2} name="Venue Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Venue Performance</CardTitle>
                <CardDescription>Revenue by venue this month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={venues.map(v => ({ name: v.name.split(' ')[0], earnings: v.venueEarnings }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="earnings" fill="#A19AD3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Payment System Settings
              </CardTitle>
              <CardDescription>Configure global payment settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Revenue Share (%)</Label>
                  <Input defaultValue="30" />
                  <p className="text-sm text-gray-500">Default percentage for new venues</p>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Payout Amount ($)</Label>
                  <Input defaultValue="25.00" />
                  <p className="text-sm text-gray-500">Minimum amount before payout</p>
                </div>
                <div className="space-y-2">
                  <Label>Payout Schedule</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Processing Fee (%)</Label>
                  <Input defaultValue="2.9" />
                  <p className="text-sm text-gray-500">Stripe processing fee</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button>Save Settings</Button>
                <Button variant="outline">Reset to Defaults</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
