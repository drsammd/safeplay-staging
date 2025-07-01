
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Navigation,
  MapPin,
  Clock,
  Users,
  Route,
  Zap,
  Shield,
  Accessibility,
  Baby,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationWaypoint {
  zoneId: string;
  zoneName: string;
  coordinates: { x: number; y: number };
  estimatedTime: number;
  crowdDensity: number;
  safetyScore: number;
}

interface NavigationPath {
  waypoints: NavigationWaypoint[];
  totalDistance: number;
  estimatedTime: number;
  safetyScore: number;
  crowdFactor: number;
}

interface NavigationAlternative {
  name: string;
  waypoints: NavigationWaypoint[];
  totalDistance: number;
  estimatedTime: number;
  benefits: string[];
}

interface NavigationRequest {
  id: string;
  child: {
    id: string;
    firstName: string;
    lastName: string;
  };
  targetLocation: string;
  mode: 'WALKING' | 'ACCESSIBLE' | 'STROLLER_FRIENDLY' | 'QUICKEST' | 'SAFEST';
  requestedAt: Date;
  path?: NavigationPath;
  alternatives?: NavigationAlternative[];
  progress?: number;
  currentLocation?: string;
  nextWaypoint?: NavigationWaypoint;
  remainingTime?: number;
}

interface EnhancedNavigationProps {
  currentRequest?: NavigationRequest;
  navigationHistory: NavigationRequest[];
  onStartNavigation: (childId: string, targetLocation: string, mode: string, options: any) => void;
  onUpdateProgress: (requestId: string, currentZoneId: string) => void;
  onCompleteNavigation: (requestId: string) => void;
  isLoading?: boolean;
}

