
"use client";

import { useEffect, useState } from "react";
import { MapPin, Navigation, Clock, AlertCircle, Users, Zap, RefreshCw, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { LocationMap } from "@/components/mobile/location-map";
import { LocationTimeline } from "@/components/mobile/location-timeline";
import { ChildLocationCard } from "@/components/mobile/child-location-card";

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

export default function MobileLocationPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [currentLocations, setCurrentLocations] = useState<LocationData[]>([]);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'timeline'>('map');
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    loadLocationData();
    
    // Set up live updates every 10 seconds when live mode is on
    const interval = setInterval(() => {
      if (isLive) {
        loadLocationData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isLive]);

  const loadLocationData = async () => {
    try {
      setIsRefreshing(true);
      
      // Load children
      setChildren([
        {
          id: '1',
          firstName: 'Emma',
          lastName: 'Johnson',
          status: 'CHECKED_IN',
          profilePhoto: 'https://i.pinimg.com/originals/95/48/61/95486188fbf36520e34fc2ec41b4523f.jpg'
        },
        {
          id: '2',
          firstName: 'Lucas',
          lastName: 'Johnson',
          status: 'CHECKED_OUT',
          profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        }
      ]);

      // Load current locations
      setCurrentLocations([
        {
          id: '1',
          child: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            status: 'CHECKED_IN',
            profilePhoto: 'https://www.wallofcelebrities.com/celebrity/emma-johnson/pictures/original/emma-johnson_3677211.jpg'
          },
          venue: {
            id: 'venue1',
            name: 'Adventure Playground',
            address: '123 Play Street'
          },
          zone: {
            id: 'zone1',
            name: 'Main Play Area',
            type: 'PLAY_AREA',
            color: '#10B981'
          },
          position: { x: 150, y: 200 },
          accuracy: 95.5,
          isCurrentLocation: true,
          timestamp: '2 minutes ago',
          duration: 45, // minutes
          confidence: 96.7
        }
      ]);

      // Load location history
      setLocationHistory([
        {
          id: '1',
          child: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            status: 'CHECKED_IN'
          },
          venue: {
            id: 'venue1',
            name: 'Adventure Playground',
            address: '123 Play Street'
          },
          zone: {
            id: 'zone1',
            name: 'Main Play Area',
            type: 'PLAY_AREA',
            color: '#10B981'
          },
          position: { x: 150, y: 200 },
          accuracy: 95.5,
          isCurrentLocation: true,
          timestamp: '2 minutes ago',
          confidence: 96.7
        },
        {
          id: '2',
          child: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            status: 'CHECKED_IN'
          },
          venue: {
            id: 'venue1',
            name: 'Adventure Playground',
            address: '123 Play Street'
          },
          zone: {
            id: 'zone2',
            name: 'Food Court',
            type: 'FOOD_COURT',
            color: '#F59E0B'
          },
          position: { x: 300, y: 150 },
          accuracy: 92.1,
          isCurrentLocation: false,
          timestamp: '15 minutes ago',
          duration: 10,
          confidence: 94.2
        },
        {
          id: '3',
          child: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            status: 'CHECKED_IN'
          },
          venue: {
            id: 'venue1',
            name: 'Adventure Playground',
            address: '123 Play Street'
          },
          zone: {
            id: 'zone3',
            name: 'Entrance',
            type: 'ENTRANCE',
            color: '#3B82F6'
          },
          position: { x: 50, y: 50 },
          accuracy: 98.0,
          isCurrentLocation: false,
          timestamp: '1 hour ago',
          duration: 2,
          confidence: 98.5
        }
      ]);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading location data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadLocationData();
  };

  const handleChildSelect = (childId: string) => {
    setSelectedChild(selectedChild === childId ? null : childId);
  };

  const handleToggleLive = () => {
    setIsLive(!isLive);
  };

  const filteredLocations = selectedChild 
    ? currentLocations.filter(loc => loc.child.id === selectedChild)
    : currentLocations;

  const filteredHistory = selectedChild
    ? locationHistory.filter(loc => loc.child.id === selectedChild)
    : locationHistory;

  const activeChildren = currentLocations.length;
  const averageAccuracy = currentLocations.reduce((sum, loc) => sum + loc.accuracy, 0) / (currentLocations.length || 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-20">
      {/* Mobile Header */}
      <MobileHeader 
        isOnline={true}
        batteryLevel={85}
        notificationsEnabled={true}
        unreadCount={2}
        onToggleNotifications={() => {}}
        lastSync={lastUpdate}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Page Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Location</h1>
            <p className="text-gray-600">Track your children in real-time</p>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleLive}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium text-sm transition-colors ${
              isLive 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Zap className={`h-4 w-4 ${isLive ? 'animate-pulse' : ''}`} />
            <span>{isLive ? 'Live' : 'Paused'}</span>
          </motion.button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{activeChildren}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Navigation className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{averageAccuracy.toFixed(0)}%</p>
            <p className="text-xs text-gray-500">Accuracy</p>
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Clock className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{locationHistory.length}</p>
            <p className="text-xs text-gray-500">Updates</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('map')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-md font-medium text-sm transition-colors ${
              viewMode === 'map' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Map View</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('timeline')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-md font-medium text-sm transition-colors ${
              viewMode === 'timeline' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Timeline</span>
          </motion.button>
        </div>
      </div>

      {/* Child Filter */}
      <div className="px-4 mb-4">
        <div className="flex space-x-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedChild(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedChild 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            All Children
          </motion.button>
          
          {children.map((child) => (
            <motion.button
              key={child.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleChildSelect(child.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedChild === child.id 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {child.firstName}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {/* Current Locations */}
        {currentLocations.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Current Locations</h2>
            {filteredLocations.map((location, index) => (
              <ChildLocationCard 
                key={location.id} 
                location={location} 
                index={index}
                isLive={isLive}
              />
            ))}
          </div>
        )}

        {/* Map or Timeline View */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <AnimatePresence mode="wait">
            {viewMode === 'map' ? (
              <motion.div
                key="map"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LocationMap 
                  locations={filteredLocations}
                  selectedChild={selectedChild}
                />
              </motion.div>
            ) : (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <LocationTimeline 
                  history={filteredHistory}
                  selectedChild={selectedChild}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Status Indicator */}
        <AnimatePresence>
          {isLive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-24 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 z-40"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-white rounded-full"
              />
              <span className="text-sm font-medium">Live tracking active</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {currentLocations.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Locations</h3>
            <p className="text-gray-600 mb-4">
              No children are currently checked in at any venues
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium"
            >
              Check In Child
            </motion.button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav activeTab="location" />
    </div>
  );
}
