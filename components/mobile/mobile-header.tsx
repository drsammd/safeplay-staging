
"use client";

import { 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryLow, 
  Bell, 
  BellOff, 
  RefreshCw,
  Signal,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

interface MobileHeaderProps {
  isOnline: boolean;
  batteryLevel: number;
  notificationsEnabled: boolean;
  unreadCount: number;
  onToggleNotifications: () => void;
  lastSync: Date;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function MobileHeader({
  isOnline,
  batteryLevel,
  notificationsEnabled,
  unreadCount,
  onToggleNotifications,
  lastSync,
  isRefreshing,
  onRefresh
}: MobileHeaderProps) {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const getBatteryIcon = () => {
    if (batteryLevel <= 20) {
      return <BatteryLow className="h-4 w-4 text-red-500" />;
    }
    return <Battery className="h-4 w-4 text-gray-600" />;
  };

  const getBatteryColor = () => {
    if (batteryLevel <= 20) return 'text-red-500';
    if (batteryLevel <= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-sm">
        {/* Left side - Time and Network */}
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-gray-900">{currentTime}</span>
          <div className="flex items-center space-x-1">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-gray-600" />
                <Signal className="h-4 w-4 text-gray-600" />
              </>
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Right side - Battery and Notifications */}
        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <button
            onClick={onToggleNotifications}
            className="relative"
          >
            {notificationsEnabled ? (
              <Bell className="h-4 w-4 text-gray-600" />
            ) : (
              <BellOff className="h-4 w-4 text-gray-400" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Battery */}
          <div className="flex items-center space-x-1">
            {getBatteryIcon()}
            <span className={`text-xs font-medium ${getBatteryColor()}`}>
              {batteryLevel}%
            </span>
          </div>
        </div>
      </div>

      {/* App Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">SafePlay</h1>
          <p className="text-xs text-gray-500">
            Last sync: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-full bg-blue-50 text-blue-600 disabled:opacity-50"
        >
          <RefreshCw 
            className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
        </motion.button>
      </div>
    </div>
  );
}
