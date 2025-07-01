
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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Fingerprint, 
  Camera, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Upload,
  RefreshCw,
  Plus,
  Users,
  Shield,
  AlertTriangle,
  Clock,
  Search,
  FileImage
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BiometricRecord {
  id: string;
  personType: string;
  personId: string;
  verificationType: string;
  verificationResult: string;
  matchConfidence?: number;
  qualityScore?: number;
  processingTime?: number;
  timestamp: string;
  checkInEvent?: {
    eventType: string;
    child: {
      firstName: string;
      lastName: string;
    };
  };
  pickupEvent?: {
    pickupPersonName: string;
  };
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  faceRecognitionEnabled: boolean;
  biometricId?: string;
}

export default function BiometricManagement() {
  const { data: session } = useSession();
  const [biometricRecords, setBiometricRecords] = useState<BiometricRecord[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [enrollmentImages, setEnrollmentImages] = useState<string[]>([]);
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch biometric records
      const recordsResponse = await fetch('/api/biometric');
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        setBiometricRecords(recordsData.biometricVerifications || []);
      }

      // Fetch children
      const childrenResponse = await fetch('/api/check-in-out/status');
      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        setChildren(childrenData.children || []);
      }
    } catch (error) {
      console.error('Error fetching biometric data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const imagePromises = Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(imagePromises).then(images => {
        setEnrollmentImages(prev => [...prev, ...images].slice(0, 5)); // Max 5 images
      });
    }
  };

  const handleEnrollBiometric = async () => {
    if (!selectedChild || enrollmentImages.length === 0) return;

    try {
      setEnrolling(true);
      setEnrollmentProgress(10);

      const response = await fetch('/api/biometric/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: selectedChild.id,
          personType: 'CHILD',
          biometricImages: enrollmentImages,
          verificationType: 'FACE_RECOGNITION',
        }),
      });

      setEnrollmentProgress(50);

      if (response.ok) {
        const result = await response.json();
        setEnrollmentProgress(100);
        
        if (result.success) {
          await fetchData();
          setShowEnrollDialog(false);
          setSelectedChild(null);
          setEnrollmentImages([]);
          setEnrollmentProgress(0);
        }
      }
    } catch (error) {
      console.error('Error enrolling biometric:', error);
    } finally {
      setEnrolling(false);
    }
  };

  const createBiometricVerification = async (childId: string) => {
    try {
      // Simulate biometric capture for demo
      const demoImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='; // Placeholder

      const response = await fetch('/api/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personType: 'CHILD',
          personId: childId,
          verificationType: 'FACE_RECOGNITION',
          capturedBiometric: demoImage,
          deviceInfo: {
            device: 'Demo Device',
            quality: 'HD',
          },
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error creating biometric verification:', error);
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'MATCH': return 'bg-green-500';
      case 'PARTIAL_MATCH': return 'bg-yellow-500';
      case 'NO_MATCH': return 'bg-red-500';
      case 'PENDING': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'MATCH': return <CheckCircle className="h-4 w-4" />;
      case 'NO_MATCH': return <XCircle className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredChildren = children.filter(child =>
    `${child.firstName} ${child.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalRecords: biometricRecords.length,
    enrolled: children.filter(child => child.faceRecognitionEnabled).length,
    successfulVerifications: biometricRecords.filter(record => record.verificationResult === 'MATCH').length,
    averageConfidence: biometricRecords.length > 0 
      ? biometricRecords
          .filter(record => record.matchConfidence)
          .reduce((sum, record) => sum + (record.matchConfidence || 0), 0) / 
        biometricRecords.filter(record => record.matchConfidence).length
      : 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading biometric management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Biometric Management</h1>
          <p className="text-muted-foreground">Manage facial recognition enrollment and verification</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Enroll Child
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Enroll Child for Biometric Recognition</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Child:</label>
                  <div className="mt-2 space-y-2">
                    {children.filter(child => !child.faceRecognitionEnabled).map(child => (
                      <Button
                        key={child.id}
                        variant={selectedChild?.id === child.id ? "default" : "outline"}
                        onClick={() => setSelectedChild(child)}
                        className="w-full justify-start"
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={child.profilePhoto} />
                          <AvatarFallback>{child.firstName[0]}{child.lastName[0]}</AvatarFallback>
                        </Avatar>
                        {child.firstName} {child.lastName}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedChild && (
                  <div>
                    <label className="text-sm font-medium">Upload Photos (3-5 recommended):</label>
                    <div className="mt-2">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="mb-2"
                      />
                      {enrollmentImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {enrollmentImages.map((image, index) => (
                            <div key={index} className="relative">
                              <img 
                                src={image} 
                                alt={`Enrollment ${index + 1}`}
                                className="w-full h-16 object-cover rounded border"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                onClick={() => setEnrollmentImages(prev => prev.filter((_, i) => i !== index))}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {enrolling && (
                  <div>
                    <Progress value={enrollmentProgress} className="mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Processing biometric enrollment...
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleEnrollBiometric}
                  disabled={!selectedChild || enrollmentImages.length === 0 || enrolling}
                  className="w-full"
                >
                  {enrolling ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Fingerprint className="h-4 w-4 mr-2" />
                  )}
                  Enroll Biometric
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
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <FileImage className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enrolled Children</p>
                <p className="text-2xl font-bold text-green-600">{stats.enrolled}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Successful Verifications</p>
                <p className="text-2xl font-bold text-blue-600">{stats.successfulVerifications}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Confidence</p>
                <p className="text-2xl font-bold">{stats.averageConfidence.toFixed(1)}%</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="children" className="space-y-6">
        <TabsList>
          <TabsTrigger value="children">Children Enrollment</TabsTrigger>
          <TabsTrigger value="records">Verification Records</TabsTrigger>
        </TabsList>

        <TabsContent value="children" className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search children..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
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
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              className={`${child.faceRecognitionEnabled ? 'bg-green-500' : 'bg-gray-500'} text-white`}
                            >
                              {child.faceRecognitionEnabled ? 'Enrolled' : 'Not Enrolled'}
                            </Badge>
                            {child.biometricId && (
                              <Badge variant="outline">ID: {child.biometricId.slice(-8)}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {!child.faceRecognitionEnabled ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedChild(child);
                              setShowEnrollDialog(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Camera className="h-4 w-4 mr-1" />
                            Enroll
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => createBiometricVerification(child.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Test Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Verification Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {biometricRecords.slice(0, 20).map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Fingerprint className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {record.checkInEvent?.child.firstName} {record.checkInEvent?.child.lastName}
                          {record.pickupEvent?.pickupPersonName && ` (Pickup: ${record.pickupEvent.pickupPersonName})`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.verificationType.replace('_', ' ')} | {record.personType}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <Badge className={`${getResultColor(record.verificationResult)} text-white`}>
                          {getResultIcon(record.verificationResult)}
                          <span className="ml-1">{record.verificationResult.replace('_', ' ')}</span>
                        </Badge>
                        {record.matchConfidence && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Confidence: {record.matchConfidence.toFixed(1)}%
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(record.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </p>
                        {record.processingTime && (
                          <p className="text-xs text-muted-foreground">
                            {record.processingTime}ms
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {biometricRecords.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">No biometric records found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
