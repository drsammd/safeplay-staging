
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, RotateCcw, Check, AlertCircle, User, Lightbulb } from 'lucide-react';

interface SelfieCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  onQualityCheck?: (quality: {
    hasMultipleFaces: boolean;
    faceDetected: boolean;
    brightness: number;
    sharpness: number;
    isGoodQuality: boolean;
  }) => void;
  className?: string;
}

export function SelfieCapture({ onCapture, onQualityCheck, className = "" }: SelfieCaptureProps) {
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [qualityFeedback, setQualityFeedback] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setStreamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setStreamError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreamActive(false);
  }, []);

  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    setIsAnalyzing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        // Create data URL for preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setCapturedImage(e.target?.result as string);
        };
        reader.readAsDataURL(blob);
        
        // Perform basic quality analysis
        await analyzeImageQuality(canvas, context);
        
        // Call parent callback
        onCapture(blob);
        stopCamera();
      }
      setIsCapturing(false);
      setIsAnalyzing(false);
    }, 'image/jpeg', 0.9);
  }, [onCapture, stopCamera]);

  // Basic image quality analysis
  const analyzeImageQuality = async (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Calculate brightness
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalBrightness += (r + g + b) / 3;
      }
      const brightness = totalBrightness / (data.length / 4);
      
      // Simple sharpness estimation using edge detection
      const sharpness = calculateSharpness(imageData);
      
      // Face detection would require additional libraries
      // For now, we'll provide basic feedback
      const feedback: string[] = [];
      
      if (brightness < 80) {
        feedback.push("Image appears too dark - try better lighting");
      } else if (brightness > 200) {
        feedback.push("Image appears too bright - reduce lighting");
      }
      
      if (sharpness < 50) {
        feedback.push("Image appears blurry - hold camera steady");
      }
      
      const isGoodQuality = brightness >= 80 && brightness <= 200 && sharpness >= 50;
      
      if (isGoodQuality) {
        feedback.push("Good image quality detected");
      }
      
      setQualityFeedback(feedback);
      
      const qualityData = {
        hasMultipleFaces: false, // Would need face detection library
        faceDetected: true, // Assume face detected for now
        brightness: brightness / 255,
        sharpness: sharpness / 100,
        isGoodQuality
      };
      
      onQualityCheck?.(qualityData);
      
    } catch (error) {
      console.error('Error analyzing image quality:', error);
    }
  };

  // Simple sharpness calculation using Laplacian operator
  const calculateSharpness = (imageData: ImageData): number => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let sharpness = 0;
    const laplacian = [0, -1, 0, -1, 4, -1, 0, -1, 0];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            sum += gray * laplacian[(ky + 1) * 3 + (kx + 1)];
          }
        }
        sharpness += Math.abs(sum);
      }
    }
    
    return sharpness / ((width - 2) * (height - 2));
  };

  // Reset capture
  const resetCapture = useCallback(() => {
    setCapturedImage(null);
    setQualityFeedback([]);
    startCamera();
  }, [startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Real-time guidance tips
  const guidanceTips = [
    "Look directly at the camera",
    "Ensure your face is well-lit",
    "Remove sunglasses or hats",
    "Hold the camera at eye level",
    "Keep a neutral expression"
  ];

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Selfie Verification
          </CardTitle>
          <CardDescription>
            Take a clear selfie for identity verification. This will be compared with your document photo.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Camera view or captured image */}
          <div className="relative">
            <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
              {capturedImage ? (
                <img 
                  src={capturedImage} 
                  alt="Captured selfie" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />
              )}
            </div>
            
            {/* Face detection overlay guide */}
            {isStreamActive && !capturedImage && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-white rounded-full opacity-50">
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-16 w-16 text-white opacity-50" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <div>Analyzing image quality...</div>
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {streamError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{streamError}</span>
            </div>
          )}

          {/* Quality feedback */}
          {qualityFeedback.length > 0 && (
            <div className="space-y-2">
              {qualityFeedback.map((feedback, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                    feedback.includes('Good') 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  {feedback.includes('Good') ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{feedback}</span>
                </div>
              ))}
            </div>
          )}

          {/* Guidance tips */}
          {isStreamActive && !capturedImage && (
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Tips for best results:</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  {guidanceTips.map((tip, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {!isStreamActive && !capturedImage && (
              <Button onClick={startCamera} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            )}
            
            {isStreamActive && !capturedImage && (
              <Button 
                onClick={capturePhoto} 
                disabled={isCapturing}
                className="flex-1"
              >
                {isCapturing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </>
                )}
              </Button>
            )}
            
            {capturedImage && (
              <Button onClick={resetCapture} variant="outline" className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Photo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
