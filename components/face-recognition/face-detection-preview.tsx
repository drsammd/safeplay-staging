
"use client";

import { useState, useCallback } from "react";
import { Upload, Eye, AlertCircle, Check, Camera } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

interface DetectedFace {
  id: string;
  boundingBox: {
    Width: number;
    Height: number;
    Left: number;
    Top: number;
  };
  confidence: number;
  attributes?: {
    emotions?: Array<{ type: string; confidence: number }>;
    ageRange?: { low: number; high: number };
    gender?: { value: string; confidence: number };
    smile?: { value: boolean; confidence: number };
    eyeglasses?: { value: boolean; confidence: number };
    quality?: { brightness: number; sharpness: number };
  };
}

interface FaceDetectionResult {
  success: boolean;
  faces: DetectedFace[];
  summary: {
    totalFaces: number;
    averageConfidence: number;
    highConfidenceFaces: number;
  };
}

interface FaceDetectionPreviewProps {
  onDetectionComplete?: (result: FaceDetectionResult) => void;
  showDetailedAnalysis?: boolean;
  maxFiles?: number;
}

export default function FaceDetectionPreview({
  onDetectionComplete,
  showDetailedAnalysis = false,
  maxFiles = 1,
}: FaceDetectionPreviewProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<FaceDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [analyzeDetails, setAnalyzeDetails] = useState(showDetailedAnalysis);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setDetectionResult(null);
    setUploadedFile(file);
    
    // Create preview
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    
    // Start face detection
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('analyzeDetails', analyzeDetails.toString());

      const response = await fetch('/api/faces/detect', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setDetectionResult(result);
        onDetectionComplete?.(result);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Face detection failed');
      }
    } catch (err) {
      console.error('Face detection error:', err);
      setError('Face detection failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [analyzeDetails, onDetectionComplete]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Reset
  const handleReset = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setUploadedFile(null);
    setImagePreview(null);
    setDetectionResult(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!imagePreview ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('face-detection-upload')?.click()}
        >
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Upload Photo for Face Detection
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Drop an image here or click to browse
          </p>
          
          {showDetailedAnalysis && (
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Switch
                id="analyze-details"
                checked={analyzeDetails}
                onCheckedChange={setAnalyzeDetails}
              />
              <label htmlFor="analyze-details" className="text-sm text-gray-600">
                Include detailed face analysis
              </label>
            </div>
          )}
          
          <input
            id="face-detection-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
        </div>
      ) : (
        <Card className="p-6">
          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Face Detection Results
            </h3>
            <div className="flex items-center space-x-4">
              {detectionResult && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-overlay"
                    checked={showOverlay}
                    onCheckedChange={setShowOverlay}
                  />
                  <label htmlFor="show-overlay" className="text-sm text-gray-600">
                    Show face overlay
                  </label>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleReset}>
                Upload New
              </Button>
            </div>
          </div>

          {/* Image with Face Detection Overlay */}
          <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
            <Image
              src={imagePreview}
              alt="Face detection preview"
              fill
              className="object-contain"
            />
            
            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>Detecting faces...</p>
                </div>
              </div>
            )}

            {/* Face Detection Overlay */}
            {showOverlay && detectionResult?.faces.map((face, index) => (
              <div
                key={face.id}
                className="absolute border-2 border-green-400 bg-green-400 bg-opacity-20"
                style={{
                  left: `${face.boundingBox.Left * 100}%`,
                  top: `${face.boundingBox.Top * 100}%`,
                  width: `${face.boundingBox.Width * 100}%`,
                  height: `${face.boundingBox.Height * 100}%`,
                }}
              >
                <Badge className="absolute -top-6 left-0 bg-green-500">
                  Face {index + 1} - {face.confidence.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>

          {/* Results */}
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {detectionResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {detectionResult.summary.totalFaces}
                  </div>
                  <div className="text-sm text-gray-600">Faces Detected</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {detectionResult.summary.averageConfidence.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Confidence</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {detectionResult.summary.highConfidenceFaces}
                  </div>
                  <div className="text-sm text-gray-600">High Quality</div>
                </Card>
              </div>

              {/* Detailed Face Analysis */}
              {analyzeDetails && detectionResult.faces.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Detailed Face Analysis</h4>
                  {detectionResult.faces.map((face, index) => (
                    <Card key={face.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium">Face {index + 1}</h5>
                        <Badge variant={face.confidence >= 95 ? "default" : "secondary"}>
                          {face.confidence.toFixed(1)}% confidence
                        </Badge>
                      </div>

                      {face.attributes && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          {/* Age Range */}
                          {face.attributes.ageRange && (
                            <div>
                              <span className="font-medium">Age Range:</span>
                              <span className="ml-2">
                                {face.attributes.ageRange.low}-{face.attributes.ageRange.high}
                              </span>
                            </div>
                          )}

                          {/* Gender */}
                          {face.attributes.gender && (
                            <div>
                              <span className="font-medium">Gender:</span>
                              <span className="ml-2">
                                {face.attributes.gender.value} ({face.attributes.gender.confidence.toFixed(1)}%)
                              </span>
                            </div>
                          )}

                          {/* Smile */}
                          {face.attributes.smile && (
                            <div>
                              <span className="font-medium">Smiling:</span>
                              <span className="ml-2">
                                {face.attributes.smile.value ? 'Yes' : 'No'} ({face.attributes.smile.confidence.toFixed(1)}%)
                              </span>
                            </div>
                          )}

                          {/* Eyeglasses */}
                          {face.attributes.eyeglasses && (
                            <div>
                              <span className="font-medium">Eyeglasses:</span>
                              <span className="ml-2">
                                {face.attributes.eyeglasses.value ? 'Yes' : 'No'} ({face.attributes.eyeglasses.confidence.toFixed(1)}%)
                              </span>
                            </div>
                          )}

                          {/* Quality */}
                          {face.attributes.quality && (
                            <div className="md:col-span-2">
                              <span className="font-medium">Image Quality:</span>
                              <span className="ml-2">
                                Brightness: {face.attributes.quality.brightness.toFixed(1)}, 
                                Sharpness: {face.attributes.quality.sharpness.toFixed(1)}
                              </span>
                            </div>
                          )}

                          {/* Top Emotions */}
                          {face.attributes.emotions && face.attributes.emotions.length > 0 && (
                            <div className="md:col-span-3">
                              <span className="font-medium">Top Emotions:</span>
                              <div className="ml-2 mt-1">
                                {face.attributes.emotions
                                  .sort((a, b) => b.confidence - a.confidence)
                                  .slice(0, 3)
                                  .map((emotion, i) => (
                                    <Badge key={i} variant="outline" className="mr-2 mb-1">
                                      {emotion.type}: {emotion.confidence.toFixed(1)}%
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {/* Success Message */}
              {detectionResult.faces.length > 0 && (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Successfully detected {detectionResult.faces.length} face(s) with an average confidence of {detectionResult.summary.averageConfidence.toFixed(1)}%.
                  </AlertDescription>
                </Alert>
              )}

              {/* No Faces Message */}
              {detectionResult.faces.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No faces were detected in this image. Please try uploading a clearer image with visible faces.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
