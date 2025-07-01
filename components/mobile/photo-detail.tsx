
"use client";

import { Download, Share, Heart, X, MapPin, Clock, Camera, Eye, Star } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
}

interface Venue {
  id: string;
  name: string;
  address: string;
}

interface PhotoNotification {
  id: string;
  photoUrl: string;
  thumbnailUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  capturedAt: string;
  child: Child;
  venue: Venue;
  location?: {
    zone: string;
    camera: string;
  };
  isViewed: boolean;
  isDownloaded: boolean;
  isShared: boolean;
  isFavorite?: boolean;
  detectionConfidence?: number;
  recognitionConfidence?: number;
  metadata?: {
    camera: string;
    resolution: string;
    timestamp: string;
  };
}

interface PhotoDetailProps {
  photo: PhotoNotification;
  onClose: () => void;
  onAction: (photoId: string, action: 'download' | 'share' | 'favorite') => void;
}

export function PhotoDetail({ photo, onClose, onAction }: PhotoDetailProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    // Simulate download
    await new Promise(resolve => setTimeout(resolve, 1000));
    onAction(photo.id, 'download');
    setIsDownloading(false);
  };

  const handleShare = async () => {
    setIsSharing(true);
    // Simulate share
    await new Promise(resolve => setTimeout(resolve, 500));
    onAction(photo.id, 'share');
    setIsSharing(false);
  };

  const handleFavorite = () => {
    onAction(photo.id, 'favorite');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)}KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-600';
    if (confidence >= 95) return 'text-green-600';
    if (confidence >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
            {photo.child.profilePhoto ? (
              <Image
                src={photo.child.profilePhoto}
                alt={photo.child.firstName}
                width={32}
                height={32}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {photo.child.firstName[0]}
                </span>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-medium text-sm">
              {photo.child.firstName} {photo.child.lastName}
            </h3>
            <p className="text-xs text-gray-300">{photo.capturedAt}</p>
          </div>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
        >
          <X className="h-5 w-5" />
        </motion.button>
      </div>
      
      {/* Photo */}
      <div 
        className="flex-1 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative max-w-full max-h-full"
        >
          <Image
            src={photo.photoUrl}
            alt="Child photo"
            width={400}
            height={300}
            className="object-contain rounded-lg"
          />
          
          {!photo.isViewed && (
            <div className="absolute top-4 right-4 w-4 h-4 bg-purple-500 rounded-full border-2 border-white" />
          )}
        </motion.div>
      </div>
      
      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white rounded-t-2xl p-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${
              photo.isDownloaded 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Download className={`h-6 w-6 mb-2 ${isDownloading ? 'animate-bounce' : ''}`} />
            <span className="text-sm font-medium">
              {isDownloading ? 'Downloading...' : photo.isDownloaded ? 'Downloaded' : 'Download'}
            </span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            disabled={isSharing}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${
              photo.isShared 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Share className={`h-6 w-6 mb-2 ${isSharing ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium">
              {isSharing ? 'Sharing...' : photo.isShared ? 'Shared' : 'Share'}
            </span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleFavorite}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${
              photo.isFavorite 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Heart className={`h-6 w-6 mb-2 ${photo.isFavorite ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">
              {photo.isFavorite ? 'Favorited' : 'Favorite'}
            </span>
          </motion.button>
        </div>
        
        {/* Photo Details */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Photo Details</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{photo.venue.name}</p>
                  {photo.location && (
                    <p className="text-gray-600">{photo.location.zone}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Captured</p>
                  <p className="text-gray-600">{photo.capturedAt}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {photo.recognitionConfidence && (
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Recognition</p>
                    <p className={`${getConfidenceColor(photo.recognitionConfidence)}`}>
                      {photo.recognitionConfidence.toFixed(1)}% confidence
                    </p>
                  </div>
                </div>
              )}
              
              {photo.metadata && (
                <div className="flex items-center space-x-2">
                  <Camera className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Camera</p>
                    <p className="text-gray-600">{photo.metadata.camera}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Technical Details */}
        {photo.metadata && (
          <div className="pt-3 border-t border-gray-200">
            <h5 className="font-medium text-gray-900 mb-2">Technical Info</h5>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">Resolution:</span>
                <span className="ml-2">{photo.metadata.resolution}</span>
              </div>
              
              {photo.originalSize && (
                <div>
                  <span className="font-medium">Size:</span>
                  <span className="ml-2">{formatFileSize(photo.originalSize)}</span>
                </div>
              )}
              
              {photo.detectionConfidence && (
                <div>
                  <span className="font-medium">Detection:</span>
                  <span className="ml-2">{photo.detectionConfidence.toFixed(1)}%</span>
                </div>
              )}
              
              {photo.location && (
                <div>
                  <span className="font-medium">Camera:</span>
                  <span className="ml-2">{photo.location.camera}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
