
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapPin, Users, AlertTriangle, Camera, Eye, RotateCcw, Move } from "lucide-react";
import Image from "next/image";
import { getChildAvatar, getRandomChildren } from "@/lib/avatar-mapping";

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

interface DragState {
  isDragging: boolean;
  dragZoneId: string | null;
  startPosition: { x: number; y: number };
  offset: { x: number; y: number };
}

interface DemoZoneMapProps {
  selectedZone?: string;
  onZoneSelect?: (zoneName: string) => void;
}

export default function DemoZoneMap({ selectedZone, onZoneSelect }: DemoZoneMapProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragZoneId: null,
    startPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const STORAGE_KEY = 'safeplay-zone-positions';

  // Using centralized avatar mapping for consistency
  // No more random avatar assignments - each child has a fixed avatar

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

  // Zone position persistence functions
  const saveZonePositions = useCallback((zonesToSave: Zone[]) => {
    try {
      const positions = zonesToSave.reduce((acc, zone) => {
        acc[zone.id] = { x: zone.x, y: zone.y };
        return acc;
      }, {} as Record<string, { x: number; y: number }>);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    } catch (error) {
      console.error('Failed to save zone positions:', error);
    }
  }, [STORAGE_KEY]);

  const loadZonePositions = useCallback(() => {
    try {
      const savedPositions = localStorage.getItem(STORAGE_KEY);
      if (savedPositions) {
        return JSON.parse(savedPositions) as Record<string, { x: number; y: number }>;
      }
    } catch (error) {
      console.error('Failed to load zone positions:', error);
    }
    return {};
  }, [STORAGE_KEY]);

  const resetZonePositions = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setZones(currentZones => 
        currentZones.map(zone => {
          const originalZone = initialZones.find(z => z.id === zone.id);
          return originalZone ? { ...zone, x: originalZone.x, y: originalZone.y } : zone;
        })
      );
    } catch (error) {
      console.error('Failed to reset zone positions:', error);
    }
  }, [STORAGE_KEY]);

  // Boundary constraint functions
  const constrainPosition = useCallback((x: number, y: number, width: number, height: number) => {
    const container = mapContainerRef.current;
    if (!container) return { x, y };

    const containerRect = container.getBoundingClientRect();
    const maxX = containerRect.width - width;
    const maxY = containerRect.height - height;

    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    };
  }, []);

  // Drag event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, zoneId: string) => {
    if (!isDragEnabled) return;
    e.preventDefault();
    e.stopPropagation();

    const container = mapContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    setDragState({
      isDragging: true,
      dragZoneId: zoneId,
      startPosition: { x: e.clientX, y: e.clientY },
      offset: {
        x: e.clientX - containerRect.left - zone.x,
        y: e.clientY - containerRect.top - zone.y
      }
    });
  }, [isDragEnabled, zones]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.dragZoneId) return;

    const container = mapContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    setZones(currentZones => {
      const zone = currentZones.find(z => z.id === dragState.dragZoneId);
      if (!zone) return currentZones;

      const newX = e.clientX - containerRect.left - dragState.offset.x;
      const newY = e.clientY - containerRect.top - dragState.offset.y;
      const constrainedPosition = constrainPosition(newX, newY, zone.width, zone.height);

      return currentZones.map(z =>
        z.id === dragState.dragZoneId
          ? { ...z, x: constrainedPosition.x, y: constrainedPosition.y }
          : z
      );
    });
  }, [dragState, constrainPosition]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        dragZoneId: null,
        startPosition: { x: 0, y: 0 },
        offset: { x: 0, y: 0 }
      });
      
      // Save positions after drag ends
      setTimeout(() => {
        setZones(currentZones => {
          saveZonePositions(currentZones);
          return currentZones;
        });
      }, 100);
    }
  }, [dragState.isDragging, saveZonePositions]);

  // Mouse event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // Initialize zones with saved positions
  useEffect(() => {
    const savedPositions = loadZonePositions();
    
    const zonesWithPositions = initialZones.map(zone => ({
      ...zone,
      x: savedPositions[zone.id]?.x ?? zone.x,
      y: savedPositions[zone.id]?.y ?? zone.y,
      children: [],
      alertCount: 0
    }));
    
    setZones(zonesWithPositions);
  }, [loadZonePositions]);

  // Simulate zone occupancy and child movements
  useEffect(() => {
    if (!isSimulating || zones.length === 0) return;

    const updateZones = () => {
      setZones(currentZones => currentZones.map(zone => {
        const childCount = Math.floor(Math.random() * Math.min(zone.capacity, 6));
        const children: ZoneChild[] = [];
        
        // Get random children using centralized avatar mapping
        const randomChildren = getRandomChildren(childCount);
        
        for (let i = 0; i < childCount; i++) {
          const selectedChild = randomChildren[i] || randomChildren[0]; // Fallback to first child
          const child: ZoneChild = {
            id: `${zone.id}-child-${i}`,
            name: selectedChild.name,
            avatar: selectedChild.avatar, // Use consistent avatar from centralized mapping
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
      }));
    };

    updateZones();
    const interval = setInterval(updateZones, 4000);

    return () => clearInterval(interval);
  }, [isSimulating, zones.length]);

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
          <h3 className="text-3xl font-bold text-gray-900">Interactive Zone Map</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">LIVE</span>
          </div>
          {isDragEnabled && (
            <div className="flex items-center space-x-1">
              <Move className="h-3 w-3 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">DRAG MODE</span>
            </div>
          )}
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
          
          {/* Drag Controls */}
          <button
            onClick={() => setIsDragEnabled(!isDragEnabled)}
            className={`px-3 py-1 text-sm rounded flex items-center space-x-1 ${
              isDragEnabled 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
            title="Enable zone repositioning"
          >
            <Move className="h-3 w-3" />
            <span>{isDragEnabled ? 'Exit Edit' : 'Edit Layout'}</span>
          </button>
          
          {isDragEnabled && (
            <button
              onClick={resetZonePositions}
              className="px-3 py-1 text-sm rounded flex items-center space-x-1 bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200"
              title="Reset zones to default positions"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
          
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1 text-sm rounded ${
              isSimulating 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isSimulating ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="card">
        <div 
          ref={mapContainerRef}
          className="relative w-full h-96 bg-venue rounded-lg overflow-hidden border-2 border-gray-200 select-none"
          style={{
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Venue background grid */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-16 grid-rows-12 h-full">
              {Array.from({ length: 192 }).map((_, i) => (
                <div key={i} className="border border-gray-300"></div>
              ))}
            </div>
          </div>

          {/* Zones */}
          {zones.map((zone) => {
            const isDragging = dragState.isDragging && dragState.dragZoneId === zone.id;
            const isSelected = selectedZone === zone.name;
            
            return (
              <div
                key={zone.id}
                className={`absolute border-2 rounded-lg transition-all duration-200 ${
                  getZoneColor(zone)
                } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
                  isDragEnabled 
                    ? 'cursor-move hover:ring-2 hover:ring-blue-400 hover:shadow-lg' 
                    : 'cursor-pointer hover:opacity-80'
                } ${isDragging ? 'opacity-80 shadow-2xl z-50 scale-105' : 'hover:scale-102'}`}
                style={{
                  left: `${zone.x}px`,
                  top: `${zone.y}px`,
                  width: `${zone.width}px`,
                  height: `${zone.height}px`,
                  transform: isDragging ? 'scale(1.05)' : undefined,
                  zIndex: isDragging ? 50 : undefined
                }}
                onMouseDown={(e) => isDragEnabled && handleMouseDown(e, zone.id)}
                onClick={() => !isDragEnabled && onZoneSelect?.(zone.name)}
              >
              {/* Zone label */}
              <div className="absolute -top-6 left-0 bg-white px-2 py-1 rounded text-xs font-medium shadow-sm border">
                {zone.name}
                <span className="ml-1 text-gray-500">({zone.children.length}/{zone.capacity})</span>
              </div>

              {/* Drag handle indicator */}
              {isDragEnabled && (
                <div className="absolute top-1 right-1 opacity-60 hover:opacity-100 transition-opacity">
                  <Move className="h-3 w-3 text-gray-600" />
                </div>
              )}

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
          );
          })}

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
