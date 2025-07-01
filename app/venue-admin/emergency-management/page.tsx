
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
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AlertTriangle, Shield, Users, MapPin, Clock, Phone, Megaphone, Route, CheckCircle, XCircle, PlayCircle, PauseCircle } from 'lucide-react';

interface EmergencyProcedure {
  id: string;
  zoneId: string;
  procedureType: string;
  name: string;
  description: string;
  stepByStepGuide: any;
  estimatedDuration: number;
  requiredPersonnel: number;
  requiredEquipment: string[];
  priorityLevel: string;
  contactProcedure: any;
  evacuationInstructions?: any;
  communicationProtocol?: any;
  postEmergencySteps?: any;
  trainingRequired: boolean;
  certificationRequired: boolean;
  lastReviewed?: string;
  reviewedBy?: string;
  nextReviewDate?: string;
  isActive: boolean;
  zone: {
    id: string;
    name: string;
    type: string;
    floorPlan: {
      id: string;
      name: string;
      venueId: string;
    };
  };
}

interface EvacuationRoute {
  id: string;
  name: string;
  fromZoneId: string;
  toZoneId: string;
  distance: number;
  estimatedTime: number;
  maxCapacity: number;
  currentLoad: number;
  isActive: boolean;
  isPrimary: boolean;
  isAccessible: boolean;
  hazardLevel: string;
  lighting: boolean;
  signage: boolean;
  obstacleStatus: string;
  fromZone: { id: string; name: string; type: string };
  toZone: { id: string; name: string; type: string };
}

interface EmergencyEvent {
  id: string;
  type: string;
  status: string;
  zoneId: string;
  zoneName: string;
  description: string;
  severity: string;
  activatedAt: string;
  activatedBy: string;
  estimatedDuration: number;
  affectedPersons: number;
}

