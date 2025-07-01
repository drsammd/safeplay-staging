
'use client';

import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Map, 
  Camera as CameraIcon, 
  BarChart3, 
  Lightbulb,
  Settings,
  Eye,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

// Import our components
import FloorPlanUpload from './floor-plan-upload';
import FloorPlanList from './floor-plan-list';
import FloorPlanViewer from './floor-plan-viewer';
import CameraList from '@/components/camera/camera-list';
import CameraPlacementPanel from '@/components/camera/camera-placement-panel';
import CameraCoverageDisplay from '@/components/camera/camera-coverage-display';

// Import common types
import type { 
  FloorPlan, 
  CameraDevice, 
  Zone, 
  CameraRecommendation,
  CameraInput,
  FloorPlanViewerCamera
} from '@/lib/floor-plan-types';

interface FloorPlanManagementProps {
  venueId?: string;
  userRole: string;
  userId: string;
}



export default function FloorPlanManagement({ venueId, userRole, userId }: FloorPlanManagementProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<FloorPlan | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [mode, setMode] = useState<'view' | 'edit' | 'camera-placement'>('view');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isNewCamera, setIsNewCamera] = useState(false);
  const [recommendations, setRecommendations] = useState<CameraRecommendation[]>([]);
  const [showCoverageAreas, setShowCoverageAreas] = useState(false);
  const [coverageAreas, setCoverageAreas] = useState([]);

  // If no venue is provided and user is VENUE_ADMIN, show error
  if (!venueId && userRole === 'VENUE_ADMIN') {
    return (
      <Alert>
        <AlertDescription>
          No venue assigned to your account. Please contact the administrator.
        </AlertDescription>
      </Alert>
    );
  }

  // For COMPANY_ADMIN without venueId, show venue selector (simplified for now)
  if (!venueId && userRole === 'COMPANY_ADMIN') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Venue</CardTitle>
          <CardDescription>
            Choose a venue to manage floor plans and cameras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Venue selection for company admins will be implemented in a future update.
            For now, please access venue-specific floor plan management through individual venue dashboards.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleFloorPlanSelect = useCallback((floorPlan: FloorPlan) => {
    setSelectedFloorPlan(floorPlan);
    setActiveTab('viewer');
    
    // Fetch cameras and zones for this floor plan
    (async () => {
      try {
        const [camerasResponse, zonesResponse] = await Promise.all([
          fetch(`/api/cameras?venueId=${venueId}&floorPlanId=${floorPlan.id}`),
          fetch(`/api/zones?floorPlanId=${floorPlan.id}`)
        ]);

        if (camerasResponse.ok) {
          const camerasData = await camerasResponse.json();
          setCameras(camerasData);
        }

        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json();
          setZones(zonesData);
        }
      } catch (error) {
        console.error('Error fetching floor plan data:', error);
        toast.error('Failed to load floor plan data');
      }
    })();
  }, [venueId]);

  const handleUploadComplete = useCallback((floorPlan: FloorPlan) => {
    toast.success('Floor plan uploaded successfully!');
    setRefreshTrigger(prev => prev + 1);
    setSelectedFloorPlan(floorPlan);
    setActiveTab('viewer');
  }, []);

  const handleUploadError = useCallback((error: string) => {
    toast.error(`Upload failed: ${error}`);
  }, []);

  const handleDeleteFloorPlan = useCallback((floorPlanId: string) => {
    if (selectedFloorPlan?.id === floorPlanId) {
      setSelectedFloorPlan(null);
      setActiveTab('overview');
    }
    setRefreshTrigger(prev => prev + 1);
    toast.success('Floor plan deleted successfully');
  }, [selectedFloorPlan]);

  const handleCameraSelect = useCallback((camera: CameraDevice) => {
    setSelectedCamera(camera);
    setIsNewCamera(false);
  }, []);

  const handleCameraMove = useCallback((cameraId: string, position: { x: number; y: number }) => {
    setCameras((prev: CameraDevice[]) => prev.map(camera => 
      camera.id === cameraId 
        ? { ...camera, position }
        : camera
    ));
    
    if (selectedCamera?.id === cameraId) {
      setSelectedCamera(prev => prev ? { ...prev, position } : null);
    }
  }, [selectedCamera]);

  const handleCanvasClick = useCallback((position: { x: number; y: number }) => {
    if (mode === 'camera-placement') {
      // Create new camera at clicked position
      const newCamera: CameraDevice = {
        id: `temp-${Date.now()}`,
        name: `Camera ${cameras.length + 1}`,
        position,
        status: 'OFFLINE',
        viewAngle: 60,
        viewDistance: 10,
        rotation: 0,
        height: 2.5,
        isRecordingEnabled: true,
        isRecognitionEnabled: true,
        recognitionThreshold: 0.85
      };
      
      setSelectedCamera(newCamera);
      setIsNewCamera(true);
    }
  }, [mode, cameras.length]);

  const handleCameraUpdate = useCallback((camera: CameraDevice) => {
    if (isNewCamera) {
      setSelectedCamera(camera);
    } else {
      setCameras(prev => prev.map(c => c.id === camera.id ? camera : c));
      setSelectedCamera(camera);
    }
  }, [isNewCamera]);

  const handleCameraSave = useCallback((camera: CameraDevice) => {
    (async () => {
      try {
        const method = isNewCamera ? 'POST' : 'PATCH';
        const url = isNewCamera ? '/api/cameras' : `/api/cameras/${camera.id}`;
        
        const requestData = {
          ...camera,
          venueId,
          floorPlanId: selectedFloorPlan?.id
        };

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          throw new Error('Failed to save camera');
        }

        const savedCamera = await response.json();
        
        if (isNewCamera) {
          setCameras(prev => [...prev, savedCamera]);
          setIsNewCamera(false);
        } else {
          setCameras(prev => prev.map(c => c.id === camera.id ? savedCamera : c));
        }
        
        setSelectedCamera(savedCamera);
        toast.success('Camera saved successfully');
      } catch (error) {
        console.error('Error saving camera:', error);
        toast.error('Failed to save camera');
      }
    })();
  }, [isNewCamera, venueId, selectedFloorPlan]);

  const handleCameraDelete = useCallback((cameraId: string) => {
    (async () => {
      try {
        const response = await fetch(`/api/cameras/${cameraId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete camera');
        }

        setCameras(prev => prev.filter(c => c.id !== cameraId));
        setSelectedCamera(null);
        toast.success('Camera deleted successfully');
      } catch (error) {
        console.error('Error deleting camera:', error);
        toast.error('Failed to delete camera');
      }
    })();
  }, []);

  const handleGenerateRecommendations = useCallback(() => {
    if (!selectedFloorPlan) return;

    (async () => {
      try {
        const response = await fetch('/api/cameras/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venueId,
            floorPlanId: selectedFloorPlan.id,
            regenerate: true
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate recommendations');
        }

        const recs = await response.json();
        setRecommendations(recs);
        toast.success(`Generated ${recs.length} camera recommendations`);
      } catch (error) {
        console.error('Error generating recommendations:', error);
        toast.error('Failed to generate recommendations');
      }
    })();
  }, [selectedFloorPlan, venueId]);

  const handleAddCamera = useCallback(() => {
    setMode('camera-placement');
    setSelectedCamera(null);
    toast.info('Click on the floor plan to place a new camera');
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Floor Plans</h3>
              <p className="text-gray-700 font-medium">
                Manage and view all floor plans for your venue. Select a floor plan to configure cameras and zones.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <FloorPlanList
                venueId={venueId!}
                onSelectFloorPlan={handleFloorPlanSelect}
                onDeleteFloorPlan={handleDeleteFloorPlan}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload New Floor Plan</h3>
              <p className="text-gray-700 font-medium">
                Add a new floor plan to your venue. Supported formats include PNG, JPG, and PDF files.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <FloorPlanUpload
                venueId={venueId!}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </div>
          </div>
        );

      case 'viewer':
        if (!selectedFloorPlan) {
          return (
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Map className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Floor Plan Selected</h3>
                  <p className="text-gray-600 font-medium mb-4">
                    Select a floor plan from the overview tab to view and manage cameras
                  </p>
                  <Button 
                    onClick={() => setActiveTab('overview')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Go to Floor Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        }

        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* Floor Plan Viewer */}
            <div className="lg:col-span-3 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden shadow-inner">
              <FloorPlanViewer
                floorPlan={selectedFloorPlan}
                cameras={cameras.filter(camera => camera.id).map((camera) => ({
                  id: camera.id!,
                  name: camera.name,
                  position: camera.position,
                  status: camera.status ?? 'OFFLINE',
                  viewAngle: camera.viewAngle,
                  viewDistance: camera.viewDistance,
                  rotation: camera.rotation
                }))}
                zones={zones}
                mode={mode}
                onCameraSelect={handleCameraSelect}
                onCameraMove={handleCameraMove}
                onCanvasClick={handleCanvasClick}
                showCoverageAreas={showCoverageAreas}
                coverageAreas={coverageAreas}
              />
            </div>

            {/* Enhanced Control Panel */}
            <div className="space-y-4">
              {/* Mode Controls */}
              <Card className="bg-white/95 backdrop-blur-sm border-white/40 shadow-lg">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-lg font-bold text-gray-900">Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={mode === 'view' ? 'default' : 'outline'}
                      size="sm"
                      className={`font-semibold ${mode === 'view' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                        : 'bg-white hover:bg-blue-50 border-blue-200 text-blue-700'
                      }`}
                      onClick={() => setMode('view')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Mode
                    </Button>
                    <Button
                      variant={mode === 'camera-placement' ? 'default' : 'outline'}
                      size="sm"
                      className={`font-semibold ${mode === 'camera-placement' 
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                        : 'bg-white hover:bg-green-50 border-green-200 text-green-700'
                      }`}
                      onClick={() => setMode('camera-placement')}
                    >
                      <CameraIcon className="h-4 w-4 mr-2" />
                      Place Cameras
                    </Button>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCoverageAreas(!showCoverageAreas)}
                      className={`w-full font-semibold ${showCoverageAreas 
                        ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800' 
                        : 'bg-white hover:bg-amber-50 border-amber-200 text-amber-700'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {showCoverageAreas ? 'Hide' : 'Show'} Coverage
                    </Button>
                  </div>

                  {mode === 'camera-placement' && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 font-medium flex items-center">
                        <Lightbulb className="h-3 w-3 mr-1" />
                        Click on the floor plan to place a new camera
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Camera Placement Panel */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-white/40 shadow-lg">
                <CameraPlacementPanel
                  selectedCamera={selectedCamera}
                  floorPlanDimensions={selectedFloorPlan.dimensions}
                  onCameraUpdate={handleCameraUpdate}
                  onCameraDelete={handleCameraDelete}
                  onCameraSave={handleCameraSave}
                  onGenerateRecommendations={handleGenerateRecommendations}
                  isNewCamera={isNewCamera}
                  recommendations={recommendations}
                />
              </div>
            </div>
          </div>
        );

      case 'cameras':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Camera Management</h3>
              <p className="text-gray-700 font-medium">
                Configure and monitor all cameras in your venue. Add new cameras or modify existing ones.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <CameraList
                venueId={venueId!}
                floorPlanId={selectedFloorPlan?.id}
                onSelectCamera={handleCameraSelect}
                onAddCamera={handleAddCamera}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        );

      case 'coverage':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Coverage Analysis</h3>
              <p className="text-gray-700 font-medium">
                View detailed camera coverage analytics and optimize your safety monitoring system.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <CameraCoverageDisplay
                venueId={venueId!}
                floorPlanId={selectedFloorPlan?.id}
                onRefresh={() => setRefreshTrigger(prev => prev + 1)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Enhanced Header with Back Button */}
      {selectedFloorPlan && activeTab === 'viewer' && (
        <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-md p-6 border border-white/30 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 font-semibold shadow-sm"
              onClick={() => {
                setSelectedFloorPlan(null);
                setActiveTab('overview');
                setMode('view');
                setSelectedCamera(null);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Floor Plans
            </Button>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{selectedFloorPlan.name}</h2>
              {selectedFloorPlan.description && (
                <p className="text-sm text-gray-600 mt-1 font-medium">{selectedFloorPlan.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 font-semibold">
                <CameraIcon className="h-3 w-3 mr-1" />
                {cameras.length} camera{cameras.length !== 1 ? 's' : ''}
              </Badge>
              {zones.length > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 font-semibold">
                  {zones.length} zone{zones.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Main Tabs */}
      <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-white/30 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-gray-50/80 border-b border-gray-200">
            <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-2">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 font-semibold text-gray-700 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md px-4 py-3"
              >
                <Map className="h-4 w-4" />
                Floor Plans
              </TabsTrigger>
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-2 font-semibold text-gray-700 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md px-4 py-3"
              >
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger 
                value="viewer" 
                className="flex items-center gap-2 font-semibold text-gray-700 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={!selectedFloorPlan}
              >
                <Eye className="h-4 w-4" />
                Viewer
              </TabsTrigger>
              <TabsTrigger 
                value="cameras" 
                className="flex items-center gap-2 font-semibold text-gray-700 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md px-4 py-3"
              >
                <CameraIcon className="h-4 w-4" />
                Cameras
              </TabsTrigger>
              <TabsTrigger 
                value="coverage" 
                className="flex items-center gap-2 font-semibold text-gray-700 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md px-4 py-3"
              >
                <BarChart3 className="h-4 w-4" />
                Coverage
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="p-6 bg-white">
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
