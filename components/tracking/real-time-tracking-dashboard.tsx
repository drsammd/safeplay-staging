
"use client";

import { useEffect, useState } from "react";
import { Users, Eye, MapPin, Clock, Camera, AlertTriangle, Activity, Wifi, WifiOff } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface ChildLocation {
  childId: string;
  childName: string;
  zone: string;
  coordinates: { x: number; y: number };
  confidence: number;
  lastSeen: Date;
  status: 'present' | 'departed' | 'unknown';
  cameraId?: string;
  alertLevel: 'green' | 'yellow' | 'red';
}

interface ZoneOccupancy {
  zoneId: string;
  zoneName: string;
  currentOccupancy: number;
  maxCapacity: number;
  utilizationRate: number;
  children: string[];
  alerts: string[];
  lastUpdated: Date;
}

interface VenueTrackingStatus {
  venueId: string;
  totalChildren: number;
  activeChildren: number;
  totalZones: number;
  alerts: number;
  averageConfidence: number;
  lastUpdated: Date;
  zones: ZoneOccupancy[];
  children: ChildLocation[];
}

interface RealTimeTrackingDashboardProps {
  venueId: string;
  isDemo?: boolean;
}

export default function RealTimeTrackingDashboard({ venueId, isDemo = false }: RealTimeTrackingDashboardProps) {
  const { data: session } = useSession();
  const [trackingData, setTrackingData] = useState<VenueTrackingStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initialize tracking and establish real-time connection
  useEffect(() => {
    initializeTracking();
    
    if (!isDemo) {
      connectWebSocket();
    } else {
      startDemoSimulation();
    }

    return () => {
      // Cleanup WebSocket connection
    };
  }, [venueId, isDemo]);

  const initializeTracking = async () => {
    try {
      const response = await fetch(`/api/live-tracking?venueId=${venueId}`);
      const result = await response.json();
      
      if (result.success) {
        setTrackingData(result.data);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error initializing tracking:', error);
      setIsConnected(false);
    }
  };

  const connectWebSocket = () => {
    // WebSocket connection for real-time updates
    // This would connect to the WebSocket service
    console.log('Connecting to WebSocket for real-time tracking...');
    setIsConnected(true);
  };

  const startDemoSimulation = () => {
    // Demo data simulation
    const demoData: VenueTrackingStatus = {
      venueId,
      totalChildren: 12,
      activeChildren: 8,
      totalZones: 6,
      alerts: 1,
      averageConfidence: 94.2,
      lastUpdated: new Date(),
      zones: [
        {
          zoneId: 'zone-1',
          zoneName: 'Play Area A',
          currentOccupancy: 3,
          maxCapacity: 8,
          utilizationRate: 0.375,
          children: ['child-1', 'child-2', 'child-3'],
          alerts: [],
          lastUpdated: new Date()
        },
        {
          zoneId: 'zone-2',
          zoneName: 'Climbing Zone',
          currentOccupancy: 2,
          maxCapacity: 6,
          utilizationRate: 0.33,
          children: ['child-4', 'child-5'],
          alerts: [],
          lastUpdated: new Date()
        },
        {
          zoneId: 'zone-3',
          zoneName: 'Ball Pit',
          currentOccupancy: 2,
          maxCapacity: 10,
          utilizationRate: 0.2,
          children: ['child-6', 'child-7'],
          alerts: [],
          lastUpdated: new Date()
        },
        {
          zoneId: 'zone-4',
          zoneName: 'Exit Zone',
          currentOccupancy: 1,
          maxCapacity: 4,
          utilizationRate: 0.25,
          children: ['child-8'],
          alerts: ['Child near exit'],
          lastUpdated: new Date()
        }
      ],
      children: [
        {
          childId: 'child-1',
          childName: 'Emma Johnson',
          zone: 'Play Area A',
          coordinates: { x: 120, y: 80 },
          confidence: 0.96,
          lastSeen: new Date(Date.now() - 30000),
          status: 'present',
          cameraId: 'camera-1',
          alertLevel: 'green'
        },
        {
          childId: 'child-2',
          childName: 'Michael Chen',
          zone: 'Play Area A',
          coordinates: { x: 180, y: 120 },
          confidence: 0.94,
          lastSeen: new Date(Date.now() - 45000),
          status: 'present',
          cameraId: 'camera-1',
          alertLevel: 'green'
        },
        {
          childId: 'child-3',
          childName: 'Sofia Martinez',
          zone: 'Exit Zone',
          coordinates: { x: 450, y: 250 },
          confidence: 0.89,
          lastSeen: new Date(Date.now() - 60000),
          status: 'present',
          cameraId: 'camera-4',
          alertLevel: 'yellow'
        },
        {
          childId: 'child-4',
          childName: 'Marcus Thompson',
          zone: 'Climbing Zone',
          coordinates: { x: 320, y: 150 },
          confidence: 0.97,
          lastSeen: new Date(Date.now() - 20000),
          status: 'present',
          cameraId: 'camera-2',
          alertLevel: 'green'
        },
        {
          childId: 'child-5',
          childName: 'Aria Kim',
          zone: 'Ball Pit',
          coordinates: { x: 280, y: 200 },
          confidence: 0.93,
          lastSeen: new Date(Date.now() - 90000),
          status: 'present',
          cameraId: 'camera-3',
          alertLevel: 'green'
        },
        {
          childId: 'child-6',
          childName: 'Diego Rodriguez',
          zone: 'Climbing Zone',
          coordinates: { x: 340, y: 130 },
          confidence: 0.91,
          lastSeen: new Date(Date.now() - 120000),
          status: 'present',
          cameraId: 'camera-2',
          alertLevel: 'green'
        },
        {
          childId: 'child-7',
          childName: 'Zoe Williams',
          zone: 'Ball Pit',
          coordinates: { x: 260, y: 220 },
          confidence: 0.95,
          lastSeen: new Date(Date.now() - 75000),
          status: 'present',
          cameraId: 'camera-3',
          alertLevel: 'green'
        },
        {
          childId: 'child-8',
          childName: 'Noah Davis',
          zone: 'Play Area A',
          coordinates: { x: 140, y: 100 },
          confidence: 0.98,
          lastSeen: new Date(Date.now() - 15000),
          status: 'present',
          cameraId: 'camera-1',
          alertLevel: 'green'
        }
      ]
    };

    setTrackingData(demoData);
    setIsConnected(true);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setTrackingData(prev => {
        if (!prev) return null;
        
        // Simulate random movements and updates
        const updatedChildren = prev.children.map(child => ({
          ...child,
          coordinates: {
            x: Math.max(20, Math.min(480, child.coordinates.x + (Math.random() - 0.5) * 40)),
            y: Math.max(20, Math.min(280, child.coordinates.y + (Math.random() - 0.5) * 30))
          },
          confidence: Math.max(0.8, Math.min(0.99, child.confidence + (Math.random() - 0.5) * 0.1)),
          lastSeen: Math.random() > 0.7 ? new Date() : child.lastSeen
        }));

        return {
          ...prev,
          children: updatedChildren,
          lastUpdated: new Date()
        };
      });
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getAlertLevelColor = (level: 'green' | 'yellow' | 'red') => {
    switch (level) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!trackingData) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Activity className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Initializing real-time tracking...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status & Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(lastUpdate)}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Active Children</p>
              <p className="text-lg font-bold text-gray-900">{trackingData.activeChildren}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Zones</p>
              <p className="text-lg font-bold text-gray-900">{trackingData.totalZones}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Alerts</p>
              <p className="text-lg font-bold text-gray-900">{trackingData.alerts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="h-4 w-4 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Avg Confidence</p>
              <p className="text-lg font-bold text-gray-900">{trackingData.averageConfidence.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tracking Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Venue Map */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Venue Map</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">LIVE</span>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
            {/* Zone overlay */}
            <div className="absolute inset-0">
              {/* Play Area A */}
              <div 
                className={`absolute bg-blue-200 bg-opacity-50 border-2 border-blue-400 rounded-lg ${
                  selectedZone === 'Play Area A' ? 'ring-2 ring-blue-600' : ''
                }`}
                style={{ left: '10%', top: '15%', width: '35%', height: '40%' }}
                onClick={() => setSelectedZone(selectedZone === 'Play Area A' ? null : 'Play Area A')}
              >
                <span className="absolute -top-6 left-0 text-xs font-medium text-blue-700">
                  Play Area A ({trackingData.zones.find(z => z.zoneName === 'Play Area A')?.currentOccupancy || 0})
                </span>
              </div>

              {/* Climbing Zone */}
              <div 
                className={`absolute bg-green-200 bg-opacity-50 border-2 border-green-400 rounded-lg ${
                  selectedZone === 'Climbing Zone' ? 'ring-2 ring-green-600' : ''
                }`}
                style={{ left: '55%', top: '15%', width: '30%', height: '35%' }}
                onClick={() => setSelectedZone(selectedZone === 'Climbing Zone' ? null : 'Climbing Zone')}
              >
                <span className="absolute -top-6 left-0 text-xs font-medium text-green-700">
                  Climbing Zone ({trackingData.zones.find(z => z.zoneName === 'Climbing Zone')?.currentOccupancy || 0})
                </span>
              </div>

              {/* Ball Pit */}
              <div 
                className={`absolute bg-purple-200 bg-opacity-50 border-2 border-purple-400 rounded-lg ${
                  selectedZone === 'Ball Pit' ? 'ring-2 ring-purple-600' : ''
                }`}
                style={{ left: '10%', top: '60%', width: '40%', height: '30%' }}
                onClick={() => setSelectedZone(selectedZone === 'Ball Pit' ? null : 'Ball Pit')}
              >
                <span className="absolute -top-6 left-0 text-xs font-medium text-purple-700">
                  Ball Pit ({trackingData.zones.find(z => z.zoneName === 'Ball Pit')?.currentOccupancy || 0})
                </span>
              </div>

              {/* Exit Zone */}
              <div 
                className={`absolute bg-yellow-200 bg-opacity-50 border-2 border-yellow-400 rounded-lg ${
                  selectedZone === 'Exit Zone' ? 'ring-2 ring-yellow-600' : ''
                }`}
                style={{ left: '65%', top: '65%', width: '25%', height: '25%' }}
                onClick={() => setSelectedZone(selectedZone === 'Exit Zone' ? null : 'Exit Zone')}
              >
                <span className="absolute -top-6 left-0 text-xs font-medium text-yellow-700">
                  Exit Zone ({trackingData.zones.find(z => z.zoneName === 'Exit Zone')?.currentOccupancy || 0})
                </span>
              </div>
            </div>

            {/* Child positions */}
            {trackingData.children
              .filter(child => !selectedZone || child.zone === selectedZone)
              .map((child) => (
                <div
                  key={child.childId}
                  className={`absolute transition-all duration-1000 ease-in-out cursor-pointer ${
                    selectedChild === child.childId ? 'z-20' : 'z-10'
                  }`}
                  style={{
                    left: `${child.coordinates.x}px`,
                    top: `${child.coordinates.y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={() => setSelectedChild(selectedChild === child.childId ? null : child.childId)}
                >
                  {/* Detection indicator */}
                  <div className={`absolute -inset-6 border-2 rounded-full ${
                    child.alertLevel === 'yellow' ? 'border-yellow-400 bg-yellow-400' : 
                    child.alertLevel === 'red' ? 'border-red-400 bg-red-400' : 
                    'border-green-400 bg-green-400'
                  } bg-opacity-20 animate-pulse`}>
                    {/* Confidence score */}
                    <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-1 py-0.5 rounded text-xs font-medium ${
                      child.alertLevel === 'yellow' ? 'bg-yellow-400 text-yellow-900' :
                      child.alertLevel === 'red' ? 'bg-red-400 text-red-900' :
                      'bg-green-400 text-green-900'
                    }`}>
                      {Math.round(child.confidence * 100)}%
                    </div>
                  </div>

                  {/* Child indicator */}
                  <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg ${getAlertLevelColor(child.alertLevel)} flex items-center justify-center`}>
                    <Users className="h-4 w-4 text-white" />
                  </div>

                  {/* Child info popup */}
                  {selectedChild === child.childId && (
                    <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-3 min-w-48 z-30">
                      <h4 className="font-medium text-gray-900">{child.childName}</h4>
                      <div className="text-sm text-gray-600 space-y-1 mt-1">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{child.zone}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Seen {formatTimeAgo(child.lastSeen)}</span>
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          <span>{Math.round(child.confidence * 100)}% confidence</span>
                        </div>
                        {child.cameraId && (
                          <div className="flex items-center">
                            <Camera className="h-3 w-3 mr-1" />
                            <span>Camera {child.cameraId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Children List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Children</h3>
            <span className="text-sm text-gray-500">{trackingData.activeChildren} present</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {trackingData.children.map((child) => (
              <div 
                key={child.childId} 
                className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                  selectedChild === child.childId ? 'border-blue-300 bg-blue-50' :
                  child.alertLevel === 'yellow' ? 'border-yellow-200 bg-yellow-50' : 
                  child.alertLevel === 'red' ? 'border-red-200 bg-red-50' :
                  'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedChild(selectedChild === child.childId ? null : child.childId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{child.childName}</h4>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getAlertLevelColor(child.alertLevel)}`}></div>
                    {child.alertLevel === 'yellow' && (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{child.zone}</span>
                    </div>
                    <span className="text-xs">{Math.round(child.confidence * 100)}%</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Last seen {formatTimeAgo(child.lastSeen)}</span>
                  </div>
                  
                  {child.cameraId && (
                    <div className="flex items-center">
                      <Camera className="h-3 w-3 mr-1" />
                      <span>Camera {child.cameraId}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone Occupancy Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone Occupancy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trackingData.zones.map((zone) => (
            <div 
              key={zone.zoneId}
              className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                selectedZone === zone.zoneName ? 'border-blue-300 bg-blue-50' :
                zone.alerts.length > 0 ? 'border-yellow-300 bg-yellow-50' :
                'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedZone(selectedZone === zone.zoneName ? null : zone.zoneName)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{zone.zoneName}</h4>
                {zone.alerts.length > 0 && (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Occupancy</span>
                  <span className="font-medium">{zone.currentOccupancy}/{zone.maxCapacity}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      zone.utilizationRate > 0.8 ? 'bg-red-500' :
                      zone.utilizationRate > 0.6 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${zone.utilizationRate * 100}%` }}
                  ></div>
                </div>
                
                <div className="text-xs text-gray-500">
                  {Math.round(zone.utilizationRate * 100)}% capacity
                </div>
                
                {zone.alerts.length > 0 && (
                  <div className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                    {zone.alerts[0]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
