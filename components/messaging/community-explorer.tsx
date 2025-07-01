
'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Globe,
  Users,
  Calendar,
  MapPin,
  Heart,
  Star,
  Plus,
  Search,
  Filter,
  UserPlus,
  MessageCircle,
  Clock,
  TrendingUp,
  Baby,
  Gamepad2,
  GraduationCap,
  Music,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface CommunityGroup {
  id: string;
  name: string;
  description?: string;
  type: 'LOCAL_FAMILIES' | 'SPECIAL_NEEDS' | 'AGE_GROUP' | 'ACTIVITY_BASED' | 'CULTURAL' | 'MENTORSHIP';
  admin: {
    id: string;
    name: string;
  };
  venue?: {
    id: string;
    name: string;
  };
  memberCount: number;
  eventCount: number;
  isMember: boolean;
  userRole?: string;
  interests: string[];
  ageRange?: string;
  location?: string;
  isPublic: boolean;
  createdAt: Date;
}

interface CommunityEvent {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  location: string;
  startTime: Date;
  endTime: Date;
  maxParticipants?: number;
  currentParticipants: number;
  ageRange?: string;
  cost?: number;
  isPublic: boolean;
  group: {
    id: string;
    name: string;
    type: string;
  };
  organizer: {
    id: string;
    name: string;
  };
  isParticipating: boolean;
  participationStatus?: string;
}

