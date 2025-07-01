
"use client";

import { MapPin, Clock, Navigation, Zap, AlertCircle } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

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

interface ChildLocationCardProps {
  location: LocationData;
  index: number;
  isLive?: boolean;
}

export function ChildLocationCard({ location, index, isLive = false }: ChildLocationCardProps) {
  const getAccuracyConfig = (accuracy: number) => {
    if (accuracy >= 95) {
      return { color: 'text-green-600', bg: 'bg-green-100', icon: Navigation };
    } else if (accuracy >= 80) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Navigation };
    } else {
      return { color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle };
    }
  };

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

  const accuracyConfig = getAccuracyConfig(location.accuracy);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all duration-200 ${
        location.isCurrentLocation 
          ? 'border-green-200 shadow-green-100' 
          : 'border-gray-100'
      }`}
    >
      <div className="flex items-center space-x-4">
        {/* Child Profile */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border-3 border-white shadow-sm">
            {location.child.profilePhoto ? (
              <Image
                src={location.child.profilePhoto}
                alt={`${location.child.firstName} ${location.child.lastName}`}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {location.child.firstName[0]}
                </span>
              </div>
            )}
          </div>
          
          {/* Live Indicator */}
          {location.isCurrentLocation && isLive && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
            >
              <Zap className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>

        {/* Location Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {location.child.firstName} {location.child.lastName}
            </h3>
            {location.isCurrentLocation && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Live
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
                <span className="text-sm font-medium text-gray-700 truncate">
                  {location.zone.name}
                </span>
              </div>
            </div>
          )}
          
          {/* Venue and Time */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{location.venue.name}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>
                {location.timestamp}
                {location.duration && ` • ${location.duration}m`}
              </span>
            </div>
          </div>
        </div>

        {/* Accuracy Indicator */}
        <div className="flex flex-col items-center space-y-2 flex-shrink-0">
          <div className={`w-10 h-10 ${accuracyConfig.bg} rounded-lg flex items-center justify-center`}>
            <accuracyConfig.icon className={`h-5 w-5 ${accuracyConfig.color}`} />
          </div>
          
          <div className="text-center">
            <div className={`text-xs font-medium ${accuracyConfig.color}`}>
              {location.accuracy.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">accuracy</div>
          </div>
        </div>
      </div>
      
      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Confidence: {location.confidence.toFixed(1)}%</span>
            {location.position && (
              <span>Position: ({location.position.x}, {location.position.y})</span>
            )}
          </div>
          
          {location.isCurrentLocation && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center space-x-1 text-green-600"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="font-medium">Live tracking</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
