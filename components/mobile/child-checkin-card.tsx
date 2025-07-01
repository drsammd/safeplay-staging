
"use client";

import { CheckCircle, Clock, MapPin, LogIn, LogOut, User } from "lucide-react";
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
  lastCheckIn?: string;
  checkInTime?: string;
}

interface ChildCheckInCardProps {
  child: Child;
  index: number;
  onAction: (childId: string, venueId: string, action: 'CHECK_IN' | 'CHECK_OUT') => void;
  isProcessing: boolean;
}

export function ChildCheckInCard({ child, index, onAction, isProcessing }: ChildCheckInCardProps) {
  const isCheckedIn = child.status === 'CHECKED_IN';
  
  const handleAction = () => {
    if (isProcessing) return;
    
    const action = isCheckedIn ? 'CHECK_OUT' : 'CHECK_IN';
    const venueId = 'venue1'; // Default venue for manual check-in
    onAction(child.id, venueId, action);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all duration-200 ${
        isCheckedIn 
          ? 'border-green-200 bg-green-50' 
          : 'border-gray-100'
      }`}
    >
      <div className="flex items-center space-x-4">
        {/* Profile Photo */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border-3 border-white shadow-sm">
            {child.profilePhoto ? (
              <Image
                src={child.profilePhoto}
                alt={`${child.firstName} ${child.lastName}`}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          
          {/* Status Indicator */}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
            isCheckedIn ? 'bg-green-500' : 'bg-gray-400'
          }`}>
            {isCheckedIn ? (
              <CheckCircle className="w-3 h-3 text-white" />
            ) : (
              <Clock className="w-3 h-3 text-white" />
            )}
          </div>
        </div>

        {/* Child Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {child.firstName} {child.lastName}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isCheckedIn 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {isCheckedIn ? 'Checked In' : 'Available'}
            </span>
          </div>
          
          {/* Location/Time Info */}
          {isCheckedIn && child.currentVenue ? (
            <div className="space-y-1">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{child.currentVenue.name}</span>
              </div>
              {child.checkInTime && (
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>{child.checkInTime}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Ready for venue check-in</p>
          )}
        </div>

        {/* Action Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAction}
          disabled={isProcessing}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
            isCheckedIn
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <>
              {isCheckedIn ? (
                <LogOut className="h-4 w-4" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              <span>
                {isCheckedIn ? 'Check Out' : 'Check In'}
              </span>
            </>
          )}
        </motion.button>
      </div>
      
      {/* Additional Info */}
      {isCheckedIn && child.currentVenue && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Location: {child.currentVenue.address}</span>
            <span className="text-green-600 font-medium">● Active</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