interface CommunityExplorerProps {
  groups: CommunityGroup[];
  events: CommunityEvent[];
  onJoinGroup: (groupId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onJoinEvent: (eventId: string) => void;
  onCreateGroup: () => void;
  onCreateEvent: () => void;
  isLoading?: boolean;
}

export default function CommunityExplorer({
  groups,
  events,
  onJoinGroup,
  onLeaveGroup,
  onJoinEvent,
  onCreateGroup,
  onCreateEvent,
  isLoading = false,
}: CommunityExplorerProps) {
  const [activeTab, setActiveTab] = useState<'groups' | 'events'>('groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<CommunityGroup | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'LOCAL_FAMILIES':
        return <MapPin className="w-4 h-4" />;
      case 'SPECIAL_NEEDS':
        return <Heart className="w-4 h-4" />;
      case 'AGE_GROUP':
        return <Baby className="w-4 h-4" />;
      case 'ACTIVITY_BASED':
        return <Gamepad2 className="w-4 h-4" />;
      case 'CULTURAL':
        return <Globe className="w-4 h-4" />;
      case 'MENTORSHIP':
        return <GraduationCap className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case 'LOCAL_FAMILIES':
        return 'bg-blue-500';
      case 'SPECIAL_NEEDS':
        return 'bg-pink-500';
      case 'AGE_GROUP':
        return 'bg-green-500';
      case 'ACTIVITY_BASED':
        return 'bg-purple-500';
      case 'CULTURAL':
        return 'bg-orange-500';
      case 'MENTORSHIP':
        return 'bg-teal-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || group.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const upcomingEvents = filteredEvents.filter(event => new Date(event.startTime) > new Date());

  const renderGroupCard = (group: CommunityGroup, index: number) => (
    <motion.div
      key={group.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => {
          setSelectedGroup(group);
          setShowGroupDetails(true);
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarFallback className={`text-white ${getGroupTypeColor(group.type)}`}>
                  {getGroupTypeIcon(group.type)}
                </AvatarFallback>
              </Avatar>
              
              {!group.isPublic && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">🔒</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm truncate mb-1">{group.name}</h3>
                  <Badge variant="outline" className="text-xs mb-2">
                    {group.type.replace('_', ' ').toLowerCase()}
                  </Badge>
                </div>
                
                {group.isMember ? (
                  <Badge variant="default" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Member
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoinGroup(group.id);
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Join
                  </Button>
                )}
              </div>
              
              {group.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {group.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{group.memberCount} members</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{group.eventCount} events</span>
                </div>
              </div>
              
              {group.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{group.location}</span>
                </div>
              )}
              
              {group.ageRange && (
                <Badge variant="secondary" className="text-xs mr-2">
                  Ages {group.ageRange}
                </Badge>
              )}
              
              {group.interests.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {group.interests.slice(0, 3).map((interest, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                  {group.interests.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{group.interests.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderEventCard = (event: CommunityEvent, index: number) => (
    <motion.div
      key={event.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => {
          setSelectedEvent(event);
          setShowEventDetails(true);
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                <div className="text-xs font-bold text-blue-600">
                  {new Date(event.startTime).getDate()}
                </div>
                <div className="text-xs text-blue-600">
                  {new Date(event.startTime).toLocaleDateString([], { month: 'short' })}
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm truncate mb-1">{event.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {event.eventType}
                  </Badge>
                </div>
                
                {event.isParticipating ? (
                  <Badge variant="default" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    Registered
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoinEvent(event.id);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Join
                  </Button>
                )}
              </div>
              
              {event.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {event.description}
                </p>
              )}
              
              <div className="space-y-1 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(event.startTime).toLocaleDateString()} at{' '}
                    {new Date(event.startTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {event.currentParticipants}
                    {event.maxParticipants && `/${event.maxParticipants}`} participants
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {event.group.name}
                </Badge>
                
                {event.ageRange && (
                  <Badge variant="outline" className="text-xs">
                    Ages {event.ageRange}
                  </Badge>
                )}
                
                {event.cost !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {event.cost === 0 ? 'Free' : `$${event.cost}`}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Community Explorer
            </CardTitle>
            
            <div className="flex gap-2">
              <Button onClick={onCreateGroup} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Group
              </Button>
              <Button onClick={onCreateEvent} size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search groups and events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="LOCAL_FAMILIES">Local Families</SelectItem>
                <SelectItem value="SPECIAL_NEEDS">Special Needs</SelectItem>
                <SelectItem value="AGE_GROUP">Age Groups</SelectItem>
                <SelectItem value="ACTIVITY_BASED">Activities</SelectItem>
                <SelectItem value="CULTURAL">Cultural</SelectItem>
                <SelectItem value="MENTORSHIP">Mentorship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'groups' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('groups')}
            >
              <Users className="w-4 h-4 mr-2" />
              Groups ({filteredGroups.length})
            </Button>
            <Button
              variant={activeTab === 'events' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('events')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Events ({upcomingEvents.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div>
        {activeTab === 'groups' ? (
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredGroups.length > 0 ? (
              <AnimatePresence>
                {filteredGroups.map((group, index) => renderGroupCard(group, index))}
              </AnimatePresence>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No groups found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a community group!'}
                  </p>
                  <Button onClick={onCreateGroup}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Group
                  </Button>
                </CardContent>
              </Card>
            )}
          </ScrollArea>
        ) : (
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingEvents.length > 0 ? (
              <AnimatePresence>
                {upcomingEvents.map((event, index) => renderEventCard(event, index))}
              </AnimatePresence>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No upcoming events</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a community event!'}
                  </p>
                  <Button onClick={onCreateEvent}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Create New Event
                  </Button>
                </CardContent>
              </Card>
            )}
          </ScrollArea>
        )}
      </div>

      {/* Group Details Dialog */}
      <Dialog open={showGroupDetails} onOpenChange={setShowGroupDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedGroup && getGroupTypeIcon(selectedGroup.type)}
              {selectedGroup?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedGroup?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedGroup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedGroup.memberCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Members</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedGroup.eventCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Events</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Group Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{selectedGroup.type.replace('_', ' ')}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Admin:</span>
                      <span>{selectedGroup.admin.name}</span>
                    </div>
                    
                    {selectedGroup.location && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{selectedGroup.location}</span>
                      </div>
                    )}
                    
                    {selectedGroup.ageRange && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age Range:</span>
                        <span>{selectedGroup.ageRange}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDistanceToNow(new Date(selectedGroup.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                
                {selectedGroup.interests.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGroup.interests.map((interest, index) => (
                        <Badge key={index} variant="outline">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                {selectedGroup.isMember ? (
                  <>
                    <Button variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Group Chat
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onLeaveGroup(selectedGroup.id);
                        setShowGroupDetails(false);
                      }}
                    >
                      Leave Group
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      onJoinGroup(selectedGroup.id);
                      setShowGroupDetails(false);
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Group
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedEvent.currentParticipants}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Participants
                    {selectedEvent.maxParticipants && ` (max ${selectedEvent.maxParticipants})`}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedEvent.cost === 0 ? 'Free' : `$${selectedEvent.cost}`}
                  </div>
                  <div className="text-sm text-muted-foreground">Cost</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-semibold">Event Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span>
                      {new Date(selectedEvent.startTime).toLocaleDateString()} at{' '}
                      {new Date(selectedEvent.startTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{selectedEvent.location}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Organizer:</span>
                    <span>{selectedEvent.organizer.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Group:</span>
                    <span>{selectedEvent.group.name}</span>
                  </div>
                  
                  {selectedEvent.ageRange && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Age Range:</span>
                      <span>{selectedEvent.ageRange}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                {selectedEvent.isParticipating ? (
                  <Badge variant="default" className="text-sm py-2 px-4">
                    <Calendar className="w-4 h-4 mr-2" />
                    You're registered for this event
                  </Badge>
                ) : (
                  <Button
                    onClick={() => {
                      onJoinEvent(selectedEvent.id);
                      setShowEventDetails(false);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Register for Event
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
