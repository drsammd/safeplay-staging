
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Camera,
  Fingerprint,
  Search,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PickupAuthorization {
  id: string;
  authorizedPersonName: string;
  relationship: string;
  phoneNumber: string;
  status: string;
  requiresBiometric: boolean;
  requiresPhotoId: boolean;
  child: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  parent: {
    name: string;
    email: string;
  };
  createdAt: string;
  usageCount: number;
}

interface PickupEvent {
  id: string;
  pickupPersonName: string;
  verificationMethod: string;
  biometricVerified: boolean;
  photoIdVerified: boolean;
  verificationScore: number;
  timestamp: string;
  child: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  venue: {
    name: string;
  };
}

export default function PickupManagement() {
  const { data: session } = useSession();
  const [authorizations, setAuthorizations] = useState<PickupAuthorization[]>([]);
  const [recentEvents, setRecentEvents] = useState<PickupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuth, setSelectedAuth] = useState<PickupAuthorization | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    todayPickups: 0,
    totalAuthorizations: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch pickup authorizations
      const authResponse = await fetch('/api/pickup');
      if (authResponse.ok) {
        const authData = await authResponse.json();
        setAuthorizations(authData.pickupAuthorizations || []);
        
        // Calculate stats
        const pending = authData.pickupAuthorizations.filter((auth: any) => auth.status === 'PENDING').length;
        const approved = authData.pickupAuthorizations.filter((auth: any) => auth.status === 'APPROVED').length;
        
        setStats({
          pending,
          approved,
          todayPickups: 0, // Would be calculated from today's events
          totalAuthorizations: authData.pickupAuthorizations.length,
        });
      }

      // Fetch recent pickup events
      const eventsResponse = await fetch('/api/pickup/events?limit=20');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setRecentEvents(eventsData.pickupEvents || []);
      }
    } catch (error) {
      console.error('Error fetching pickup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAuthorization = async (authId: string) => {
    try {
      const response = await fetch('/api/pickup', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorizationId: authId,
          status: 'APPROVED',
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error approving authorization:', error);
    }
  };

  const handleRejectAuthorization = async (authId: string, reason: string) => {
    try {
      const response = await fetch('/api/pickup', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorizationId: authId,
          status: 'REJECTED',
          rejectedReason: reason,
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error rejecting authorization:', error);
    }
  };

  const filteredAuthorizations = authorizations.filter(auth =>
    auth.authorizedPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${auth.child.firstName} ${auth.child.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    auth.parent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'REJECTED': return 'bg-red-500';
      case 'SUSPENDED': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getVerificationIcon = (method: string) => {
    switch (method) {
      case 'BIOMETRIC_ONLY': return <Fingerprint className="h-4 w-4" />;
      case 'QR_PLUS_BIOMETRIC': return <Camera className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading pickup management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pickup Management</h1>
          <p className="text-muted-foreground">Manage child pickup authorizations and verification</p>
          
          {/* Purpose Explanation */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-4xl">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Secure Child Pickup Verification System</h3>
                <p className="text-sm text-blue-800">
                  <strong>Purpose:</strong> This system ensures only authorized individuals can pick up children through multi-layer verification including 
                  biometric authentication, photo ID verification, and parent-approved authorization lists. Each pickup is logged with verification scores 
                  and audit trails for maximum security and accountability.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-blue-700 border-blue-300">Biometric Verification</Badge>
                  <Badge variant="outline" className="text-blue-700 border-blue-300">Photo ID Validation</Badge>
                  <Badge variant="outline" className="text-blue-700 border-blue-300">Parent Authorization</Badge>
                  <Badge variant="outline" className="text-blue-700 border-blue-300">Real-time Notifications</Badge>
                </div>
              </div>
            </div>
          </div>
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
                  <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">Today&apos;s Pickups</p>
                  <p className="text-2xl font-bold">{recentEvents.length}</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">Total Authorizations</p>
                  <p className="text-2xl font-bold">{stats.totalAuthorizations}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="authorizations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="authorizations">Pickup Authorizations</TabsTrigger>
          <TabsTrigger value="events">Recent Pickups</TabsTrigger>
        </TabsList>

        <TabsContent value="authorizations" className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search authorizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Authorizations List */}
          <div className="grid gap-4">
            {filteredAuthorizations.map((auth, index) => (
              <motion.div
                key={auth.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={auth.child.profilePhoto} />
                          <AvatarFallback>
                            {auth.child.firstName[0]}{auth.child.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {auth.child.firstName} {auth.child.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Authorized Person: {auth.authorizedPersonName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Relationship: {auth.relationship} | Phone: {auth.phoneNumber}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <Badge className={`${getStatusColor(auth.status)} text-white`}>
                            {auth.status}
                          </Badge>
                          <div className="flex items-center space-x-2 mt-2">
                            {auth.requiresBiometric && (
                              <Fingerprint className="h-4 w-4 text-blue-500" />
                            )}
                            {auth.requiresPhotoId && (
                              <Camera className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedAuth(auth)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Pickup Authorization Details</DialogTitle>
                              </DialogHeader>
                              {selectedAuth && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold">Child Information</h4>
                                      <p>{selectedAuth.child.firstName} {selectedAuth.child.lastName}</p>
                                      <p className="text-sm text-muted-foreground">Parent: {selectedAuth.parent.name}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Authorized Person</h4>
                                      <p>{selectedAuth.authorizedPersonName}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedAuth.relationship} | {selectedAuth.phoneNumber}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">Security Requirements</h4>
                                    <div className="flex space-x-4 mt-2">
                                      <Badge variant={selectedAuth.requiresBiometric ? "default" : "secondary"}>
                                        Biometric: {selectedAuth.requiresBiometric ? "Required" : "Optional"}
                                      </Badge>
                                      <Badge variant={selectedAuth.requiresPhotoId ? "default" : "secondary"}>
                                        Photo ID: {selectedAuth.requiresPhotoId ? "Required" : "Optional"}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Created: {new Date(selectedAuth.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Usage Count: {selectedAuth.usageCount}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {auth.status === 'PENDING' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleApproveAuthorization(auth.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectAuthorization(auth.id, 'Manual rejection')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
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
              <CardTitle>Recent Pickup Events</CardTitle>
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
                          Picked up by: {event.pickupPersonName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="flex items-center space-x-2">
                          {getVerificationIcon(event.verificationMethod)}
                          <span className="text-sm">{event.verificationMethod.replace('_', ' ')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Score: {event.verificationScore}%
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {event.biometricVerified && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {event.photoIdVerified && (
                          <FileText className="h-4 w-4 text-blue-500" />
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium">{event.venue.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
