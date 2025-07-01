
"use client";

import { X, Smartphone, Download, Wifi, Battery, Trash2, HardDrive } from "lucide-react";
import { motion } from "framer-motion";

interface DeviceSettings {
  offlineMode: boolean;
  autoSync: boolean;
  cacheSize: number;
  batteryOptimization: boolean;
}

interface StorageUsage {
  total: number;
  used: number;
  photos: number;
  cache: number;
  offline: number;
}

interface DeviceSettingsProps {
  settings: DeviceSettings;
  storageUsage: StorageUsage;
  onChange: (key: string, value: any) => void;
  onClearCache: () => void;
  onClearOffline: () => void;
  onClose: () => void;
}

export function DeviceSettings({ 
  settings, 
  storageUsage, 
  onChange, 
  onClearCache, 
  onClearOffline, 
  onClose 
}: DeviceSettingsProps) {
  const formatStorageSize = (mb: number) => {
    if (mb < 1024) return `${mb} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
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
        className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Device & Storage</h3>
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
          {/* Performance Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Performance</h4>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Download className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Offline Mode</p>
                    <p className="text-sm text-gray-600">
                      Download data for offline access when connection is poor
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={settings.offlineMode}
                    onChange={(e) => onChange('offlineMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Wifi className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Auto Sync</p>
                    <p className="text-sm text-gray-600">
                      Automatically sync data when connected to Wi-Fi
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={settings.autoSync}
                    onChange={(e) => onChange('autoSync', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Battery className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Battery Optimization</p>
                    <p className="text-sm text-gray-600">
                      Reduce background activity to save battery
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={settings.batteryOptimization}
                    onChange={(e) => onChange('batteryOptimization', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Storage Management */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Storage</h4>
            </div>
            
            {/* Storage Overview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">Storage Usage</span>
                <span className="text-sm text-gray-600">
                  {formatStorageSize(storageUsage.used)} / {formatStorageSize(storageUsage.total)}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(storageUsage.used / storageUsage.total) * 100}%` }}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <span className="text-sm text-gray-600">Photos</span>
                  </div>
                  <span className="text-sm font-medium">{formatStorageSize(storageUsage.photos)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-sm text-gray-600">Cache</span>
                  </div>
                  <span className="text-sm font-medium">{formatStorageSize(storageUsage.cache)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-600">Offline Data</span>
                  </div>
                  <span className="text-sm font-medium">{formatStorageSize(storageUsage.offline)}</span>
                </div>
              </div>
            </div>
            
            {/* Cache Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cache Size Limit
              </label>
              <select
                value={settings.cacheSize}
                onChange={(e) => onChange('cacheSize', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={100}>100 MB</option>
                <option value={250}>250 MB</option>
                <option value={500}>500 MB</option>
                <option value={1024}>1 GB</option>
                <option value={2048}>2 GB</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Higher cache limits improve performance but use more storage
              </p>
            </div>
            
            {/* Storage Actions */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClearCache}
                className="flex items-center justify-center space-x-2 py-3 px-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-medium"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Cache</span>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClearOffline}
                className="flex items-center justify-center space-x-2 py-3 px-4 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 font-medium"
              >
                <Download className="h-4 w-4" />
                <span>Clear Offline</span>
              </motion.button>
            </div>
          </div>

          {/* Device Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Device Information</h4>
            
            <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">App Version:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform:</span>
                <span className="font-medium">Web</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Sync:</span>
                <span className="font-medium">Just now</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium text-green-600">Online</span>
              </div>
            </div>
          </div>

          {/* Performance Tips */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-blue-900 mb-2">Performance Tips</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Enable offline mode for better performance in low signal areas</li>
                  <li>• Clear cache regularly to free up storage space</li>
                  <li>• Use battery optimization to extend device life</li>
                  <li>• Auto-sync on Wi-Fi to reduce data usage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium"
          >
            Save Device Settings
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
