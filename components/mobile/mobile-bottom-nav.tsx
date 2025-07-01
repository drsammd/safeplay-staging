
"use client";

import { Home, MapPin, Camera, Phone, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface MobileBottomNavProps {
  activeTab: string;
}

const navItems = [
  {
    id: 'dashboard',
    icon: Home,
    label: 'Home',
    path: '/parent/mobile'
  },
  {
    id: 'location',
    icon: MapPin,
    label: 'Location',
    path: '/parent/mobile/location'
  },
  {
    id: 'photos',
    icon: Camera,
    label: 'Photos',
    path: '/parent/mobile/photos'
  },
  {
    id: 'emergency',
    icon: Phone,
    label: 'Emergency',
    path: '/parent/mobile/emergency'
  },
  {
    id: 'settings',
    icon: Settings,
    label: 'Settings',
    path: '/parent/mobile/settings'
  }
];

export function MobileBottomNav({ activeTab }: MobileBottomNavProps) {
  const router = useRouter();

  const handleNavPress = (item: typeof navItems[0]) => {
    router.push(item.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavPress(item)}
              className="flex-1 flex flex-col items-center py-2 relative"
            >
              <div className={`p-2 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-blue-500' : 'bg-transparent'
              }`}>
                <item.icon 
                  className={`h-5 w-5 transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-gray-500'
                  }`} 
                />
              </div>
              
              <span className={`text-xs mt-1 transition-colors duration-200 ${
                isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Safe area padding for devices with home indicators */}
      <div className="h-safe-area-inset-bottom" />
    </div>
  );
}
