
"use client";

import { useState, useRef, useEffect } from "react";
import { X, Camera, Flashlight, RotateCcw, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export function QRScanner({ onScan, onClose, isProcessing = false }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    requestCameraPermission();
    return () => {
      stopCamera();
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
        setError(null);
        
        // Start scanning for QR codes
        startQRDetection();
      }
    } catch (err) {
      console.error('Camera permission denied:', err);
      setHasPermission(false);
      setError('Camera access is required to scan QR codes. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const startQRDetection = () => {
    // Mock QR detection for demonstration
    // In a real app, you would use a QR code detection library
    const interval = setInterval(() => {
      if (isProcessing) {
        clearInterval(interval);
        return;
      }
      
      // Simulate QR code detection after 3 seconds
      setTimeout(() => {
        if (!isProcessing) {
          // Mock QR data
          const mockQRData = 'SAFEPLAY_CHECK_IN_VENUE1_ADVENTURE_PLAYGROUND';
          onScan(mockQRData);
          clearInterval(interval);
        }
      }, 3000);
    }, 100);

    return () => clearInterval(interval);
  };

  const toggleFlash = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream;
      const track = stream?.getVideoTracks()[0];
      
      // Check if torch capability exists (with type assertion for broader compatibility)
      const capabilities = track?.getCapabilities?.() as any;
      if (capabilities?.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashOn } as any]
        });
        setFlashOn(!flashOn);
      }
    } catch (err) {
      console.error('Flash toggle failed:', err);
    }
  };

  const retryCamera = () => {
    setError(null);
    setHasPermission(null);
    requestCameraPermission();
  };

  if (hasPermission === null) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      >
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4" />
          <p>Requesting camera access...</p>
        </div>
      </motion.div>
    );
  }

  if (hasPermission === false || error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Access Required</h3>
          <p className="text-gray-600 text-sm mb-6">
            {error || 'We need camera access to scan QR codes for check-in/out.'}
          </p>
          
          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={retryCamera}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium"
            >
              Try Again
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
            >
              Cancel
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50"
    >
      {/* Camera View */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center justify-between text-white">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
              >
                <X className="h-6 w-6" />
              </motion.button>
              
              <h1 className="text-lg font-semibold">Scan QR Code</h1>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleFlash}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  flashOn ? 'bg-yellow-500' : 'bg-black/50'
                }`}
              >
                <Flashlight className={`h-5 w-5 ${flashOn ? 'text-black' : 'text-white'}`} />
              </motion.button>
            </div>
          </div>
          
          {/* Scanning Frame */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-64 h-64 border-2 border-white rounded-2xl relative">
                {/* Corner indicators */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-blue-500 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-blue-500 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-blue-500 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-blue-500 rounded-br-xl" />
                
                {/* Scanning line */}
                {!isProcessing && (
                  <motion.div
                    animate={{ y: [0, 240, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-lg shadow-blue-500/50"
                  />
                )}
                
                {/* Processing overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2" />
                      <p className="text-sm font-medium">Processing...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
            <div className="text-white text-center">
              <h2 className="text-xl font-semibold mb-2">
                {isProcessing ? 'Processing QR Code...' : 'Position QR code in frame'}
              </h2>
              <p className="text-white/80 text-sm">
                {isProcessing 
                  ? 'Please wait while we process your request' 
                  : 'Hold your device steady and align the QR code within the frame'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
