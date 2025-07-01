
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  MapPin,
  Camera,
  Phone,
  Mail,
  MessageSquare,
  X,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface Alert {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'IMMEDIATE';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED' | 'EXPIRED';
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
    address?: string;
    phone?: string;
    email?: string;
  };
  camera?: {
    id: string;
    name: string;
    position?: any;
    ipAddress?: string;
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
    status: string;
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
  escalationLevel: number;
  responseTime?: number;
  imageUrls?: string[];
  videoUrls?: string[];
  lastSeenLocation?: any;
  lastSeenTime?: string;
  location?: any;
}

interface AlertDetailModalProps {
  alert: Alert;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (alertId: string, response?: string) => Promise<void>;
  userRole: string;
  userId: string;
}

export function AlertDetailModal({ 
  alert, 
  isOpen, 
  onClose, 
  onAcknowledge, 
  userRole, 
  userId 
}: AlertDetailModalProps) {
  const [acknowledgeResponse, setAcknowledgeResponse] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await onAcknowledge(alert.id, acknowledgeResponse);
      onClose();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    } finally {
      setAcknowledging(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'EMERGENCY': return 'bg-red-600 text-white';
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-red-100 text-red-800';
      case 'ACKNOWLEDGED': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'ESCALATED': return 'bg-purple-100 text-purple-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'DISMISSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'CREATED': return <AlertTriangle className="h-4 w-4" />;
      case 'ACKNOWLEDGED': return <Eye className="h-4 w-4" />;
      case 'ESCALATED': return <AlertCircle className="h-4 w-4" />;
      case 'RESOLVED': return <CheckCircle className="h-4 w-4" />;
      case 'STATUS_CHANGED': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const isAlreadyAcknowledged = alert.acknowledgments.some(ack => ack.user.id === userId);
  const canAcknowledge = userRole !== 'PARENT' && alert.status === 'ACTIVE' && !isAlreadyAcknowledged;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-xl">{alert.title}</DialogTitle>
              <Badge className={getSeverityColor(alert.severity)}>
                {alert.severity}
              </Badge>
              <Badge variant="outline" className={getStatusColor(alert.status)}>
                {alert.status}
              </Badge>
              {alert.escalationLevel > 0 && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  Escalation Level {alert.escalationLevel}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Alert Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alert Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Alert Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{alert.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-1">Type</h4>
                    <p className="text-sm text-muted-foreground">{alert.type.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Priority</h4>
                    <p className="text-sm text-muted-foreground">{alert.priority}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Created</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {alert.responseTime && (
                    <div>
                      <h4 className="font-semibold mb-1">Response Time</h4>
                      <p className="text-sm text-muted-foreground">
                        {Math.floor(alert.responseTime / 60)}m {alert.responseTime % 60}s
                      </p>
                    </div>
                  )}
                </div>

                {/* Location Information */}
                {(alert.venue || alert.camera || alert.zone) && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Venue:</span>
                        <span className="text-muted-foreground">{alert.venue.name}</span>
                      </div>
                      {alert.zone && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Zone:</span>
                          <span className="text-muted-foreground">{alert.zone.name} ({alert.zone.type})</span>
                        </div>
                      )}
                      {alert.camera && (
                        <div className="flex items-center space-x-2">
                          <Camera className="h-4 w-4" />
                          <span className="font-medium">Camera:</span>
                          <span className="text-muted-foreground">{alert.camera.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Images */}
                {alert.imageUrls && alert.imageUrls.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Associated Images</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {alert.imageUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Alert image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alert.timeline?.map((entry, index) => (
                    <div key={entry.id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          {getEventTypeIcon(entry.eventType)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{entry.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                          <span>{new Date(entry.timestamp).toLocaleString()}</span>
                          {entry.performer && (
                            <>
                              <span>•</span>
                              <span>{entry.performer.name} ({entry.performer.role})</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Child Information */}
            {alert.child && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Child Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={alert.child.profilePhoto} />
                      <AvatarFallback>
                        {alert.child.firstName[0]}{alert.child.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{alert.child.firstName} {alert.child.lastName}</p>
                      <p className="text-sm text-muted-foreground">Child ID: {alert.child.id}</p>
                    </div>
                  </div>

                  {alert.child.parent && (
                    <div>
                      <h4 className="font-semibold mb-2">Parent Contact</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{alert.child.parent.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">{alert.child.parent.email}</span>
                        </div>
                        {alert.child.parent.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">{alert.child.parent.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {alert.lastSeenTime && (
                    <div>
                      <h4 className="font-semibold mb-1">Last Seen</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(alert.lastSeenTime).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Acknowledgments */}
            {alert.acknowledgments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>Acknowledgments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alert.acknowledgments.map((ack) => (
                      <div key={ack.id} className="border rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {ack.user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{ack.user.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {ack.user.role}
                          </Badge>
                        </div>
                        {ack.response && (
                          <p className="text-sm text-muted-foreground mb-2">{ack.response}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(ack.acknowledgedAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            {alert.notifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Notifications Sent</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {alert.notifications.map((notification) => (
                      <div key={notification.id} className="flex items-center justify-between text-sm">
                        <span>{notification.recipient.name}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.channel}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              notification.status === 'SENT' ? 'bg-green-100 text-green-800' :
                              notification.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {notification.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Acknowledge Alert */}
            {canAcknowledge && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Acknowledge Alert</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Optional response or action taken..."
                    value={acknowledgeResponse}
                    onChange={(e) => setAcknowledgeResponse(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleAcknowledge} 
                    disabled={acknowledging}
                    className="w-full"
                  >
                    {acknowledging ? 'Acknowledging...' : 'Acknowledge Alert'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
