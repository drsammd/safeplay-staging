
"use client";

import { useEffect, useState } from "react";
import { Camera, Wifi, WifiOff, Settings, Play, Pause, TestTube, Calibrate, Download, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface CameraDriver {
  name: string;
  version: string;
  manufacturer: string;
  supportedModels: string[];
  driverPath: string;
  configSchema: any;
  isInstalled: boolean;
}

interface CameraDiscoveryResult {
  ipAddress: string;
  port: number;
  manufacturer: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  capabilities: string[];
  streamUrls: {
    rtsp?: string;
    http?: string;
    webrtc?: string;
  };
  authentication: {
    username?: string;
    password?: string;
    token?: string;
  };
}

interface CameraConnectionStatus {
  cameraId: string;
  isConnected: boolean;
  isStreaming: boolean;
  streamHealth: 'excellent' | 'good' | 'poor' | 'offline';
  latency: number;
  frameRate: number;
  resolution: string;
  lastHeartbeat: Date;
  errorCount: number;
  lastError?: string;
}

interface CameraHardwareManagerProps {
  venueId: string;
  isDemo?: boolean;
}

export default function CameraHardwareManager({ venueId, isDemo = false }: CameraHardwareManagerProps) {
  const [drivers, setDrivers] = useState<CameraDriver[]>([]);
  const [discoveredCameras, setDiscoveredCameras] = useState<CameraDiscoveryResult[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<CameraConnectionStatus[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    ipAddress: '',
    port: 554,
    username: '',
    password: '',
    driverName: 'Generic RTSP'
  });
  const [testResults, setTestResults] = useState<any>(null);
  const [isCalibrating, setIsCalibrating] = useState<string | null>(null);

  useEffect(() => {
    loadHardwareData();
  }, [venueId]);

  const loadHardwareData = async () => {
    try {
      if (isDemo) {
        loadDemoData();
      } else {
        const response = await fetch('/api/camera-hardware');
        const result = await response.json();
        
        if (result.success) {
          setDrivers(result.data.drivers || []);
          setDiscoveredCameras(result.data.discoveredCameras || []);
          setConnectionStatuses(result.data.statuses || []);
        }
      }
    } catch (error) {
      console.error('Error loading hardware data:', error);
    }
  };

  const loadDemoData = () => {
    const demoDrivers: CameraDriver[] = [
      {
        name: 'Generic RTSP',
        version: '1.0.0',
        manufacturer: 'Generic',
        supportedModels: ['Any RTSP Camera'],
        driverPath: '/drivers/generic-rtsp',
        configSchema: {},
        isInstalled: true
      },
      {
        name: 'Hikvision DS Series',
        version: '2.1.0',
        manufacturer: 'Hikvision',
        supportedModels: ['DS-2CD2xxx', 'DS-2CD3xxx'],
        driverPath: '/drivers/hikvision-ds',
        configSchema: {},
        isInstalled: true
      },
      {
        name: 'Axis Communications',
        version: '1.8.0',
        manufacturer: 'Axis',
        supportedModels: ['M-Series', 'P-Series'],
        driverPath: '/drivers/axis-comm',
        configSchema: {},
        isInstalled: true
      }
    ];

    const demoDiscovered: CameraDiscoveryResult[] = [
      {
        ipAddress: '192.168.1.100',
        port: 554,
        manufacturer: 'Hikvision',
        model: 'DS-2CD2385FWD-I',
        serialNumber: 'DS-2CD2385FWD-I20200123CCWR',
        firmwareVersion: 'V5.6.3',
        capabilities: ['H.264', 'H.265', 'Motion Detection', 'Audio'],
        streamUrls: {
          rtsp: 'rtsp://192.168.1.100:554/Streaming/Channels/101',
          http: 'https://i.pinimg.com/736x/e5/af/76/e5af76b0a8e06ca489a7d9532ac9e763.jpg'
        },
        authentication: { username: 'admin', password: '' }
      },
      {
        ipAddress: '192.168.1.101',
        port: 80,
        manufacturer: 'Axis',
        model: 'M3046-V',
        serialNumber: 'ACCC8E123456',
        firmwareVersion: '10.12.0',
        capabilities: ['H.264', 'MJPEG', 'PTZ', 'Audio'],
        streamUrls: {
          rtsp: 'rtsp://192.168.1.101/axis-media/media.amp',
          http: 'https://www.cctvcamerapros.com/v/IP-cameras.jpg'
        },
        authentication: { username: 'root', password: '' }
      }
    ];

    const demoStatuses: CameraConnectionStatus[] = [
      {
        cameraId: 'camera-1',
        isConnected: true,
        isStreaming: true,
        streamHealth: 'excellent',
        latency: 45,
        frameRate: 30,
        resolution: '1920x1080',
        lastHeartbeat: new Date(),
        errorCount: 0
      },
      {
        cameraId: 'camera-2',
        isConnected: true,
        isStreaming: true,
        streamHealth: 'good',
        latency: 85,
        frameRate: 25,
        resolution: '1920x1080',
        lastHeartbeat: new Date(),
        errorCount: 1
      },
      {
        cameraId: 'camera-3',
        isConnected: false,
        isStreaming: false,
        streamHealth: 'offline',
        latency: 0,
        frameRate: 0,
        resolution: '',
        lastHeartbeat: new Date(Date.now() - 300000),
        errorCount: 5,
        lastError: 'Connection timeout'
      }
    ];

    setDrivers(demoDrivers);
    setDiscoveredCameras(demoDiscovered);
    setConnectionStatuses(demoStatuses);
  };

  const scanForCameras = async () => {
    setIsScanning(true);
    try {
      if (isDemo) {
        // Simulate scanning
        await new Promise(resolve => setTimeout(resolve, 3000));
        loadDemoData();
      } else {
        const response = await fetch('/api/camera-hardware?action=discovered');
        const result = await response.json();
        
        if (result.success) {
          setDiscoveredCameras(result.discoveredCameras);
        }
      }
    } catch (error) {
      console.error('Error scanning for cameras:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const testConnection = async () => {
    try {
      setTestResults({ status: 'testing' });
      
      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTestResults({
          status: 'success',
          connection: 'OK',
          authentication: 'OK',
          streamAvailable: true,
          resolution: '1920x1080',
          frameRate: 30,
          latency: 65
        });
      } else {
        const response = await fetch('/api/camera-hardware', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'test',
            connectionConfig: connectionForm
          })
        });
        
        const result = await response.json();
        setTestResults(result);
      }
    } catch (error) {
      setTestResults({
        status: 'error',
        error: error instanceof Error ? error.message : 'Test failed'
      });
    }
  };

  const connectCamera = async (camera: CameraDiscoveryResult) => {
    try {
      if (isDemo) {
        // Simulate connection
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const newStatus: CameraConnectionStatus = {
          cameraId: `camera-${Date.now()}`,
          isConnected: true,
          isStreaming: true,
          streamHealth: 'good',
          latency: 50 + Math.random() * 50,
          frameRate: 25 + Math.random() * 5,
          resolution: '1920x1080',
          lastHeartbeat: new Date(),
          errorCount: 0
        };
        
        setConnectionStatuses(prev => [...prev, newStatus]);
      } else {
        const response = await fetch('/api/camera-hardware', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'connect',
            cameraId: `discovered-${camera.ipAddress}`,
            connectionConfig: {
              ipAddress: camera.ipAddress,
              port: camera.port,
              username: camera.authentication.username,
              password: camera.authentication.password,
              streamUrl: camera.streamUrls.rtsp
            }
          })
        });
        
        if (response.ok) {
          loadHardwareData();
        }
      }
    } catch (error) {
      console.error('Error connecting camera:', error);
    }
  };

  const disconnectCamera = async (cameraId: string) => {
    try {
      if (isDemo) {
        setConnectionStatuses(prev => prev.filter(status => status.cameraId !== cameraId));
      } else {
        const response = await fetch('/api/camera-hardware', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'disconnect',
            cameraId
          })
        });
        
        if (response.ok) {
          loadHardwareData();
        }
      }
    } catch (error) {
      console.error('Error disconnecting camera:', error);
    }
  };

  const calibrateCamera = async (cameraId: string) => {
    setIsCalibrating(cameraId);
    try {
      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Demo calibration completed
      } else {
        const response = await fetch('/api/camera-hardware', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'calibrate',
            cameraId
          })
        });
        
        if (!response.ok) {
          throw new Error('Calibration failed');
        }
      }
    } catch (error) {
      console.error('Error calibrating camera:', error);
    } finally {
      setIsCalibrating(null);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'poor': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Camera Hardware Manager</h2>
          <p className="text-gray-600">Discover, connect, and manage camera hardware</p>
        </div>
        <button
          onClick={scanForCameras}
          disabled={isScanning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isScanning ? (
            <>
              <Clock className="h-4 w-4 mr-2 inline animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2 inline" />
              Scan Network
            </>
          )}
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Camera className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Connected</p>
              <p className="text-xl font-bold text-gray-900">
                {connectionStatuses.filter(s => s.isConnected).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wifi className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Streaming</p>
              <p className="text-xl font-bold text-gray-900">
                {connectionStatuses.filter(s => s.isStreaming).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Discovered</p>
              <p className="text-xl font-bold text-gray-900">{discoveredCameras.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Download className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Drivers</p>
              <p className="text-xl font-bold text-gray-900">{drivers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected Cameras */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Cameras</h3>
          
          {connectionStatuses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cameras connected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectionStatuses.map((status) => (
                <div key={status.cameraId} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        status.isConnected ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {status.isConnected ? (
                          <Wifi className="h-4 w-4 text-green-600" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Camera {status.cameraId}</h4>
                        <p className="text-sm text-gray-500">{status.resolution}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => calibrateCamera(status.cameraId)}
                        disabled={isCalibrating === status.cameraId}
                        className="p-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                        title="Calibrate Camera"
                      >
                        {isCalibrating === status.cameraId ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => disconnectCamera(status.cameraId)}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors"
                        title="Disconnect Camera"
                      >
                        <WifiOff className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(status.streamHealth)}`}>
                        {status.streamHealth}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Frame Rate</p>
                      <p className="font-medium">{status.frameRate}fps</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Latency</p>
                      <p className="font-medium">{status.latency}ms</p>
                    </div>
                  </div>

                  {status.lastError && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {status.lastError}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discovered Cameras */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Discovered Cameras</h3>
          
          {discoveredCameras.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cameras discovered</p>
              <button
                onClick={scanForCameras}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Scanning
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {discoveredCameras.map((camera, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {camera.manufacturer} {camera.model}
                      </h4>
                      <p className="text-sm text-gray-500">{camera.ipAddress}:{camera.port}</p>
                    </div>
                    
                    <button
                      onClick={() => connectCamera(camera)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Connect
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Serial Number</p>
                      <p className="font-mono text-xs">{camera.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Firmware</p>
                      <p className="font-medium">{camera.firmwareVersion}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-gray-500 text-sm mb-2">Capabilities</p>
                    <div className="flex flex-wrap gap-1">
                      {camera.capabilities.map((capability, capIndex) => (
                        <span
                          key={capIndex}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Connection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Camera Connection</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IP Address
              </label>
              <input
                type="text"
                value={connectionForm.ipAddress}
                onChange={(e) => setConnectionForm(prev => ({ ...prev, ipAddress: e.target.value }))}
                className="input-field"
                placeholder="192.168.1.100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port
              </label>
              <input
                type="number"
                value={connectionForm.port}
                onChange={(e) => setConnectionForm(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                className="input-field"
                placeholder="554"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={connectionForm.username}
                onChange={(e) => setConnectionForm(prev => ({ ...prev, username: e.target.value }))}
                className="input-field"
                placeholder="admin"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={connectionForm.password}
                onChange={(e) => setConnectionForm(prev => ({ ...prev, password: e.target.value }))}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver
              </label>
              <select
                value={connectionForm.driverName}
                onChange={(e) => setConnectionForm(prev => ({ ...prev, driverName: e.target.value }))}
                className="input-field"
              >
                {drivers.map((driver) => (
                  <option key={driver.name} value={driver.name}>
                    {driver.manufacturer} - {driver.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={testConnection}
              disabled={!connectionForm.ipAddress}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <TestTube className="h-4 w-4 mr-2 inline" />
              Test Connection
            </button>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Test Results</h4>
            
            {!testResults ? (
              <div className="text-center py-8 text-gray-500">
                <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click "Test Connection" to verify camera settings</p>
              </div>
            ) : testResults.status === 'testing' ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-spin" />
                <p className="text-blue-600">Testing connection...</p>
              </div>
            ) : testResults.status === 'success' || testResults.success ? (
              <div className="space-y-3">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Connection Successful</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Connection</p>
                    <p className="font-medium text-green-600">OK</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Authentication</p>
                    <p className="font-medium text-green-600">OK</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Resolution</p>
                    <p className="font-medium">{testResults.details?.resolution || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Latency</p>
                    <p className="font-medium">{testResults.details?.latency || 'N/A'}ms</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center text-red-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Connection Failed</span>
                </div>
                
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {testResults.message || testResults.error || 'Unknown error'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Drivers */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Drivers</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver) => (
            <div key={driver.name} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{driver.name}</h4>
                {driver.isInstalled ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Download className="h-5 w-5 text-gray-400" />
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500">Manufacturer</p>
                  <p className="font-medium">{driver.manufacturer}</p>
                </div>
                <div>
                  <p className="text-gray-500">Version</p>
                  <p className="font-medium">{driver.version}</p>
                </div>
                <div>
                  <p className="text-gray-500">Supported Models</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {driver.supportedModels.slice(0, 2).map((model, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {model}
                      </span>
                    ))}
                    {driver.supportedModels.length > 2 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{driver.supportedModels.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
