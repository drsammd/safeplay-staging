
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Filter,
  RefreshCw,
  Bell,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDetailModal } from './alert-detail-modal';
import { useToast } from '@/hooks/use-toast';

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
  };
  venue: {
    id: string;
    name: string;
  };
  camera?: {
    id: string;
    name: string;
    position?: any;
  };
  zone?: {
    id: string;
    name: string;
    type: string;
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
}

interface AlertDashboardProps {
  venueId?: string;
  userRole: string;
  userId: string;
}

export function AlertDashboard({ venueId, userRole, userId }: AlertDashboardProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    type: 'all'
  });
  const [stats, setStats] = useState({
    active: 0,
    acknowledged: 0,
    resolved: 0,
    escalated: 0
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
    // Set up real-time updates
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [filters, venueId]);

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.severity !== 'all') params.append('severity', filters.severity);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (venueId) params.append('venueId', venueId);

      const response = await fetch(`/api/enhanced-alerts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      
      const data = await response.json();
      setAlerts(data.alerts || []);
      
      // Calculate stats
      const alertStats = {
        active: data.alerts?.filter((a: Alert) => a.status === 'ACTIVE').length || 0,
        acknowledged: data.alerts?.filter((a: Alert) => a.status === 'ACKNOWLEDGED').length || 0,
        resolved: data.alerts?.filter((a: Alert) => a.status === 'RESOLVED').length || 0,
        escalated: data.alerts?.filter((a: Alert) => a.status === 'ESCALATED').length || 0,
      };
      setStats(alertStats);
      
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string, response?: string) => {
    try {
      const result = await fetch(`/api/enhanced-alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response }),
      });

      if (!result.ok) throw new Error('Failed to acknowledge alert');

      toast({
        title: "Success",
        description: "Alert acknowledged successfully",
      });

      // Refresh alerts
      await fetchAlerts();
      
      // Update selected alert if it's the one being acknowledged
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(null);
      }

    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <AlertTriangle className="h-4 w-4" />;
      case 'ACKNOWLEDGED': return <Eye className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />;
      case 'ESCALATED': return <AlertCircle className="h-4 w-4" />;
      case 'RESOLVED': return <CheckCircle className="h-4 w-4" />;
      case 'DISMISSED': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.acknowledged}</p>
                  <p className="text-sm text-muted-foreground">Acknowledged</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.escalated}</p>
                  <p className="text-sm text-muted-foreground">Escalated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Alert Management</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="ESCALATED">Escalated</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={fetchAlerts}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2 p-4">
            <AnimatePresence>
              {alerts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground"
                >
                  No alerts found matching the current filters.
                </motion.div>
              ) : (
                alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      alert.status === 'ACTIVE' ? 'border-red-200 bg-red-50' :
                      alert.status === 'ESCALATED' ? 'border-purple-200 bg-purple-50' :
                      'border-gray-200'
                    }`}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(alert.status)}>
                            {getStatusIcon(alert.status)}
                            <span className="ml-1">{alert.status}</span>
                          </Badge>
                          {alert.escalationLevel > 0 && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800">
                              Level {alert.escalationLevel}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg">{alert.title}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{alert.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{alert.venue.name}</span>
                          {alert.child && (
                            <span>Child: {alert.child.firstName} {alert.child.lastName}</span>
                          )}
                          {alert.zone && (
                            <span>Zone: {alert.zone.name}</span>
                          )}
                          <span>{new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        {alert.acknowledgments.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Acknowledged by {alert.acknowledgments[0].user.name}
                          </div>
                        )}
                        
                        {userRole !== 'PARENT' && alert.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledgeAlert(alert.id);
                            }}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={handleAcknowledgeAlert}
          userRole={userRole}
          userId={userId}
        />
      )}
    </div>
  );
}
