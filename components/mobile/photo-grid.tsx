
"use client";

import { useState } from "react";
import { Camera, Download, Share, Eye, EyeOff, Heart, MoreVertical, CheckSquare, Square } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

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
  recognitionConfidence?: number;
}

interface PhotoGridProps {
  photos: PhotoNotification[];
  viewMode: 'grid' | 'list';
  onPhotoSelect: (photo: PhotoNotification) => void;
  onPhotoAction: (photoId: string, action: 'download' | 'share' | 'favorite') => void;
  onBulkAction: (photoIds: string[], action: 'download' | 'share' | 'delete') => void;
}

export function PhotoGrid({ 
  photos, 
  viewMode, 
  onPhotoSelect, 
  onPhotoAction, 
  onBulkAction 
}: PhotoGridProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handlePhotoPress = (photo: PhotoNotification) => {
    if (isSelectionMode) {
      togglePhotoSelection(photo.id);
    } else {
      onPhotoSelect(photo);
    }
  };

  const handlePhotoLongPress = (photoId: string) => {
    setIsSelectionMode(true);
    togglePhotoSelection(photoId);
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      
      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }
      
      return newSet;
    });
  };

  const handleBulkActionPress = (action: 'download' | 'share' | 'delete') => {
    onBulkAction(Array.from(selectedPhotos), action);
    setSelectedPhotos(new Set());
    setIsSelectionMode(false);
  };

  const formatConfidence = (confidence?: number) => {
    if (!confidence) return '';
    return `${confidence.toFixed(0)}%`;
  };

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Photos Found</h3>
        <p className="text-gray-600">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {selectedPhotos.size} selected
              </span>
              
              <div className="flex items-center space-x-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBulkActionPress('download')}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBulkActionPress('share')}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium"
                >
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedPhotos(new Set());
                    setIsSelectionMode(false);
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Grid */}
      <div className={`space-y-4 ${isSelectionMode ? 'mt-20' : ''}`}>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onTap={() => handlePhotoPress(photo)}
                onTapStart={() => {
                  const timer = setTimeout(() => handlePhotoLongPress(photo.id), 500);
                  return () => clearTimeout(timer);
                }}
                className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
              >
                {/* Selection Overlay */}
                {isSelectionMode && (
                  <div className="absolute top-2 left-2 z-10">
                    {selectedPhotos.has(photo.id) ? (
                      <CheckSquare className="h-6 w-6 text-blue-500 bg-white rounded" />
                    ) : (
                      <Square className="h-6 w-6 text-gray-400 bg-white rounded" />
                    )}
                  </div>
                )}
                
                {/* Photo */}
                <div className="aspect-square relative">
                  <Image
                    src={photo.thumbnailUrl || photo.photoUrl}
                    alt="Child photo"
                    fill
                    className="object-cover"
                  />
                  
                  {/* Unviewed Indicator */}
                  {!photo.isViewed && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-purple-500 rounded-full border-2 border-white" />
                  )}
                  
                  {/* Confidence Badge */}
                  {photo.recognitionConfidence && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      {formatConfidence(photo.recognitionConfidence)}
                    </div>
                  )}
                  
                  {/* Actions Overlay */}
                  <div className="absolute bottom-2 right-2 flex space-x-1">
                    {photo.isFavorite && (
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                    )}
                    {photo.isDownloaded && (
                      <Download className="h-4 w-4 text-green-500" />
                    )}
                    {photo.isShared && (
                      <Share className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
                
                {/* Photo Info */}
                <div className="p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {photo.child.firstName}
                    </h3>
                    {!photo.isViewed && (
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 truncate">{photo.venue.name}</p>
                  <p className="text-xs text-gray-500">{photo.capturedAt}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onTap={() => handlePhotoPress(photo)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4"
              >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                  <div className="flex-shrink-0">
                    {selectedPhotos.has(photo.id) ? (
                      <CheckSquare className="h-6 w-6 text-blue-500" />
                    ) : (
                      <Square className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                )}
                
                {/* Thumbnail */}
                <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  <Image
                    src={photo.thumbnailUrl || photo.photoUrl}
                    alt="Child photo"
                    fill
                    className="object-cover"
                  />
                  
                  {!photo.isViewed && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
                  )}
                </div>
                
                {/* Photo Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {photo.child.firstName} {photo.child.lastName}
                    </h3>
                    {!photo.isViewed && (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate">{photo.venue.name}</p>
                  {photo.location && (
                    <p className="text-sm text-gray-500 truncate">{photo.location.zone}</p>
                  )}
                  <p className="text-xs text-gray-400">{photo.capturedAt}</p>
                  
                  {photo.recognitionConfidence && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {formatConfidence(photo.recognitionConfidence)} match
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {photo.isFavorite && (
                    <Heart className="h-4 w-4 text-red-500 fill-current" />
                  )}
                  {photo.isDownloaded && (
                    <Download className="h-4 w-4 text-green-500" />
                  )}
                  {photo.isShared && (
                    <Share className="h-4 w-4 text-blue-500" />
                  )}
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPhotoAction(photo.id, 'favorite');
                    }}
                    className="p-1 rounded-lg hover:bg-gray-100"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
