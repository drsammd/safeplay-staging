
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  MapPin, 
  Camera, 
  Eye, 
  ArrowRight,
  Filter,
  Calendar,
  User,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useToast } from '@/hooks/use-toast';

interface ChildSighting {
  id: string;
  confidence: number;
  imageUrl?: string;
  sightingType: 'DETECTED' | 'ENTERING' | 'EXITING' | 'MOVING' | 'STATIONARY';
  timestamp: string;
  position?: any;
  child: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  venue: {
    id: string;
    name: string;
  };
  camera?: {
    id: string;
    name: string;
    position?: any;
  };
  zone?: {
    id: string;
    name: string;
    type: string;
  };
  recognitionEvent?: {
    id: string;
    eventType: string;
    confidence: number;
  };
}

interface ChildSightingTimelineProps {
  childId?: string;
  venueId?: string;
  userRole: string;
}

export function ChildSightingTimeline({ childId, venueId, userRole }: ChildSightingTimelineProps) {
  const [sightings, setSightings] = useState<ChildSighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string>(childId || 'all');
  const [sightingType, setSightingType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchChildren();
  }, [venueId]);

  useEffect(() => {
    fetchSightings();
  }, [selectedChild, sightingType, dateRange, venueId]);

  const fetchChildren = async () => {
    try {
      const params = new URLSearchParams();
      if (venueId) params.append('venueId', venueId);

      const response = await fetch(`/api/children?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch children');
      
      const data = await response.json();
      setChildren(data.children || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const fetchSightings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedChild !== 'all') params.append('childId', selectedChild);
      if (sightingType !== 'all') params.append('sightingType', sightingType);
      if (venueId) params.append('venueId', venueId);
      if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());
      
      params.append('limit', '50');

      const response = await fetch(`/api/child-sightings?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch sightings');
      
      const data = await response.json();
      setSightings(data.sightings || []);
    } catch (error) {
      console.error('Error fetching sightings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch child sightings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSightingTypeColor = (type: string) => {
    switch (type) {
      case 'ENTERING': return 'bg-green-100 text-green-800';
      case 'EXITING': return 'bg-red-100 text-red-800';
      case 'MOVING': return 'bg-blue-100 text-blue-800';
      case 'STATIONARY': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSightingTypeIcon = (type: string) => {
    switch (type) {
      case 'ENTERING': return <ArrowRight className="h-4 w-4 rotate-90" />;
      case 'EXITING': return <ArrowRight className="h-4 w-4 -rotate-90" />;
      case 'MOVING': return <ArrowRight className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Child Sighting Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.firstName} {child.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sightingType} onValueChange={setSightingType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sighting type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DETECTED">Detected</SelectItem>
                <SelectItem value="ENTERING">Entering</SelectItem>
                <SelectItem value="EXITING">Exiting</SelectItem>
                <SelectItem value="MOVING">Moving</SelectItem>
                <SelectItem value="STATIONARY">Stationary</SelectItem>
              </SelectContent>
            </Select>

            <DatePickerWithRange
              value={dateRange}
              onChange={setDateRange}
              className="w-64"
            />

            <Button variant="outline" size="sm" onClick={fetchSightings}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardContent className="p-6">
          {sightings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sightings found matching the current filters.
            </div>
          ) : (
            <div className="space-y-4">
              {sightings.map((sighting, index) => (
                <motion.div
                  key={sighting.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  {/* Timeline connector */}
                  {index < sightings.length - 1 && (
                    <div className="absolute left-6 top-12 w-px h-16 bg-border" />
                  )}

                  <div className="flex space-x-4">
                    {/* Timeline marker */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                        {getSightingTypeIcon(sighting.sightingType)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-card border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center space-x-3 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={sighting.child.profilePhoto} />
                              <AvatarFallback>
                                {sighting.child.firstName[0]}{sighting.child.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">
                                {sighting.child.firstName} {sighting.child.lastName}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {new Date(sighting.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-4">
                              <Badge className={getSightingTypeColor(sighting.sightingType)}>
                                {sighting.sightingType}
                              </Badge>
                              <span className={`text-sm font-medium ${getConfidenceColor(sighting.confidence)}`}>
                                {Math.round(sighting.confidence * 100)}% confidence
                              </span>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{sighting.venue.name}</span>
                              </div>
                              {sighting.zone && (
                                <div className="flex items-center space-x-1">
                                  <span>Zone: {sighting.zone.name}</span>
                                </div>
                              )}
                              {sighting.camera && (
                                <div className="flex items-center space-x-1">
                                  <Camera className="h-4 w-4" />
                                  <span>{sighting.camera.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Image */}
                        {sighting.imageUrl && (
                          <div className="ml-4">
                            <img
                              src={sighting.imageUrl}
                              alt="Sighting"
                              className="w-16 h-16 rounded-lg object-cover border"
                            />
                          </div>
                        )}
                      </div>
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
