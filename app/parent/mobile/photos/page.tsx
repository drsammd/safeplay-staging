
"use client";

import { useEffect, useState } from "react";
import { Camera, Download, Share, Eye, Filter, Grid, List, Search, Star, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { PhotoGrid } from "@/components/mobile/photo-grid";
import { PhotoDetail } from "@/components/mobile/photo-detail";
import { PhotoFilters } from "@/components/mobile/photo-filters";

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

export default function MobilePhotosPage() {
  const [photos, setPhotos] = useState<PhotoNotification[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoNotification | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    child: '',
    venue: '',
    viewed: 'all', // all, viewed, unviewed
    timeRange: 'all', // today, week, month, all
    confidence: 'all' // high, medium, low, all
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [filters]);

  const loadPhotos = async () => {
    try {
      setIsRefreshing(true);
      
      // Mock photo data
      setPhotos([
        {
          id: '1',
          photoUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhn3NX43OWwDOHuKinz4Nd3FzThFH0ZHXdCBN1dRFusjKSfHYzGlVYV_rJ3WA-8TGhwi0GufcklHF9tQVNG8xEzuZOzpoqU-heJgLhYfzpw-YhmD_XTxKt6k5sUYfMuk2yc39aiL75orY8cPrVjaNI42xXdBGoQkrk2Tq0pUMRnDyiAXyLNY7zPcad31cQa/s1920/school-playground-equipment.jpg',
          thumbnailUrl: 'https://www.shutterstock.com/image-photo/child-playing-playground-equipment-home-600w-1714292095.jpg',
          originalSize: 2048576, // 2MB
          compressedSize: 512000, // 500KB
          capturedAt: '2 minutes ago',
          child: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            profilePhoto: 'https://i.pinimg.com/originals/6a/53/60/6a5360f4fc04a9bfe007a33fd6451d72.jpg'
          },
          venue: {
            id: 'venue1',
            name: 'Adventure Playground',
            address: '123 Play Street'
          },
          location: {
            zone: 'Main Play Area',
            camera: 'Camera 3'
          },
          isViewed: false,
          isDownloaded: false,
          isShared: false,
          isFavorite: false,
          detectionConfidence: 98.5,
          recognitionConfidence: 96.7,
          metadata: {
            camera: 'IP-CAM-003',
            resolution: '1920x1080',
            timestamp: '2024-01-15T14:30:22Z'
          }
        },
        {
          id: '2',
          photoUrl: 'https://static.vecteezy.com/system/resources/previews/030/503/711/non_2x/young-girl-on-a-swing-set-laughing-with-pure-joy-generative-ai-photo.jpg',
          thumbnailUrl: 'https://i.pinimg.com/originals/9b/81/10/9b811043030741e4e4fb23589499ab8e.jpg',
          originalSize: 1856432,
          compressedSize: 445000,
          capturedAt: '15 minutes ago',
          child: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            profilePhoto: 'https://i.pinimg.com/originals/02/a4/05/02a4051b4f4204743110ca3871223ec3.jpg'
          },
          venue: {
            id: 'venue1',
            name: 'Adventure Playground',
            address: '123 Play Street'
          },
          location: {
            zone: 'Swing Area',
            camera: 'Camera 5'
          },
          isViewed: true,
          isDownloaded: true,
          isShared: false,
          isFavorite: true,
          detectionConfidence: 95.2,
          recognitionConfidence: 94.1,
          metadata: {
            camera: 'IP-CAM-005',
            resolution: '1920x1080',
            timestamp: '2024-01-15T14:15:45Z'
          }
        },
        {
          id: '3',
          photoUrl: 'https://i.ytimg.com/vi/vA4x585ipqM/maxresdefault.jpg',
          thumbnailUrl: 'https://i.pinimg.com/originals/c6/34/91/c6349138661e61b31f087ede35b77be4.jpg',
          originalSize: 2234567,
          compressedSize: 578000,
          capturedAt: '1 hour ago',
          child: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            profilePhoto: 'https://c8.alamy.com/comp/2HWWYTX/portrait-of-smiling-young-beautiful-girl-with-brown-hair-2HWWYTX.jpg'
          },
          venue: {
            id: 'venue1',
            name: 'Adventure Playground',
            address: '123 Play Street'
          },
          location: {
            zone: 'Climbing Area',
            camera: 'Camera 2'
          },
          isViewed: true,
          isDownloaded: false,
          isShared: true,
          isFavorite: false,
          detectionConfidence: 91.8,
          recognitionConfidence: 89.5,
          metadata: {
            camera: 'IP-CAM-002',
            resolution: '1920x1080',
            timestamp: '2024-01-15T13:30:15Z'
          }
        },
        {
          id: '4',
          photoUrl: 'https://foodfornet.com/wp-content/uploads/A-bunch-of-kids-having-a-picnic-outside-800x534.jpg',
          thumbnailUrl: 'https://img.freepik.com/premium-photo/cute-little-girl-eating-lunch-outside-picnic-table_1041545-46224.jpg',
          originalSize: 1789234,
          compressedSize: 423000,
          capturedAt: '2 hours ago',
          child: {
            id: '2',
            firstName: 'Lucas',
            lastName: 'Johnson',
            profilePhoto: 'https://i.pinimg.com/originals/42/1a/2f/421a2f0d7c770d276401b8821d359fae.jpg'
          },
          venue: {
            id: 'venue1',
            name: 'Adventure Playground',
            address: '123 Play Street'
          },
          location: {
            zone: 'Food Court',
            camera: 'Camera 4'
          },
          isViewed: true,
          isDownloaded: false,
          isShared: false,
          isFavorite: true,
          detectionConfidence: 97.3,
          recognitionConfidence: 95.8,
          metadata: {
            camera: 'IP-CAM-004',
            resolution: '1920x1080',
            timestamp: '2024-01-15T12:45:30Z'
          }
        }
      ]);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePhotoSelect = (photo: PhotoNotification) => {
    setSelectedPhoto(photo);
    // Mark as viewed
    if (!photo.isViewed) {
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, isViewed: true } : p
      ));
    }
  };

  const handlePhotoAction = (photoId: string, action: 'download' | 'share' | 'favorite') => {
    setPhotos(prev => prev.map(photo => {
      if (photo.id === photoId) {
        switch (action) {
          case 'download':
            return { ...photo, isDownloaded: true };
          case 'share':
            return { ...photo, isShared: true };
          case 'favorite':
            return { ...photo, isFavorite: !photo.isFavorite };
          default:
            return photo;
        }
      }
      return photo;
    }));
  };

  const handleBulkAction = (photoIds: string[], action: 'download' | 'share' | 'delete') => {
    switch (action) {
      case 'download':
        setPhotos(prev => prev.map(photo => 
          photoIds.includes(photo.id) ? { ...photo, isDownloaded: true } : photo
        ));
        break;
      case 'share':
        setPhotos(prev => prev.map(photo => 
          photoIds.includes(photo.id) ? { ...photo, isShared: true } : photo
        ));
        break;
      case 'delete':
        setPhotos(prev => prev.filter(photo => !photoIds.includes(photo.id)));
        break;
    }
  };

  const handleRefresh = () => {
    loadPhotos();
  };

  // Filter photos based on current filters and search
  const filteredPhotos = photos.filter(photo => {
    // Child filter
    if (filters.child && photo.child.id !== filters.child) return false;
    
    // Venue filter
    if (filters.venue && photo.venue.id !== filters.venue) return false;
    
    // Viewed filter
    if (filters.viewed === 'viewed' && !photo.isViewed) return false;
    if (filters.viewed === 'unviewed' && photo.isViewed) return false;
    
    // Confidence filter
    if (filters.confidence === 'high' && (photo.recognitionConfidence || 0) < 95) return false;
    if (filters.confidence === 'medium' && ((photo.recognitionConfidence || 0) < 80 || (photo.recognitionConfidence || 0) >= 95)) return false;
    if (filters.confidence === 'low' && (photo.recognitionConfidence || 0) >= 80) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = `${photo.child.firstName} ${photo.child.lastName} ${photo.venue.name} ${photo.location?.zone || ''}`.toLowerCase();
      if (!searchableText.includes(query)) return false;
    }
    
    return true;
  });

  const unviewedCount = photos.filter(p => !p.isViewed).length;
  const totalSize = photos.reduce((sum, p) => sum + (p.originalSize || 0), 0);
  const favoriteCount = photos.filter(p => p.isFavorite).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-20">
      {/* Mobile Header */}
      <MobileHeader 
        isOnline={true}
        batteryLevel={85}
        notificationsEnabled={true}
        unreadCount={unviewedCount}
        onToggleNotifications={() => {}}
        lastSync={new Date()}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Page Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
            <p className="text-gray-600">
              {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}
              {unviewedCount > 0 && ` • ${unviewedCount} new`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(true)}
              className="p-2 rounded-lg bg-white shadow-sm border border-gray-200"
            >
              <Filter className="h-5 w-5 text-gray-600" />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg bg-white shadow-sm border border-gray-200"
            >
              {viewMode === 'grid' ? (
                <List className="h-5 w-5 text-gray-600" />
              ) : (
                <Grid className="h-5 w-5 text-gray-600" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search photos by child, venue, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Camera className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{photos.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Eye className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{unviewedCount}</p>
            <p className="text-xs text-gray-500">New</p>
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Heart className="h-5 w-5 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{favoriteCount}</p>
            <p className="text-xs text-gray-500">Favorites</p>
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Download className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{Math.round(totalSize / 1024 / 1024)}MB</p>
            <p className="text-xs text-gray-500">Size</p>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="px-4">
        <PhotoGrid 
          photos={filteredPhotos}
          viewMode={viewMode}
          onPhotoSelect={handlePhotoSelect}
          onPhotoAction={handlePhotoAction}
          onBulkAction={handleBulkAction}
        />
      </div>

      {/* Photo Detail Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <PhotoDetail
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onAction={handlePhotoAction}
          />
        )}
      </AnimatePresence>

      {/* Filters Modal */}
      <AnimatePresence>
        {showFilters && (
          <PhotoFilters
            filters={filters}
            photos={photos}
            onFiltersChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <MobileBottomNav activeTab="photos" />
    </div>
  );
}
