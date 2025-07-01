
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  MapPin, 
  Clock, 
  Camera, 
  AlertTriangle, 
  Baby, 
  Shield, 
  Phone,
  Wifi,
  WifiOff,
  Battery,
  Bell,
  BellOff,
  RefreshCw,
  QrCode,
  Navigation,
  Heart
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MobileChildCard } from "@/components/mobile/mobile-child-card";
import { MobileAlertFeed } from "@/components/mobile/mobile-alert-feed";
import { MobileQuickActions } from "@/components/mobile/mobile-quick-actions";
import { MobilePhotoCarousel } from "@/components/mobile/mobile-photo-carousel";
import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { MobileEmergencyButton } from "@/components/mobile/mobile-emergency-button";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  profilePhoto?: string;
  currentVenue?: {
    id: string;
    name: string;
    address: string;
  };
  lastSeen?: string;
  checkInTime?: string;
}

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  priority: string;
  child?: Child;
  isRead: boolean;
}

interface PhotoNotification {
  id: string;
  photoUrl: string;
  thumbnailUrl?: string;
  capturedAt: string;
  child: Child;
  venue: {
    name: string;
  };
  isViewed: boolean;
  recognitionConfidence?: number;
}

export default function MobileDashboard() {
  const { data: session } = useSession();
  const [children, setChildren] = useState<Child[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [photos, setPhotos] = useState<PhotoNotification[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    loadDashboardData();
    setupNetworkMonitoring();
    setupBatteryMonitoring();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      if (isOnline) {
        loadDashboardData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsRefreshing(true);
      
      // Load children data
      setChildren([
        {
          id: '1',
          firstName: 'Emma',
          lastName: 'Johnson',
          status: 'CHECKED_IN',
          profilePhoto: 'https://i.pinimg.com/originals/02/a4/05/02a4051b4f4204743110ca3871223ec3.jpg',
          currentVenue: {
            id: 'venue1',
            name: 'Adventure Playground',
            address: '123 Play Street'
          },
          lastSeen: '2 minutes ago',
          checkInTime: '2:30 PM'
        },
        {
          id: '2',
          firstName: 'Lucas',
          lastName: 'Johnson',
          status: 'CHECKED_OUT',
          profilePhoto: 'https://i.pinimg.com/originals/f8/41/ef/f841efd85c34c30a9df273d65ab4f652.jpg',
          lastSeen: '1 hour ago'
        }
      ]);

      // Load alerts
      setAlerts([
        {
          id: '1',
          type: 'CHILD_DETECTED',
          title: 'Child Located',
          message: 'Emma was detected in the play area',
          timestamp: '5 minutes ago',
          priority: 'NORMAL',
          child: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            status: 'CHECKED_IN'
          },
          isRead: false
        },
        {
          id: '2',
          type: 'PHOTO_AVAILABLE',
          title: 'New Photo Available',
          message: 'A new photo of Emma is ready for download',
          timestamp: '10 minutes ago',
          priority: 'LOW',
          child: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            status: 'CHECKED_IN'
          },
          isRead: false
        }
      ]);

      // Load photos
      setPhotos([
        {
          id: '1',
          photoUrl: 'https://images.ctfassets.net/0ls885pa980u/Gxcz0brBgwIgeUq1FjfGz/0c35c8dc54c5298a1abec3a27309a6a7/freestanding-playground-equipment-reference-image.jpg',
          thumbnailUrl: 'https://image.shutterstock.com/image-vector/children-playing-playground-equipment-260nw-1487653082.jpg',
          capturedAt: '15 minutes ago',
          child: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            status: 'CHECKED_IN'
          },
          venue: {
            name: 'Adventure Playground'
          },
          isViewed: false,
          recognitionConfidence: 96.7
        },
        {
          id: '2',
          photoUrl: 'https://i.pinimg.com/originals/9b/81/10/9b811043030741e4e4fb23589499ab8e.jpg',
          thumbnailUrl: 'https://static.vecteezy.com/system/resources/previews/047/064/221/non_2x/a-young-boy-swings-on-a-playground-swing-set-laughing-with-delight-photo.jpeg',
          capturedAt: '1 hour ago',
          child: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            status: 'CHECKED_IN'
          },
          venue: {
            name: 'Adventure Playground'
          },
          isViewed: true,
          recognitionConfidence: 94.2
        }
      ]);

      setUnreadCount(alerts.filter(a => !a.isRead).length + photos.filter(p => !p.isViewed).length);
      setLastSync(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const setupNetworkMonitoring = () => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  };

  const setupBatteryMonitoring = () => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleEmergency = () => {
    // Handle emergency alert
    alert('Emergency alert sent!');
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const activeChildren = children.filter(child => child.status === 'CHECKED_IN');
  const totalChildren = children.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 relative">
      {/* Mobile Header */}
      <MobileHeader 
        isOnline={isOnline}
        batteryLevel={batteryLevel}
        notificationsEnabled={notificationsEnabled}
        unreadCount={unreadCount}
        onToggleNotifications={handleToggleNotifications}
        lastSync={lastSync}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Main Content */}
      <div className="px-4 pt-6 space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome Back, {session?.user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600">
            {activeChildren.length} of {totalChildren} children are currently active
          </p>
        </motion.div>

        {/* Emergency Button */}
        <MobileEmergencyButton onClick={handleEmergency} />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm text-center"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Baby className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalChildren}</p>
            <p className="text-xs text-gray-500">Children</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 shadow-sm text-center"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeChildren.length}</p>
            <p className="text-xs text-gray-500">Active</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-4 shadow-sm text-center"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Camera className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{photos.filter(p => !p.isViewed).length}</p>
            <p className="text-xs text-gray-500">New Photos</p>
          </motion.div>
        </div>

        {/* Children Status Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Children</h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="text-blue-600 text-sm font-medium"
            >
              View All
            </motion.button>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {children.map((child, index) => (
                <MobileChildCard 
                  key={child.id} 
                  child={child} 
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Actions */}
        <MobileQuickActions />

        {/* Real-time Alert Feed */}
        <MobileAlertFeed alerts={alerts} />

        {/* Recent Photos */}
        <MobilePhotoCarousel photos={photos} />

        {/* Offline Indicator */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-4 right-4 bg-yellow-500 text-white p-3 rounded-lg shadow-lg flex items-center space-x-2 z-40"
            >
              <WifiOff className="h-5 w-5" />
              <span className="text-sm font-medium">You're offline. Some features may be limited.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav activeTab="dashboard" />
    </div>
  );
}
