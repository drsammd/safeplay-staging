
"use client";

import { MapPin, Clock, Shield, AlertCircle } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

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

interface MobileChildCardProps {
  child: Child;
  index: number;
}

export function MobileChildCard({ child, index }: MobileChildCardProps) {
  const isActive = child.status === 'CHECKED_IN';
  
  const getStatusConfig = () => {
    switch (child.status) {
      case 'CHECKED_IN':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: <Shield className="h-4 w-4 text-green-600" />,
          text: 'Safe & Active'
        };
      case 'CHECKED_OUT':
        return {
          color: 'bg-gray-400',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: <Clock className="h-4 w-4 text-gray-500" />,
          text: 'Not Active'
        };
      default:
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
          text: 'Unknown'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-xl p-4 shadow-sm border-2 ${statusConfig.borderColor} active:shadow-md transition-all duration-200`}
    >
      <div className="flex items-center space-x-4">
        {/* Profile Photo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border-3 border-white shadow-sm">
            {child.profilePhoto ? (
              <Image
                src={child.profilePhoto}
                alt={`${child.firstName} ${child.lastName}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {child.firstName[0]}
                </span>
              </div>
            )}
          </div>
          
          {/* Status Indicator */}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${statusConfig.color} rounded-full border-2 border-white flex items-center justify-center`}>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Child Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {child.firstName} {child.lastName}
            </h3>
            {isActive && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
            )}
          </div>
          
          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} mb-2`}>
            {statusConfig.icon}
            <span>{statusConfig.text}</span>
          </div>

          {/* Location/Time Info */}
          {isActive && child.currentVenue ? (
            <div className="space-y-1">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{child.currentVenue.name}</span>
              </div>
              {child.checkInTime && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>Since {child.checkInTime}</span>
                </div>
              )}
            </div>
          ) : (
            child.lastSeen && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>Last seen {child.lastSeen}</span>
              </div>
            )
          )}
        </div>

        {/* Quick Action Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`p-2 rounded-lg ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}
        >
          <MapPin className="h-5 w-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
