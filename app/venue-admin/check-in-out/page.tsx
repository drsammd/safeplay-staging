
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  UserCheck, 
  UserX, 
  QrCode, 
  Search, 
  RefreshCw,
  Clock,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle,
  Camera,
  Smartphone
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  profilePhoto?: string;
  parent: {
    name: string;
    email: string;
    phone?: string;
  };
  currentVenue?: {
    name: string;
  };
}

interface CheckInEvent {
  id: string;
  eventType: string;
  method: string;
  timestamp: string;
  child: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  venue: {
    name: string;
  };
  parent: {
    name: string;
  };
  biometricVerifications?: any[];
}

export default function CheckInOutDashboard() {
  const { data: session } = useSession();
  const [children, setChildren] = useState<Child[]>([]);
  const [recentEvents, setRecentEvents] = useState<CheckInEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    checkedOut: 0,
    todayEvents: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch current status
      const statusResponse = await fetch('/api/check-in-out/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setChildren(statusData.children || []);
        setStats({
          total: statusData.summary.total,
          checkedIn: statusData.summary.checkedIn,
          checkedOut: statusData.summary.checkedOut,
          todayEvents: statusData.summary.checkedIn + statusData.summary.checkedOut,
        });
      }

      // Fetch recent events
      const eventsResponse = await fetch('/api/check-in-out?limit=20');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setRecentEvents(eventsData.events || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheckIn = async (childId: string) => {
    try {
      const response = await fetch('/api/check-in-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          venueId: selectedVenue,
          eventType: 'CHECK_IN',
          method: 'STAFF_MANUAL',
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error checking in child:', error);
    }
  };

  const handleQuickCheckOut = async (childId: string) => {
    try {
      const response = await fetch('/api/check-in-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          venueId: selectedVenue,
          eventType: 'CHECK_OUT',
          method: 'STAFF_MANUAL',
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error checking out child:', error);
    }
  };

  const filteredChildren = children.filter(child =>
    `${child.firstName} ${child.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    child.parent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CHECKED_IN': return 'bg-green-500';
      case 'CHECKED_OUT': return 'bg-blue-500';
      case 'ACTIVE': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'QR_CODE': return <QrCode className="h-4 w-4" />;
      case 'FACIAL_RECOGNITION': return <Camera className="h-4 w-4" />;
      case 'PARENT_APP': return <Smartphone className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading check-in/out dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Check-in/Check-out Dashboard</h1>
          <p className="text-muted-foreground">Manage child arrivals and departures</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Children</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Checked In</p>
                  <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Checked Out</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.checkedOut}</p>
                </div>
                <UserX className="h-8 w-8 text-blue-500" />
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today&apos;s Events</p>
                  <p className="text-2xl font-bold">{stats.todayEvents}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="children" className="space-y-6">
        <TabsList>
          <TabsTrigger value="children">Children Status</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
        </TabsList>

        <TabsContent value="children" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search children or parents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Children List */}
          <div className="grid gap-4">
            {filteredChildren.map((child, index) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={child.profilePhoto} />
                          <AvatarFallback>
                            {child.firstName[0]}{child.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {child.firstName} {child.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Parent: {child.parent.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {child.parent.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge className={`${getStatusColor(child.status)} text-white`}>
                          {child.status.replace('_', ' ')}
                        </Badge>

                        <div className="flex space-x-2">
                          {child.status !== 'CHECKED_IN' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleQuickCheckIn(child.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Check In
                            </Button>
                          )}
                          {child.status === 'CHECKED_IN' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleQuickCheckOut(child.id)}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Check Out
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Check-in/Check-out Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={event.child.profilePhoto} />
                        <AvatarFallback>
                          {event.child.firstName[0]}{event.child.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {event.child.firstName} {event.child.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Parent: {event.parent.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <Badge 
                          variant={event.eventType === 'CHECK_IN' ? 'default' : 'secondary'}
                        >
                          {event.eventType.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getMethodIcon(event.method)}
                        <span className="text-sm">{event.method.replace('_', ' ')}</span>
                      </div>

                      {event.biometricVerifications && event.biometricVerifications.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-xs">Verified</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scanner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                QR Code Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  QR Code scanner will be available in the kiosk interface. Use mobile devices or dedicated scanners for QR code processing.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
