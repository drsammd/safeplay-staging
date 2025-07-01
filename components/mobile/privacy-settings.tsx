
"use client";

import { X, Shield, MapPin, Camera, BarChart3, Database } from "lucide-react";
import { motion } from "framer-motion";

interface PrivacySettings {
  shareLocation: boolean;
  allowPhotoSharing: boolean;
  dataCollection: boolean;
  analytics: boolean;
}

interface PrivacySettingsProps {
  settings: PrivacySettings;
  onChange: (key: string, value: boolean) => void;
  onClose: () => void;
}

export function PrivacySettings({ settings, onChange, onClose }: PrivacySettingsProps) {
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
        className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Privacy & Security</h3>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </motion.button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Location Privacy */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Location & Tracking</h4>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Share Location Data</p>
                    <p className="text-sm text-gray-600">
                      Allow SafePlay to share your child's location with authorized venue staff
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={settings.shareLocation}
                    onChange={(e) => onChange('shareLocation', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Photo Privacy */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Photo & Media</h4>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Camera className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Allow Photo Sharing</p>
                    <p className="text-sm text-gray-600">
                      Enable sharing photos with family members and authorized contacts
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={settings.allowPhotoSharing}
                    onChange={(e) => onChange('allowPhotoSharing', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Data Collection */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Data & Analytics</h4>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Database className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Data Collection</p>
                    <p className="text-sm text-gray-600">
                      Allow collection of usage data to improve app performance
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={settings.dataCollection}
                    onChange={(e) => onChange('dataCollection', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Analytics</p>
                    <p className="text-sm text-gray-600">
                      Share anonymous analytics to help improve SafePlay features
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={settings.analytics}
                    onChange={(e) => onChange('analytics', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Your Privacy Rights</h4>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900 mb-2">We protect your data</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your child's data is encrypted and secure</li>
                    <li>• We never sell your personal information</li>
                    <li>• You can delete your data at any time</li>
                    <li>• All location data is processed locally when possible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Data Management</h4>
            
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-left"
              >
                <p className="font-medium text-gray-900">Download My Data</p>
                <p className="text-sm text-gray-600">Get a copy of all your data</p>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-red-50 border border-red-200 rounded-lg text-left"
              >
                <p className="font-medium text-red-900">Delete My Account</p>
                <p className="text-sm text-red-600">Permanently delete all your data</p>
              </motion.button>
            </div>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full text-left"
            >
              <p className="text-blue-600 font-medium">Privacy Policy</p>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full text-left"
            >
              <p className="text-blue-600 font-medium">Terms of Service</p>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full text-left"
            >
              <p className="text-blue-600 font-medium">Data Protection Rights</p>
            </motion.button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium"
          >
            Save Privacy Settings
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
