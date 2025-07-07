
"use client";

import { Clock, MapPin, Navigation, Zap } from "lucide-react";
import { motion } from "framer-motion";
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
  duration?: number;
  confidence: number;
}

interface LocationTimelineProps {
  history: LocationData[];
  selectedChild?: string | null;
}

export function LocationTimeline({ history, selectedChild }: LocationTimelineProps) {
  const getZoneIcon = (zoneType: string) => {
    switch (zoneType) {
      case 'ENTRANCE':
        return '🚪';
      case 'PLAY_AREA':
        return '🎮';
      case 'FOOD_COURT':
        return '🍽️';
      case 'RESTROOM':
        return '🚻';
      case 'EMERGENCY_EXIT':
        return '🚨';
      default:
        return '📍';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (history.length === 0) {
    return (
      <div className="p-8 text-center">
        <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Location History</h3>
        <p className="text-gray-600">
          Location history will appear here as children move around venues
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Location Timeline</h3>
        <div className="text-sm text-gray-600">
          {history.length} location{history.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="space-y-4">
        {history.map((location, index) => (
          <motion.div
            key={location.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-gray-50 rounded-xl p-4 border-l-4 ${
              location.isCurrentLocation ? 'border-green-500 bg-green-50' : 'border-gray-300'
            }`}
          >
            {/* Timeline connector */}
            {index < history.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-300" />
            )}
            
            <div className="flex items-start space-x-3">
              {/* Child Profile */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  {location.child.profilePhoto ? (
                    <Image
                      src={location.child.profilePhoto}
                      alt={location.child.firstName}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {location.child.firstName[0]}
                      </span>
                    </div>
                  )}
                </div>
                
                {location.isCurrentLocation && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
                  >
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </motion.div>
                )}
              </div>
              
              {/* Location Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {location.child.firstName} {location.child.lastName}
                  </h3>
                  {location.isCurrentLocation && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <Zap className="w-3 h-3 mr-1" />
                      Current
                    </span>
                  )}
                </div>
                
                {/* Zone Info */}
                {location.zone && (
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getZoneIcon(location.zone.type)}</span>
                    <div className="flex items-center space-x-1">
                      <div 
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: location.zone.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">{location.zone.name}</span>
                    </div>
                  </div>
                )}
                
                {/* Venue Info */}
                <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                  <MapPin className="h-4 w-4" />
                  <span>{location.venue?.name || 'Unknown Venue'}</span>
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Accuracy:</span>
                      <span className={`font-medium ${
                        location.accuracy >= 95 ? 'text-green-600' : 
                        location.accuracy >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {location.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Confidence:</span>
                      <span className="font-medium text-gray-700">
                        {location.confidence.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-medium text-gray-700">{location.timestamp}</span>
                    </div>
                    
                    {location.duration && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium text-gray-700">
                          {formatDuration(location.duration)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Position Indicator */}
              {location.position && (
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-gray-500 mb-1">Position</div>
                  <div className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                    {location.position.x}, {location.position.y}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center space-x-2 mb-2">
          <Navigation className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-900">Location Summary</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Total Locations:</span>
            <span className="ml-2 font-medium text-blue-900">{history.length}</span>
          </div>
          <div>
            <span className="text-blue-700">Average Accuracy:</span>
            <span className="ml-2 font-medium text-blue-900">
              {(history.reduce((sum, loc) => sum + loc.accuracy, 0) / history.length).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-blue-700">Current Children:</span>
            <span className="ml-2 font-medium text-blue-900">
              {history.filter(loc => loc.isCurrentLocation).length}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Total Time:</span>
            <span className="ml-2 font-medium text-blue-900">
              {formatDuration(history.reduce((sum, loc) => sum + (loc.duration || 0), 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
