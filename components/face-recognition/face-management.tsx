
"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Trash2, Eye, Upload, Shield, 
  Activity, Clock, Users, Camera, AlertCircle 
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  faceRecognitionEnabled: boolean;
  faceRecognitionConsent: boolean;
  recognitionThreshold: number;
}

interface FaceRecord {
  id: string;
  awsFaceId: string;
  imageUrl: string;
  confidence: number;
  status: string;
  registrationNotes?: string;
  createdAt: string;
}

interface FaceCollection {
  id: string;
  awsCollectionId: string;
  collectionName: string;
  status: string;
  faceRecords: FaceRecord[];
  child: Child;
  awsInfo?: {
    faceCount: number;
    faceModelVersion: string;
  };
}

interface RecognitionEvent {
  id: string;
  eventType: string;
  confidence: number;
  createdAt: string;
  venue?: { name: string };
  memory?: { fileName: string; type: string };
}

interface FaceManagementProps {
  childId: string;
  onUpdate?: () => void;
}

export default function FaceManagement({ childId, onUpdate }: FaceManagementProps) {
  const [collection, setCollection] = useState<FaceCollection | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecognitionEvent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings state
  const [faceRecognitionEnabled, setFaceRecognitionEnabled] = useState(false);
  const [recognitionThreshold, setRecognitionThreshold] = useState([95]);

  // Fetch face management data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/faces/manage?childId=${childId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCollection(data.collection);
        setRecentEvents(data.recentEvents || []);
        setStats(data.stats);
        
        if (data.collection?.child) {
          setFaceRecognitionEnabled(data.collection.child.faceRecognitionEnabled);
          setRecognitionThreshold([data.collection.child.recognitionThreshold * 100]);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load face management data');
      }
    } catch (err) {
      console.error('Error fetching face management data:', err);
      setError('Failed to load face management data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [childId]);

  // Update face recognition settings
  const updateSettings = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch('/api/faces/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          updates: {
            faceRecognitionEnabled,
            recognitionThreshold: recognitionThreshold[0] / 100,
          },
        }),
      });

      if (response.ok) {
        await fetchData();
        onUpdate?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete face record
  const deleteFaceRecord = async (faceRecordId: string) => {
    if (!confirm('Are you sure you want to delete this face registration? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/faces/manage?faceRecordId=${faceRecordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
        onUpdate?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete face record');
      }
    } catch (err) {
      console.error('Error deleting face record:', err);
      setError('Failed to delete face record');
    }
  };

  // Delete entire collection
  const deleteCollection = async () => {
    if (!confirm('Are you sure you want to delete the entire face collection? This will remove all registered faces and disable face recognition.')) {
      return;
    }

    try {
      const response = await fetch(`/api/faces/collections?childId=${childId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCollection(null);
        setFaceRecognitionEnabled(false);
        onUpdate?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete collection');
      }
    } catch (err) {
      console.error('Error deleting collection:', err);
      setError('Failed to delete collection');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading face management data...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!collection) {
    return (
      <Card className="p-8 text-center">
        <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Face Collection</h3>
        <p className="text-gray-600 mb-4">
          Face recognition has not been set up for this child yet.
        </p>
        <Button onClick={() => window.location.reload()}>
          Set Up Face Recognition
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Settings className="h-6 w-6 mr-2" />
            Face Recognition Management
          </h2>
          <p className="text-gray-600">
            Manage {collection.child.firstName} {collection.child.lastName}'s face recognition settings
          </p>
        </div>
        <Badge variant={collection.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {collection.status}
        </Badge>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalFaces}</div>
            <div className="text-sm text-gray-600">Registered Faces</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeFaces}</div>
            <div className="text-sm text-gray-600">Active Faces</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.recentMatches}</div>
            <div className="text-sm text-gray-600">Recent Matches</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.averageConfidence.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </Card>
        </div>
      )}

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="faces">Registered Faces</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Privacy & Recognition Settings
            </h3>

            <div className="space-y-6">
              {/* Face Recognition Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Face Recognition</h4>
                  <p className="text-sm text-gray-600">
                    Enable or disable facial recognition for this child
                  </p>
                </div>
                <Switch
                  checked={faceRecognitionEnabled}
                  onCheckedChange={setFaceRecognitionEnabled}
                />
              </div>

              {/* Recognition Threshold */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Recognition Threshold</h4>
                  <p className="text-sm text-gray-600">
                    Higher values require closer matches (more accurate but may miss some matches)
                  </p>
                </div>
                <div className="px-4">
                  <Slider
                    value={recognitionThreshold}
                    onValueChange={setRecognitionThreshold}
                    max={100}
                    min={70}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>70% (Permissive)</span>
                    <span className="font-medium">{recognitionThreshold[0]}%</span>
                    <span>100% (Strict)</span>
                  </div>
                </div>
              </div>

              {/* Collection Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Collection Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Collection ID:</span>
                    <span className="ml-2 font-mono text-xs">{collection.awsCollectionId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">AWS Face Count:</span>
                    <span className="ml-2">{collection.awsInfo?.faceCount || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Model Version:</span>
                    <span className="ml-2">{collection.awsInfo?.faceModelVersion || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2">{collection.status}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button 
                  onClick={updateSettings}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Save Settings'}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={deleteCollection}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Collection
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Registered Faces Tab */}
        <TabsContent value="faces" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Registered Faces ({collection.faceRecords.length})</h3>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Add More Faces
            </Button>
          </div>

          {collection.faceRecords.length === 0 ? (
            <Card className="p-8 text-center">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Faces Registered</h3>
              <p className="text-gray-600 mb-4">
                No faces have been registered for this child yet.
              </p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Register First Face
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collection.faceRecords.map((faceRecord) => (
                <Card key={faceRecord.id} className="p-4">
                  <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <Image
                      src={faceRecord.imageUrl}
                      alt="Registered face"
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-2 right-2">
                      {faceRecord.confidence?.toFixed(1)}%
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={faceRecord.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {faceRecord.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(faceRecord.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {faceRecord.registrationNotes && (
                      <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {faceRecord.registrationNotes}
                      </p>
                    )}

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteFaceRecord(faceRecord.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Recognition Events ({recentEvents.length})
            </h3>
          </div>

          {recentEvents.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
              <p className="text-gray-600">
                No face recognition events have occurred recently.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <Card key={event.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        event.eventType === 'FACE_MATCHED' ? 'bg-green-500' :
                        event.eventType === 'FACE_DETECTED' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`} />
                      <div>
                        <h4 className="font-medium">
                          {event.eventType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <div className="text-sm text-gray-600">
                          {event.venue?.name && `at ${event.venue.name}`}
                          {event.memory && ` • ${event.memory.fileName}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={event.confidence >= 95 ? 'default' : 'secondary'}>
                        {event.confidence.toFixed(1)}%
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(event.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
