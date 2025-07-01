
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
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Settings, Plus, Edit, Trash2, Shield, Users, Clock, AlertTriangle, Save, MapPin } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  type: string;
  coordinates: any;
  color: string;
  description?: string;
  floorPlanId: string;
  parentZoneId?: string;
  zoneConfig?: ZoneConfig;
  accessRules?: AccessRule[];
  subZones?: Array<{ id: string; name: string; type: string }>;
  parentZone?: { id: string; name: string; type: string };
}

interface ZoneConfig {
  id: string;
  maxCapacity: number;
  minStaffRequired: number;
  maxAge?: number;
  minAge?: number;
  requiresAdultSupervision: boolean;
  isRestrictedAccess: boolean;
  accessPermissions: string[];
  operatingHours?: any;
  isMaintenanceMode: boolean;
  isEmergencyExit: boolean;
  priorityLevel: string;
  safetyLevel: string;
  hazardLevel: string;
  evacuationPriority: number;
  allowedActivities: string[];
  prohibitedItems: string[];
  requiredEquipment: string[];
  alertThresholds: any;
  environmentSettings?: any;
  complianceRequirements?: any;
}

interface AccessRule {
  id: string;
  ruleType: string;
  userRole?: string;
  ageRange?: any;
  timeRestrictions?: any;
  membershipRequired: boolean;
  staffEscortRequired: boolean;
  maxOccupancyTime?: number;
  requiresPermission: boolean;
  priority: number;
  isActive: boolean;
  violationAction: string;
}

