
"use client";

import { Phone, Mail, Clock, Edit, Trash2, Shield, AlertTriangle, User } from "lucide-react";
import { motion } from "framer-motion";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  isPrimary: boolean;
  priority: number;
  isActive: boolean;
  availableHours?: {
    start: string;
    end: string;
  };
  notes?: string;
}

interface EmergencyContactCardProps {
  contact: EmergencyContact;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onCall: () => void;
  isEmergencyService?: boolean;
}

export function EmergencyContactCard({ 
  contact, 
  index, 
  onEdit, 
  onDelete, 
  onCall,
  isEmergencyService = false
}: EmergencyContactCardProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isCurrentlyAvailable = () => {
    if (!contact.availableHours) return true;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= contact.availableHours.start && currentTime <= contact.availableHours.end;
  };

  const getContactIcon = () => {
    if (isEmergencyService) return AlertTriangle;
    if (contact.isPrimary) return Shield;
    return User;
  };

  const getContactColor = () => {
    if (isEmergencyService) return 'text-red-600 bg-red-100';
    if (contact.isPrimary) return 'text-red-600 bg-red-100';
    return 'text-blue-600 bg-blue-100';
  };

  const ContactIcon = getContactIcon();
  const contactColor = getContactColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all duration-200 ${
        contact.isPrimary ? 'border-red-200' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start space-x-4">
        {/* Contact Icon */}
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${contactColor}`}>
          <ContactIcon className="h-6 w-6" />
        </div>

        {/* Contact Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {contact.name}
            </h3>
            
            {contact.isPrimary && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                Primary
              </span>
            )}
            
            {isEmergencyService && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                Emergency
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-2">{contact.relationship}</p>
          
          {/* Phone Number */}
          <div className="flex items-center space-x-2 mb-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">{contact.phoneNumber}</span>
          </div>
          
          {/* Email */}
          {contact.email && (
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 truncate">{contact.email}</span>
            </div>
          )}
          
          {/* Availability */}
          {contact.availableHours && (
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {formatTime(contact.availableHours.start)} - {formatTime(contact.availableHours.end)}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                isCurrentlyAvailable() 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {isCurrentlyAvailable() ? 'Available' : 'Unavailable'}
              </span>
            </div>
          )}
          
          {/* Notes */}
          {contact.notes && (
            <p className="text-xs text-gray-500 mt-2 italic">
              {contact.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCall}
            className={`p-2 rounded-lg font-medium text-sm transition-colors ${
              isEmergencyService 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : contact.isPrimary
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <Phone className="h-4 w-4" />
          </motion.button>
          
          {!isEmergencyService && (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onEdit}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <Edit className="h-4 w-4" />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onDelete}
                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
            </>
          )}
        </div>
      </div>
      
      {/* Priority Indicator */}
      {!isEmergencyService && contact.priority > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Priority: #{contact.priority}</span>
            <span className={`font-medium ${isCurrentlyAvailable() ? 'text-green-600' : 'text-gray-400'}`}>
              {isCurrentlyAvailable() ? '● Available Now' : '○ Not Available'}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