export default function EmergencyManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [procedures, setProcedures] = useState<EmergencyProcedure[]>([]);
  const [evacuationRoutes, setEvacuationRoutes] = useState<EvacuationRoute[]>([]);
  const [activeEmergencies, setActiveEmergencies] = useState<EmergencyEvent[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [zones, setZones] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [activatingEmergency, setActivatingEmergency] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Emergency activation form
  const [emergencyForm, setEmergencyForm] = useState({
    emergencyType: '',
    zoneId: '',
    severity: 'MEDIUM',
    description: '',
    location: ''
  });
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (session.user?.role !== 'VENUE_ADMIN' && session.user?.role !== 'COMPANY_ADMIN') {
      router.push('/unauthorized');
      return;
    }

    fetchVenues();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedVenue) {
      fetchEmergencyData();
      fetchZones();
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

  const fetchZones = async () => {
    try {
      const response = await fetch(`/api/zones?venueId=${selectedVenue}`);
      if (response.ok) {
        const data = await response.json();
        setZones(data.zones || []);
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const fetchEmergencyData = async () => {
    try {
      setLoading(true);
      
      // Fetch emergency procedures
      const proceduresResponse = await fetch(`/api/zones/emergency?venueId=${selectedVenue}`);
      if (proceduresResponse.ok) {
        const proceduresData = await proceduresResponse.json();
        setProcedures(proceduresData.procedures || []);
      }

      // Fetch evacuation routes
      const routesResponse = await fetch(`/api/zones/${zones[0]?.id}/evacuation?includeAlternatives=true`);
      if (routesResponse.ok) {
        const routesData = await routesResponse.json();
        setEvacuationRoutes([...(routesData.evacuationRoutes || []), ...(routesData.alternativeRoutes || [])]);
      }

      // Simulate active emergencies (in real implementation, this would come from alerts API)
      setActiveEmergencies([]);
      
      setError(null);
    } catch (error) {
      console.error('Error fetching emergency data:', error);
      setError('Failed to load emergency data');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateEmergency = async () => {
    try {
      setActivatingEmergency(true);
      
      const response = await fetch('/api/zones/emergency/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emergencyForm)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Emergency procedure activated successfully');
        setShowEmergencyDialog(false);
        
        // Add to active emergencies
        setActiveEmergencies(prev => [...prev, {
          id: data.alert.id,
          type: emergencyForm.emergencyType,
          status: 'ACTIVE',
          zoneId: emergencyForm.zoneId,
          zoneName: zones.find(z => z.id === emergencyForm.zoneId)?.name || 'Unknown Zone',
          description: emergencyForm.description,
          severity: emergencyForm.severity,
          activatedAt: new Date().toISOString(),
          activatedBy: session?.user?.name || 'Staff',
          estimatedDuration: data.procedure?.estimatedDuration || 30,
          affectedPersons: 0
        }]);
        
        // Reset form
        setEmergencyForm({
          emergencyType: '',
          zoneId: '',
          severity: 'MEDIUM',
          description: '',
          location: ''
        });
      } else {
        throw new Error('Failed to activate emergency');
      }
    } catch (error) {
      console.error('Error activating emergency:', error);
      toast.error('Failed to activate emergency procedure');
    } finally {
      setActivatingEmergency(false);
    }
  };

  const handleDeactivateEmergency = async (emergencyId: string) => {
    try {
      // In real implementation, this would call an API to deactivate the emergency
      setActiveEmergencies(prev => prev.filter(e => e.id !== emergencyId));
      toast.success('Emergency deactivated successfully');
    } catch (error) {
      console.error('Error deactivating emergency:', error);
      toast.error('Failed to deactivate emergency');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'IMMEDIATE': return 'bg-red-100 text-red-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading emergency management data...</p>
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
              <Button onClick={fetchEmergencyData}>Try Again</Button>
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
          <h1 className="text-2xl font-bold text-gray-900">Emergency Management</h1>
          <p className="text-gray-600">Monitor and manage emergency procedures and evacuation protocols</p>
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

          <Button onClick={() => setShowEmergencyDialog(true)} className="bg-red-600 hover:bg-red-700">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Activate Emergency
          </Button>
        </div>
      </div>

      {/* Active Emergencies Alert */}
      {activeEmergencies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Active Emergencies ({activeEmergencies.length})</h3>
          </div>
          <div className="space-y-2">
            {activeEmergencies.map((emergency) => (
              <div key={emergency.id} className="flex items-center justify-between bg-white p-3 rounded border">
                <div>
                  <p className="font-medium text-gray-900">{emergency.type} - {emergency.zoneName}</p>
                  <p className="text-sm text-gray-600">{emergency.description}</p>
                  <p className="text-xs text-gray-500">
                    Activated {new Date(emergency.activatedAt).toLocaleString()} by {emergency.activatedBy}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityColor(emergency.severity)}>
                    {emergency.severity}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => handleDeactivateEmergency(emergency.id)}>
                    <PauseCircle className="h-3 w-3 mr-1" />
                    Deactivate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="procedures">Procedures</TabsTrigger>
          <TabsTrigger value="evacuation">Evacuation Routes</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Procedures</p>
                    <p className="text-2xl font-bold text-gray-900">{procedures.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Route className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Evacuation Routes</p>
                    <p className="text-2xl font-bold text-gray-900">{evacuationRoutes.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Emergencies</p>
                    <p className="text-2xl font-bold text-gray-900">{activeEmergencies.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Readiness Score</p>
                    <p className="text-2xl font-bold text-gray-900">85%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Procedures */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Procedure Reviews</CardTitle>
                <CardDescription>Recently reviewed emergency procedures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {procedures.slice(0, 5).map((procedure) => (
                    <div key={procedure.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{procedure.name}</p>
                        <p className="text-sm text-gray-600">{procedure.zone.name}</p>
                        <p className="text-xs text-gray-500">
                          {procedure.lastReviewed ? `Reviewed ${new Date(procedure.lastReviewed).toLocaleDateString()}` : 'Never reviewed'}
                        </p>
                      </div>
                      <Badge className={getPriorityColor(procedure.priorityLevel)}>
                        {procedure.priorityLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Evacuation Readiness */}
            <Card>
              <CardHeader>
                <CardTitle>Evacuation Readiness</CardTitle>
                <CardDescription>Status of evacuation routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evacuationRoutes.slice(0, 5).map((route) => (
                    <div key={route.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{route.name}</p>
                        <p className="text-sm text-gray-600">
                          {route.fromZone.name} → {route.toZone.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {route.distance}m • {route.estimatedTime}s • Max {route.maxCapacity} people
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {route.isPrimary && <Badge className="bg-blue-100 text-blue-800">Primary</Badge>}
                        <Badge className={route.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {route.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="procedures" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Emergency Procedures</h3>
              <Button onClick={() => router.push('/venue-admin/zone-configuration')}>
                Manage Procedures
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {procedures.map((procedure) => (
                <Card key={procedure.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{procedure.name}</CardTitle>
                      <Badge className={getPriorityColor(procedure.priorityLevel)}>
                        {procedure.priorityLevel}
                      </Badge>
                    </div>
                    <CardDescription>{procedure.zone.name} • {procedure.procedureType}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">{procedure.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Duration</p>
                          <p className="font-medium">{procedure.estimatedDuration} minutes</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Personnel</p>
                          <p className="font-medium">{procedure.requiredPersonnel} staff</p>
                        </div>
                      </div>

                      {procedure.requiredEquipment.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Required Equipment:</p>
                          <div className="flex flex-wrap gap-1">
                            {procedure.requiredEquipment.map((equipment, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {equipment}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-2 border-t text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>{procedure.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                        {procedure.trainingRequired && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>Training Required</span>
                          </div>
                        )}
                        {procedure.lastReviewed && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Reviewed {new Date(procedure.lastReviewed).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evacuation" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Evacuation Routes</h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">Primary Routes: {evacuationRoutes.filter(r => r.isPrimary).length}</Badge>
                <Badge className="bg-green-100 text-green-800">Active Routes: {evacuationRoutes.filter(r => r.isActive).length}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {evacuationRoutes.map((route) => (
                <Card key={route.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{route.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {route.isPrimary && <Badge className="bg-blue-100 text-blue-800">Primary</Badge>}
                        <Badge className={route.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {route.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {route.fromZone.name} → {route.toZone.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Distance</p>
                          <p className="font-medium">{route.distance}m</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Est. Time</p>
                          <p className="font-medium">{route.estimatedTime}s</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Capacity</p>
                          <p className="font-medium">{route.maxCapacity}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Current Load</span>
                          <span className="font-medium">{route.currentLoad}/{route.maxCapacity}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              route.currentLoad / route.maxCapacity >= 0.8 ? 'bg-red-500' :
                              route.currentLoad / route.maxCapacity >= 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(route.currentLoad / route.maxCapacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-2 border-t text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span>{route.hazardLevel} hazard</span>
                        </div>
                        {route.isAccessible && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>Accessible</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          {route.lighting ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                          <span>Lighting</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {route.signage ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                          <span>Signage</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="communication" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Communication System</CardTitle>
                <CardDescription>Configure and test emergency communication protocols</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Emergency communication interface coming soon</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This will include PA system integration, staff notifications, and parent communication
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Emergency Activation Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Activate Emergency Procedure</DialogTitle>
            <DialogDescription>
              This will activate emergency protocols and notify all relevant personnel. Only use in actual emergencies.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency-type">Emergency Type</Label>
                <Select value={emergencyForm.emergencyType} onValueChange={(value) => setEmergencyForm({ ...emergencyForm, emergencyType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select emergency type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRE">Fire</SelectItem>
                    <SelectItem value="MEDICAL_EMERGENCY">Medical Emergency</SelectItem>
                    <SelectItem value="NATURAL_DISASTER">Natural Disaster</SelectItem>
                    <SelectItem value="SECURITY_THREAT">Security Threat</SelectItem>
                    <SelectItem value="STRUCTURAL_FAILURE">Structural Failure</SelectItem>
                    <SelectItem value="POWER_OUTAGE">Power Outage</SelectItem>
                    <SelectItem value="EVACUATION">General Evacuation</SelectItem>
                    <SelectItem value="MISSING_PERSON">Missing Person</SelectItem>
                    <SelectItem value="GENERAL_EMERGENCY">General Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="emergency-zone">Affected Zone</Label>
                <Select value={emergencyForm.zoneId} onValueChange={(value) => setEmergencyForm({ ...emergencyForm, zoneId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
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
            </div>

            <div>
              <Label htmlFor="emergency-severity">Severity Level</Label>
              <Select value={emergencyForm.severity} onValueChange={(value) => setEmergencyForm({ ...emergencyForm, severity: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="emergency-description">Description</Label>
              <Textarea
                id="emergency-description"
                value={emergencyForm.description}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, description: e.target.value })}
                placeholder="Describe the emergency situation..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="emergency-location">Specific Location (optional)</Label>
              <Input
                id="emergency-location"
                value={emergencyForm.location}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, location: e.target.value })}
                placeholder="Specific location within the zone"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmergencyDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleActivateEmergency} 
              disabled={activatingEmergency || !emergencyForm.emergencyType || !emergencyForm.zoneId}
              className="bg-red-600 hover:bg-red-700"
            >
              {activatingEmergency ? 'Activating...' : 'Activate Emergency'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
