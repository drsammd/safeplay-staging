
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Users, 
  Settings, 
  Phone,
  Activity,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDashboard } from '@/components/alerts/alert-dashboard';
import { ChildSightingTimeline } from '@/components/alerts/child-sighting-timeline';
import { EmergencyContactsManager } from '@/components/alerts/emergency-contacts-manager';
import { RealTimeAlertToast } from '@/components/alerts/real-time-alert-toast';
import { AlertDetailModal } from '@/components/alerts/alert-detail-modal';
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
  escalationLevel: number;
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
  responseTime?: number;
  imageUrls?: string[];
  videoUrls?: string[];
  lastSeenLocation?: any;
  lastSeenTime?: string;
  location?: any;
}

export default function VenueAlertsPage() {
  const { data: session } = useSession();
  const [venue, setVenue] = useState<any>(null);
  const [realTimeAlert, setRealTimeAlert] = useState<Alert | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    childrenCheckedIn: 0,
    lastAlert: null as string | null
  });
  
  const { toast } = useToast();

  useEffect(() => {
    if (session?.user) {
      fetchVenue();
      fetchStats();
      
      // Set up real-time alert monitoring
      const alertInterval = setInterval(checkForNewAlerts, 30000);
      return () => clearInterval(alertInterval);
    }
  }, [session]);

  const fetchVenue = async () => {
    try {
      const response = await fetch('/api/venues');
      if (!response.ok) throw new Error('Failed to fetch venue');
      
      const data = await response.json();
      const userVenue = data.venues?.find((v: any) => v.adminId === session?.user?.id);
      setVenue(userVenue);
    } catch (error) {
      console.error('Error fetching venue:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [alertsResponse, childrenResponse] = await Promise.all([
        fetch('/api/enhanced-alerts?limit=1'),
        fetch('/api/children?status=CHECKED_IN')
      ]);

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setStats(prev => ({
          ...prev,
          totalAlerts: alertsData.total || 0,
          activeAlerts: alertsData.alerts?.filter((a: any) => a.status === 'ACTIVE').length || 0,
          lastAlert: alertsData.alerts?.[0]?.createdAt || null
        }));
      }

      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        setStats(prev => ({
          ...prev,
          childrenCheckedIn: childrenData.children?.length || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const checkForNewAlerts = async () => {
    try {
      const response = await fetch('/api/enhanced-alerts?status=ACTIVE&limit=1');
      if (!response.ok) return;
      
      const data = await response.json();
      const latestAlert = data.alerts?.[0];
      
      if (latestAlert && (!stats.lastAlert || new Date(latestAlert.createdAt) > new Date(stats.lastAlert))) {
        setRealTimeAlert(latestAlert);
        setStats(prev => ({ ...prev, lastAlert: latestAlert.createdAt }));
        
        // Play alert sound for critical alerts
        if (latestAlert.severity === 'CRITICAL' || latestAlert.severity === 'EMERGENCY') {
          try {
            const audio = new Audio('/alert-sound.mp3');
            audio.play().catch(() => {
              // Fallback if audio fails
              console.log('Alert sound failed to play');
            });
          } catch (error) {
            console.log('Audio not available');
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new alerts:', error);
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

      // Refresh stats
      await fetchStats();
      
      // Hide real-time alert if it's the one being acknowledged
      if (realTimeAlert?.id === alertId) {
        setRealTimeAlert(null);
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

  if (!session?.user || session.user.role !== 'VENUE_ADMIN') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              This page is only accessible to venue administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading venue information...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Safety Alert System</h1>
            <p className="text-muted-foreground">
              Real-time monitoring and alert management for {venue.name}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeAlerts}</p>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalAlerts}</p>
                  <p className="text-sm text-muted-foreground">Total Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.childrenCheckedIn}</p>
                  <p className="text-sm text-muted-foreground">Children Present</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {venue.cameras?.filter((c: any) => c.status === 'ONLINE').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Cameras Online</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Main Content */}
      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="sightings" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Child Activity</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>Emergency Contacts</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <AlertDashboard 
            venueId={venue.id} 
            userRole={session.user.role}
            userId={session.user.id}
          />
        </TabsContent>

        <TabsContent value="sightings">
          <ChildSightingTimeline 
            venueId={venue.id}
            userRole={session.user.role}
          />
        </TabsContent>

        <TabsContent value="contacts">
          <EmergencyContactsManager 
            venueId={venue.id}
            userRole={session.user.role}
          />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Alert System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Alert system configuration will be available in a future update.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Missing Child Threshold</h3>
                    <p className="text-sm text-muted-foreground">
                      Currently set to 30 minutes
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Notification Channels</h3>
                    <p className="text-sm text-muted-foreground">
                      SMS, Email, In-App
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real-time Alert Toast */}
      {realTimeAlert && (
        <RealTimeAlertToast
          alert={realTimeAlert}
          isVisible={!!realTimeAlert}
          onDismiss={() => setRealTimeAlert(null)}
          onAcknowledge={handleAcknowledgeAlert}
          onViewDetails={(alert) => {
            setSelectedAlert(alert);
            setRealTimeAlert(null);
          }}
          userRole={session.user.role}
        />
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={handleAcknowledgeAlert}
          userRole={session.user.role}
          userId={session.user.id}
        />
      )}
    </div>
  );
}