export default function ZoneConfigurationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [activeTab, setActiveTab] = useState('zones');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [zoneForm, setZoneForm] = useState<Partial<Zone>>({});
  const [configForm, setConfigForm] = useState<Partial<ZoneConfig>>({});
  const [ruleForm, setRuleForm] = useState<Partial<AccessRule>>({});
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingRule, setEditingRule] = useState<AccessRule | null>(null);

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
      setLoading(true);
      const response = await fetch(`/api/zones?venueId=${selectedVenue}&includeConfig=true`);
      
      if (response.ok) {
        const data = await response.json();
        setZones(data.zones || []);
        setError(null);
      } else {
        throw new Error('Failed to fetch zones');
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
      setError('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = () => {
    setEditingZone(null);
    setZoneForm({
      name: '',
      type: 'PLAY_AREA',
      color: '#3B82F6',
      description: '',
      coordinates: { x: 0, y: 0, width: 100, height: 100 }
    });
    setShowZoneDialog(true);
  };

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone);
    setZoneForm(zone);
    setShowZoneDialog(true);
  };

  const handleSaveZone = async () => {
    try {
      setSaving(true);
      const url = editingZone ? `/api/zones/${editingZone.id}` : '/api/zones';
      const method = editingZone ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...zoneForm,
          floorPlanId: zones[0]?.floorPlanId // Assume same floor plan for simplicity
        })
      });

      if (response.ok) {
        toast.success(editingZone ? 'Zone updated successfully' : 'Zone created successfully');
        setShowZoneDialog(false);
        fetchZones();
      } else {
        throw new Error('Failed to save zone');
      }
    } catch (error) {
      console.error('Error saving zone:', error);
      toast.error('Failed to save zone');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const response = await fetch(`/api/zones/${zoneId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Zone deleted successfully');
        fetchZones();
      } else {
        throw new Error('Failed to delete zone');
      }
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Failed to delete zone');
    }
  };

  const handleConfigureZone = (zone: Zone) => {
    setSelectedZone(zone);
    setConfigForm(zone.zoneConfig || {
      maxCapacity: 50,
      minStaffRequired: 1,
      requiresAdultSupervision: false,
      isRestrictedAccess: false,
      accessPermissions: [],
      isMaintenanceMode: false,
      isEmergencyExit: false,
      priorityLevel: 'NORMAL',
      safetyLevel: 'STANDARD',
      hazardLevel: 'NONE',
      evacuationPriority: 1,
      allowedActivities: [],
      prohibitedItems: [],
      requiredEquipment: [],
      alertThresholds: {}
    });
    setShowConfigDialog(true);
  };

  const handleSaveConfiguration = async () => {
    if (!selectedZone) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/zones/${selectedZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configuration: configForm
        })
      });

      if (response.ok) {
        toast.success('Zone configuration saved successfully');
        setShowConfigDialog(false);
        fetchZones();
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccessRule = (zone: Zone) => {
    setSelectedZone(zone);
    setEditingRule(null);
    setRuleForm({
      ruleType: 'GENERAL_ACCESS',
      membershipRequired: false,
      staffEscortRequired: false,
      requiresPermission: false,
      priority: 1,
      isActive: true,
      violationAction: 'ALERT'
    });
    setShowRuleDialog(true);
  };

  const handleEditAccessRule = (zone: Zone, rule: AccessRule) => {
    setSelectedZone(zone);
    setEditingRule(rule);
    setRuleForm(rule);
    setShowRuleDialog(true);
  };

  const handleSaveAccessRule = async () => {
    if (!selectedZone) return;

    try {
      setSaving(true);
      const url = editingRule 
        ? `/api/zones/${selectedZone.id}/access-rules/${editingRule.id}`
        : `/api/zones/${selectedZone.id}/access-rules`;
      const method = editingRule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm)
      });

      if (response.ok) {
        toast.success(editingRule ? 'Access rule updated successfully' : 'Access rule created successfully');
        setShowRuleDialog(false);
        fetchZones();
      } else {
        throw new Error('Failed to save access rule');
      }
    } catch (error) {
      console.error('Error saving access rule:', error);
      toast.error('Failed to save access rule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchZones}>Try Again</Button>
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
          <h1 className="text-2xl font-bold text-gray-900">Zone Configuration</h1>
          <p className="text-gray-600">Configure zones, access rules, and safety settings</p>
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

          <Button onClick={handleCreateZone}>
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="zones">Zone Management</TabsTrigger>
          <TabsTrigger value="access">Access Rules</TabsTrigger>
          <TabsTrigger value="safety">Safety Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <Card key={zone.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                    <Badge variant="outline">{zone.type}</Badge>
                  </div>
                  {zone.description && (
                    <CardDescription>{zone.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Configuration Status */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Configuration</span>
                      <Badge className={zone.zoneConfig ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {zone.zoneConfig ? 'Configured' : 'Needs Setup'}
                      </Badge>
                    </div>

                    {zone.zoneConfig && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Capacity:</span>
                          <span className="font-medium">{zone.zoneConfig.maxCapacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Safety Level:</span>
                          <Badge className="text-xs">{zone.zoneConfig.safetyLevel}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Access Rules:</span>
                          <span className="font-medium">{zone.accessRules?.length || 0} rules</span>
                        </div>
                      </div>
                    )}

                    {/* Sub-zones */}
                    {zone.subZones && zone.subZones.length > 0 && (
                      <div className="text-sm">
                        <p className="text-gray-600 mb-1">Sub-zones:</p>
                        <div className="space-y-1">
                          {zone.subZones.map((subZone) => (
                            <div key={subZone.id} className="text-xs text-gray-500">
                              • {subZone.name} ({subZone.type})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline" onClick={() => handleEditZone(zone)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleConfigureZone(zone)}>
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Zone</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{zone.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteZone(zone.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="access" className="mt-6">
          <div className="space-y-6">
            {zones.map((zone) => (
              <Card key={zone.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{zone.name}</CardTitle>
                      <CardDescription>Access rules and permissions</CardDescription>
                    </div>
                    <Button onClick={() => handleCreateAccessRule(zone)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {zone.accessRules && zone.accessRules.length > 0 ? (
                    <div className="space-y-3">
                      {zone.accessRules.map((rule) => (
                        <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{rule.ruleType.replace(/_/g, ' ')}</p>
                              <Badge className={rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {rule.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-x-3">
                              {rule.membershipRequired && <span>• Membership Required</span>}
                              {rule.staffEscortRequired && <span>• Staff Escort Required</span>}
                              {rule.requiresPermission && <span>• Permission Required</span>}
                              <span>• Priority: {rule.priority}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditAccessRule(zone, rule)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No access rules configured</p>
                      <Button className="mt-4" onClick={() => handleCreateAccessRule(zone)}>
                        Add First Rule
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="safety" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Safety Configuration</CardTitle>
                <CardDescription>Configure safety settings and emergency procedures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Safety configuration interface coming soon</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This will include emergency procedures, evacuation routes, and safety equipment management
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Zone Creation/Edit Dialog */}
      <Dialog open={showZoneDialog} onOpenChange={setShowZoneDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingZone ? 'Edit Zone' : 'Create New Zone'}</DialogTitle>
            <DialogDescription>
              {editingZone ? 'Update zone information' : 'Configure the basic settings for the new zone'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zone-name">Zone Name</Label>
                <Input
                  id="zone-name"
                  value={zoneForm.name || ''}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  placeholder="Enter zone name"
                />
              </div>
              <div>
                <Label htmlFor="zone-type">Zone Type</Label>
                <Select value={zoneForm.type || ''} onValueChange={(value) => setZoneForm({ ...zoneForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLAY_AREA">Play Area</SelectItem>
                    <SelectItem value="ENTRANCE">Entrance</SelectItem>
                    <SelectItem value="EXIT">Exit</SelectItem>
                    <SelectItem value="RESTROOM">Restroom</SelectItem>
                    <SelectItem value="FOOD_COURT">Food Court</SelectItem>
                    <SelectItem value="OFFICE">Office</SelectItem>
                    <SelectItem value="VIP_AREA">VIP Area</SelectItem>
                    <SelectItem value="STAFF_ONLY">Staff Only</SelectItem>
                    <SelectItem value="RESTRICTED">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="zone-description">Description</Label>
              <Textarea
                id="zone-description"
                value={zoneForm.description || ''}
                onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
                placeholder="Enter zone description"
              />
            </div>

            <div>
              <Label htmlFor="zone-color">Zone Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="zone-color"
                  type="color"
                  value={zoneForm.color || '#3B82F6'}
                  onChange={(e) => setZoneForm({ ...zoneForm, color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={zoneForm.color || '#3B82F6'}
                  onChange={(e) => setZoneForm({ ...zoneForm, color: e.target.value })}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowZoneDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveZone} disabled={saving}>
              {saving ? 'Saving...' : 'Save Zone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zone Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure {selectedZone?.name}</DialogTitle>
            <DialogDescription>Set capacity, safety, and operational parameters</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Configuration */}
            <div className="space-y-4">
              <h4 className="font-semibold">Basic Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-capacity">Maximum Capacity</Label>
                  <Input
                    id="max-capacity"
                    type="number"
                    value={configForm.maxCapacity || ''}
                    onChange={(e) => setConfigForm({ ...configForm, maxCapacity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="min-staff">Minimum Staff Required</Label>
                  <Input
                    id="min-staff"
                    type="number"
                    value={configForm.minStaffRequired || ''}
                    onChange={(e) => setConfigForm({ ...configForm, minStaffRequired: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Age Restrictions */}
            <div className="space-y-4">
              <h4 className="font-semibold">Age Restrictions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-age">Minimum Age</Label>
                  <Input
                    id="min-age"
                    type="number"
                    value={configForm.minAge || ''}
                    onChange={(e) => setConfigForm({ ...configForm, minAge: parseInt(e.target.value) || undefined })}
                    placeholder="No minimum"
                  />
                </div>
                <div>
                  <Label htmlFor="max-age">Maximum Age</Label>
                  <Input
                    id="max-age"
                    type="number"
                    value={configForm.maxAge || ''}
                    onChange={(e) => setConfigForm({ ...configForm, maxAge: parseInt(e.target.value) || undefined })}
                    placeholder="No maximum"
                  />
                </div>
              </div>
            </div>

            {/* Safety Configuration */}
            <div className="space-y-4">
              <h4 className="font-semibold">Safety Configuration</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="safety-level">Safety Level</Label>
                  <Select value={configForm.safetyLevel || ''} onValueChange={(value) => setConfigForm({ ...configForm, safetyLevel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select safety level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINIMAL">Minimal</SelectItem>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="ENHANCED">Enhanced</SelectItem>
                      <SelectItem value="MAXIMUM">Maximum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hazard-level">Hazard Level</Label>
                  <Select value={configForm.hazardLevel || ''} onValueChange={(value) => setConfigForm({ ...configForm, hazardLevel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hazard level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="EXTREME">Extreme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority-level">Priority Level</Label>
                  <Select value={configForm.priorityLevel || ''} onValueChange={(value) => setConfigForm({ ...configForm, priorityLevel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Settings Switches */}
            <div className="space-y-4">
              <h4 className="font-semibold">Zone Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="adult-supervision">Requires Adult Supervision</Label>
                  <Switch
                    id="adult-supervision"
                    checked={configForm.requiresAdultSupervision || false}
                    onCheckedChange={(checked) => setConfigForm({ ...configForm, requiresAdultSupervision: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="restricted-access">Restricted Access</Label>
                  <Switch
                    id="restricted-access"
                    checked={configForm.isRestrictedAccess || false}
                    onCheckedChange={(checked) => setConfigForm({ ...configForm, isRestrictedAccess: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emergency-exit">Emergency Exit</Label>
                  <Switch
                    id="emergency-exit"
                    checked={configForm.isEmergencyExit || false}
                    onCheckedChange={(checked) => setConfigForm({ ...configForm, isEmergencyExit: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <Switch
                    id="maintenance-mode"
                    checked={configForm.isMaintenanceMode || false}
                    onCheckedChange={(checked) => setConfigForm({ ...configForm, isMaintenanceMode: checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfiguration} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Access Rule' : 'Create Access Rule'}</DialogTitle>
            <DialogDescription>
              Configure access permissions and restrictions for {selectedZone?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule-type">Rule Type</Label>
                <Select value={ruleForm.ruleType || ''} onValueChange={(value) => setRuleForm({ ...ruleForm, ruleType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL_ACCESS">General Access</SelectItem>
                    <SelectItem value="AGE_RESTRICTION">Age Restriction</SelectItem>
                    <SelectItem value="TIME_RESTRICTION">Time Restriction</SelectItem>
                    <SelectItem value="CAPACITY_RESTRICTION">Capacity Restriction</SelectItem>
                    <SelectItem value="ROLE_RESTRICTION">Role Restriction</SelectItem>
                    <SelectItem value="MEMBERSHIP_RESTRICTION">Membership Restriction</SelectItem>
                    <SelectItem value="ESCORT_REQUIREMENT">Escort Requirement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="violation-action">Violation Action</Label>
                <Select value={ruleForm.violationAction || ''} onValueChange={(value) => setRuleForm({ ...ruleForm, violationAction: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALERT">Alert</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="BLOCK_ACCESS">Block Access</SelectItem>
                    <SelectItem value="ESCALATE">Escalate</SelectItem>
                    <SelectItem value="CONTACT_PARENT">Contact Parent</SelectItem>
                    <SelectItem value="CONTACT_STAFF">Contact Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule-priority">Priority</Label>
                <Input
                  id="rule-priority"
                  type="number"
                  min="1"
                  value={ruleForm.priority || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="max-occupancy-time">Max Occupancy Time (minutes)</Label>
                <Input
                  id="max-occupancy-time"
                  type="number"
                  value={ruleForm.maxOccupancyTime || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, maxOccupancyTime: parseInt(e.target.value) || undefined })}
                  placeholder="No limit"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="membership-required">Membership Required</Label>
                <Switch
                  id="membership-required"
                  checked={ruleForm.membershipRequired || false}
                  onCheckedChange={(checked) => setRuleForm({ ...ruleForm, membershipRequired: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="staff-escort">Staff Escort Required</Label>
                <Switch
                  id="staff-escort"
                  checked={ruleForm.staffEscortRequired || false}
                  onCheckedChange={(checked) => setRuleForm({ ...ruleForm, staffEscortRequired: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requires-permission">Requires Permission</Label>
                <Switch
                  id="requires-permission"
                  checked={ruleForm.requiresPermission || false}
                  onCheckedChange={(checked) => setRuleForm({ ...ruleForm, requiresPermission: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="rule-active">Rule Active</Label>
                <Switch
                  id="rule-active"
                  checked={ruleForm.isActive !== false}
                  onCheckedChange={(checked) => setRuleForm({ ...ruleForm, isActive: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAccessRule} disabled={saving}>
              {saving ? 'Saving...' : 'Save Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
