
"use client";

import { useState } from "react";
import { 
  Camera, 
  Activity, 
  MapPin, 
  AlertTriangle, 
  Users, 
  Eye,
  Monitor,
  Shield
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DemoCameraFeed from "@/components/venue/demo-camera-feed";
import DemoActivityDashboard from "@/components/venue/demo-activity-dashboard";
import DemoZoneMap from "@/components/venue/demo-zone-map";
import DemoAlertSystem from "@/components/venue/demo-alert-system";

export default function VenueAdminDemoPage() {
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedCamera, setSelectedCamera] = useState<string>('Main Entrance Camera');

  const cameras = [
    'Main Entrance Camera',
    'Play Area A Camera', 
    'Play Area B Camera',
    'Climbing Zone Camera',
    'Ball Pit Camera',
    'Toddler Area Camera',
    'Exit Zone Camera',
    'Overview Camera'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">mySafePlay™ Demo Center</h1>
        <p className="text-gray-600 mt-2">
          Interactive demonstration of venue safety monitoring capabilities using simulated data and generic avatars
        </p>
        <div className="flex items-center space-x-4 mt-3">
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span>LIVE DEMO ACTIVE</span>
          </div>
          <div className="text-sm text-gray-500">
            All data shown is simulated for demonstration purposes
          </div>
        </div>
      </div>

      {/* Demo Navigation Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="cameras" className="flex items-center space-x-2">
            <Camera className="h-4 w-4" />
            <span>Camera Feeds</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Live Activity</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Zone Map</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Alert System</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demo Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Live Venue Statistics</span>
                </CardTitle>
                <CardDescription>
                  Real-time monitoring data from demo venue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">23</p>
                    <p className="text-sm text-gray-600">Children Present</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">8/8</p>
                    <p className="text-sm text-gray-600">Cameras Online</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">125</p>
                    <p className="text-sm text-gray-600">Avg Stay (min)</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">97%</p>
                    <p className="text-sm text-gray-600">Detection Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Camera Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5 text-green-600" />
                  <span>Featured Camera Feed</span>
                </CardTitle>
                <CardDescription>
                  Live detection with generic avatar overlays
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DemoCameraFeed 
                  cameraId="demo-1" 
                  cameraName="Play Area A Camera"
                  selectedZone={selectedZone}
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <span>Recent Activity Preview</span>
              </CardTitle>
              <CardDescription>
                Latest detection events and zone movements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DemoActivityDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Camera Feeds Tab */}
        <TabsContent value="cameras" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Camera Feed Simulation</CardTitle>
              <CardDescription>
                Realistic camera feeds showing biometric detection with privacy-safe avatars
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Camera Feed:
                </label>
                <select 
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="input-field max-w-xs"
                >
                  {cameras.map((camera) => (
                    <option key={camera} value={camera}>
                      {camera}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <DemoCameraFeed 
                  cameraId="demo-main" 
                  cameraName={selectedCamera}
                  selectedZone={selectedZone}
                />
                <DemoCameraFeed 
                  cameraId="demo-secondary" 
                  cameraName={cameras[Math.floor(Math.random() * cameras.length)]}
                  selectedZone={selectedZone}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Activity Dashboard</CardTitle>
              <CardDescription>
                Live monitoring of child movements, zone occupancy, and biometric activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DemoActivityDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zone Map Tab */}
        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Venue Zone Map</CardTitle>
              <CardDescription>
                Visual representation of venue layout with real-time child positions and camera coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DemoZoneMap 
                selectedZone={selectedZone}
                onZoneSelect={setSelectedZone}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alert Management System</CardTitle>
              <CardDescription>
                Demonstration of safety alerts, emergency notifications, and response protocols
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DemoAlertSystem />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo Features Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Demo System Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Camera className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Live Camera Simulation</h4>
              <p className="text-sm text-gray-600 mt-1">Real-time detection overlays with generic avatars</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold text-gray-900">Zone Tracking</h4>
              <p className="text-sm text-gray-600 mt-1">Interactive venue map with live occupancy data</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <h4 className="font-semibold text-gray-900">Smart Alerts</h4>
              <p className="text-sm text-gray-600 mt-1">Automated safety notifications and emergency protocols</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Activity Analytics</h4>
              <p className="text-sm text-gray-600 mt-1">Real-time monitoring dashboard with insights</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>Privacy Note:</strong> This demonstration uses generic avatars and silhouettes to represent detected individuals. 
              In a real implementation, the system would use actual biometric data while maintaining strict privacy and security protocols 
              in compliance with all applicable regulations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
