
"use client";

import { useEffect, useState } from "react";
import { 
  Settings, 
  Bell, 
  Shield, 
  User, 
  Smartphone, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX,
  Download,
  Trash2,
  HelpCircle,
  LogOut,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { NotificationSettings } from "@/components/mobile/notification-settings";
import { PrivacySettings } from "@/components/mobile/privacy-settings";
import { DeviceSettings } from "@/components/mobile/device-settings";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  profilePhoto?: string;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    push: boolean;
    sound: boolean;
    vibration: boolean;
    childActivity: boolean;
    emergencyAlerts: boolean;
    photoAvailable: boolean;
    checkInOut: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  privacy: {
    shareLocation: boolean;
    allowPhotoSharing: boolean;
    dataCollection: boolean;
    analytics: boolean;
  };
  device: {
    offlineMode: boolean;
    autoSync: boolean;
    cacheSize: number;
    batteryOptimization: boolean;
  };
}

export default function MobileSettingsPage() {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+1 (555) 234-5678',
    profilePhoto: 'https://i.pinimg.com/originals/1f/59/dd/1f59dd13afdb2fbb5e804b9e87b4751b.jpg'
  });

  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    notifications: {
      push: true,
      sound: true,
      vibration: true,
      childActivity: true,
      emergencyAlerts: true,
      photoAvailable: true,
      checkInOut: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00'
      }
    },
    privacy: {
      shareLocation: true,
      allowPhotoSharing: true,
      dataCollection: false,
      analytics: true
    },
    device: {
      offlineMode: true,
      autoSync: true,
      cacheSize: 500, // MB
      batteryOptimization: true
    }
  });

  const [activeModal, setActiveModal] = useState<'notifications' | 'privacy' | 'device' | null>(null);
  const [storageUsage, setStorageUsage] = useState({
    total: 2048, // MB
    used: 342,
    photos: 156,
    cache: 89,
    offline: 97
  });

  useEffect(() => {
    // Load user settings from API or localStorage
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      // Mock loading settings
      console.log('Loading user settings...');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSettingChange = (category: keyof AppSettings, setting: string, value: any) => {
    setSettings(prev => {
      const categorySettings = prev[category] as any;
      return {
        ...prev,
        [category]: {
          ...categorySettings,
          [setting]: value
        }
      };
    });
  };

  const handleNestedSettingChange = (category: keyof AppSettings, nested: string, setting: string, value: any) => {
    setSettings(prev => {
      const categorySettings = prev[category] as any;
      const nestedSettings = categorySettings[nested] as any;
      return {
        ...prev,
        [category]: {
          ...categorySettings,
          [nested]: {
            ...nestedSettings,
            [setting]: value
          }
        }
      };
    });
  };

  const handleClearCache = () => {
    // Clear app cache
    setStorageUsage(prev => ({
      ...prev,
      used: prev.used - prev.cache,
      cache: 0
    }));
  };

  const handleClearOfflineData = () => {
    // Clear offline data
    setStorageUsage(prev => ({
      ...prev,
      used: prev.used - prev.offline,
      offline: 0
    }));
  };

  const formatStorageSize = (mb: number) => {
    if (mb < 1024) return `${mb} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const settingSections = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Manage how you receive alerts',
      action: () => setActiveModal('notifications')
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      description: 'Control your data and privacy',
      action: () => setActiveModal('privacy')
    },
    {
      id: 'device',
      title: 'Device & Storage',
      icon: Smartphone,
      description: 'App performance and storage',
      action: () => setActiveModal('device')
    }
  ];

  const quickSettings = [
    {
      id: 'theme',
      title: 'Dark Mode',
      icon: settings.theme === 'dark' ? Moon : Sun,
      enabled: settings.theme === 'dark',
      action: (enabled: boolean) => handleSettingChange('theme', 'theme', enabled ? 'dark' : 'light')
    },
    {
      id: 'sound',
      title: 'Sound',
      icon: settings.notifications.sound ? Volume2 : VolumeX,
      enabled: settings.notifications.sound,
      action: (enabled: boolean) => handleNestedSettingChange('notifications', 'notifications', 'sound', enabled)
    },
    {
      id: 'offline',
      title: 'Offline Mode',
      icon: Download,
      enabled: settings.device.offlineMode,
      action: (enabled: boolean) => handleNestedSettingChange('device', 'device', 'offlineMode', enabled)
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Mobile Header */}
      <MobileHeader 
        isOnline={true}
        batteryLevel={85}
        notificationsEnabled={settings.notifications.push}
        unreadCount={0}
        onToggleNotifications={() => {}}
        lastSync={new Date()}
        isRefreshing={false}
        onRefresh={() => {}}
      />

      {/* Page Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Customize your SafePlay experience</p>
          </div>
          
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            {userProfile.profilePhoto ? (
              <img
                src={userProfile.profilePhoto}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
              {userProfile.profilePhoto ? (
                <img
                  src={userProfile.profilePhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{userProfile.name}</h3>
              <p className="text-sm text-gray-600">{userProfile.email}</p>
              <p className="text-sm text-gray-500">{userProfile.phone}</p>
            </div>
            
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Quick Settings */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Settings</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickSettings.map((setting, index) => (
            <motion.button
              key={setting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setting.action(!setting.enabled)}
              className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all ${
                setting.enabled 
                  ? 'border-blue-200 bg-blue-50' 
                  : 'border-gray-100'
              }`}
            >
              <setting.icon className={`h-6 w-6 mx-auto mb-2 ${
                setting.enabled ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <p className={`text-sm font-medium ${
                setting.enabled ? 'text-blue-900' : 'text-gray-600'
              }`}>
                {setting.title}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Settings Sections */}
      <div className="px-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">App Settings</h2>
        
        {settingSections.map((section, index) => (
          <motion.button
            key={section.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={section.action}
            className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <section.icon className="h-6 w-6 text-blue-600" />
            </div>
            
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
              <p className="text-sm text-gray-600">{section.description}</p>
            </div>
            
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </motion.button>
        ))}

        {/* Storage Usage */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Storage Usage</h3>
            <span className="text-sm text-gray-600">
              {formatStorageSize(storageUsage.used)} / {formatStorageSize(storageUsage.total)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(storageUsage.used / storageUsage.total) * 100}%` }}
            />
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Photos</span>
              <span className="font-medium">{formatStorageSize(storageUsage.photos)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cache</span>
              <span className="font-medium">{formatStorageSize(storageUsage.cache)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Offline Data</span>
              <span className="font-medium">{formatStorageSize(storageUsage.offline)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleClearCache}
              className="flex items-center justify-center space-x-2 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Cache</span>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleClearOfflineData}
              className="flex items-center justify-center space-x-2 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Clear Offline</span>
            </motion.button>
          </div>
        </div>

        {/* Other Options */}
        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4"
          >
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <HelpCircle className="h-6 w-6 text-green-600" />
            </div>
            
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900">Help & Support</h3>
              <p className="text-sm text-gray-600">Get help and contact support</p>
            </div>
            
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white rounded-xl p-4 shadow-sm border border-red-200 flex items-center space-x-4"
          >
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <LogOut className="h-6 w-6 text-red-600" />
            </div>
            
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-red-900">Sign Out</h3>
              <p className="text-sm text-red-600">Sign out from SafePlay</p>
            </div>
            
            <ChevronRight className="h-5 w-5 text-red-400" />
          </motion.button>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>SafePlay Mobile v1.0.0</p>
          <p>Built with ❤️ for child safety</p>
        </div>
      </div>

      {/* Settings Modals */}
      <AnimatePresence>
        {activeModal === 'notifications' && (
          <NotificationSettings
            settings={settings.notifications}
            onChange={(key, value) => handleNestedSettingChange('notifications', 'notifications', key, value)}
            onClose={() => setActiveModal(null)}
          />
        )}
        
        {activeModal === 'privacy' && (
          <PrivacySettings
            settings={settings.privacy}
            onChange={(key, value) => handleNestedSettingChange('privacy', 'privacy', key, value)}
            onClose={() => setActiveModal(null)}
          />
        )}
        
        {activeModal === 'device' && (
          <DeviceSettings
            settings={settings.device}
            storageUsage={storageUsage}
            onChange={(key, value) => handleNestedSettingChange('device', 'device', key, value)}
            onClearCache={handleClearCache}
            onClearOffline={handleClearOfflineData}
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <MobileBottomNav activeTab="settings" />
    </div>
  );
}
