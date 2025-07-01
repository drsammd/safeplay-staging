
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  QrCode, 
  UserCheck, 
  UserX, 
  MapPin, 
  Clock, 
  Shield,
  Camera,
  Fingerprint,
  CheckCircle,
  XCircle,
  RefreshCw,
  Smartphone,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

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
}

interface QRCode {
  id: string;
  qrCode: string;
  qrCodeImage?: string;
  purpose: string;
  securityLevel: string;
  isActive: boolean;
  usageCount: number;
  expiresAt?: string;
}

interface Venue {
  id: string;
  name: string;
  address: string;
}

export default function MobileCheckIn() {
  const { data: session } = useSession();
  const [children, setChildren] = useState<Child[]>([]);
  const [childQRCodes, setChildQRCodes] = useState<{ [key: string]: QRCode[] }>({});
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [checkInMethod, setCheckInMethod] = useState<string>('QR_CODE');
  const [showQRCode, setShowQRCode] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch children status
      const childrenResponse = await fetch('/api/check-in-out/status');
      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        setChildren(childrenData.children || []);
      }

      // Fetch QR codes for each child
      const qrResponse = await fetch('/api/qr-codes?type=child&includeImage=true');
      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        const qrByChild: { [key: string]: QRCode[] } = {};
        qrData.childQRCodes.forEach((qr: any) => {
          if (!qrByChild[qr.childId]) {
            qrByChild[qr.childId] = [];
          }
          qrByChild[qr.childId].push(qr);
        });
        setChildQRCodes(qrByChild);
      }

      // Fetch venues (simplified - in production would be filtered by location/permission)
      const venuesResponse = await fetch('/api/venues');
      if (venuesResponse.ok) {
        const venuesData = await venuesResponse.json();
        setVenues(venuesData.venues || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (childId: string, eventType: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!selectedVenue && eventType === 'CHECK_IN') {
      alert('Please select a venue');
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch('/api/check-in-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          venueId: eventType === 'CHECK_IN' ? selectedVenue : children.find(c => c.id === childId)?.currentVenue?.id,
          eventType,
          method: checkInMethod,
          biometricRequired: checkInMethod === 'FACIAL_RECOGNITION',
        }),
      });

      if (response.ok) {
        await fetchData();
        setSelectedChild(null);
        setShowQRCode(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to process check-in/out');
      }
    } catch (error) {
      console.error('Error processing check-in/out:', error);
      alert('Failed to process check-in/out');
    } finally {
      setProcessing(false);
    }
  };

  const generateNewQR = async (childId: string) => {
    try {
      const response = await fetch('/api/qr-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'child',
          childId,
          purpose: 'CHECK_IN_OUT',
          securityLevel: 'STANDARD',
          expiresIn: 24, // 24 hours
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CHECKED_IN': return 'bg-green-500';
      case 'CHECKED_OUT': return 'bg-blue-500';
      case 'ACTIVE': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CHECKED_IN': return <UserCheck className="h-4 w-4" />;
      case 'CHECKED_OUT': return <UserX className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Loading check-in...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/parent/mobile" className="flex items-center text-blue-600">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Link>
            <h1 className="text-lg font-semibold">Check-in/Out</h1>
            <Button onClick={fetchData} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Venue Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Select Venue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a venue for check-in" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map(venue => (
                    <SelectItem key={venue.id} value={venue.id}>
                      <div>
                        <p className="font-medium">{venue.name}</p>
                        <p className="text-xs text-muted-foreground">{venue.address}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>

        {/* Check-in Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Check-in Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={checkInMethod === 'QR_CODE' ? 'default' : 'outline'}
                  onClick={() => setCheckInMethod('QR_CODE')}
                  className="h-auto py-3 flex flex-col"
                >
                  <QrCode className="h-6 w-6 mb-1" />
                  <span className="text-xs">QR Code</span>
                </Button>
                <Button
                  variant={checkInMethod === 'FACIAL_RECOGNITION' ? 'default' : 'outline'}
                  onClick={() => setCheckInMethod('FACIAL_RECOGNITION')}
                  className="h-auto py-3 flex flex-col"
                >
                  <Camera className="h-6 w-6 mb-1" />
                  <span className="text-xs">Face ID</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Children List */}
        <div className="space-y-3">
          {children.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={child.profilePhoto} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {child.firstName[0]}{child.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {child.firstName} {child.lastName}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getStatusColor(child.status)} text-white text-xs`}>
                            {getStatusIcon(child.status)}
                            <span className="ml-1">{child.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        {child.currentVenue && (
                          <p className="text-xs text-muted-foreground mt-1">
                            At: {child.currentVenue.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      {child.status !== 'CHECKED_IN' && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedChild(child)}
                          disabled={!selectedVenue || processing}
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
                          onClick={() => handleCheckIn(child.id, 'CHECK_OUT')}
                          disabled={processing}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Check Out
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Check-in Confirmation Dialog */}
        <Dialog open={!!selectedChild} onOpenChange={() => setSelectedChild(null)}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Check-in {selectedChild?.firstName}</DialogTitle>
            </DialogHeader>
            {selectedChild && (
              <div className="space-y-4">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-2">
                    <AvatarImage src={selectedChild.profilePhoto} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                      {selectedChild.firstName[0]}{selectedChild.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">
                    {selectedChild.firstName} {selectedChild.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Venue: {venues.find(v => v.id === selectedVenue)?.name}
                  </p>
                </div>

                {checkInMethod === 'QR_CODE' && (
                  <div className="space-y-3">
                    {childQRCodes[selectedChild.id]?.length > 0 ? (
                      <div>
                        <Label>Select QR Code:</Label>
                        <div className="grid gap-2 mt-2">
                          {childQRCodes[selectedChild.id].map(qr => (
                            <Button
                              key={qr.id}
                              variant="outline"
                              onClick={() => setShowQRCode(true)}
                              className="h-auto p-3 justify-start"
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              <div className="text-left">
                                <p className="text-sm font-medium">{qr.purpose.replace('_', ' ')}</p>
                                <p className="text-xs text-muted-foreground">
                                  Used: {qr.usageCount} times | {qr.securityLevel}
                                </p>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">
                          No QR code found for this child
                        </p>
                        <Button
                          onClick={() => generateNewQR(selectedChild.id)}
                          size="sm"
                        >
                          Generate QR Code
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {checkInMethod === 'FACIAL_RECOGNITION' && (
                  <div className="text-center py-4">
                    <Camera className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Face recognition will be used at the venue
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedChild(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleCheckIn(selectedChild.id, 'CHECK_IN')}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* QR Code Display Dialog */}
        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>QR Code for Check-in</DialogTitle>
            </DialogHeader>
            {selectedChild && childQRCodes[selectedChild.id]?.[0] && (
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <img
                    src={childQRCodes[selectedChild.id][0].qrCodeImage}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <div>
                  <p className="font-medium">{selectedChild.firstName} {selectedChild.lastName}</p>
                  <p className="text-sm text-muted-foreground">
                    Show this QR code at the venue for check-in
                  </p>
                </div>
                <Button
                  onClick={() => handleCheckIn(selectedChild.id, 'CHECK_IN')}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Complete Check-in
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
