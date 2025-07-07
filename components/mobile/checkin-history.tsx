
"use client";

import { X, CheckCircle, Clock, MapPin, QrCode, Smartphone, User, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  profilePhoto?: string;
}

interface CheckInOutEvent {
  id: string;
  child: Child;
  venue: {
    id: string;
    name: string;
    address: string;
  };
  eventType: 'CHECK_IN' | 'CHECK_OUT';
  method: string;
  timestamp: string;
  duration?: number;
  authorizedBy?: string;
  qrCode?: string;
}

interface CheckInOutHistoryProps {
  history: CheckInOutEvent[];
  onClose: () => void;
}

export function CheckInOutHistory({ history, onClose }: CheckInOutHistoryProps) {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'QR_CODE':
        return QrCode;
      case 'PARENT_APP':
        return Smartphone;
      case 'STAFF_MANUAL':
        return User;
      default:
        return Clock;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'QR_CODE':
        return 'text-purple-600 bg-purple-100';
      case 'PARENT_APP':
        return 'text-blue-600 bg-blue-100';
      case 'STAFF_MANUAL':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Group events by date
  const groupedHistory = history.reduce((groups, event) => {
    // Simple date grouping for demo
    const date = event.timestamp.includes('today') ? 'Today' : 
                 event.timestamp.includes('Yesterday') ? 'Yesterday' : 
                 'Earlier';
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, CheckInOutEvent[]>);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Check-In History</h3>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </motion.button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {Object.entries(groupedHistory).map(([date, events]) => (
            <div key={date} className="space-y-3">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {date}
              </h4>
              
              <div className="space-y-3">
                {events.map((event, index) => {
                  const MethodIcon = getMethodIcon(event.method);
                  const methodColor = getMethodColor(event.method);
                  
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                    >
                      <div className="flex items-start space-x-4">
                        {/* Child Profile */}
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                            {event.child.profilePhoto ? (
                              <Image
                                src={event.child.profilePhoto}
                                alt={event.child.firstName}
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                <User className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>
                          
                          {/* Event Type Indicator */}
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                            event.eventType === 'CHECK_IN' ? 'bg-green-500' : 'bg-blue-500'
                          }`}>
                            {event.eventType === 'CHECK_IN' ? (
                              <CheckCircle className="w-2.5 h-2.5 text-white" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                        </div>
                        
                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900 text-sm">
                              {event.child.firstName} {event.child.lastName}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              event.eventType === 'CHECK_IN' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {event.eventType === 'CHECK_IN' ? 'Checked In' : 'Checked Out'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{event.venue?.name || 'Unknown Venue'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{event.timestamp}</span>
                          </div>
                          
                          {/* Method and Duration */}
                          <div className="flex items-center justify-between">
                            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${methodColor}`}>
                              <MethodIcon className="h-3 w-3" />
                              <span>
                                {event.method === 'QR_CODE' ? 'QR Code' : 
                                 event.method === 'PARENT_APP' ? 'Parent App' : 
                                 'Staff Manual'}
                              </span>
                            </div>
                            
                            {event.duration && (
                              <span className="text-xs text-gray-500 font-medium">
                                Duration: {formatDuration(event.duration)}
                              </span>
                            )}
                          </div>
                          
                          {/* Additional Info */}
                          {(event.authorizedBy || event.qrCode) && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              {event.authorizedBy && (
                                <p className="text-xs text-gray-500">
                                  Authorized by: {event.authorizedBy}
                                </p>
                              )}
                              {event.qrCode && (
                                <p className="text-xs text-gray-500">
                                  QR Code: {event.qrCode}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {history.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No History Yet</h3>
              <p className="text-gray-600">
                Check-in and check-out events will appear here
              </p>
            </div>
          )}
        </div>
        
        {/* Summary Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="font-medium text-gray-900">{history.length}</p>
                <p className="text-gray-500">Total Events</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {history.filter(e => e.eventType === 'CHECK_IN').length}
                </p>
                <p className="text-gray-500">Check-ins</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {history.filter(e => e.method === 'QR_CODE').length}
                </p>
                <p className="text-gray-500">QR Scans</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
