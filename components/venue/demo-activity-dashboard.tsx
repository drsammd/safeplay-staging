
"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Clock, 
  Camera, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  MapPin,
  Eye,
  Timer
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { getChildAvatar, getRandomChildren, DEMO_CHILDREN_NAMES } from "@/lib/avatar-mapping";

interface ActivityEvent {
  id: string;
  type: 'check_in' | 'check_out' | 'zone_entry' | 'zone_exit' | 'alert' | 'memory_created';
  childName: string;
  childAvatar: string;
  location: string;
  timestamp: Date;
  confidence?: number;
  alertLevel?: 'green' | 'yellow' | 'red';
}

interface ZoneOccupancy {
  zone: string;
  current: number;
  capacity: number;
  children: Array<{
    name: string;
    avatar: string;
    duration: string;
  }>;
}

export default function DemoActivityDashboard() {
  const [recentEvents, setRecentEvents] = useState<ActivityEvent[]>([]);
  const [zoneOccupancy, setZoneOccupancy] = useState<ZoneOccupancy[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);

  // Using centralized avatar mapping for consistent child-avatar assignments

  const zones = [
    'Main Entrance', 'Play Area A', 'Play Area B', 'Climbing Zone', 
    'Ball Pit', 'Toddler Area', 'Snack Bar', 'Restrooms'
  ];

  const eventTypes = ['zone_entry', 'zone_exit', 'check_in', 'memory_created'] as const;

  // Simulate real-time activity updates
  useEffect(() => {
    if (!isSimulating) return;

    const generateEvent = (): ActivityEvent => {
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const childName = DEMO_CHILDREN_NAMES[Math.floor(Math.random() * DEMO_CHILDREN_NAMES.length)];
      const childAvatar = getChildAvatar(childName); // Use consistent avatar from centralized mapping
      const location = zones[Math.floor(Math.random() * zones.length)];
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        childName,
        childAvatar,
        location,
        timestamp: new Date(),
        confidence: type.includes('zone') ? 0.85 + Math.random() * 0.15 : undefined,
        alertLevel: location.includes('Exit') ? 'yellow' : 'green'
      };
    };

    const updateZoneOccupancy = () => {
      const occupancy: ZoneOccupancy[] = zones.slice(0, 6).map(zone => {
        const childrenCount = Math.floor(Math.random() * 4) + 1;
        const randomChildren = getRandomChildren(childrenCount);
        
        return {
          zone,
          current: Math.floor(Math.random() * 8) + 1,
          capacity: 15,
          children: randomChildren.map(child => ({
            name: child.name,
            avatar: child.avatar, // Use consistent avatar from centralized mapping
            duration: `${Math.floor(Math.random() * 90) + 5}m`
          }))
        };
      });
      setZoneOccupancy(occupancy);
    };

    // Initial data
    setRecentEvents(Array.from({ length: 5 }, generateEvent));
    updateZoneOccupancy();

    // Add new events periodically
    const eventInterval = setInterval(() => {
      setRecentEvents(prev => [generateEvent(), ...prev.slice(0, 9)]);
    }, 2000 + Math.random() * 4000);

    // Update zone occupancy
    const zoneInterval = setInterval(updateZoneOccupancy, 8000);

    return () => {
      clearInterval(eventInterval);
      clearInterval(zoneInterval);
    };
  }, [isSimulating]);

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'check_in': return <Users className="h-4 w-4 text-green-600" />;
      case 'check_out': return <Users className="h-4 w-4 text-orange-600" />;
      case 'zone_entry': return <MapPin className="h-4 w-4 text-blue-600" />;
      case 'zone_exit': return <MapPin className="h-4 w-4 text-purple-600" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'memory_created': return <Camera className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventText = (event: ActivityEvent) => {
    switch (event.type) {
      case 'check_in': return `${event.childName} checked in`;
      case 'check_out': return `${event.childName} checked out`;
      case 'zone_entry': return `${event.childName} entered ${event.location}`;
      case 'zone_exit': return `${event.childName} left ${event.location}`;
      case 'alert': return `Alert: ${event.childName} - ${event.location}`;
      case 'memory_created': return `Photo captured of ${event.childName}`;
      default: return `${event.childName} - ${event.location}`;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const diff = Date.now() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Real-Time Activity Dashboard</h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">LIVE DEMO</span>
          </div>
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1 text-sm rounded ${
              isSimulating 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isSimulating ? 'Pause Simulation' : 'Resume Simulation'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-Time Activity Feed */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Activity Feed</h3>
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {recentEvents.length} recent events
            </Badge>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                  event.alertLevel === 'yellow' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(event.type)}
                </div>
                
                <div className="flex-shrink-0">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={event.childAvatar}
                      alt={event.childName}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {getEventText(event)}
                  </p>
                  <div className="flex items-center space-x-3 mt-1">
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(event.timestamp)}
                    </p>
                    {event.confidence && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(event.confidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                </div>
                
                {event.alertLevel === 'yellow' && (
                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Zone Occupancy */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Zone Occupancy</h3>
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              Live monitoring
            </Badge>
          </div>
          
          <div className="space-y-4">
            {zoneOccupancy.map((zone) => (
              <div key={zone.zone} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{zone.zone}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {zone.current}/{zone.capacity}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      zone.current > zone.capacity * 0.8 ? 'bg-red-500' :
                      zone.current > zone.capacity * 0.6 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                  </div>
                </div>
                
                {/* Occupancy bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      zone.current > zone.capacity * 0.8 ? 'bg-red-500' :
                      zone.current > zone.capacity * 0.6 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((zone.current / zone.capacity) * 100, 100)}%` }}
                  ></div>
                </div>
                
                {/* Children in zone */}
                <div className="flex flex-wrap gap-2">
                  {zone.children.slice(0, 3).map((child, index) => (
                    <div key={index} className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1">
                      <div className="relative w-4 h-4 rounded-full overflow-hidden">
                        <Image
                          src={child.avatar}
                          alt={child.name}
                          fill
                          className="object-cover"
                          sizes="16px"
                        />
                      </div>
                      <span className="text-xs text-gray-700">{child.name.split(' ')[0]}</span>
                      <div className="flex items-center text-xs text-gray-500">
                        <Timer className="h-3 w-3 mr-0.5" />
                        {child.duration}
                      </div>
                    </div>
                  ))}
                  {zone.children.length > 3 && (
                    <div className="flex items-center px-2 py-1 bg-gray-100 rounded-full">
                      <span className="text-xs text-gray-600">+{zone.children.length - 3} more</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-2">
            <Eye className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{recentEvents.length}</p>
          <p className="text-sm text-gray-600">Live Events</p>
        </div>
        
        <div className="card text-center">
          <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-2">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {zoneOccupancy.reduce((sum, zone) => sum + zone.current, 0)}
          </p>
          <p className="text-sm text-gray-600">Children Present</p>
        </div>
        
        <div className="card text-center">
          <div className="p-3 bg-orange-100 rounded-lg w-fit mx-auto mb-2">
            <MapPin className="h-6 w-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{zoneOccupancy.length}</p>
          <p className="text-sm text-gray-600">Active Zones</p>
        </div>
        
        <div className="card text-center">
          <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-2">
            <Activity className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">97%</p>
          <p className="text-sm text-gray-600">Avg Confidence</p>
        </div>
      </div>
    </div>
  );
}
