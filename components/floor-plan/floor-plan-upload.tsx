
'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Upload, FileImage, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FloorPlanUploadProps {
  venueId: string;
  onUploadComplete: (floorPlan: any) => void;
  onUploadError: (error: string) => void;
}

export default function FloorPlanUpload({ venueId, onUploadComplete, onUploadError }: FloorPlanUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dimensions: {
      width: 1000,
      height: 800,
      scale: 1.0
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setFormData(prev => ({
        ...prev,
        name: prev.name || file.name.replace(/\.[^/.]+$/, '')
      }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'image/svg+xml': ['.svg']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const handleUpload = async () => {
    if (!uploadedFile || !formData.name.trim()) {
      onUploadError('Please select a file and provide a name');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload file
      const uploadFormData = new FormData();
      uploadFormData.append('file', uploadedFile);
      uploadFormData.append('venueId', venueId);

      setUploadProgress(30);

      const uploadResponse = await fetch('/api/floor-plans/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      const uploadData = await uploadResponse.json();
      setUploadResult(uploadData);
      setUploadProgress(70);

      // Create floor plan record
      const floorPlanData = {
        name: formData.name,
        description: formData.description,
        fileUrl: uploadData.fileUrl,
        fileType: uploadData.fileType,
        originalFileName: uploadData.originalFileName,
        fileSize: uploadData.fileSize,
        dimensions: formData.dimensions,
        venueId: venueId
      };

      const createResponse = await fetch('/api/floor-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(floorPlanData),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create floor plan record');
      }

      const floorPlan = await createResponse.json();
      setUploadProgress(100);

      setTimeout(() => {
        onUploadComplete(floorPlan);
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setUploadedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setFormData({
      name: '',
      description: '',
      dimensions: {
        width: 1000,
        height: 800,
        scale: 1.0
      }
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Floor Plan
        </CardTitle>
        <CardDescription>
          Upload CAD files, images, or PDFs of your venue floor plan. Supported formats: PNG, JPG, PDF, SVG (max 50MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : uploadedFile
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          
          {uploadedFile ? (
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-lg font-medium text-green-700">{uploadedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <Button variant="outline" size="sm" onClick={(e) => {
                e.stopPropagation();
                setUploadedFile(null);
              }}>
                Remove File
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <FileImage className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a floor plan file'}
              </p>
              <p className="text-sm text-gray-500">
                or click to browse files
              </p>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Floor Plan Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Main Floor Plan 2024"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description of the floor plan..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Width (pixels/units)</Label>
              <Input
                id="width"
                type="number"
                value={formData.dimensions.width}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, width: parseInt(e.target.value) || 1000 }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="height">Height (pixels/units)</Label>
              <Input
                id="height"
                type="number"
                value={formData.dimensions.height}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, height: parseInt(e.target.value) || 800 }
                }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="scale">Scale (meters per unit)</Label>
            <Input
              id="scale"
              type="number"
              step="0.1"
              value={formData.dimensions.scale}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                dimensions: { ...prev.dimensions, scale: parseFloat(e.target.value) || 1.0 }
              }))}
              placeholder="e.g., 0.01 for 1cm per pixel"
            />
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!uploadedFile || !formData.name.trim() || isUploading}
            className="flex-1"
          >
            {isUploading ? 'Uploading...' : 'Upload Floor Plan'}
          </Button>
          
          {(uploadedFile || uploadResult) && (
            <Button variant="outline" onClick={resetForm} disabled={isUploading}>
              Reset
            </Button>
          )}
        </div>

        {/* Upload Success Message */}
        {uploadResult && uploadProgress === 100 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Floor plan uploaded successfully! Setting up your floor plan...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
