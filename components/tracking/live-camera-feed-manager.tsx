
"use client";

import { useEffect, useState } from "react";
import { Camera, Play, Pause, Settings, Maximize2, Minimize2, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import DemoCameraFeed from "@/components/venue/demo-camera-feed";

interface CameraFeed {
  cameraId: string;
  cameraName: string;
  zone: string;
  isStreaming: boolean;
  isRecognitionEnabled: boolean;
  streamHealth: 'excellent' | 'good' | 'poor' | 'offline';
  frameRate: number;
  resolution: string;
  recognitionThreshold: number;
  lastRecognition?: Date;
  recognitionCount: number;
}

interface LiveCameraFeedManagerProps {
  venueId: string;
  isDemo?: boolean;
  selectedZone?: string;
  onCameraSelect?: (cameraId: string) => void;
}

export default function LiveCameraFeedManager({ 
  venueId, 
  isDemo = false, 
  selectedZone, 
  onCameraSelect 
}: LiveCameraFeedManagerProps) {
  const [cameras, setCameras] = useState<CameraFeed[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recognitionSettings, setRecognitionSettings] = useState({
    threshold: 80,
    frameRate: 2,
    enabled: true
  });

  useEffect(() => {
    if (isDemo) {
      initializeDemoCameras();
    } else {
      loadCameras();
    }
  }, [venueId, isDemo]);

  const initializeDemoCameras = () => {
    const demoCameras: CameraFeed[] = [
      {
        cameraId: 'demo-camera-1',
        cameraName: 'Main Entrance Camera',
        zone: 'Entrance',
        isStreaming: true,
        isRecognitionEnabled: true,
        streamHealth: 'excellent',
        frameRate: 30,
        resolution: '1920x1080',
        recognitionThreshold: 85,
        lastRecognition: new Date(Date.now() - 30000),
        recognitionCount: 15
      },
      {
        cameraId: 'demo-camera-2',
        cameraName: 'Play Area A Camera',
        zone: 'Play Area A',
        isStreaming: true,
        isRecognitionEnabled: true,
        streamHealth: 'good',
        frameRate: 25,
        resolution: '1920x1080',
        recognitionThreshold: 80,
        lastRecognition: new Date(Date.now() - 45000),
        recognitionCount: 8
      },
      {
        cameraId: 'demo-camera-3',
        cameraName: 'Climbing Zone Camera',
        zone: 'Climbing Zone',
        isStreaming: true,
        isRecognitionEnabled: true,
        streamHealth: 'excellent',
        frameRate: 30,
        resolution: '1920x1080',
        recognitionThreshold: 85,
        lastRecognition: new Date(Date.now() - 60000),
        recognitionCount: 12
      },
      {
        cameraId: 'demo-camera-4',
        cameraName: 'Ball Pit Camera',
        zone: 'Ball Pit',
        isStreaming: true,
        isRecognitionEnabled: true,
        streamHealth: 'good',
        frameRate: 25,
        resolution: '1920x1080',
        recognitionThreshold: 80,
        lastRecognition: new Date(Date.now() - 90000),
        recognitionCount: 6
      },
      {
        cameraId: 'demo-camera-5',
        cameraName: 'Exit Monitor Camera',
        zone: 'Exit Zone',
        isStreaming: false,
        isRecognitionEnabled: false,
        streamHealth: 'offline',
        frameRate: 0,
        resolution: '1920x1080',
        recognitionThreshold: 80,
        recognitionCount: 0
      },
      {
        cameraId: 'demo-camera-6',
        cameraName: 'Overview Camera',
        zone: 'Overview',
        isStreaming: true,
        isRecognitionEnabled: true,
        streamHealth: 'poor',
        frameRate: 15,
        resolution: '1280x720',
        recognitionThreshold: 75,
        lastRecognition: new Date(Date.now() - 120000),
        recognitionCount: 3
      }
    ];

    setCameras(demoCameras);
    setSelectedCamera(demoCameras[0].cameraId);
  };

  const loadCameras = async () => {
    try {
      // Load actual cameras from API
      const response = await fetch(`/api/cameras?venueId=${venueId}`);
      const result = await response.json();
      
      if (result && Array.isArray(result)) {
        const cameraFeeds: CameraFeed[] = result.map(camera => ({
          cameraId: camera.id,
          cameraName: camera.name,
          zone: camera.zone || 'Unknown',
          isStreaming: camera.isActive,
          isRecognitionEnabled: camera.isRecognitionEnabled,
          streamHealth: camera.isActive ? 'good' : 'offline',
          frameRate: camera.isActive ? 25 : 0,
          resolution: '1920x1080',
          recognitionThreshold: Math.round((camera.recognitionThreshold || 0.8) * 100),
          recognitionCount: 0
        }));
        
        setCameras(cameraFeeds);
        if (cameraFeeds.length > 0) {
          setSelectedCamera(cameraFeeds[0].cameraId);
        }
      }
    } catch (error) {
      console.error('Error loading cameras:', error);
    }
  };

  const handleCameraSelect = (cameraId: string) => {
    setSelectedCamera(cameraId);
    onCameraSelect?.(cameraId);
  };

  const toggleRecognition = async (cameraId: string) => {
    try {
      const camera = cameras.find(c => c.cameraId === cameraId);
      if (!camera) return;

      if (isDemo) {
        // Demo mode - just update state
        setCameras(prev => prev.map(c => 
          c.cameraId === cameraId 
            ? { ...c, isRecognitionEnabled: !c.isRecognitionEnabled }
            : c
        ));
      } else {
        // Real mode - call API
        const action = camera.isRecognitionEnabled ? 'stop' : 'start';
        const response = await fetch('/api/real-time/face-recognition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cameraId,
            venueId,
            action,
            recognitionThreshold: recognitionSettings.threshold,
            frameRate: recognitionSettings.frameRate
          })
        });

        if (response.ok) {
          setCameras(prev => prev.map(c => 
            c.cameraId === cameraId 
              ? { ...c, isRecognitionEnabled: !c.isRecognitionEnabled }
              : c
          ));
        }
      }
    } catch (error) {
      console.error('Error toggling recognition:', error);
    }
  };

  const updateRecognitionSettings = async (cameraId: string, settings: typeof recognitionSettings) => {
    try {
      if (isDemo) {
        // Demo mode - just update state
        setCameras(prev => prev.map(c => 
          c.cameraId === cameraId 
            ? { ...c, recognitionThreshold: settings.threshold }
            : c
        ));
      } else {
        // Real mode - call API to update settings
        const response = await fetch('/api/real-time/face-recognition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cameraId,
            venueId,
            action: 'start',
            recognitionThreshold: settings.threshold,
            frameRate: settings.frameRate
          })
        });

        if (response.ok) {
          setCameras(prev => prev.map(c => 
            c.cameraId === cameraId 
              ? { ...c, recognitionThreshold: settings.threshold }
              : c
          ));
        }
      }
    } catch (error) {
      console.error('Error updating recognition settings:', error);
    }
  };

  const getStreamHealthColor = (health: CameraFeed['streamHealth']) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'poor': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStreamHealthIcon = (health: CameraFeed['streamHealth']) => {
    return health === 'offline' ? WifiOff : Wifi;
  };

  const selectedCameraData = cameras.find(c => c.cameraId === selectedCamera);

  return (
    <div className="space-y-6">
      {/* Camera Grid Selector */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Live Camera Feeds</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {cameras.filter(c => c.isStreaming).length}/{cameras.length} active
            </span>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cameras.map((camera) => {
            const HealthIcon = getStreamHealthIcon(camera.streamHealth);
            return (
              <button
                key={camera.cameraId}
                onClick={() => handleCameraSelect(camera.cameraId)}
                className={`relative aspect-video rounded-lg border-2 transition-all duration-200 ${
                  selectedCamera === camera.cameraId 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${
                  camera.streamHealth === 'offline' ? 'bg-gray-100' : 'bg-gray-900'
                }`}
              >
                {/* Camera preview */}
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  {camera.isStreaming ? (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-gray-400" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Status indicators */}
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <HealthIcon className={`h-3 w-3 ${getStreamHealthColor(camera.streamHealth)}`} />
                  {camera.isRecognitionEnabled && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>

                {/* Camera info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 rounded-b-lg">
                  <p className="text-xs font-medium truncate">{camera.cameraName}</p>
                  <p className="text-xs text-gray-300">{camera.zone}</p>
                </div>

                {/* Recognition count badge */}
                {camera.isRecognitionEnabled && camera.recognitionCount > 0 && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {camera.recognitionCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Camera Feed */}
      {selectedCameraData && (
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
          <div className={`${isFullscreen ? 'h-full p-4' : ''}`}>
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedCameraData.streamHealth === 'excellent' ? 'bg-green-100' :
                    selectedCameraData.streamHealth === 'good' ? 'bg-blue-100' :
                    selectedCameraData.streamHealth === 'poor' ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    <Camera className={`h-5 w-5 ${getStreamHealthColor(selectedCameraData.streamHealth)}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedCameraData.cameraName}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedCameraData.zone} • {selectedCameraData.resolution} • {selectedCameraData.frameRate}fps
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Recognition toggle */}
                  <button
                    onClick={() => toggleRecognition(selectedCameraData.cameraId)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedCameraData.isRecognitionEnabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedCameraData.isRecognitionEnabled ? (
                      <>
                        <Pause className="h-4 w-4 mr-1 inline" />
                        Stop Recognition
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1 inline" />
                        Start Recognition
                      </>
                    )}
                  </button>

                  {/* Settings */}
                  <div className="relative group">
                    <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                      <Settings className="h-4 w-4" />
                    </button>
                    
                    {/* Settings dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <h4 className="font-medium text-gray-900 mb-3">Recognition Settings</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Confidence Threshold: {recognitionSettings.threshold}%
                          </label>
                          <input
                            type="range"
                            min="50"
                            max="99"
                            value={recognitionSettings.threshold}
                            onChange={(e) => {
                              const newSettings = { ...recognitionSettings, threshold: parseInt(e.target.value) };
                              setRecognitionSettings(newSettings);
                              updateRecognitionSettings(selectedCameraData.cameraId, newSettings);
                            }}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Frame Rate: {recognitionSettings.frameRate}fps
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={recognitionSettings.frameRate}
                            onChange={(e) => {
                              const newSettings = { ...recognitionSettings, frameRate: parseInt(e.target.value) };
                              setRecognitionSettings(newSettings);
                              updateRecognitionSettings(selectedCameraData.cameraId, newSettings);
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {isFullscreen && (
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Camera Feed */}
              <div className={`${isFullscreen ? 'h-[calc(100vh-200px)]' : 'aspect-video'}`}>
                {isDemo ? (
                  <DemoCameraFeed 
                    cameraId={selectedCameraData.cameraId}
                    cameraName={selectedCameraData.cameraName}
                    selectedZone={selectedZone}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Live Feed: {selectedCameraData.cameraName}</p>
                      <p className="text-sm opacity-75">Real camera feed would be displayed here</p>
                      {selectedCameraData.streamHealth === 'offline' && (
                        <div className="mt-4 flex items-center justify-center text-red-400">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          <span>Camera offline</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Statistics */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedCameraData.recognitionCount}</p>
                  <p className="text-sm text-gray-600">Recognitions Today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedCameraData.recognitionThreshold}%</p>
                  <p className="text-sm text-gray-600">Threshold</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${getStreamHealthColor(selectedCameraData.streamHealth)}`}>
                    {selectedCameraData.streamHealth.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600">Stream Health</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedCameraData.lastRecognition 
                      ? Math.floor((Date.now() - selectedCameraData.lastRecognition.getTime()) / 60000)
                      : '∞'
                    }m
                  </p>
                  <p className="text-sm text-gray-600">Last Recognition</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
