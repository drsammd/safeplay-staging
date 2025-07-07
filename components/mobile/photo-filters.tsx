
"use client";

import { X, Filter, ChevronDown } from "lucide-react";
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
  child: Child;
  venue: Venue;
  isViewed: boolean;
  recognitionConfidence?: number;
  capturedAt: string;
}

interface FilterOptions {
  child: string;
  venue: string;
  viewed: string;
  timeRange: string;
  confidence: string;
}

interface PhotoFiltersProps {
  filters: FilterOptions;
  photos: PhotoNotification[];
  onFiltersChange: (filters: FilterOptions) => void;
  onClose: () => void;
}

export function PhotoFilters({ filters, photos, onFiltersChange, onClose }: PhotoFiltersProps) {
  const [tempFilters, setTempFilters] = useState(filters);

  // Extract unique children and venues from photos
  const uniqueChildren = Array.from(
    new Map(photos.map(photo => [photo.child.id, photo.child])).values()
  );
  
  const uniqueVenues = Array.from(
    new Map(photos.map(photo => [photo.venue.id, photo.venue])).values()
  );

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      child: '',
      venue: '',
      viewed: 'all',
      timeRange: 'all',
      confidence: 'all'
    };
    setTempFilters(resetFilters);
    onFiltersChange(resetFilters);
    onClose();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (tempFilters.child) count++;
    if (tempFilters.venue) count++;
    if (tempFilters.viewed !== 'all') count++;
    if (tempFilters.timeRange !== 'all') count++;
    if (tempFilters.confidence !== 'all') count++;
    return count;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {getActiveFilterCount() > 0 && (
              <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </motion.button>
        </div>
        
        {/* Filter Options */}
        <div className="p-4 space-y-6">
          {/* Child Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Child
            </label>
            <select
              value={tempFilters.child}
              onChange={(e) => setTempFilters(prev => ({ ...prev, child: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Children</option>
              {uniqueChildren.map(child => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))}
            </select>
          </div>
          
          {/* Venue Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Venue
            </label>
            <select
              value={tempFilters.venue}
              onChange={(e) => setTempFilters(prev => ({ ...prev, venue: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Venues</option>
              {uniqueVenues.map(venue => (
                <option key={venue.id} value={venue.id}>
                  {venue?.name || 'Unknown Venue'}
                </option>
              ))}
            </select>
          </div>
          
          {/* Viewed Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Viewed Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'all', label: 'All Photos' },
                { value: 'viewed', label: 'Viewed' },
                { value: 'unviewed', label: 'New' }
              ].map(option => (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTempFilters(prev => ({ ...prev, viewed: option.value }))}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    tempFilters.viewed === option.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Time Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Time Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' }
              ].map(option => (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTempFilters(prev => ({ ...prev, timeRange: option.value }))}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    tempFilters.timeRange === option.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Recognition Confidence Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Recognition Confidence
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Levels' },
                { value: 'high', label: 'High (95%+)' },
                { value: 'medium', label: 'Medium (80-94%)' },
                { value: 'low', label: 'Low (<80%)' }
              ].map(option => (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTempFilters(prev => ({ ...prev, confidence: option.value }))}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    tempFilters.confidence === option.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 flex space-x-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleResetFilters}
            className="flex-1 py-3 px-4 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Reset
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleApplyFilters}
            className="flex-1 py-3 px-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
          >
            Apply Filters
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
