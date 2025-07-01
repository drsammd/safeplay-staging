
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Clock,
  Shield,
  Users,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  isPrimary: boolean;
  priority: number;
  availableHours?: any;
  contactType: 'PERSONAL' | 'VENUE_STAFF' | 'EMERGENCY_SERVICES' | 'VENUE_MANAGEMENT';
  isActive: boolean;
  child?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  venue?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

interface EmergencyContactsManagerProps {
  childId?: string;
  venueId?: string;
  userId?: string;
  userRole: string;
}

export function EmergencyContactsManager({ 
  childId, 
  venueId, 
  userId, 
  userRole 
}: EmergencyContactsManagerProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phoneNumber: '',
    email: '',
    isPrimary: false,
    priority: 1,
    contactType: 'PERSONAL' as 'PERSONAL' | 'VENUE_STAFF' | 'EMERGENCY_SERVICES' | 'VENUE_MANAGEMENT',
    childId: childId || '',
    venueId: venueId || '',
    userId: userId || '',
    availableHours: null,
  });

  useEffect(() => {
    fetchContacts();
    if (userRole === 'PARENT') {
      fetchChildren();
    }
  }, [childId, venueId, userId]);

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams();
      if (childId) params.append('childId', childId);
      if (venueId) params.append('venueId', venueId);

      const response = await fetch(`/api/emergency-contacts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch emergency contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/children');
      if (!response.ok) throw new Error('Failed to fetch children');
      
      const data = await response.json();
      setChildren(data.children || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingContact ? 'PATCH' : 'POST';
      const url = editingContact 
        ? `/api/emergency-contacts/${editingContact.id}` 
        : '/api/emergency-contacts';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save contact');

      toast({
        title: "Success",
        description: `Emergency contact ${editingContact ? 'updated' : 'created'} successfully`,
      });

      await fetchContacts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: "Failed to save emergency contact",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber,
      email: contact.email || '',
      isPrimary: contact.isPrimary,
      priority: contact.priority,
      contactType: contact.contactType,
      childId: contact.child?.id || '',
      venueId: contact.venue?.id || '',
      userId: contact.user?.id || '',
      availableHours: contact.availableHours,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this emergency contact?')) {
      return;
    }

    try {
      const response = await fetch(`/api/emergency-contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete contact');

      toast({
        title: "Success",
        description: "Emergency contact deleted successfully",
      });

      await fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete emergency contact",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      relationship: '',
      phoneNumber: '',
      email: '',
      isPrimary: false,
      priority: 1,
      contactType: 'PERSONAL',
      childId: childId || '',
      venueId: venueId || '',
      userId: userId || '',
      availableHours: null,
    });
  };

  const getContactTypeIcon = (type: string) => {
    switch (type) {
      case 'PERSONAL': return <User className="h-4 w-4" />;
      case 'VENUE_STAFF': return <Users className="h-4 w-4" />;
      case 'EMERGENCY_SERVICES': return <Shield className="h-4 w-4" />;
      case 'VENUE_MANAGEMENT': return <Building className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'PERSONAL': return 'bg-blue-100 text-blue-800';
      case 'VENUE_STAFF': return 'bg-green-100 text-green-800';
      case 'EMERGENCY_SERVICES': return 'bg-red-100 text-red-800';
      case 'VENUE_MANAGEMENT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Emergency Contacts</span>
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingContact ? 'Edit' : 'Add'} Emergency Contact
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="relationship">Relationship *</Label>
                    <Input
                      id="relationship"
                      value={formData.relationship}
                      onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                      placeholder="e.g., Parent, Guardian, Manager"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactType">Contact Type</Label>
                    <Select 
                      value={formData.contactType} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, contactType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERSONAL">Personal Contact</SelectItem>
                        <SelectItem value="VENUE_STAFF">Venue Staff</SelectItem>
                        <SelectItem value="EMERGENCY_SERVICES">Emergency Services</SelectItem>
                        <SelectItem value="VENUE_MANAGEMENT">Venue Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {userRole === 'PARENT' && children.length > 0 && (
                    <div>
                      <Label htmlFor="childId">Child</Label>
                      <Select 
                        value={formData.childId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, childId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select child" />
                        </SelectTrigger>
                        <SelectContent>
                          {children.map((child) => (
                            <SelectItem key={child.id} value={child.id}>
                              {child.firstName} {child.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="priority">Priority (1-10)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isPrimary}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrimary: checked }))}
                    />
                    <Label>Primary Contact</Label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingContact ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No emergency contacts found. Add one to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{contact.name}</h3>
                            {contact.isPrimary && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-4">
                          <Badge className={getContactTypeColor(contact.contactType)}>
                            {getContactTypeIcon(contact.contactType)}
                            <span className="ml-1">{contact.contactType.replace('_', ' ')}</span>
                          </Badge>
                          <Badge variant="outline">
                            Priority {contact.priority}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>{contact.phoneNumber}</span>
                          </div>
                          {contact.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                        </div>

                        {contact.child && (
                          <div className="text-sm text-muted-foreground">
                            Child: {contact.child.firstName} {contact.child.lastName}
                          </div>
                        )}

                        {contact.venue && (
                          <div className="text-sm text-muted-foreground">
                            Venue: {contact.venue.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
