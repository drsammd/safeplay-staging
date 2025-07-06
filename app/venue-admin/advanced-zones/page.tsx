
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
import { AlertTriangle, Users, Activity, Shield, Settings, MapPin, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  type: string;
  coordinates: any;
  color: string;
  status: string;
  realTimeMetrics: {
    currentOccupancy: number;
    maxCapacity: number;
    utilizationRate: number;
    remainingCapacity: number;
    queueLength: number;
    lastUpdated: string;
  };
  activity: {
    recentSightings: number;
    activeAlerts: number;
    unresolvedViolations: number;
    hourlyAccess: number;
    occupancyTrend: string;
  };
  safety: {
    hazardLevel: string;
    safetyLevel: string;
    activeCameras: number;
    totalCameras: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    age: number;
  }>;
  violations: Array<{
    id: string;
    type: string;
    severity: string;
    age: number;
  }>;
}

interface VenueMetrics {
  totalZones: number;
  activeZones: number;
  zonesAtCapacity: number;
  zonesWithAlerts: number;
  totalOccupancy: number;
  totalCapacity: number;
  overallUtilization: number;
}

export default function AdvancedZonesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [venueMetrics, setVenueMetrics] = useState<VenueMetrics | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      fetchZonesData();
      const interval = setInterval(fetchZonesData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedVenue]);

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

  const fetchZonesData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/zones/realtime?venueId=${selectedVenue}&includeHistory=true`);
      
      if (response.ok) {
        const data = await response.json();
        setZones(data.zones || []);
        setVenueMetrics(data.venueMetrics);
        setError(null);
      } else {
        throw new Error('Failed to fetch zones data');
      }
    } catch (error) {
      console.error('Error fetching zones data:', error);
      setError('Failed to load zones data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'bg-green-100 text-green-800';
      case 'NEAR_CAPACITY': return 'bg-yellow-100 text-yellow-800';
      case 'FULL': return 'bg-red-100 text-red-800';
      case 'ALERT': return 'bg-orange-100 text-orange-800';
      case 'MAINTENANCE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-blue-100 text-blue-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-red-600 transform rotate-180" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredZones = zones.filter(zone => {
    if (filterStatus === 'all') return true;
    return zone.status === filterStatus;
  });

  if (loading && zones.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading zone data...</p>
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
              <Button onClick={fetchZonesData}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Zone Management</h1>
          <p className="text-gray-600">Real-time monitoring and management of venue zones</p>
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

          <Button onClick={fetchZonesData} disabled={loading}>
            {loading ? 'Updating...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Venue Metrics Overview */}
      {venueMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Zones</p>
                  <p className="text-2xl font-bold text-gray-900">{venueMetrics.totalZones}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overall Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">{venueMetrics.overallUtilization}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Zones with Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{venueMetrics.zonesWithAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current Occupancy</p>
                  <p className="text-2xl font-bold text-gray-900">{venueMetrics.totalOccupancy}</p>
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
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Violations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            {/* Zone Filter */}
            <div className="flex items-center gap-4">
              <Label htmlFor="status-filter">Filter by Status:</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="NEAR_CAPACITY">Near Capacity</SelectItem>
                  <SelectItem value="FULL">Full</SelectItem>
                  <SelectItem value="ALERT">Alert</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Zones Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredZones.map((zone) => (
                <Card key={zone.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedZone(zone)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{zone.name}</CardTitle>
                      <Badge className={getStatusColor(zone.status)}>
                        {zone.status}
                      </Badge>
                    </div>
                    <CardDescription>{zone.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Capacity Info */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Occupancy</span>
                        <span className="font-medium">
                          {zone.realTimeMetrics.currentOccupancy}/{zone.realTimeMetrics.maxCapacity}
                        </span>
                      </div>
                      
                      {/* Utilization Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            zone.realTimeMetrics.utilizationRate >= 90 ? 'bg-red-500' :
                            zone.realTimeMetrics.utilizationRate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(zone.realTimeMetrics.utilizationRate, 100)}%` }}
                        ></div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(zone.activity.occupancyTrend)}
                          <span className="text-gray-600">Trend</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-600">{zone.safety.activeCameras}/{zone.safety.totalCameras}</span>
                        </div>
                      </div>

                      {/* Alerts & Violations */}
                      {(zone.activity.activeAlerts > 0 || zone.activity.unresolvedViolations > 0) && (
                        <div className="flex items-center gap-4 pt-2 border-t">
                          {zone.activity.activeAlerts > 0 && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">{zone.activity.activeAlerts} alerts</span>
                            </div>
                          )}
                          {zone.activity.unresolvedViolations > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs">{zone.activity.unresolvedViolations} violations</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Zone List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Zones</CardTitle>
                <CardDescription>Click a zone for detailed monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedZone?.id === zone.id ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedZone(zone)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{zone.name}</span>
                        <Badge className={getStatusColor(zone.status)}>
                          {zone.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {zone.realTimeMetrics.currentOccupancy}/{zone.realTimeMetrics.maxCapacity} occupancy
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Zone Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedZone ? `${selectedZone.name} - Real-time Monitoring` : 'Select a Zone'}
                </CardTitle>
                {selectedZone && (
                  <CardDescription>
                    Last updated: {new Date(selectedZone.realTimeMetrics.lastUpdated).toLocaleString()}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {selectedZone ? (
                  <div className="space-y-6">
                    {/* Real-time Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Current Occupancy</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedZone.realTimeMetrics.currentOccupancy}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Utilization</p>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedZone.realTimeMetrics.utilizationRate}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-gray-600">Queue Length</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {selectedZone.realTimeMetrics.queueLength}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Recent Sightings</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {selectedZone.activity.recentSightings}
                        </p>
                      </div>
                    </div>

                    {/* Safety Status */}
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3">Safety Status</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Hazard Level</p>
                          <Badge className={getSeverityColor(selectedZone.safety.hazardLevel)}>
                            {selectedZone.safety.hazardLevel}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Camera Coverage</p>
                          <p className="font-medium">
                            {selectedZone.safety.activeCameras}/{selectedZone.safety.totalCameras} online
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Active Alerts */}
                    {selectedZone.alerts.length > 0 && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-3">Active Alerts</h4>
                        <div className="space-y-2">
                          {selectedZone.alerts.map((alert) => (
                            <div key={alert.id} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                              <div>
                                <p className="font-medium">{alert.title}</p>
                                <p className="text-sm text-gray-600">{alert.type}</p>
                              </div>
                              <div className="text-right">
                                <Badge className={getSeverityColor(alert.severity)}>
                                  {alert.severity}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">{alert.age}m ago</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Violations */}
                    {selectedZone.violations.length > 0 && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-3">Unresolved Violations</h4>
                        <div className="space-y-2">
                          {selectedZone.violations.map((violation) => (
                            <div key={violation.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                              <div>
                                <p className="font-medium">{violation.type}</p>
                              </div>
                              <div className="text-right">
                                <Badge className={getSeverityColor(violation.severity)}>
                                  {violation.severity}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">{violation.age}m ago</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Select a zone from the list to view detailed monitoring information</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Zone Alerts & Violations</CardTitle>
                <CardDescription>Monitor and manage safety alerts and rule violations across all zones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Alerts and violations management interface coming soon</p>
                  <Button className="mt-4" onClick={() => router.push('/venue-admin/alerts')}>
                    Go to Alerts Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Zone Analytics & Intelligence</CardTitle>
                <CardDescription>Advanced analytics and predictive insights for zone optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Advanced zone analytics interface coming soon</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This will include capacity predictions, optimization recommendations, and trend analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
