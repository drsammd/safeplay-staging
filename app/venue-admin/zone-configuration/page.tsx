
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Settings, Plus, Edit, Trash2, Shield, Users, AlertTriangle, Save, MapPin, CheckCircle, Clock } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  type: string;
  description?: string;
  capacity: number;
  currentOccupancy: number;
  status: 'active' | 'inactive' | 'maintenance';
  safetyLevel: 'low' | 'medium' | 'high';
  isEmergencyExit: boolean;
  requiresSupervision: boolean;
}

// Sample zone data (in a real app, this would come from an API)
const SAMPLE_ZONES: Zone[] = [
  {
    id: '1',
    name: 'Main Play Area',
    type: 'PLAY_AREA',
    description: 'Primary play zone with slides and climbing structures',
    capacity: 50,
    currentOccupancy: 32,
    status: 'active',
    safetyLevel: 'medium',
    isEmergencyExit: false,
    requiresSupervision: true
  },
  {
    id: '2',
    name: 'Toddler Zone',
    type: 'TODDLER_AREA',
    description: 'Safe play area for children under 5',
    capacity: 20,
    currentOccupancy: 8,
    status: 'active',
    safetyLevel: 'high',
    isEmergencyExit: false,
    requiresSupervision: true
  },
  {
    id: '3',
    name: 'Party Room A',
    type: 'PARTY_ROOM',
    description: 'Birthday party and event space',
    capacity: 30,
    currentOccupancy: 0,
    status: 'active',
    safetyLevel: 'low',
    isEmergencyExit: false,
    requiresSupervision: false
  },
  {
    id: '4',
    name: 'Main Entrance',
    type: 'ENTRANCE',
    description: 'Primary entrance and reception area',
    capacity: 100,
    currentOccupancy: 15,
    status: 'active',
    safetyLevel: 'medium',
    isEmergencyExit: true,
    requiresSupervision: false
  }
];

export default function ZoneConfigurationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>(SAMPLE_ZONES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleUpdateZone = async (zoneId: string, updates: Partial<Zone>) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setZones(prev => prev.map(zone => 
        zone.id === zoneId ? { ...zone, ...updates } : zone
      ));
      
      toast.success('Zone updated successfully');
    } catch (error) {
      console.error('Error updating zone:', error);
      toast.error('Failed to update zone');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Zone['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSafetyLevelColor = (level: Zone['safetyLevel']) => {
    switch (level) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOccupancyPercentage = (current: number, capacity: number) => {
    return Math.round((current / capacity) * 100);
  };

  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading zone configuration...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Zone Configuration</h1>
          <p className="text-gray-600">Monitor and configure your venue zones</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={() => toast.info('Add zone feature coming soon')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Zone Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <Card key={zone.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                    <Badge className={getStatusColor(zone.status)}>
                      {zone.status}
                    </Badge>
                  </div>
                  {zone.description && (
                    <CardDescription>{zone.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Occupancy */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Occupancy</span>
                        <span className="font-medium">
                          {zone.currentOccupancy} / {zone.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getOccupancyPercentage(zone.currentOccupancy, zone.capacity)}%` }}
                        />
                      </div>
                    </div>

                    {/* Zone Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{zone.type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Safety Level:</span>
                        <Badge className={getSafetyLevelColor(zone.safetyLevel)}>
                          {zone.safetyLevel}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Supervision:</span>
                        <span className="font-medium">
                          {zone.requiresSupervision ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      {zone.isEmergencyExit && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="text-xs font-medium">Emergency Exit</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setActiveTab('configuration')}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setActiveTab('monitoring')}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Monitor
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Zone Configuration Settings</CardTitle>
                <CardDescription>Configure zone parameters and safety settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Zone Selection */}
                  <div className="space-y-2">
                    <Label>Select Zone to Configure</Label>
                    <Select defaultValue={zones[0]?.id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Configuration Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Zone Name</Label>
                        <Input defaultValue={zones[0]?.name} />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Capacity</Label>
                        <Input type="number" defaultValue={zones[0]?.capacity} />
                      </div>
                      <div className="space-y-2">
                        <Label>Safety Level</Label>
                        <Select defaultValue={zones[0]?.safetyLevel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Zone Type</Label>
                        <Select defaultValue={zones[0]?.type}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PLAY_AREA">Play Area</SelectItem>
                            <SelectItem value="TODDLER_AREA">Toddler Area</SelectItem>
                            <SelectItem value="PARTY_ROOM">Party Room</SelectItem>
                            <SelectItem value="ENTRANCE">Entrance</SelectItem>
                            <SelectItem value="EXIT">Exit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Requires Supervision</Label>
                          <Switch defaultChecked={zones[0]?.requiresSupervision} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Emergency Exit</Label>
                          <Switch defaultChecked={zones[0]?.isEmergencyExit} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={() => toast.success('Configuration saved successfully')}
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Zone Monitoring</CardTitle>
                <CardDescription>Real-time monitoring of all zones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {zones.map((zone) => (
                    <div key={zone.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{zone.name}</h4>
                        <Badge className={getStatusColor(zone.status)}>
                          {zone.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Occupancy:</span>
                          <span className="font-medium">
                            {zone.currentOccupancy} / {zone.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              getOccupancyPercentage(zone.currentOccupancy, zone.capacity) > 80
                                ? 'bg-red-500'
                                : getOccupancyPercentage(zone.currentOccupancy, zone.capacity) > 60
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${getOccupancyPercentage(zone.currentOccupancy, zone.capacity)}%` }}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>Last updated: {new Date().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
