
"use client";

import { AlertTriangle, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface MobileEmergencyButtonProps {
  onClick: () => void;
}

export function MobileEmergencyButton({ onClick }: MobileEmergencyButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    onClick();
    setTimeout(() => setIsPressed(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        onTap={handlePress}
        className={`w-full p-6 rounded-2xl shadow-lg transition-all duration-300 ${
          isPressed 
            ? 'bg-red-600 shadow-xl shadow-red-500/30' 
            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/20'
        }`}
      >
        <div className="flex items-center justify-center space-x-4">
          <motion.div
            animate={isPressed ? { rotate: [0, -10, 10, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <AlertTriangle className="h-8 w-8 text-white" />
            {isPressed && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 rounded-full bg-white"
              />
            )}
          </motion.div>
          
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">
              {isPressed ? 'Emergency Alert Sent!' : 'Emergency Alert'}
            </h3>
            <p className="text-red-100 text-sm">
              {isPressed ? 'Help is on the way' : 'Tap to report an emergency for any child'}
            </p>
          </div>
          
          <Phone className="h-6 w-6 text-white" />
        </div>
        
        {/* Pulse animation when not pressed */}
        {!isPressed && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl bg-red-400 opacity-20"
          />
        )}
      </motion.button>
      
      {/* Success indicator */}
      {isPressed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 p-3 bg-green-500 text-white text-center rounded-lg text-sm font-medium"
        >
          ✓ Emergency contacts and venue staff have been notified
        </motion.div>
      )}
    </motion.div>
  );
}
