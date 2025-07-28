
"use client";

import { useState } from "react";
import { Camera, Users, Activity, Shield, Settings, Play, Pause } from "lucide-react";
import RealTimeTrackingDashboard from "@/components/tracking/real-time-tracking-dashboard";
import LiveCameraFeedManager from "@/components/tracking/live-camera-feed-manager";
import CameraHardwareManager from "@/components/tracking/camera-hardware-manager";

export default function CoreSafetyLoopPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cameras' | 'hardware'>('dashboard');
  const [isSystemActive, setIsSystemActive] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>('');

  // Demo venue ID - in real implementation this would come from session/context
  const venueId = 'demo-venue-1';
  const isDemo = true; // Set to false for real implementation

  const tabs = [
    {
      id: 'dashboard' as const,
      name: 'Live Tracking',
      icon: Activity,
      description: 'Real-time child tracking and zone monitoring'
    },
    {
      id: 'cameras' as const,
      name: 'Camera Feeds',
      icon: Camera,
      description: 'Live camera feeds with face recognition'
    },
    {
      id: 'hardware' as const,
      name: 'Hardware',
      icon: Settings,
      description: 'Camera hardware management and configuration'
    }
  ];

  const toggleSystem = () => {
    setIsSystemActive(!isSystemActive);
    // In real implementation, this would start/stop the Safety Monitoring system
  };

  return (
    <div className="min-h-full bg-tracking bg-overlay-readable">
      <div className="space-y-6 content-overlay">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="h-8 w-8 mr-3 text-blue-600" />
              Safety Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Real-time child safety monitoring with face recognition and live tracking
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* System Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isSystemActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                isSystemActive ? 'text-green-700' : 'text-red-700'
              }`}>
                {isSystemActive ? 'Safety Monitoring Active' : 'Safety Monitoring Stopped'}
              </span>
            </div>

            {/* System Toggle */}
            <button
              onClick={toggleSystem}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isSystemActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isSystemActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2 inline" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2 inline" />
                  Start Monitoring
                </>
              )}
            </button>
          </div>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Children Tracked</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
                <p className="text-xs text-green-600">+2 from yesterday</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Camera className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cameras Active</p>
                <p className="text-2xl font-bold text-gray-900">5/6</p>
                <p className="text-xs text-yellow-600">1 offline</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recognition Rate</p>
                <p className="text-2xl font-bold text-gray-900">94.2%</p>
                <p className="text-xs text-green-600">Excellent</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Shield className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Safety Score</p>
                <p className="text-2xl font-bold text-gray-900">98/100</p>
                <p className="text-xs text-green-600">Optimal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`mr-2 h-5 w-5 ${
                      activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs text-gray-500 font-normal">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {!isSystemActive && (
                <div className="card bg-yellow-50 border-yellow-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Shield className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Safety Monitoring Inactive
                      </h3>
                      <p className="text-sm text-yellow-700">
                        Real-time tracking is currently stopped. Click "Start Monitoring" to begin monitoring.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <RealTimeTrackingDashboard 
                venueId={venueId}
                isDemo={isDemo}
              />
            </div>
          )}

          {activeTab === 'cameras' && (
            <div className="space-y-6">
              {!isSystemActive && (
                <div className="card bg-yellow-50 border-yellow-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Camera className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Camera Recognition Inactive
                      </h3>
                      <p className="text-sm text-yellow-700">
                        Face recognition is currently stopped. Start the system to enable live recognition.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <LiveCameraFeedManager 
                venueId={venueId}
                isDemo={isDemo}
                selectedZone={selectedZone}
                onCameraSelect={(cameraId) => console.log('Camera selected:', cameraId)}
              />
            </div>
          )}

          {activeTab === 'hardware' && (
            <CameraHardwareManager 
              venueId={venueId}
              isDemo={isDemo}
            />
          )}
        </div>

        {/* System Performance Metrics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Recognition Accuracy</span>
                <span className="text-sm font-medium text-gray-900">94.2%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">System Uptime</span>
                <span className="text-sm font-medium text-gray-900">99.8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '99.8%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-medium text-gray-900">&lt; 2s</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Mode Notice */}
        {isDemo && (
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Play className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Demo Mode Active
                </h3>
                <p className="text-sm text-blue-700">
                  You're viewing a demonstration of the Safety Dashboard. In production, this would connect to real cameras and process live video feeds.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
