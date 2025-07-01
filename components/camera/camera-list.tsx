
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera as CameraIcon, 
  Search, 
  Filter, 
  Eye, 
  Settings, 
  MapPin,
  Wifi,
  WifiOff,
  AlertTriangle,
  Wrench,
  Plus
} from 'lucide-react';
import { formatDistance } from 'date-fns';

// Import unified types
import type { CameraDevice as Camera } from '@/lib/floor-plan-types';

interface CameraListProps {
  venueId: string;
  floorPlanId?: string;
  onSelectCamera: (camera: Camera) => void;
  onAddCamera: () => void;
  refreshTrigger?: number;
}

export default function CameraList({ 
  venueId, 
  floorPlanId,
  onSelectCamera, 
  onAddCamera,
  refreshTrigger = 0
}: CameraListProps) {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [filteredCameras, setFilteredCameras] = useState<Camera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchCameras();
  }, [venueId, floorPlanId, refreshTrigger]);

  useEffect(() => {
    filterCameras();
  }, [cameras, searchTerm, statusFilter]);

  const fetchCameras = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let url = `/api/cameras?venueId=${venueId}`;
      if (floorPlanId) {
        url += `&floorPlanId=${floorPlanId}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cameras');
      }

      const data = await response.json();
      setCameras(data);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      setError(error instanceof Error ? error.message : 'Failed to load cameras');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCameras = () => {
    let filtered = cameras;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(camera =>
        camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        camera.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        camera.ipAddress?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(camera => camera.status === statusFilter);
    }

    setFilteredCameras(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'OFFLINE':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      case 'MAINTENANCE':
        return <Wrench className="h-4 w-4 text-yellow-600" />;
      case 'ERROR':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <CameraIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-100 text-green-800';
      case 'OFFLINE': return 'bg-red-100 text-red-800';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecentEvent = (camera: Camera) => {
    if (!camera.cameraEvents || camera.cameraEvents.length === 0) return null;
    return camera.cameraEvents[0];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Cameras</h3>
          <p className="text-sm text-muted-foreground">
            {filteredCameras.length} of {cameras.length} cameras
          </p>
        </div>
        <Button onClick={onAddCamera}>
          <Plus className="h-4 w-4 mr-2" />
          Add Camera
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cameras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ONLINE">Online</SelectItem>
            <SelectItem value="OFFLINE">Offline</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Camera List */}
      {filteredCameras.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {cameras.length === 0 ? 'No cameras configured' : 'No cameras match your filters'}
              </h3>
              <p className="text-gray-500 mb-4">
                {cameras.length === 0 
                  ? 'Add your first camera to start monitoring your venue.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {cameras.length === 0 && (
                <Button onClick={onAddCamera}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Camera
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCameras.map((camera) => (
            <Card key={camera.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onSelectCamera(camera)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(camera.status)}
                    <div>
                      <CardTitle className="text-base">{camera.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {camera.model && `${camera.model} • `}
                        {camera.ipAddress && `${camera.ipAddress} • `}
                        {camera.floorPlan?.name || 'No floor plan assigned'}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(camera.status)}>
                    {camera.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Position</p>
                      <p className="text-muted-foreground">
                        {camera.position 
                          ? `(${Math.round(camera.position.x)}, ${Math.round(camera.position.y)})`
                          : 'Not placed'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">View</p>
                      <p className="text-muted-foreground">
                        {camera.viewAngle}° / {camera.viewDistance}m
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium">Features</p>
                    <div className="flex gap-1 mt-1">
                      {camera.isRecordingEnabled && (
                        <Badge variant="secondary" className="text-xs">Recording</Badge>
                      )}
                      {camera.isRecognitionEnabled && (
                        <Badge variant="secondary" className="text-xs">Recognition</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium">Last Update</p>
                    <p className="text-muted-foreground">
                      {formatDistance(new Date(camera.updatedAt ?? new Date()), new Date(), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                {/* Recent Events */}
                {(() => {
                  const recentEvent = getRecentEvent(camera);
                  return recentEvent && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-1">Recent Event:</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {recentEvent.type}
                        </Badge>
                        <span className="text-muted-foreground">
                          {formatDistance(new Date(recentEvent.createdAt), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  );
                })()}
                
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCamera(camera);
                    }}
                    className="flex-1"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
