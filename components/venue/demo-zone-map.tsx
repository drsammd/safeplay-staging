
"use client";

import { useEffect, useState } from "react";
import { MapPin, Users, AlertTriangle, Camera, Eye } from "lucide-react";
import Image from "next/image";

interface ZoneChild {
  id: string;
  name: string;
  avatar: string;
  x: number;
  y: number;
  confidence: number;
  alertLevel: 'green' | 'yellow' | 'red';
  timeInZone: string;
}

interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  children: ZoneChild[];
  alertCount: number;
}

interface DemoZoneMapProps {
  selectedZone?: string;
  onZoneSelect?: (zoneName: string) => void;
}

export default function DemoZoneMap({ selectedZone, onZoneSelect }: DemoZoneMapProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);

  // Demo avatars
  const demoAvatars = [
    'https://cdn.abacus.ai/images/f4c211d6-381f-4a4c-9f9e-c83c1f16262a.png',
    'https://cdn.abacus.ai/images/717d6bf8-00ba-428a-be06-751273e7c291.png',
    'https://cdn.abacus.ai/images/5b8a3c7b-6ce9-4d97-8ba4-1c5cbbd72a91.png',
    'https://cdn.abacus.ai/images/c8f16198-68ee-40f3-86b4-43726d5d552b.png',
    'https://cdn.abacus.ai/images/a06294b5-8deb-4342-86fa-a7498885a50c.png',
    'https://cdn.abacus.ai/images/0e8496b3-a6f2-45fb-8ac0-a97f5e6eb921.png',
  ];

  const demoChildren = [
    'Emma Johnson', 'Michael Chen', 'Sofia Martinez', 
    'Marcus Thompson', 'Aria Kim', 'Diego Rodriguez',
    'Zoe Williams', 'Noah Davis', 'Maya Patel', 'Elijah Brown'
  ];

  // Initial zone layout (scaled for display)
  const initialZones: Omit<Zone, 'children' | 'alertCount'>[] = [
    { id: '1', name: 'Main Entrance', x: 50, y: 50, width: 150, height: 80, capacity: 10 },
    { id: '2', name: 'Play Area A', x: 250, y: 100, width: 180, height: 120, capacity: 15 },
    { id: '3', name: 'Play Area B', x: 480, y: 100, width: 180, height: 120, capacity: 15 },
    { id: '4', name: 'Climbing Zone', x: 250, y: 260, width: 160, height: 100, capacity: 12 },
    { id: '5', name: 'Ball Pit', x: 480, y: 260, width: 140, height: 80, capacity: 10 },
    { id: '6', name: 'Toddler Area', x: 100, y: 380, width: 160, height: 80, capacity: 8 },
    { id: '7', name: 'Snack Bar', x: 320, y: 380, width: 120, height: 60, capacity: 6 },
    { id: '8', name: 'Restrooms', x: 500, y: 380, width: 80, height: 50, capacity: 4 },
    { id: '9', name: 'Exit Zone', x: 600, y: 200, width: 80, height: 150, capacity: 5 },
  ];

  // Camera positions
  const cameras = [
    { id: '1', name: 'Entrance Cam', x: 125, y: 90, coverage: '1,2' },
    { id: '2', name: 'Play Area Cam', x: 340, y: 160, coverage: '2,4' },
    { id: '3', name: 'Ball Pit Cam', x: 550, y: 200, coverage: '3,5' },
    { id: '4', name: 'Exit Cam', x: 640, y: 275, coverage: '9' },
    { id: '5', name: 'Overview Cam', x: 400, y: 300, coverage: '4,6,7' },
  ];

  // Simulate zone occupancy and child movements
  useEffect(() => {
    if (!isSimulating) return;

    const updateZones = () => {
      const updatedZones = initialZones.map(zone => {
        const childCount = Math.floor(Math.random() * Math.min(zone.capacity, 6));
        const children: ZoneChild[] = [];
        
        for (let i = 0; i < childCount; i++) {
          const child: ZoneChild = {
            id: `${zone.id}-child-${i}`,
            name: demoChildren[Math.floor(Math.random() * demoChildren.length)],
            avatar: demoAvatars[Math.floor(Math.random() * demoAvatars.length)],
            x: zone.x + 20 + Math.random() * (zone.width - 40),
            y: zone.y + 20 + Math.random() * (zone.height - 40),
            confidence: 0.85 + Math.random() * 0.15,
            alertLevel: zone.name.includes('Exit') && Math.random() > 0.7 ? 'yellow' : 'green',
            timeInZone: `${Math.floor(Math.random() * 45) + 5}m`
          };
          children.push(child);
        }

        return {
          ...zone,
          children,
          alertCount: children.filter(c => c.alertLevel !== 'green').length
        };
      });

      setZones(updatedZones);
    };

    updateZones();
    const interval = setInterval(updateZones, 4000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const getZoneColor = (zone: Zone) => {
    const occupancyRatio = zone.children.length / zone.capacity;
    
    if (zone.alertCount > 0) return 'border-red-400 bg-red-100';
    if (occupancyRatio > 0.8) return 'border-yellow-400 bg-yellow-100';
    if (occupancyRatio > 0.6) return 'border-orange-400 bg-orange-100';
    return 'border-green-400 bg-green-100';
  };

  const totalChildren = zones.reduce((sum, zone) => sum + zone.children.length, 0);
  const totalAlerts = zones.reduce((sum, zone) => sum + zone.alertCount, 0);

  return (
    <div className="space-y-4">
      {/* Controls and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Interactive Zone Map</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">LIVE</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4 text-blue-600" />
            <span>{totalChildren} children</span>
          </div>
          {totalAlerts > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span>{totalAlerts} alerts</span>
            </div>
          )}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1 text-sm rounded ${
              isSimulating 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}
          >
            {isSimulating ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="card">
        <div className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200">
          {/* Venue background grid */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-16 grid-rows-12 h-full">
              {Array.from({ length: 192 }).map((_, i) => (
                <div key={i} className="border border-gray-300"></div>
              ))}
            </div>
          </div>

          {/* Zones */}
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`absolute border-2 rounded-lg transition-all duration-300 cursor-pointer hover:opacity-80 ${
                getZoneColor(zone)
              } ${selectedZone === zone.name ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                left: `${zone.x}px`,
                top: `${zone.y}px`,
                width: `${zone.width}px`,
                height: `${zone.height}px`,
              }}
              onClick={() => onZoneSelect?.(zone.name)}
            >
              {/* Zone label */}
              <div className="absolute -top-6 left-0 bg-white px-2 py-1 rounded text-xs font-medium shadow-sm border">
                {zone.name}
                <span className="ml-1 text-gray-500">({zone.children.length}/{zone.capacity})</span>
              </div>

              {/* Alert indicator */}
              {zone.alertCount > 0 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{zone.alertCount}</span>
                </div>
              )}

              {/* Children in zone */}
              {zone.children.map((child) => (
                <div
                  key={child.id}
                  className="absolute transition-all duration-1000"
                  style={{
                    left: `${child.x - zone.x - 12}px`,
                    top: `${child.y - zone.y - 12}px`,
                  }}
                >
                  {/* Child avatar */}
                  <div className={`relative w-6 h-6 rounded-full overflow-hidden border-2 ${
                    child.alertLevel === 'yellow' ? 'border-yellow-500' :
                    child.alertLevel === 'red' ? 'border-red-500' :
                    'border-green-500'
                  } shadow-sm hover:scale-110 transition-transform cursor-pointer group`}>
                    <Image
                      src={child.avatar}
                      alt={child.name}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        <div>{child.name}</div>
                        <div>Confidence: {Math.round(child.confidence * 100)}%</div>
                        <div>Time in zone: {child.timeInZone}</div>
                      </div>
                    </div>
                  </div>

                  {/* Alert indicator for child */}
                  {child.alertLevel === 'yellow' && (
                    <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Cameras */}
          {cameras.map((camera) => (
            <div
              key={camera.id}
              className="absolute w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg group cursor-pointer"
              style={{
                left: `${camera.x - 8}px`,
                top: `${camera.y - 8}px`,
              }}
            >
              <Camera className="h-2 w-2 text-white absolute top-1 left-1" />
              
              {/* Camera tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="bg-blue-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  <div>{camera.name}</div>
                  <div>Coverage: Zones {camera.coverage}</div>
                </div>
              </div>

              {/* Camera view cone */}
              <div className="absolute top-0 left-0 w-16 h-16 opacity-20 group-hover:opacity-40 transition-opacity">
                <div className="w-full h-full bg-blue-500 transform rotate-45 origin-bottom-left" 
                     style={{ 
                       clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
                       transform: 'rotate(45deg) scale(0.8)'
                     }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone Details */}
      {selectedZone && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {zones
            .filter(zone => zone.name === selectedZone)
            .map(zone => (
              <div key={zone.id} className="md:col-span-3">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">{zone.name} Details</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {zone.children.length}/{zone.capacity} occupancy
                      </span>
                      <div className={`w-3 h-3 rounded-full ${
                        zone.children.length > zone.capacity * 0.8 ? 'bg-red-500' :
                        zone.children.length > zone.capacity * 0.6 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                    </div>
                  </div>

                  {zone.children.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {zone.children.map((child) => (
                        <div key={child.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden">
                            <Image
                              src={child.avatar}
                              alt={child.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{child.name}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>In zone: {child.timeInZone}</span>
                              <span>•</span>
                              <span>{Math.round(child.confidence * 100)}% confidence</span>
                            </div>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            child.alertLevel === 'green' ? 'bg-green-500' :
                            child.alertLevel === 'yellow' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No children currently detected in this zone</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
