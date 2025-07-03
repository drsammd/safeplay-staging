
"use client";

import { useEffect, useState } from "react";
import { Camera, Users, AlertTriangle, Activity, Eye, MapPin } from "lucide-react";
import Image from "next/image";

interface DemoChild {
  id: string;
  name: string;
  avatar: string;
  position: { x: number; y: number };
  confidence: number;
  lastSeen: string;
  zone: string;
  alertLevel: 'green' | 'yellow' | 'red';
}

interface CameraFeedProps {
  cameraId: string;
  cameraName: string;
  selectedZone?: string;
}

export default function DemoCameraFeed({ cameraId, cameraName, selectedZone }: CameraFeedProps) {
  const [detectedChildren, setDetectedChildren] = useState<DemoChild[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);

  // Demo children data with avatars
  const demoChildren = [
    {
      id: '1',
      name: 'Emma Johnson',
      avatar: 'https://cdn.abacus.ai/images/f4c211d6-381f-4a4c-9f9e-c83c1f16262a.png',
      zones: ['Play Area A', 'Climbing Zone', 'Snack Bar']
    },
    {
      id: '2', 
      name: 'Michael Chen',
      avatar: 'https://cdn.abacus.ai/images/717d6bf8-00ba-428a-be06-751273e7c291.png',
      zones: ['Play Area B', 'Ball Pit', 'Toddler Area']
    },
    {
      id: '3',
      name: 'Sofia Martinez', 
      avatar: 'https://cdn.abacus.ai/images/5b8a3c7b-6ce9-4d97-8ba4-1c5cbbd72a91.png',
      zones: ['Exit Zone', 'Main Entrance', 'Restrooms']
    },
    {
      id: '4',
      name: 'Marcus Thompson',
      avatar: 'https://cdn.abacus.ai/images/c8f16198-68ee-40f3-86b4-43726d5d552b.png',
      zones: ['Climbing Zone', 'Play Area A', 'Ball Pit']
    },
    {
      id: '5',
      name: 'Aria Kim',
      avatar: 'https://cdn.abacus.ai/images/a06294b5-8deb-4342-86fa-a7498885a50c.png',
      zones: ['Toddler Area', 'Snack Bar', 'Play Area B']
    },
    {
      id: '6',
      name: 'Diego Rodriguez',
      avatar: 'https://cdn.abacus.ai/images/0e8496b3-a6f2-45fb-8ac0-a97f5e6eb921.png',
      zones: ['Ball Pit', 'Play Area A', 'Climbing Zone']
    }
  ];

  // Simulate real-time detection updates
  useEffect(() => {
    if (!isSimulating) return;

    const updateDetections = () => {
      const activeChildren = demoChildren
        .filter(() => Math.random() > 0.3) // Randomly show/hide children
        .slice(0, 2 + Math.floor(Math.random() * 3)) // Show 2-4 children
        .map(child => {
          const zones = child.zones;
          const currentZone = selectedZone && zones.includes(selectedZone) 
            ? selectedZone 
            : zones[Math.floor(Math.random() * zones.length)];

          return {
            id: child.id,
            name: child.name,
            avatar: child.avatar,
            position: {
              x: 20 + Math.random() * 560, // Random position in 600px width feed
              y: 20 + Math.random() * 300  // Random position in 340px height feed
            },
            confidence: 0.87 + Math.random() * 0.12,
            lastSeen: `${Math.floor(Math.random() * 30)} seconds ago`,
            zone: currentZone,
            alertLevel: currentZone.includes('Exit') ? 'yellow' : 'green' as 'green' | 'yellow' | 'red'
          };
        });

      setDetectedChildren(activeChildren);
    };

    // Initial update
    updateDetections();

    // Update every 3-7 seconds for realistic simulation
    const interval = setInterval(updateDetections, 3000 + Math.random() * 4000);

    return () => clearInterval(interval);
  }, [isSimulating, selectedZone]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Camera className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{cameraName}</h3>
            <p className="text-sm text-gray-500">Live Demo Feed</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">LIVE</span>
          </div>
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`text-xs px-2 py-1 rounded ${
              isSimulating ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isSimulating ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Camera Feed Display */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        {/* Simulated camera background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 grid-rows-6 h-full">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="border border-gray-600"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Detection zones overlay */}
        <div className="absolute inset-0">
          <div className="absolute top-4 left-4 bg-blue-500 bg-opacity-30 border-2 border-blue-400 rounded w-32 h-20">
            <span className="absolute -top-6 left-0 text-xs text-blue-400 font-medium">
              Detection Zone A
            </span>
          </div>
          <div className="absolute bottom-4 right-4 bg-green-500 bg-opacity-30 border-2 border-green-400 rounded w-28 h-16">
            <span className="absolute -top-6 right-0 text-xs text-green-400 font-medium">
              Zone B
            </span>
          </div>
        </div>

        {/* Detected children with avatars */}
        {detectedChildren.map((child) => (
          <div
            key={child.id}
            className="absolute transition-all duration-1000 ease-in-out"
            style={{
              left: `${child.position.x}px`,
              top: `${child.position.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Detection bounding box */}
            <div className={`absolute -inset-8 border-2 rounded-lg ${
              child.alertLevel === 'yellow' ? 'border-yellow-400 bg-yellow-400' : 
              child.alertLevel === 'red' ? 'border-red-400 bg-red-400' : 
              'border-green-400 bg-green-400'
            } bg-opacity-20 animate-pulse`}>
              {/* Confidence score */}
              <div className={`absolute -top-6 left-0 px-1 py-0.5 rounded text-xs font-medium ${
                child.alertLevel === 'yellow' ? 'bg-yellow-400 text-yellow-900' :
                child.alertLevel === 'red' ? 'bg-red-400 text-red-900' :
                'bg-green-400 text-green-900'
              }`}>
                {Math.round(child.confidence * 100)}%
              </div>
            </div>

            {/* Child avatar */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
              <Image
                src={child.avatar}
                alt={child.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>

            {/* Alert indicator */}
            {child.alertLevel === 'yellow' && (
              <AlertTriangle className="absolute -top-2 -right-2 h-4 w-4 text-yellow-500 animate-bounce" />
            )}
          </div>
        ))}

        {/* Camera info overlay */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          <div className="flex items-center space-x-2">
            <Eye className="h-3 w-3" />
            <span>{detectedChildren.length} detected</span>
          </div>
        </div>

        {/* Timestamp */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded font-mono">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Detection Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-gray-700">
            {detectedChildren.length} children detected
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-green-600" />
          <span className="text-sm text-gray-700">
            Avg confidence: {detectedChildren.length > 0 
              ? Math.round(detectedChildren.reduce((sum, c) => sum + c.confidence, 0) / detectedChildren.length * 100)
              : 0}%
          </span>
        </div>
      </div>

      {/* Detected Children List */}
      {detectedChildren.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Currently Detected:</h4>
          <div className="space-y-2">
            {detectedChildren.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={child.avatar}
                      alt={child.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{child.name}</p>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{child.zone}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`w-2 h-2 rounded-full ${
                    child.alertLevel === 'green' ? 'bg-green-500' :
                    child.alertLevel === 'yellow' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <p className="text-xs text-gray-500 mt-1">{child.lastSeen}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
