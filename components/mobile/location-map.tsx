
"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Zap, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  profilePhoto?: string;
}

interface Venue {
  id: string;
  name: string;
  address: string;
}

interface Zone {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface LocationData {
  id: string;
  child: Child;
  venue: Venue;
  zone?: Zone;
  position?: { x: number; y: number };
  accuracy: number;
  isCurrentLocation: boolean;
  timestamp: string;
  confidence: number;
}

interface LocationMapProps {
  locations: LocationData[];
  selectedChild?: string | null;
}

export function LocationMap({ locations, selectedChild }: LocationMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 400, height: 300 });

  // Mock venue layout
  const venueLayout = {
    zones: [
      { id: 'zone1', name: 'Main Play Area', type: 'PLAY_AREA', color: '#10B981', x: 100, y: 150, width: 150, height: 100 },
      { id: 'zone2', name: 'Food Court', type: 'FOOD_COURT', color: '#F59E0B', x: 250, y: 100, width: 100, height: 80 },
      { id: 'zone3', name: 'Entrance', type: 'ENTRANCE', color: '#3B82F6', x: 20, y: 20, width: 80, height: 60 },
      { id: 'zone4', name: 'Restrooms', type: 'RESTROOM', color: '#8B5CF6', x: 350, y: 50, width: 60, height: 40 },
      { id: 'zone5', name: 'Emergency Exit', type: 'EMERGENCY_EXIT', color: '#EF4444', x: 380, y: 250, width: 40, height: 30 }
    ]
  };

  useEffect(() => {
    drawMap();
  }, [locations, mapDimensions]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setMapDimensions({ width: width - 32, height: 300 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw venue zones
    venueLayout.zones.forEach(zone => {
      ctx.fillStyle = zone.color + '20'; // Add transparency
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
      
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
      
      // Zone label
      ctx.fillStyle = zone.color;
      ctx.font = '12px system-ui';
      ctx.fillText(zone.name, zone.x + 5, zone.y + 15);
    });

    // Draw child locations
    locations.forEach(location => {
      if (location.position) {
        const { x, y } = location.position;
        
        // Accuracy circle
        const radius = 20 + (100 - location.accuracy) * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = location.zone?.color + '15' || '#3B82F630';
        ctx.fill();
        ctx.strokeStyle = location.zone?.color || '#3B82F6';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Child marker
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = location.isCurrentLocation ? '#10B981' : '#6B7280';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Pulse animation for current location
        if (location.isCurrentLocation) {
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, 2 * Math.PI);
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is near any location
    const clickedLocation = locations.find(location => {
      if (!location.position) return false;
      const distance = Math.sqrt(
        Math.pow(x - location.position.x, 2) + Math.pow(y - location.position.y, 2)
      );
      return distance <= 15;
    });

    setSelectedLocation(clickedLocation || null);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Venue Map</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Navigation className="h-4 w-4" />
            <span>Adventure Playground</span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={mapDimensions.width}
            height={mapDimensions.height}
            onClick={handleCanvasClick}
            className="cursor-pointer border border-gray-200 rounded-lg bg-white"
          />
        </div>
        
        {/* Map Legend */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Zones</h4>
            {venueLayout.zones.slice(0, 3).map(zone => (
              <div key={zone.id} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: zone.color }}
                />
                <span className="text-xs text-gray-600">{zone.name}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Children</h4>
            {locations.map(location => (
              <div key={location.id} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  location.isCurrentLocation ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-xs text-gray-600">
                  {location.child.firstName}
                  {location.isCurrentLocation && (
                    <span className="ml-1 text-green-600">●</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Location Detail Modal */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-200"
          >
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {selectedLocation.child.profilePhoto ? (
                  <Image
                    src={selectedLocation.child.profilePhoto}
                    alt={selectedLocation.child.firstName}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {selectedLocation.child.firstName[0]}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {selectedLocation.child.firstName} {selectedLocation.child.lastName}
                  </h3>
                  {selectedLocation.isCurrentLocation && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 bg-green-500 rounded-full"
                    />
                  )}
                </div>
                
                {selectedLocation.zone && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: selectedLocation.zone.color }}
                    />
                    <span className="text-sm text-gray-600">{selectedLocation.zone.name}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Accuracy:</span> {selectedLocation.accuracy.toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-medium">Confidence:</span> {selectedLocation.confidence.toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-medium">Last seen:</span> {selectedLocation.timestamp}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <span className={`ml-1 ${selectedLocation.isCurrentLocation ? 'text-green-600' : 'text-gray-600'}`}>
                      {selectedLocation.isCurrentLocation ? 'Current' : 'Historical'}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
