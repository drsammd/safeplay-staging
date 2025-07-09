
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  QrCode, 
  Download, 
  Printer, 
  Share2, 
  RefreshCw, 
  Plus,
  Clock,
  Users,
  Shield,
  Eye,
  Copy,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';

interface QRCodeRecord {
  id: string;
  qrCode: string;
  qrCodeImage?: string;
  purpose: string;
  securityLevel: string;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
  expiresAt?: string;
  child?: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  parent?: {
    name: string;
    email: string;
  };
  createdAt: string;
  lastUsedAt?: string;
}

export default function QRCodeManagement() {
  const { data: session } = useSession();
  const [childQRCodes, setChildQRCodes] = useState<QRCodeRecord[]>([]);
  const [parentQRCodes, setParentQRCodes] = useState<QRCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQRCode, setSelectedQRCode] = useState<QRCodeRecord | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: 'child',
    childId: '',
    purpose: 'CHECK_IN_OUT',
    securityLevel: 'STANDARD',
    expiresIn: '',
    maxUsage: '',
    biometricRequired: false,
  });
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchChildren();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch child QR codes
      const childResponse = await fetch('/api/qr-codes?type=child&includeImage=true');
      if (childResponse.ok) {
        const childData = await childResponse.json();
        setChildQRCodes(childData.childQRCodes || []);
      }

      // Fetch parent QR codes
      const parentResponse = await fetch('/api/qr-codes?type=parent&includeImage=true');
      if (parentResponse.ok) {
        const parentData = await parentResponse.json();
        setParentQRCodes(parentData.parentQRCodes || []);
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/check-in-out/status');
      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const handleCreateQRCode = async () => {
    try {
      const payload: any = {
        type: createForm.type,
        purpose: createForm.purpose,
        securityLevel: createForm.securityLevel,
        expiresIn: createForm.expiresIn ? parseInt(createForm.expiresIn) : undefined,
        maxUsage: createForm.maxUsage ? parseInt(createForm.maxUsage) : undefined,
        biometricRequired: createForm.biometricRequired,
      };

      if (createForm.type === 'child' && createForm.childId) {
        payload.childId = createForm.childId;
      }

      const response = await fetch('/api/qr-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchData();
        setShowCreateDialog(false);
        setCreateForm({
          type: 'child',
          childId: '',
          purpose: 'CHECK_IN_OUT',
          securityLevel: 'STANDARD',
          expiresIn: '',
          maxUsage: '',
          biometricRequired: false,
        });
      }
    } catch (error) {
      console.error('Error creating QR code:', error);
    }
  };

  const handleDownloadQR = (qrCodeImage: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyQRCode = (qrCode: string) => {
    navigator.clipboard.writeText(qrCode);
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'BASIC': return 'bg-gray-500';
      case 'STANDARD': return 'bg-blue-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MAXIMUM': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const isExpired = (expiresAt?: string) => {
    return expiresAt && new Date(expiresAt) < new Date();
  };

  const isOverLimit = (usageCount: number, maxUsage?: number) => {
    return maxUsage && usageCount >= maxUsage;
  };

  const filteredChildQRCodes = childQRCodes.filter(qr =>
    qr.child && 
    `${qr.child.firstName} ${qr.child.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredParentQRCodes = parentQRCodes.filter(qr =>
    qr.parent && 
    qr.parent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading QR code management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QR Code Management</h1>
          <p className="text-muted-foreground">Generate and manage QR codes for secure check-in/out</p>
          
          {/* Purpose Explanation */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg max-w-4xl">
            <div className="flex items-start space-x-3">
              <QrCode className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Quick Access & Identification System</h3>
                <p className="text-sm text-green-800">
                  <strong>Purpose:</strong> QR codes provide instant, secure identification for children and parents, enabling quick check-in/out processes, 
                  pickup authorization, and emergency access. Each QR code can be customized with security levels, usage limits, and expiration dates 
                  to ensure maximum security while maintaining convenience.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-green-700 border-green-300">Instant Check-in</Badge>
                  <Badge variant="outline" className="text-green-700 border-green-300">Secure Identification</Badge>
                  <Badge variant="outline" className="text-green-700 border-green-300">Usage Tracking</Badge>
                  <Badge variant="outline" className="text-green-700 border-green-300">Expiration Control</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Generate New QR Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <Select value={createForm.type} onValueChange={(value) => setCreateForm({...createForm, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">Child QR Code</SelectItem>
                      <SelectItem value="parent">Parent QR Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {createForm.type === 'child' && (
                  <div>
                    <Label>Child</Label>
                    <Select value={createForm.childId} onValueChange={(value) => setCreateForm({...createForm, childId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select child" />
                      </SelectTrigger>
                      <SelectContent>
                        {children.map(child => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.firstName} {child.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Purpose</Label>
                  <Select value={createForm.purpose} onValueChange={(value) => setCreateForm({...createForm, purpose: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHECK_IN_OUT">Check-in/Out</SelectItem>
                      <SelectItem value="PICKUP_AUTHORIZATION">Pickup Authorization</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency Access</SelectItem>
                      <SelectItem value="IDENTIFICATION">Identification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Security Level</Label>
                  <Select value={createForm.securityLevel} onValueChange={(value) => setCreateForm({...createForm, securityLevel: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASIC">Basic</SelectItem>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MAXIMUM">Maximum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Expires In (hours)</Label>
                    <Input
                      type="number"
                      placeholder="Optional"
                      value={createForm.expiresIn}
                      onChange={(e) => setCreateForm({...createForm, expiresIn: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Max Usage</Label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={createForm.maxUsage}
                      onChange={(e) => setCreateForm({...createForm, maxUsage: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="biometric"
                    checked={createForm.biometricRequired}
                    onCheckedChange={(checked) => setCreateForm({...createForm, biometricRequired: !!checked})}
                  />
                  <Label htmlFor="biometric">Require biometric verification</Label>
                </div>

                <Button onClick={handleCreateQRCode} className="w-full">
                  Generate QR Code
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Child QR Codes</p>
                <p className="text-2xl font-bold">{childQRCodes.length}</p>
              </div>
              <QrCode className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Parent QR Codes</p>
                <p className="text-2xl font-bold">{parentQRCodes.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Codes</p>
                <p className="text-2xl font-bold">
                  {[...childQRCodes, ...parentQRCodes].filter(qr => qr.isActive).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired Codes</p>
                <p className="text-2xl font-bold text-red-600">
                  {[...childQRCodes, ...parentQRCodes].filter(qr => isExpired(qr.expiresAt)).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
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
              placeholder="Search by child or parent name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Tabs */}
      <Tabs defaultValue="child" className="space-y-6">
        <TabsList>
          <TabsTrigger value="child">Child QR Codes</TabsTrigger>
          <TabsTrigger value="parent">Parent QR Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="child" className="space-y-6">
          <div className="grid gap-4">
            {filteredChildQRCodes.map((qr, index) => (
              <motion.div
                key={qr.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={qr.child?.profilePhoto} />
                          <AvatarFallback>
                            {qr.child?.firstName[0]}{qr.child?.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {qr.child?.firstName} {qr.child?.lastName}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{qr.purpose.replace('_', ' ')}</Badge>
                            <Badge className={`${getSecurityLevelColor(qr.securityLevel)} text-white`}>
                              {qr.securityLevel}
                            </Badge>
                            {!qr.isActive && <Badge variant="destructive">Inactive</Badge>}
                            {isExpired(qr.expiresAt) && <Badge variant="destructive">Expired</Badge>}
                            {isOverLimit(qr.usageCount, qr.maxUsage) && <Badge variant="destructive">Over Limit</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Used: {qr.usageCount}{qr.maxUsage ? `/${qr.maxUsage}` : ''} times
                            {qr.expiresAt && ` | Expires: ${new Date(qr.expiresAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {qr.qrCodeImage && (
                          <div className="w-16 h-16 border rounded">
                            <img src={qr.qrCodeImage} alt="QR Code" className="w-full h-full" />
                          </div>
                        )}

                        <div className="flex flex-col space-y-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyQRCode(qr.qrCode)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {qr.qrCodeImage && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadQR(qr.qrCodeImage!, `qr-${qr.child?.firstName}-${qr.child?.lastName}`)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedQRCode(qr)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>QR Code Details</DialogTitle>
                              </DialogHeader>
                              {selectedQRCode && (
                                <div className="space-y-4">
                                  <div className="text-center">
                                    {selectedQRCode.qrCodeImage && (
                                      <img 
                                        src={selectedQRCode.qrCodeImage} 
                                        alt="QR Code" 
                                        className="w-48 h-48 mx-auto border rounded"
                                      />
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="font-semibold">Child:</p>
                                      <p>{selectedQRCode.child?.firstName} {selectedQRCode.child?.lastName}</p>
                                    </div>
                                    <div>
                                      <p className="font-semibold">Purpose:</p>
                                      <p>{selectedQRCode.purpose.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                      <p className="font-semibold">Security Level:</p>
                                      <p>{selectedQRCode.securityLevel}</p>
                                    </div>
                                    <div>
                                      <p className="font-semibold">Usage:</p>
                                      <p>{selectedQRCode.usageCount}{selectedQRCode.maxUsage ? `/${selectedQRCode.maxUsage}` : ''}</p>
                                    </div>
                                    <div>
                                      <p className="font-semibold">Created:</p>
                                      <p>{new Date(selectedQRCode.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                      <p className="font-semibold">Last Used:</p>
                                      <p>{selectedQRCode.lastUsedAt ? new Date(selectedQRCode.lastUsedAt).toLocaleDateString() : 'Never'}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="parent" className="space-y-6">
          <div className="grid gap-4">
            {filteredParentQRCodes.map((qr, index) => (
              <motion.div
                key={qr.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {qr.parent?.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{qr.parent?.name}</h3>
                          <p className="text-sm text-muted-foreground">{qr.parent?.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{qr.purpose.replace('_', ' ')}</Badge>
                            <Badge className={`${getSecurityLevelColor(qr.securityLevel)} text-white`}>
                              {qr.securityLevel}
                            </Badge>
                            {!qr.isActive && <Badge variant="destructive">Inactive</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Used: {qr.usageCount}{qr.maxUsage ? `/${qr.maxUsage}` : ''} times
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {qr.qrCodeImage && (
                          <div className="w-16 h-16 border rounded">
                            <img src={qr.qrCodeImage} alt="QR Code" className="w-full h-full" />
                          </div>
                        )}

                        <div className="flex flex-col space-y-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyQRCode(qr.qrCode)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {qr.qrCodeImage && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadQR(qr.qrCodeImage!, `parent-qr-${qr.parent?.name}`)}
                            >
                              <Download className="h-4 w-4" />
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
      </Tabs>
    </div>
  );
}
