
"use client";

import { useEffect, useState } from "react";
import { Phone, Plus, MessageCircle, AlertTriangle, Shield, Edit, Trash2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { EmergencyContactCard } from "@/components/mobile/emergency-contact-card";
import { EmergencyContactForm } from "@/components/mobile/emergency-contact-form";
import { EmergencyCallModal } from "@/components/mobile/emergency-call-modal";

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

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
}

export default function MobileEmergencyPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  const [emergencyActive, setEmergencyActive] = useState(false);

  useEffect(() => {
    loadEmergencyData();
  }, []);

  const loadEmergencyData = async () => {
    try {
      // Mock data for demonstration
      setContacts([
        {
          id: '1',
          name: 'John Johnson',
          relationship: 'Father',
          phoneNumber: '+1 (555) 123-4567',
          email: 'john@example.com',
          isPrimary: true,
          priority: 1,
          isActive: true,
          availableHours: {
            start: '08:00',
            end: '18:00'
          },
          notes: 'Primary emergency contact. Available during work hours.'
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          relationship: 'Mother',
          phoneNumber: '+1 (555) 234-5678',
          email: 'sarah@example.com',
          isPrimary: false,
          priority: 2,
          isActive: true,
          availableHours: {
            start: '09:00',
            end: '17:00'
          }
        },
        {
          id: '3',
          name: 'Mary Smith',
          relationship: 'Grandmother',
          phoneNumber: '+1 (555) 345-6789',
          email: 'mary@example.com',
          isPrimary: false,
          priority: 3,
          isActive: true,
          notes: 'Backup emergency contact. Retired, usually available.'
        },
        {
          id: '4',
          name: 'Emergency Services',
          relationship: 'Emergency',
          phoneNumber: '911',
          isPrimary: false,
          priority: 0,
          isActive: true,
          notes: 'For life-threatening emergencies only.'
        }
      ]);

      setChildren([
        {
          id: '1',
          firstName: 'Emma',
          lastName: 'Johnson',
          profilePhoto: 'https://i.pinimg.com/originals/e3/7e/0e/e37e0e25686c2139b281a57a5b4906f2.jpg'
        },
        {
          id: '2',
          firstName: 'Lucas',
          lastName: 'Johnson',
          profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        }
      ]);
    } catch (error) {
      console.error('Error loading emergency data:', error);
    }
  };

  const handleAddContact = (contactData: Partial<EmergencyContact>) => {
    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: contactData.name || '',
      relationship: contactData.relationship || '',
      phoneNumber: contactData.phoneNumber || '',
      email: contactData.email,
      isPrimary: contactData.isPrimary || false,
      priority: contactData.priority || contacts.length + 1,
      isActive: true,
      availableHours: contactData.availableHours,
      notes: contactData.notes
    };

    setContacts(prev => [...prev, newContact]);
    setShowAddForm(false);
  };

  const handleEditContact = (contactData: Partial<EmergencyContact>) => {
    if (!editingContact) return;

    setContacts(prev => prev.map(contact => 
      contact.id === editingContact.id 
        ? { ...contact, ...contactData }
        : contact
    ));
    setEditingContact(null);
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
  };

  const handleQuickCall = (contact: EmergencyContact) => {
    setSelectedContact(contact);
    setShowCallModal(true);
  };

  const handleEmergencyCall = () => {
    setEmergencyActive(true);
    // Find primary contact or first available
    const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];
    if (primaryContact) {
      setSelectedContact(primaryContact);
      setShowCallModal(true);
    }
  };

  const primaryContacts = contacts.filter(c => c.isPrimary && c.isActive);
  const secondaryContacts = contacts.filter(c => !c.isPrimary && c.isActive && c.phoneNumber !== '911');
  const emergencyServices = contacts.filter(c => c.phoneNumber === '911');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20">
      {/* Mobile Header */}
      <MobileHeader 
        isOnline={true}
        batteryLevel={85}
        notificationsEnabled={true}
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
            <h1 className="text-2xl font-bold text-gray-900">Emergency Contacts</h1>
            <p className="text-gray-600">Manage your emergency contacts and communication</p>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            className="p-2 rounded-lg bg-white shadow-sm border border-gray-200"
          >
            <Plus className="h-5 w-5 text-gray-600" />
          </motion.button>
        </div>

        {/* Emergency Call Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleEmergencyCall}
          className={`w-full p-6 rounded-2xl shadow-lg transition-all duration-300 ${
            emergencyActive 
              ? 'bg-red-600 shadow-xl shadow-red-500/30' 
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/20'
          }`}
        >
          <div className="flex items-center justify-center space-x-4 text-white">
            <motion.div
              animate={emergencyActive ? { rotate: [0, -10, 10, -10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <AlertTriangle className="h-8 w-8" />
            </motion.div>
            
            <div className="text-left">
              <h3 className="text-xl font-bold">Emergency Call</h3>
              <p className="text-red-100 text-sm">
                Instantly call your primary emergency contact
              </p>
            </div>
            
            <Phone className="h-6 w-6" />
          </div>
        </motion.button>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Shield className="h-5 w-5 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{primaryContacts.length}</p>
            <p className="text-xs text-gray-500">Primary</p>
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Phone className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{contacts.filter(c => c.isActive).length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <MessageCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{contacts.filter(c => c.email).length}</p>
            <p className="text-xs text-gray-500">With Email</p>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="px-4 space-y-6">
        {/* Primary Contacts */}
        {primaryContacts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span>Primary Contacts</span>
            </h2>
            
            {primaryContacts.map((contact, index) => (
              <EmergencyContactCard
                key={contact.id}
                contact={contact}
                index={index}
                onEdit={() => setEditingContact(contact)}
                onDelete={() => handleDeleteContact(contact.id)}
                onCall={() => handleQuickCall(contact)}
              />
            ))}
          </div>
        )}

        {/* Secondary Contacts */}
        {secondaryContacts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Secondary Contacts</span>
            </h2>
            
            {secondaryContacts.map((contact, index) => (
              <EmergencyContactCard
                key={contact.id}
                contact={contact}
                index={index}
                onEdit={() => setEditingContact(contact)}
                onDelete={() => handleDeleteContact(contact.id)}
                onCall={() => handleQuickCall(contact)}
              />
            ))}
          </div>
        )}

        {/* Emergency Services */}
        {emergencyServices.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Emergency Services</span>
            </h2>
            
            {emergencyServices.map((contact, index) => (
              <EmergencyContactCard
                key={contact.id}
                contact={contact}
                index={index}
                onEdit={() => setEditingContact(contact)}
                onDelete={() => handleDeleteContact(contact.id)}
                onCall={() => handleQuickCall(contact)}
                isEmergencyService={true}
              />
            ))}
          </div>
        )}

        {/* Children Info */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Associated Children</h2>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-3">
              These emergency contacts are available for all your registered children:
            </p>
            <div className="flex space-x-2">
              {children.map(child => (
                <div key={child.id} className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                    {child.profilePhoto ? (
                      <img
                        src={child.profilePhoto}
                        alt={child.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {child.firstName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safety Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Emergency Contact Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Keep at least 2 primary contacts updated</li>
                <li>• Include local emergency services numbers</li>
                <li>• Update availability hours regularly</li>
                <li>• Test emergency call system monthly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Add Contact Form */}
      <AnimatePresence>
        {showAddForm && (
          <EmergencyContactForm
            onSave={handleAddContact}
            onClose={() => setShowAddForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Edit Contact Form */}
      <AnimatePresence>
        {editingContact && (
          <EmergencyContactForm
            contact={editingContact}
            onSave={handleEditContact}
            onClose={() => setEditingContact(null)}
          />
        )}
      </AnimatePresence>

      {/* Emergency Call Modal */}
      <AnimatePresence>
        {showCallModal && selectedContact && (
          <EmergencyCallModal
            contact={selectedContact}
            onClose={() => {
              setShowCallModal(false);
              setSelectedContact(null);
              setEmergencyActive(false);
            }}
            isEmergency={emergencyActive}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <MobileBottomNav activeTab="emergency" />
    </div>
  );
}
