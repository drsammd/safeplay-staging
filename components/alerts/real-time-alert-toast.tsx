
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Eye, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'IMMEDIATE';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED' | 'EXPIRED';
  escalationLevel: number;
  createdAt: string;
  child?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    parent?: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
  };
  venue: {
    id: string;
    name: string;
  };
  zone?: {
    id: string;
    name: string;
    type: string;
    coordinates?: any;
  };
  acknowledgments: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      role: string;
    };
    acknowledgedAt: string;
    response?: string;
  }>;
  notifications: Array<{
    id: string;
    channel: string;
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'CANCELLED';
    sentAt?: string;
    recipient: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
  }>;
  timeline: Array<{
    id: string;
    eventType: string;
    description: string;
    timestamp: string;
    performer?: {
      id: string;
      name: string;
      role: string;
    };
  }>;
}

interface RealTimeAlertToastProps {
  alert: Alert;
  isVisible: boolean;
  onDismiss: () => void;
  onAcknowledge: (alertId: string) => void;
  onViewDetails: (alert: Alert) => void;
  userRole: string;
}

export function RealTimeAlertToast({
  alert,
  isVisible,
  onDismiss,
  onAcknowledge,
  onViewDetails,
  userRole
}: RealTimeAlertToastProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (isVisible) {
      // Auto-dismiss after 10 seconds for non-critical alerts
      if (alert.severity !== 'CRITICAL' && alert.severity !== 'EMERGENCY') {
        const timer = setTimeout(() => {
          onDismiss();
        }, 10000);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, alert.severity, onDismiss]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'EMERGENCY': return 'bg-red-600 border-red-600';
      case 'CRITICAL': return 'bg-red-500 border-red-500';
      case 'HIGH': return 'bg-orange-500 border-orange-500';
      case 'MEDIUM': return 'bg-yellow-500 border-yellow-500';
      case 'LOW': return 'bg-blue-500 border-blue-500';
      default: return 'bg-gray-500 border-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'EMERGENCY':
      case 'CRITICAL':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'HIGH':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-blue-600" />;
    }
  };

  const shouldShowPhoneOption = alert.severity === 'CRITICAL' || alert.severity === 'EMERGENCY';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white border-l-4 rounded-lg shadow-lg overflow-hidden ${getSeverityColor(alert.severity)}`}
        >
          {/* Alert indicator - animated pulse for critical alerts */}
          {(alert.severity === 'CRITICAL' || alert.severity === 'EMERGENCY') && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute top-0 left-0 w-full h-1 bg-red-500"
            />
          )}

          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getSeverityIcon(alert.severity)}
                <Badge className={`${getSeverityColor(alert.severity)} text-white`}>
                  {alert.severity}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(alert.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Alert Content */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm">{alert.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {alert.description}
                </p>
              </div>

              {/* Child Info */}
              {alert.child && (
                <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={alert.child.profilePhoto} />
                    <AvatarFallback className="text-xs">
                      {alert.child.firstName[0]}{alert.child.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">
                    {alert.child.firstName} {alert.child.lastName}
                  </span>
                </div>
              )}

              {/* Location Info */}
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{alert.venue.name}</span>
                {alert.zone && (
                  <>
                    <span>•</span>
                    <span>{alert.zone.name}</span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewDetails(alert)}
                  className="flex-1 text-xs h-8"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>

                {userRole !== 'PARENT' && alert.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    onClick={() => onAcknowledge(alert.id)}
                    className="flex-1 text-xs h-8"
                  >
                    Acknowledge
                  </Button>
                )}

                {shouldShowPhoneOption && alert.child?.parent && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // In a real app, this would initiate a phone call
                      toast({
                        title: "Call Initiated",
                        description: `Calling ${alert.child?.parent?.name}...`,
                      });
                    }}
                    className="text-xs h-8 px-2"
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar for auto-dismiss */}
          {alert.severity !== 'CRITICAL' && alert.severity !== 'EMERGENCY' && (
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 10, ease: "linear" }}
              className="h-1 bg-blue-500"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
