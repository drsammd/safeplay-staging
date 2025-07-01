
"use client";

import { Bell, AlertTriangle, Camera, MapPin, Clock, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
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

interface MobileAlertFeedProps {
  alerts: Alert[];
}

export function MobileAlertFeed({ alerts }: MobileAlertFeedProps) {
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'CHILD_DETECTED':
        return <MapPin className="h-4 w-4" />;
      case 'PHOTO_AVAILABLE':
        return <Camera className="h-4 w-4" />;
      case 'EMERGENCY_ALERT':
        return <AlertTriangle className="h-4 w-4" />;
      case 'CHILD_CHECK_IN':
      case 'CHILD_CHECK_OUT':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertConfig = (type: string, priority: string) => {
    if (priority === 'EMERGENCY') {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100'
      };
    }
    
    switch (type) {
      case 'CHILD_DETECTED':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100'
        };
      case 'PHOTO_AVAILABLE':
        return {
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          iconColor: 'text-purple-600',
          iconBg: 'bg-purple-100'
        };
      case 'CHILD_CHECK_IN':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          iconBg: 'bg-gray-100'
        };
    }
  };

  const handleAlertPress = (alertId: string) => {
    setReadAlerts(prev => new Set([...prev, alertId]));
    // Handle alert action based on type
  };

  const unreadAlerts = alerts.filter(alert => !alert.isRead && !readAlerts.has(alert.id));
  const recentAlerts = alerts.slice(0, 5); // Show only 5 most recent

  if (alerts.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
        <div className="bg-white rounded-xl p-6 text-center">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No recent activity</p>
          <p className="text-sm text-gray-400 mt-1">
            You'll see updates about your children here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
        {unreadAlerts.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{unreadAlerts.length} new</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-red-500 rounded-full"
            />
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <AnimatePresence>
          {recentAlerts.map((alert, index) => {
            const config = getAlertConfig(alert.type, alert.priority);
            const isUnread = !alert.isRead && !readAlerts.has(alert.id);
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAlertPress(alert.id)}
                className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${config.borderColor} ${
                  isUnread ? 'shadow-md' : ''
                } active:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 ${config.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <div className={config.iconColor}>
                      {getAlertIcon(alert.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {alert.title}
                      </h3>
                      {isUnread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{alert.timestamp}</span>
                      </div>
                      
                      {alert.child && (
                        <span className="font-medium">
                          {alert.child.firstName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {alerts.length > 5 && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full py-3 text-blue-600 font-medium text-sm bg-blue-50 rounded-lg active:bg-blue-100 transition-colors"
        >
          View All Activity ({alerts.length} total)
        </motion.button>
      )}
    </div>
  );
}
