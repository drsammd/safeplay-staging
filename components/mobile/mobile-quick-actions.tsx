
"use client";

import { QrCode, MapPin, Camera, Phone, Settings, Clock } from "lucide-react";
import { motion } from "framer-motion";

const quickActions = [
  {
    id: 'qr-scan',
    icon: QrCode,
    label: 'QR Scan',
    description: 'Check-in/out',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  {
    id: 'track-location',
    icon: MapPin,
    label: 'Track',
    description: 'Live location',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  {
    id: 'view-photos',
    icon: Camera,
    label: 'Photos',
    description: 'New memories',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  {
    id: 'emergency-contacts',
    icon: Phone,
    label: 'Contacts',
    description: 'Emergency',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600'
  }
];

export function MobileQuickActions() {
  const handleActionPress = (actionId: string) => {
    switch (actionId) {
      case 'qr-scan':
        // Navigate to QR scanner
        window.location.href = '/parent/mobile/checkin';
        break;
      case 'track-location':
        // Navigate to location tracking
        window.location.href = '/parent/mobile/location';
        break;
      case 'view-photos':
        // Navigate to photo gallery
        window.location.href = '/parent/mobile/photos';
        break;
      case 'emergency-contacts':
        // Navigate to emergency contacts
        window.location.href = '/parent/mobile/emergency';
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg bg-gray-50 text-gray-500"
        >
          <Settings className="h-4 w-4" />
        </motion.button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleActionPress(action.id)}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:shadow-md transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${action.lightColor} rounded-lg flex items-center justify-center`}>
                <action.icon className={`h-6 w-6 ${action.textColor}`} />
              </div>
              
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {action.label}
                </h3>
                <p className="text-xs text-gray-500">
                  {action.description}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
      
      {/* Recent Activity Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Clock className="h-5 w-5 text-indigo-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 text-sm">Today's Activity</h3>
            <p className="text-xs text-gray-600">2 check-ins • 3 photos • 1 alert</p>
          </div>
          
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-3 h-3 bg-green-500 rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