export default function EnhancedNavigation({
  currentRequest,
  navigationHistory,
  onStartNavigation,
  onUpdateProgress,
  onCompleteNavigation,
  isLoading = false,
}: EnhancedNavigationProps) {
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [targetLocation, setTargetLocation] = useState<string>('');
  const [navigationMode, setNavigationMode] = useState<string>('WALKING');
  const [avoidCrowds, setAvoidCrowds] = useState(true);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(false);
  const [prioritizeSafety, setPriorizeSafety] = useState(true);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'WALKING':
        return <Navigation className="w-4 h-4" />;
      case 'ACCESSIBLE':
        return <Accessibility className="w-4 h-4" />;
      case 'STROLLER_FRIENDLY':
        return <Baby className="w-4 h-4" />;
      case 'QUICKEST':
        return <Zap className="w-4 h-4" />;
      case 'SAFEST':
        return <Shield className="w-4 h-4" />;
      default:
        return <Navigation className="w-4 h-4" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'WALKING':
        return 'bg-blue-500';
      case 'ACCESSIBLE':
        return 'bg-green-500';
      case 'STROLLER_FRIENDLY':
        return 'bg-purple-500';
      case 'QUICKEST':
        return 'bg-orange-500';
      case 'SAFEST':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getCrowdColor = (density: number) => {
    if (density < 0.3) return 'text-green-600';
    if (density < 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSafetyColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleStartNavigation = () => {
    if (selectedChild && targetLocation) {
      onStartNavigation(selectedChild, targetLocation, navigationMode, {
        avoidCrowds,
        accessibilityNeeds,
        prioritizeSafety,
      });
    }
  };

  const renderWaypoint = (waypoint: NavigationWaypoint, index: number, isActive = false) => (
    <motion.div
      key={waypoint.zoneId}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        isActive ? 'bg-blue-50 border-blue-200' : 'bg-muted/50'
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
        isActive ? 'bg-blue-500' : 'bg-gray-400'
      }`}>
        {index + 1}
      </div>
      
      <div className="flex-1">
        <h4 className="font-semibold text-sm">{waypoint.zoneName}</h4>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{waypoint.estimatedTime}m</span>
          </div>
          
          <div className={`flex items-center gap-1 ${getCrowdColor(waypoint.crowdDensity)}`}>
            <Users className="w-3 h-3" />
            <span>{Math.round(waypoint.crowdDensity * 100)}%</span>
          </div>
          
          <div className={`flex items-center gap-1 ${getSafetyColor(waypoint.safetyScore)}`}>
            <Shield className="w-3 h-3" />
            <span>{Math.round(waypoint.safetyScore * 100)}%</span>
          </div>
        </div>
      </div>
      
      {isActive && (
        <div className="text-blue-500">
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </motion.div>
  );

  const renderAlternative = (alternative: NavigationAlternative, index: number) => (
    <Card key={index} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">{alternative.name}</h4>
          <Badge variant="outline" className="text-xs">
            {formatTime(alternative.estimatedTime)}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-3">
          {alternative.benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {alternative.totalDistance.toFixed(0)}m distance
          </span>
          <Button size="sm" variant="outline">
            Use This Route
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="w-5 h-5" />
            Enhanced Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Child</label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="child1">Emma Johnson</SelectItem>
                  <SelectItem value="child2">Noah Smith</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Target Location</label>
              <Select value={targetLocation} onValueChange={setTargetLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Where to?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="playground">Main Playground</SelectItem>
                  <SelectItem value="cafeteria">Cafeteria</SelectItem>
                  <SelectItem value="restroom">Restroom</SelectItem>
                  <SelectItem value="exit">Exit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-3 block">Navigation Mode</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { key: 'WALKING', label: 'Walking', icon: Navigation },
                { key: 'ACCESSIBLE', label: 'Accessible', icon: Accessibility },
                { key: 'STROLLER_FRIENDLY', label: 'Stroller', icon: Baby },
                { key: 'QUICKEST', label: 'Quickest', icon: Zap },
                { key: 'SAFEST', label: 'Safest', icon: Shield },
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={navigationMode === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNavigationMode(key)}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={avoidCrowds}
                onChange={(e) => setAvoidCrowds(e.target.checked)}
                className="rounded"
              />
              Avoid crowds
            </label>
            
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={accessibilityNeeds}
                onChange={(e) => setAccessibilityNeeds(e.target.checked)}
                className="rounded"
              />
              Accessibility needs
            </label>
            
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={prioritizeSafety}
                onChange={(e) => setPriorizeSafety(e.target.checked)}
                className="rounded"
              />
              Prioritize safety
            </label>
          </div>
          
          <Button
            onClick={handleStartNavigation}
            disabled={!selectedChild || !targetLocation || isLoading}
            className="w-full"
          >
            <Route className="w-4 h-4 mr-2" />
            Generate Navigation Route
          </Button>
        </CardContent>
      </Card>

      {/* Current Navigation */}
      {currentRequest && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Active Navigation
              </CardTitle>
              
              <Badge className={`${getModeColor(currentRequest.mode)} text-white`}>
                {getModeIcon(currentRequest.mode)}
                {currentRequest.mode}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {currentRequest.child.firstName} to {currentRequest.targetLocation}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Started {new Date(currentRequest.requestedAt).toLocaleTimeString()}
                </p>
              </div>
              
              {currentRequest.progress !== undefined && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(currentRequest.progress * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
              )}
            </div>
            
            {currentRequest.progress !== undefined && (
              <Progress value={currentRequest.progress * 100} className="h-2" />
            )}
            
            {currentRequest.remainingTime !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(currentRequest.remainingTime)} remaining</span>
                </div>
                
                {currentRequest.currentLocation && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>Currently at {currentRequest.currentLocation}</span>
                  </div>
                )}
              </div>
            )}
            
            {currentRequest.nextWaypoint && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">Next Destination</h4>
                <div className="flex items-center justify-between">
                  <span>{currentRequest.nextWaypoint.zoneName}</span>
                  <Badge variant="outline">
                    {currentRequest.nextWaypoint.estimatedTime}m
                  </Badge>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateProgress(currentRequest.id, 'current-zone')}
              >
                Update Location
              </Button>
              
              <Button
                size="sm"
                onClick={() => onCompleteNavigation(currentRequest.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Arrived
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Details */}
      {currentRequest?.path && (
        <Card>
          <CardHeader>
            <CardTitle>Route Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {formatTime(currentRequest.path.estimatedTime)}
                </div>
                <div className="text-sm text-muted-foreground">Estimated Time</div>
              </div>
              
              <div className="text-center">
                <div className={`text-lg font-bold ${getSafetyColor(currentRequest.path.safetyScore)}`}>
                  {Math.round(currentRequest.path.safetyScore * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Safety Score</div>
              </div>
              
              <div className="text-center">
                <div className={`text-lg font-bold ${getCrowdColor(currentRequest.path.crowdFactor)}`}>
                  {Math.round(currentRequest.path.crowdFactor * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Crowd Impact</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Waypoints</h4>
              {currentRequest.path.waypoints.map((waypoint, index) => 
                renderWaypoint(
                  waypoint, 
                  index, 
                  currentRequest.currentLocation === waypoint.zoneName
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternative Routes */}
      {currentRequest?.alternatives && currentRequest.alternatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alternative Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {currentRequest.alternatives.map((alternative, index) => 
                renderAlternative(alternative, index)
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Navigation History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {navigationHistory.length > 0 ? (
              <div className="space-y-3">
                {navigationHistory.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {request.child.firstName[0]}{request.child.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="font-semibold text-sm">
                          {request.child.firstName} → {request.targetLocation}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getModeIcon(request.mode)}
                        {request.mode}
                      </Badge>
                      
                      {request.path && (
                        <span className="text-sm text-muted-foreground">
                          {formatTime(request.path.estimatedTime)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Route className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No navigation history yet</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
