
"use client";

import { Camera, Download, Share, Eye, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
}

interface PhotoNotification {
  id: string;
  photoUrl: string;
  thumbnailUrl?: string;
  capturedAt: string;
  child: Child;
  venue: {
    name: string;
  };
  isViewed: boolean;
  recognitionConfidence?: number;
}

interface MobilePhotoCarouselProps {
  photos: PhotoNotification[];
}

export function MobilePhotoCarousel({ photos }: MobilePhotoCarouselProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoNotification | null>(null);
  const [viewedPhotos, setViewedPhotos] = useState<Set<string>>(new Set());

  const handlePhotoPress = (photo: PhotoNotification) => {
    setSelectedPhoto(photo);
    setViewedPhotos(prev => new Set([...prev, photo.id]));
  };

  const handleDownload = (photo: PhotoNotification) => {
    // Handle photo download
    console.log('Downloading photo:', photo.id);
  };

  const handleShare = (photo: PhotoNotification) => {
    // Handle photo sharing
    console.log('Sharing photo:', photo.id);
  };

  const unviewedPhotos = photos.filter(photo => !photo.isViewed && !viewedPhotos.has(photo.id));

  if (photos.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Photos</h2>
        <div className="bg-white rounded-xl p-6 text-center">
          <Camera className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No photos yet</p>
          <p className="text-sm text-gray-400 mt-1">
            New photos of your children will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Photos</h2>
          {unviewedPhotos.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{unviewedPhotos.length} new</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-purple-500 rounded-full"
              />
            </div>
          )}
        </div>
        
        <div className="horizontal-scroll">
          <div className="flex space-x-3 pb-2">
            {photos.slice(0, 10).map((photo, index) => {
              const isUnviewed = !photo.isViewed && !viewedPhotos.has(photo.id);
              
              return (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePhotoPress(photo)}
                  className="flex-shrink-0 w-32 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 active:shadow-md transition-all duration-200"
                >
                  <div className="relative">
                    <div className="w-32 h-24 bg-gray-200 relative">
                      <Image
                        src={photo.thumbnailUrl || photo.photoUrl}
                        alt="Child photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {isUnviewed && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-purple-500 rounded-full border-2 border-white" />
                    )}
                    
                    {photo.recognitionConfidence && (
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        {photo.recognitionConfidence.toFixed(0)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center space-x-1 mb-1">
                      <h3 className="font-medium text-gray-900 text-xs truncate">
                        {photo.child.firstName}
                      </h3>
                      {isUnviewed && (
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{photo.venue.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{photo.capturedAt}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {photos.length > 10 && (
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 w-32 h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center"
              >
                <div className="text-center">
                  <Camera className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">+{photos.length - 10} more</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Detail Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl overflow-hidden max-w-sm w-full"
            >
              <div className="relative">
                <div className="w-full h-64 bg-gray-200 relative">
                  <Image
                    src={selectedPhoto.photoUrl}
                    alt="Child photo"
                    fill
                    className="object-cover"
                  />
                </div>
                
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedPhoto.child.firstName} {selectedPhoto.child.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedPhoto.venue.name}</p>
                  </div>
                  
                  {selectedPhoto.recognitionConfidence && (
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      {selectedPhoto.recognitionConfidence.toFixed(1)}% match
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
                  <Clock className="h-4 w-4" />
                  <span>{selectedPhoto.capturedAt}</span>
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload(selectedPhoto)}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-lg flex items-center justify-center space-x-2 font-medium"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare(selectedPhoto)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg flex items-center justify-center space-x-2 font-medium"
                  >
                    <Share className="h-4 w-4" />
                    <span>Share</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .horizontal-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .horizontal-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
