
"use client";

import { useState, useEffect } from "react";
import { Phone, X, PhoneCall, MessageCircle, AlertTriangle, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  isPrimary: boolean;
}

interface EmergencyCallModalProps {
  contact: EmergencyContact;
  onClose: () => void;
  isEmergency?: boolean;
}

export function EmergencyCallModal({ contact, onClose, isEmergency = false }: EmergencyCallModalProps) {
  const [callStatus, setCallStatus] = useState<'preparing' | 'calling' | 'connected' | 'ended'>('preparing');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    // Auto-start call after 2 seconds for emergency
    if (isEmergency) {
      const timer = setTimeout(() => {
        handleStartCall();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isEmergency]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [callStatus]);

  const handleStartCall = () => {
    setCallStatus('calling');
    
    // Simulate call connection
    setTimeout(() => {
      setCallStatus('connected');
    }, 3000);
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusConfig = () => {
    switch (callStatus) {
      case 'preparing':
        return {
          title: isEmergency ? 'Emergency Call' : 'Calling Contact',
          subtitle: isEmergency ? 'Preparing to call primary contact' : 'Ready to call',
          color: isEmergency ? 'bg-red-500' : 'bg-blue-500',
          icon: Phone
        };
      case 'calling':
        return {
          title: 'Calling...',
          subtitle: `Calling ${contact.name}`,
          color: 'bg-orange-500',
          icon: PhoneCall
        };
      case 'connected':
        return {
          title: 'Connected',
          subtitle: `Speaking with ${contact.name}`,
          color: 'bg-green-500',
          icon: PhoneCall
        };
      case 'ended':
        return {
          title: 'Call Ended',
          subtitle: 'Call completed',
          color: 'bg-gray-500',
          icon: Phone
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
      >
        {/* Emergency Alert */}
        {isEmergency && callStatus === 'preparing' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center justify-center space-x-2 text-red-700 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Emergency Mode</span>
            </div>
            <p className="text-sm text-red-600">
              Automatically calling your primary emergency contact
            </p>
          </div>
        )}

        {/* Contact Avatar */}
        <div className="relative mb-6">
          <div className={`w-24 h-24 ${statusConfig.color} rounded-full mx-auto flex items-center justify-center mb-4`}>
            <motion.div
              animate={callStatus === 'calling' ? { rotate: 360 } : {}}
              transition={callStatus === 'calling' ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
            >
              <StatusIcon className="h-12 w-12 text-white" />
            </motion.div>
          </div>
          
          {/* Pulse Animation for calling */}
          {callStatus === 'calling' && (
            <>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`absolute inset-0 w-24 h-24 ${statusConfig.color} rounded-full mx-auto opacity-30`}
              />
              <motion.div
                animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                className={`absolute inset-0 w-24 h-24 ${statusConfig.color} rounded-full mx-auto opacity-20`}
              />
            </>
          )}
        </div>

        {/* Call Info */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {statusConfig.title}
          </h3>
          <p className="text-gray-600 mb-1">{statusConfig.subtitle}</p>
          <p className="text-lg font-medium text-gray-900">{contact.phoneNumber}</p>
          <p className="text-sm text-gray-500">{contact.relationship}</p>
        </div>

        {/* Call Duration */}
        {callStatus === 'connected' && (
          <div className="mb-6 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-green-700">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-lg">{formatDuration(callDuration)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {callStatus === 'preparing' && !isEmergency && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStartCall}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              <PhoneCall className="h-5 w-5" />
              <span>Start Call</span>
            </motion.button>
          )}

          {callStatus === 'calling' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleEndCall}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              <X className="h-5 w-5" />
              <span>Cancel Call</span>
            </motion.button>
          )}

          {callStatus === 'connected' && (
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleEndCall}
                className="bg-red-500 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <Phone className="h-4 w-4" />
                <span>End Call</span>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="bg-blue-500 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Message</span>
              </motion.button>
            </div>
          )}

          {(callStatus === 'preparing' || callStatus === 'ended') && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
            >
              {callStatus === 'ended' ? 'Close' : 'Cancel'}
            </motion.button>
          )}
        </div>

        {/* Emergency Instructions */}
        {isEmergency && callStatus !== 'ended' && (
          <div className="mt-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-700">
              <strong>Emergency Protocol:</strong> If this contact doesn't answer, 
              we'll automatically try the next contact in your list.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
