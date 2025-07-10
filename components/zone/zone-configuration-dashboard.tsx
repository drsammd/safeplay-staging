
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MapPin, Camera, Users, Settings, AlertTriangle, Edit, Trash2, Eye, Shield, Activity } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  description?: string;
  zoneType: string;
  maxCapacity?: number;
  currentOccupancy?: number;
  coordinates?: any;
  cameras?: any[];
  safetyLevel: string;
  monitoringEnabled: boolean;
}

interface ZoneConfigurationDashboardProps {
  venueId?: string;
  userRole: string;
  userId: string;
  initialZones: Zone[];
}

export default function ZoneConfigurationDashboard({
  venueId,
  userRole,
  userId,
  initialZones
}: ZoneConfigurationDashboardProps) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newZone, setNewZone] = useState({
    name: '',
    description: '',
    zoneType: 'PLAY_AREA',
    maxCapacity: '',
    safetyLevel: 'MEDIUM',
    monitoringEnabled: true
  });

  const zoneTypes = [
    { value: 'PLAY_AREA', label: 'Play Area', icon: '🎮' },
    { value: 'DINING', label: 'Dining Area', icon: '🍽️' },
    { value: 'RESTROOM', label: 'Restroom', icon: '🚻' },
    { value: 'ENTRANCE', label: 'Entrance/Exit', icon: '🚪' },
    { value: 'PARTY_ROOM', label: 'Party Room', icon: '🎉' },
    { value: 'ARCADE', label: 'Arcade', icon: '🕹️' },
    { value: 'OUTDOOR', label: 'Outdoor Area', icon: '🌳' },
    { value: 'STAFF_ONLY', label: 'Staff Only', icon: '🔒' },
    { value: 'EMERGENCY', label: 'Emergency Area', icon: '🚨' },
    { value: 'OTHER', label: 'Other', icon: '📍' }
  ];

  const safetyLevels = [
    { value: 'LOW', label: 'Low Risk', color: 'green' },
    { value: 'MEDIUM', label: 'Medium Risk', color: 'yellow' },
    { value: 'HIGH', label: 'High Risk', color: 'red' },
    { value: 'CRITICAL', label: 'Critical Risk', color: 'red' }
  ];

  const handleCreateZone = async () => {
    if (!newZone.name.trim()) {
      setError('Zone name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newZone,
          maxCapacity: newZone.maxCapacity ? parseInt(newZone.maxCapacity) : null,
          venueId: venueId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create zone');
      }

      const createdZone = await response.json();
      setZones(prev => [...prev, createdZone]);
      setIsCreateModalOpen(false);
      setNewZone({
        name: '',
        description: '',
        zoneType: 'PLAY_AREA',
        maxCapacity: '',
        safetyLevel: 'MEDIUM',
        monitoringEnabled: true
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create zone');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('Are you sure you want to delete this zone? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/zones/${zoneId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete zone');
      }

      setZones(prev => prev.filter(zone => zone.id !== zoneId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete zone');
    } finally {
      setIsLoading(false);
    }
  };

  const getZoneTypeInfo = (zoneType: string) => {
    return zoneTypes.find(type => type.value === zoneType) || zoneTypes[zoneTypes.length - 1];
  };

  const getSafetyLevelInfo = (safetyLevel: string) => {
    return safetyLevels.find(level => level.value === safetyLevel) || safetyLevels[1];
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Zone Management</h2>
          <p className="text-gray-600 mt-1">Configure and monitor safety zones in your venue</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Zone</DialogTitle>
              <DialogDescription>
                Add a new safety zone to your venue for enhanced monitoring and organization.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zone-name">Zone Name *</Label>
                  <Input
                    id="zone-name"
                    placeholder="e.g., Main Play Area"
                    value={newZone.name}
                    onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zone-type">Zone Type *</Label>
                  <Select value={newZone.zoneType} onValueChange={(value) => setNewZone(prev => ({ ...prev, zoneType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {zoneTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <span className="mr-2">{type.icon}</span>
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-capacity">Max Capacity</Label>
                  <Input
                    id="max-capacity"
                    type="number"
                    placeholder="e.g., 50"
                    value={newZone.maxCapacity}
                    onChange={(e) => setNewZone(prev => ({ ...prev, maxCapacity: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="safety-level">Safety Level *</Label>
                  <Select value={newZone.safetyLevel} onValueChange={(value) => setNewZone(prev => ({ ...prev, safetyLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {safetyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 bg-${level.color}-500`}></div>
                            {level.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone-description">Description</Label>
                <Textarea
                  id="zone-description"
                  placeholder="Describe this zone's purpose and any special safety considerations..."
                  value={newZone.description}
                  onChange={(e) => setNewZone(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateZone} 
                  disabled={isLoading || !newZone.name.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Creating...' : 'Create Zone'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Zones</p>
                <p className="text-2xl font-bold">{zones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Camera Coverage</p>
                <p className="text-2xl font-bold">{zones.reduce((acc, zone) => acc + (zone.cameras?.length || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monitored</p>
                <p className="text-2xl font-bold">{zones.filter(zone => zone.monitoringEnabled).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">{zones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zones Grid */}
      {zones.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No zones configured</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first safety zone.
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Zone
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => {
            const typeInfo = getZoneTypeInfo(zone.zoneType);
            const safetyInfo = getSafetyLevelInfo(zone.safetyLevel);
            
            return (
              <Card key={zone.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{typeInfo.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{zone.name}</CardTitle>
                        <CardDescription>{typeInfo.label}</CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteZone(zone.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {zone.description && (
                    <p className="text-sm text-gray-600 mb-4">{zone.description}</p>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Safety Level</span>
                      <Badge variant="outline" className={`text-${safetyInfo.color}-700 border-${safetyInfo.color}-200`}>
                        {safetyInfo.label}
                      </Badge>
                    </div>
                    
                    {zone.maxCapacity && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Capacity</span>
                        <span className="text-sm font-medium">
                          {zone.currentOccupancy || 0} / {zone.maxCapacity}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cameras</span>
                      <span className="text-sm font-medium">{zone.cameras?.length || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Monitoring</span>
                      <Badge variant={zone.monitoringEnabled ? "default" : "secondary"}>
                        {zone.monitoringEnabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
