
"use client";

import { useEffect, useState } from "react";
import { Eye, Users, AlertTriangle, Camera, MapPin, Clock } from "lucide-react";

export default function LiveTrackingPage() {
  const [activeChildren, setActiveChildren] = useState([
    {
      id: 1,
      name: "Emma Johnson",
      age: 7,
      checkInTime: "2:30 PM",
      currentZone: "Play Area A",
      lastSeen: "2 minutes ago",
      confidence: 98,
      alertLevel: "green"
    },
    {
      id: 2,
      name: "Michael Chen",
      age: 6,
      checkInTime: "1:45 PM",
      currentZone: "Climbing Zone",
      lastSeen: "30 seconds ago",
      confidence: 95,
      alertLevel: "green"
    },
    {
      id: 3,
      name: "Sofia Martinez",
      age: 8,
      checkInTime: "3:15 PM",
      currentZone: "Near Exit",
      lastSeen: "1 minute ago",
      confidence: 89,
      alertLevel: "yellow"
    },
    {
      id: 4,
      name: "Lucas Anderson",
      age: 5,
      checkInTime: "2:00 PM",
      currentZone: "Ball Pit",
      lastSeen: "45 seconds ago",
      confidence: 96,
      alertLevel: "green"
    }
  ]);

  const [cameras, setCameras] = useState([
    { id: 1, name: "Main Entrance", status: "online", zone: "Entrance" },
    { id: 2, name: "Play Area A", status: "online", zone: "Play Area A" },
    { id: 3, name: "Climbing Zone", status: "online", zone: "Climbing Zone" },
    { id: 4, name: "Ball Pit", status: "online", zone: "Ball Pit" },
    { id: 5, name: "Exit Monitor", status: "offline", zone: "Exit" },
    { id: 6, name: "Restroom Area", status: "online", zone: "Restroom" }
  ]);

  const [selectedCamera, setSelectedCamera] = useState(1);

  return (
    <div className="min-h-full bg-tracking bg-overlay-light">
      <div className="space-y-6 content-overlay">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
        <p className="text-gray-600 mt-2">
          Real-time monitoring of children and camera feeds
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Children Present</p>
              <p className="text-2xl font-bold text-gray-900">{activeChildren.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Camera className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Cameras Online</p>
              <p className="text-2xl font-bold text-gray-900">
                {cameras.filter(c => c.status === "online").length}/{cameras.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Attention Needed</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeChildren.filter(c => c.alertLevel === "yellow").length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(activeChildren.reduce((sum, c) => sum + c.confidence, 0) / activeChildren.length)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tracking Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Camera Feed</h2>
            <select 
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(parseInt(e.target.value))}
              className="input-field"
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.name} ({camera.status})
                </option>
              ))}
            </select>
          </div>
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Live Feed: {cameras.find(c => c.id === selectedCamera)?.name}</p>
              <p className="text-sm opacity-75">Camera feed would be displayed here</p>
            </div>
          </div>
          
          {/* Camera Grid */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {cameras.map((camera) => (
              <button
                key={camera.id}
                onClick={() => setSelectedCamera(camera.id)}
                className={`aspect-video bg-gray-200 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                  selectedCamera === camera.id ? 'ring-2 ring-blue-500' : ''
                } ${camera.status === 'offline' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-300'}`}
              >
                <div className="text-center">
                  <Camera className="h-4 w-4 mx-auto mb-1" />
                  <p>{camera.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Children */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Children</h2>
          <div className="space-y-3">
            {activeChildren.map((child) => (
              <div key={child.id} className={`p-3 rounded-lg border-2 ${
                child.alertLevel === 'yellow' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{child.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${
                    child.alertLevel === 'green' ? 'bg-green-500' : 
                    child.alertLevel === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{child.currentZone}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>In: {child.checkInTime}</span>
                  </div>
                  <div className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    <span>Seen: {child.lastSeen}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Confidence: {child.confidence}%</span>
                    {child.alertLevel === 'yellow' && (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone Map */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Venue Layout</h2>
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg font-medium">Interactive Venue Map</p>
            <p className="text-sm">Real-time child positions would be displayed here</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
