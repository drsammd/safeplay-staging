
"use client";

import { useEffect, useState } from "react";
import { QrCode, Clock, MapPin, Users, CheckCircle, AlertCircle, Camera, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { QRScanner } from "@/components/mobile/qr-scanner";
import { CheckInOutHistory } from "@/components/mobile/checkin-history";
import { ChildCheckInCard } from "@/components/mobile/child-checkin-card";

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

export default function MobileCheckInPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [checkInHistory, setCheckInHistory] = useState<CheckInOutEvent[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadCheckInData();
  }, []);

  const loadCheckInData = async () => {
    try {
      // Mock data for demonstration
      setChildren([
        {
          id: '1',
          firstName: 'Emma',
          lastName: 'Johnson',
          status: 'CHECKED_IN',
          profilePhoto: 'https://i.pinimg.com/originals/32/2e/cf/322ecf6c1eecef557e63223dc638ade6.jpg',
          currentVenue: {
            id: 'venue1',
            name: 'Adventure Playground',
            address: '123 Play Street'
          },
          lastCheckIn: '2:30 PM',
          checkInTime: '2 hours ago'
        },
        {
          id: '2',
          firstName: 'Lucas',
          lastName: 'Johnson',
          status: 'CHECKED_OUT',
          profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        }
      ]);

      setCheckInHistory([
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
          eventType: 'CHECK_IN',
          method: 'QR_CODE',
          timestamp: '2:30 PM today',
          authorizedBy: 'Staff Member',
          qrCode: 'QR-ENTRY-001'
        },
        {
          id: '2',
          child: {
            id: '2',
            firstName: 'Lucas',
            lastName: 'Johnson',
            status: 'CHECKED_OUT'
          },
          venue: {
            id: 'venue1',
            name: 'Adventure Playground',
            address: '123 Play Street'
          },
          eventType: 'CHECK_OUT',
          method: 'PARENT_APP',
          timestamp: '1:15 PM today',
          duration: 180 // minutes
        },
        {
          id: '3',
          child: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            status: 'CHECKED_OUT'
          },
          venue: {
            id: 'venue2',
            name: 'Fun Zone',
            address: '456 Fun Avenue'
          },
          eventType: 'CHECK_OUT',
          method: 'QR_CODE',
          timestamp: 'Yesterday 5:45 PM',
          duration: 120,
          authorizedBy: 'Parent Pickup'
        }
      ]);
    } catch (error) {
      console.error('Error loading check-in data:', error);
    }
  };

  const handleQRScan = async (qrData: string) => {
    setIsProcessing(true);
    
    try {
      // Mock QR processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (qrData.includes('CHECK_IN')) {
        setLastAction({
          type: 'success',
          message: 'Check-in successful! Emma is now at Adventure Playground.'
        });
        
        // Update child status
        setChildren(prev => prev.map(child => 
          child.id === '1' 
            ? { 
                ...child, 
                status: 'CHECKED_IN',
                currentVenue: {
                  id: 'venue1',
                  name: 'Adventure Playground',
                  address: '123 Play Street'
                },
                checkInTime: 'Just now'
              }
            : child
        ));
      } else if (qrData.includes('CHECK_OUT')) {
        setLastAction({
          type: 'success',
          message: 'Check-out successful! Emma has left Adventure Playground.'
        });
        
        // Update child status
        setChildren(prev => prev.map(child => 
          child.id === '1' 
            ? { 
                ...child, 
                status: 'CHECKED_OUT',
                currentVenue: undefined,
                checkInTime: undefined
              }
            : child
        ));
      } else {
        setLastAction({
          type: 'error',
          message: 'Invalid QR code. Please scan a valid venue QR code.'
        });
      }
    } catch (error) {
      setLastAction({
        type: 'error',
        message: 'Failed to process QR code. Please try again.'
      });
    } finally {
      setIsProcessing(false);
      setShowQRScanner(false);
      
      // Clear action message after 3 seconds
      setTimeout(() => setLastAction(null), 3000);
    }
  };

  const handleManualCheckIn = async (childId: string, venueId: string, action: 'CHECK_IN' | 'CHECK_OUT') => {
    setIsProcessing(true);
    
    try {
      // Mock manual check-in/out
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const child = children.find(c => c.id === childId);
      if (!child) return;
      
      if (action === 'CHECK_IN') {
        setLastAction({
          type: 'success',
          message: `${child.firstName} checked in successfully!`
        });
      } else {
        setLastAction({
          type: 'success',
          message: `${child.firstName} checked out successfully!`
        });
      }
      
      // Update child status
      setChildren(prev => prev.map(c => 
        c.id === childId 
          ? {
              ...c,
              status: action === 'CHECK_IN' ? 'CHECKED_IN' : 'CHECKED_OUT',
              currentVenue: action === 'CHECK_IN' ? {
                id: 'venue1',
                name: 'Adventure Playground',
                address: '123 Play Street'
              } : undefined,
              checkInTime: action === 'CHECK_IN' ? 'Just now' : undefined
            }
          : c
      ));
      
      // Add to history
      const newEvent: CheckInOutEvent = {
        id: Date.now().toString(),
        child,
        venue: {
          id: 'venue1',
          name: 'Adventure Playground',
          address: '123 Play Street'
        },
        eventType: action,
        method: 'PARENT_APP',
        timestamp: 'Just now'
      };
      
      setCheckInHistory(prev => [newEvent, ...prev]);
      
    } catch (error) {
      setLastAction({
        type: 'error',
        message: 'Operation failed. Please try again.'
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setLastAction(null), 3000);
    }
  };

  const checkedInChildren = children.filter(child => child.status === 'CHECKED_IN');
  const checkedOutChildren = children.filter(child => child.status === 'CHECKED_OUT');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
      {/* Mobile Header */}
      <MobileHeader 
        isOnline={true}
        batteryLevel={85}
        notificationsEnabled={true}
        unreadCount={1}
        onToggleNotifications={() => {}}
        lastSync={new Date()}
        isRefreshing={false}
        onRefresh={() => {}}
      />

      {/* Page Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Check-In/Out</h1>
            <p className="text-gray-600">Manage venue access for your children</p>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHistory(true)}
            className="p-2 rounded-lg bg-white shadow-sm border border-gray-200"
          >
            <History className="h-5 w-5 text-gray-600" />
          </motion.button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{checkedInChildren.length}</p>
            <p className="text-xs text-gray-500">Checked In</p>
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{checkedOutChildren.length}</p>
            <p className="text-xs text-gray-500">Available</p>
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <History className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{checkInHistory.length}</p>
            <p className="text-xs text-gray-500">Events</p>
          </div>
        </div>

        {/* QR Scanner Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowQRScanner(true)}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 rounded-xl shadow-lg flex items-center justify-center space-x-3 mb-6 disabled:opacity-50"
        >
          <QrCode className="h-6 w-6" />
          <div className="text-left">
            <h3 className="font-semibold">Scan QR Code</h3>
            <p className="text-sm text-blue-100">Quick check-in/out at venues</p>
          </div>
          {isProcessing && (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          )}
        </motion.button>
      </div>

      {/* Action Result */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mx-4 mb-4 p-4 rounded-xl flex items-center space-x-3 ${
              lastAction.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {lastAction.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <p className={`font-medium text-sm ${
              lastAction.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {lastAction.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children Cards */}
      <div className="px-4 space-y-4">
        {/* Checked In Children */}
        {checkedInChildren.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Currently Checked In</span>
            </h2>
            
            {checkedInChildren.map((child, index) => (
              <ChildCheckInCard
                key={child.id}
                child={child}
                index={index}
                onAction={handleManualCheckIn}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        )}

        {/* Available Children */}
        {checkedOutChildren.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Available for Check-In</span>
            </h2>
            
            {checkedOutChildren.map((child, index) => (
              <ChildCheckInCard
                key={child.id}
                child={child}
                index={index}
                onAction={handleManualCheckIn}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        )}

        {/* Recent Activity */}
        {checkInHistory.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHistory(true)}
                className="text-blue-600 text-sm font-medium"
              >
                View All
              </motion.button>
            </div>
            
            <div className="space-y-2">
              {checkInHistory.slice(0, 3).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      event.eventType === 'CHECK_IN' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {event.eventType === 'CHECK_IN' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {event.child.firstName} {event.eventType === 'CHECK_IN' ? 'checked in' : 'checked out'}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{event.venue.name}</p>
                      <p className="text-xs text-gray-500">{event.timestamp}</p>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        event.method === 'QR_CODE' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {event.method === 'QR_CODE' ? 'QR Code' : 'Manual'}
                      </span>
                      {event.duration && (
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.floor(event.duration / 60)}h {event.duration % 60}m
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showQRScanner && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setShowQRScanner(false)}
            isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <CheckInOutHistory
            history={checkInHistory}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <MobileBottomNav activeTab="dashboard" />
    </div>
  );
}
