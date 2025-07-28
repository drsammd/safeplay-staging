
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Monitor, 
  Wifi, 
  WifiOff, 
  Settings, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Wrench,
  Battery,
  Thermometer,
  HardDrive,
  Cpu,
  Search,
  Eye,
  RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Kiosk {
  id: string;
  kioskId: string;
  name: string;
  location: string;
  kioskType: string;
  status: string;
  lastHeartbeat?: string;
  ipAddress?: string;
  uptimePercentage: number;
  totalTransactions: number;
  dailyTransactions: number;
  errorCount: number;
  performanceScore: number;
  cpuUsage: number;
  memoryUsed: number;
  diskUsage: number;
  batteryLevel?: number;
  temperatureStatus: string;
  venue: {
    name: string;
    address: string;
  };
  stats: {
    totalEvents: number;
    todayEvents: number;
    activeSessions: number;
  };
  capabilities: string[];
}

interface KioskSession {
  id: string;
  sessionId: string;
  sessionType: string;
  status: string;
  startTime: string;
  duration?: number;
  parentId?: string;
  childrenIds: string[];
  language: string;
  completedSteps: string[];
  currentStep?: string;
  kiosk: {
    name: string;
    location: string;
  };
}

export default function KioskManagement() {
  const { data: session } = useSession();
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [sessions, setSessions] = useState<KioskSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    kioskId: '',
    name: '',
    location: '',
    kioskType: 'CHECK_IN_TERMINAL',
    ipAddress: '',
    macAddress: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch kiosks
      const kiosksResponse = await fetch('/api/kiosks');
      if (kiosksResponse.ok) {
        const kiosksData = await kiosksResponse.json();
        setKiosks(kiosksData.kiosks || []);
      }

      // Fetch active sessions
      const sessionsResponse = await fetch('/api/kiosks/sessions?status=ACTIVE');
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.kioskSessions || []);
      }
    } catch (error) {
      console.error('Error fetching kiosk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKiosk = async () => {
    try {
      const response = await fetch('/api/kiosks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          venueId: 'venue-1', // Default venue ID - would be determined from session context
          capabilities: ['QR_SCANNING', 'PHOTO_CAPTURE', 'TOUCHSCREEN'], // Default capabilities
        }),
      });

      if (response.ok) {
        await fetchData();
        setShowCreateDialog(false);
        setCreateForm({
          kioskId: '',
          name: '',
          location: '',
          kioskType: 'CHECK_IN_TERMINAL',
          ipAddress: '',
          macAddress: '',
        });
      }
    } catch (error) {
      console.error('Error creating kiosk:', error);
    }
  };

  const handleUpdateKioskStatus = async (kioskId: string, status: string) => {
    try {
      const response = await fetch('/api/kiosks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kioskId,
          status,
          systemMetrics: {
            cpuUsage: Math.random() * 100,
            memoryUsed: Math.random() * 8,
            diskUsage: Math.random() * 100,
          },
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating kiosk status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-500';
      case 'IDLE': return 'bg-blue-500';
      case 'BUSY': return 'bg-yellow-500';
      case 'OFFLINE': return 'bg-red-500';
      case 'MAINTENANCE': return 'bg-orange-500';
      case 'ERROR': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE':
      case 'IDLE':
      case 'BUSY':
        return <CheckCircle className="h-4 w-4" />;
      case 'MAINTENANCE':
        return <Wrench className="h-4 w-4" />;
      case 'ERROR':
      case 'OFFLINE':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredKiosks = kiosks.filter(kiosk =>
    kiosk?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    kiosk?.location?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    kiosk?.kioskId?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: kiosks?.length ?? 0,
    online: kiosks?.filter(k => k?.status === 'ONLINE' || k?.status === 'IDLE' || k?.status === 'BUSY')?.length ?? 0,
    offline: kiosks?.filter(k => k?.status === 'OFFLINE' || k?.status === 'ERROR')?.length ?? 0,
    maintenance: kiosks?.filter(k => k?.status === 'MAINTENANCE')?.length ?? 0,
    activeSessions: sessions?.length ?? 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading kiosk management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kiosk Management</h1>
          <p className="text-muted-foreground">Monitor and manage check-in kiosks</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Kiosk
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Kiosk</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Kiosk ID</Label>
                  <Input
                    placeholder="KIOSK001"
                    value={createForm.kioskId}
                    onChange={(e) => setCreateForm({...createForm, kioskId: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    placeholder="Main Entrance Kiosk"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    placeholder="Main Entrance"
                    value={createForm.location}
                    onChange={(e) => setCreateForm({...createForm, location: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={createForm.kioskType} onValueChange={(value) => setCreateForm({...createForm, kioskType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHECK_IN_TERMINAL">Check-in Terminal</SelectItem>
                      <SelectItem value="CHECK_OUT_TERMINAL">Check-out Terminal</SelectItem>
                      <SelectItem value="DUAL_PURPOSE">Dual Purpose</SelectItem>
                      <SelectItem value="MOBILE_TABLET">Mobile Tablet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>IP Address</Label>
                    <Input
                      placeholder="192.168.1.100"
                      value={createForm.ipAddress}
                      onChange={(e) => setCreateForm({...createForm, ipAddress: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>MAC Address</Label>
                    <Input
                      placeholder="00:11:22:33:44:55"
                      value={createForm.macAddress}
                      onChange={(e) => setCreateForm({...createForm, macAddress: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateKiosk} className="w-full">
                  Add Kiosk
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Kiosks</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Monitor className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-600">{stats.online}</p>
              </div>
              <Wifi className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
              </div>
              <WifiOff className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">{stats.maintenance}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{stats.activeSessions}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search kiosks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Kiosks Tab */}
      <Tabs defaultValue="kiosks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="kiosks">Kiosks</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="kiosks" className="space-y-6">
          <div className="grid gap-4">
            {filteredKiosks?.map?.((kiosk, index) => (
              <motion.div
                key={kiosk?.id ?? index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                          <Monitor className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{kiosk?.name ?? 'Unknown Kiosk'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {kiosk?.kioskId ?? 'N/A'} | {kiosk?.location ?? 'Unknown Location'}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={`${getStatusColor(kiosk?.status ?? 'UNKNOWN')} text-white`}>
                              {getStatusIcon(kiosk?.status ?? 'UNKNOWN')}
                              <span className="ml-1">{kiosk?.status ?? 'UNKNOWN'}</span>
                            </Badge>
                            <Badge variant="outline">{kiosk?.kioskType?.replace('_', ' ') ?? 'Unknown Type'}</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        {/* Performance Metrics */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Performance</p>
                          <p className={`text-lg font-bold ${getPerformanceColor(kiosk?.performanceScore ?? 0)}`}>
                            {kiosk?.performanceScore ?? 0}%
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Uptime</p>
                          <p className="text-lg font-bold text-green-600">{kiosk?.uptimePercentage ?? 0}%</p>
                        </div>

                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Today</p>
                          <p className="text-lg font-bold">{kiosk?.stats?.todayEvents ?? 0}</p>
                        </div>

                        {/* System Metrics */}
                        <div className="space-y-2 min-w-[120px]">
                          <div className="flex items-center justify-between">
                            <Cpu className="h-4 w-4 text-blue-500" />
                            <span className="text-xs">{kiosk?.cpuUsage?.toFixed?.(0) ?? 0}%</span>
                          </div>
                          <Progress value={kiosk?.cpuUsage ?? 0} className="h-1" />
                          
                          <div className="flex items-center justify-between">
                            <HardDrive className="h-4 w-4 text-green-500" />
                            <span className="text-xs">{kiosk?.memoryUsed?.toFixed?.(1) ?? 0}GB</span>
                          </div>
                          <Progress value={(kiosk?.memoryUsed ?? 0) * 12.5} className="h-1" />

                          {kiosk?.batteryLevel && (
                            <>
                              <div className="flex items-center justify-between">
                                <Battery className="h-4 w-4 text-yellow-500" />
                                <span className="text-xs">{kiosk?.batteryLevel ?? 0}%</span>
                              </div>
                              <Progress value={kiosk?.batteryLevel ?? 0} className="h-1" />
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col space-y-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedKiosk(kiosk)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Kiosk Details: {selectedKiosk?.name}</DialogTitle>
                              </DialogHeader>
                              {selectedKiosk && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold">Basic Information</h4>
                                      <p className="text-sm">ID: {selectedKiosk?.kioskId ?? 'N/A'}</p>
                                      <p className="text-sm">Type: {selectedKiosk?.kioskType ?? 'Unknown'}</p>
                                      <p className="text-sm">Location: {selectedKiosk?.location ?? 'Unknown'}</p>
                                      <p className="text-sm">IP: {selectedKiosk?.ipAddress ?? 'Not set'}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Statistics</h4>
                                      <p className="text-sm">Total Transactions: {selectedKiosk?.totalTransactions ?? 0}</p>
                                      <p className="text-sm">Daily Transactions: {selectedKiosk?.dailyTransactions ?? 0}</p>
                                      <p className="text-sm">Error Count: {selectedKiosk?.errorCount ?? 0}</p>
                                      <p className="text-sm">
                                        Last Heartbeat: {
                                          selectedKiosk?.lastHeartbeat 
                                            ? new Date(selectedKiosk.lastHeartbeat).toLocaleString()
                                            : 'Never'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">Capabilities</h4>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {selectedKiosk?.capabilities?.map?.(capability => (
                                        <Badge key={capability} variant="outline">
                                          {capability?.replace?.('_', ' ') ?? 'Unknown'}
                                        </Badge>
                                      )) ?? []}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {kiosk?.status === 'OFFLINE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateKioskStatus(kiosk?.kioskId ?? '', 'ONLINE')}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateKioskStatus(kiosk?.kioskId ?? '', 'MAINTENANCE')}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Kiosk Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions?.map?.((session, index) => (
                  <motion.div
                    key={session?.id ?? index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{session?.kiosk?.name ?? 'Unknown Kiosk'}</p>
                      <p className="text-sm text-muted-foreground">
                        Session: {session?.sessionId ?? 'N/A'} | Type: {session?.sessionType ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Started: {session?.startTime ? new Date(session.startTime).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{session?.status ?? 'Unknown'}</Badge>
                      <p className="text-sm mt-1">Step: {session?.currentStep ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        Children: {session?.childrenIds?.length ?? 0} | Lang: {session?.language ?? 'Unknown'}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {(sessions?.length ?? 0) === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No active sessions found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
