
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera as CameraIcon, 
  Settings, 
  Eye, 
  RotateCw, 
  Crosshair,
  Lightbulb,
  Save,
  Trash2,
  AlertCircle
} from 'lucide-react';

// Import unified types
import type { CameraDevice, CameraRecommendation } from '@/lib/floor-plan-types';

interface CameraPlacementPanelProps {
  selectedCamera: CameraDevice | null;
  floorPlanDimensions?: { width: number; height: number };
  onCameraUpdate: (camera: CameraDevice) => void;
  onCameraDelete: (cameraId: string) => void;
  onCameraSave: (camera: CameraDevice) => void;
  onGenerateRecommendations: () => void;
  isNewCamera?: boolean;
  recommendations?: Array<{
    id: string;
    suggestedPosition: { x: number; y: number };
    reasoning: string;
    priority: string;
  }>;
}

export default function CameraPlacementPanel({
  selectedCamera,
  floorPlanDimensions,
  onCameraUpdate,
  onCameraDelete,
  onCameraSave,
  onGenerateRecommendations,
  isNewCamera = false,
  recommendations = []
}: CameraPlacementPanelProps) {
  const [editingCamera, setEditingCamera] = useState<CameraDevice | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (selectedCamera) {
      setEditingCamera({ ...selectedCamera });
      setHasChanges(false);
    } else {
      setEditingCamera(null);
      setHasChanges(false);
    }
  }, [selectedCamera]);

  const handleCameraChange = (field: string, value: any) => {
    if (!editingCamera) return;

    const updatedCamera = { ...editingCamera, [field]: value };
    setEditingCamera(updatedCamera);
    setHasChanges(true);
    onCameraUpdate(updatedCamera);
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    if (!editingCamera) return;

    const updatedCamera = {
      ...editingCamera,
      [parent]: {
        ...(editingCamera[parent as keyof CameraDevice] as Record<string, any> || {}),
        [field]: value
      }
    };
    setEditingCamera(updatedCamera);
    setHasChanges(true);
    onCameraUpdate(updatedCamera);
  };

  const handleSave = async () => {
    if (!editingCamera) return;

    try {
      await onCameraSave(editingCamera);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving camera:', error);
    }
  };

  const handleDelete = () => {
    if (editingCamera?.id) {
      onCameraDelete(editingCamera.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-100 text-green-800';
      case 'OFFLINE': return 'bg-red-100 text-red-800';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!editingCamera) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CameraIcon className="h-5 w-5" />
            Camera Placement
          </CardTitle>
          <CardDescription>
            Click on the floor plan to place a new camera or select an existing camera to edit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {recommendations.slice(0, 3).map((rec) => (
                  <Alert key={rec.id}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <Badge variant="outline" className="mr-2">
                        {rec.priority}
                      </Badge>
                      {rec.reasoning}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
          
          <Button onClick={onGenerateRecommendations} className="w-full" variant="outline">
            <Lightbulb className="h-4 w-4 mr-2" />
            Generate Recommendations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 max-h-[80vh] overflow-y-auto">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CameraIcon className="h-5 w-5" />
              {isNewCamera ? 'New Camera' : 'Edit Camera'}
            </CardTitle>
            {editingCamera.position && (
              <CardDescription>
                Position: ({Math.round(editingCamera.position.x)}, {Math.round(editingCamera.position.y)})
              </CardDescription>
            )}
          </div>
          
          {!isNewCamera && (
            <Badge className={getStatusColor(editingCamera.status)}>
              {editingCamera.status}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="camera-name">Camera Name</Label>
            <Input
              id="camera-name"
              value={editingCamera.name}
              onChange={(e) => handleCameraChange('name', e.target.value)}
              placeholder="e.g., Front Entrance Camera"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="camera-model">Model</Label>
              <Input
                id="camera-model"
                value={editingCamera.model || ''}
                onChange={(e) => handleCameraChange('model', e.target.value)}
                placeholder="Camera model"
              />
            </div>
            <div>
              <Label htmlFor="camera-status">Status</Label>
              <Select
                value={editingCamera.status}
                onValueChange={(value) => handleCameraChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="camera-ip">IP Address</Label>
            <Input
              id="camera-ip"
              value={editingCamera.ipAddress || ''}
              onChange={(e) => handleCameraChange('ipAddress', e.target.value)}
              placeholder="192.168.1.100"
            />
          </div>

          <div>
            <Label htmlFor="camera-stream">Stream URL</Label>
            <Input
              id="camera-stream"
              value={editingCamera.streamUrl || ''}
              onChange={(e) => handleCameraChange('streamUrl', e.target.value)}
              placeholder="rtsp://camera-ip:554/stream"
            />
          </div>
        </div>

        <Separator />

        {/* Position and Orientation */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Crosshair className="h-4 w-4" />
            Position & Orientation
          </h4>

          {editingCamera.position && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>X Position</Label>
                <Input
                  type="number"
                  value={Math.round(editingCamera.position.x)}
                  onChange={(e) => handleCameraChange('position', {
                    ...editingCamera.position,
                    x: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label>Y Position</Label>
                <Input
                  type="number"
                  value={Math.round(editingCamera.position.y)}
                  onChange={(e) => handleCameraChange('position', {
                    ...editingCamera.position,
                    y: parseInt(e.target.value) || 0
                  })}
                />
              </div>
            </div>
          )}

          <div>
            <Label className="flex items-center justify-between">
              <span>Rotation: {editingCamera.rotation}°</span>
              <RotateCw className="h-4 w-4" />
            </Label>
            <Slider
              value={[editingCamera.rotation ?? 0]}
              onValueChange={([value]) => handleCameraChange('rotation', value)}
              max={360}
              step={5}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Height: {editingCamera.height ?? 2.5}m</Label>
            <Slider
              value={[editingCamera.height ?? 2.5]}
              onValueChange={([value]) => handleCameraChange('height', value)}
              min={1}
              max={5}
              step={0.1}
              className="mt-2"
            />
          </div>
        </div>

        <Separator />

        {/* View Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Configuration
          </h4>

          <div>
            <Label>View Angle: {editingCamera.viewAngle ?? 60}°</Label>
            <Slider
              value={[editingCamera.viewAngle ?? 60]}
              onValueChange={([value]) => handleCameraChange('viewAngle', value)}
              min={30}
              max={180}
              step={5}
              className="mt-2"
            />
          </div>

          <div>
            <Label>View Distance: {editingCamera.viewDistance ?? 10}m</Label>
            <Slider
              value={[editingCamera.viewDistance ?? 10]}
              onValueChange={([value]) => handleCameraChange('viewDistance', value)}
              min={2}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>
        </div>

        <Separator />

        {/* Features */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Features
          </h4>

          <div className="flex items-center justify-between">
            <Label htmlFor="recording-enabled">Recording Enabled</Label>
            <Switch
              id="recording-enabled"
              checked={editingCamera.isRecordingEnabled}
              onCheckedChange={(checked) => handleCameraChange('isRecordingEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="recognition-enabled">Face Recognition</Label>
            <Switch
              id="recognition-enabled"
              checked={editingCamera.isRecognitionEnabled}
              onCheckedChange={(checked) => handleCameraChange('isRecognitionEnabled', checked)}
            />
          </div>

          {editingCamera.isRecognitionEnabled && (
            <div>
              <Label>Recognition Threshold: {Math.round((editingCamera.recognitionThreshold ?? 0.85) * 100)}%</Label>
              <Slider
                value={[editingCamera.recognitionThreshold ?? 0.85]}
                onValueChange={([value]) => handleCameraChange('recognitionThreshold', value)}
                min={0.5}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isNewCamera ? 'Add Camera' : 'Save Changes'}
          </Button>
          
          {!isNewCamera && editingCamera.id && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {hasChanges && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Click Save to apply them.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
