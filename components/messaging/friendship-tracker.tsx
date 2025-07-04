// @ts-nocheck
'use client'

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import {
  Users,
  Heart,
  Clock,
  Activity,
  TrendingUp,
  MessageCircle,
  Calendar,
  MapPin,
  Star,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface Friendship {
  id: string;
  friend: {
    id: string;
    name: string;
    parent: {
      id: string;
      name: string;
    };
  };
  status: 'DETECTED' | 'CONFIRMED' | 'DECLINED' | 'BLOCKED' | 'PENDING';
  confidenceScore: number;
  interactionCount: number;
  totalInteractionTime: number; // in minutes
  lastInteractionAt: Date;
  sharedActivities: string[];
  detectedAt: Date;
  confirmedAt?: Date;
}

interface FriendshipRecommendation {
  childId: string;
  childName: string;
  compatibilityScore: number;
  sharedActivities: string[];
  reason: string;
}

interface FriendshipTrackerProps {
  childId: string;
  childName: string;
  friendships: Friendship[];
  recommendations: FriendshipRecommendation[];
  onConfirmFriendship: (friendshipId: string) => void;
  onDeclineFriendship: (friendshipId: string) => void;
  onConnectParent: (parentId: string) => void;
  isLoading?: boolean;
}

export default function FriendshipTracker({
  childId,
  childName,
  friendships,
  recommendations,
  onConfirmFriendship,
  onDeclineFriendship,
  onConnectParent,
  isLoading = false,
}: FriendshipTrackerProps) {
  const [selectedFriendship, setSelectedFriendship] = useState<Friendship | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500';
      case 'DETECTED':
        return 'bg-blue-500';
      case 'PENDING':
        return 'bg-yellow-500';
      case 'DECLINED':
        return 'bg-gray-500';
      case 'BLOCKED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4" />;
      case 'DETECTED':
        return <AlertTriangle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'DECLINED':
        return <XCircle className="w-4 h-4" />;
      case 'BLOCKED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatInteractionTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const handleViewDetails = (friendship: Friendship) => {
    setSelectedFriendship(friendship);
    setShowDetails(true);
  };

  const confirmedFriendships = friendships.filter(f => f.status === 'CONFIRMED');
  const pendingFriendships = friendships.filter(f => f.status === 'DETECTED' || f.status === 'PENDING');

  const renderFriendshipCard = (friendship: Friendship, showActions = false) => (
    <Card
      key={friendship.id}
      className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleViewDetails(friendship)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback>
              {friendship.friend.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm">{friendship.friend.name}</h3>
              <Badge
                variant="secondary"
                className={`text-xs text-white ${getStatusColor(friendship.status)}`}
              >
                {getStatusIcon(friendship.status)}
                {friendship.status.toLowerCase()}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              Parent: {friendship.friend.parent.name}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(friendship.confidenceScore * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Confidence</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {friendship.interactionCount}
                </div>
                <div className="text-xs text-muted-foreground">Interactions</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Total time: {formatInteractionTime(friendship.totalInteractionTime)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Last interaction: {formatDistanceToNow(new Date(friendship.lastInteractionAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            {friendship.sharedActivities.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-muted-foreground mb-1">Shared Activities:</div>
                <div className="flex flex-wrap gap-1">
                  {friendship.sharedActivities.slice(0, 3).map((activity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {activity}
                    </Badge>
                  ))}
                  {friendship.sharedActivities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{friendship.sharedActivities.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {showActions && friendship.status === 'DETECTED' && (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirmFriendship(friendship.id);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Heart className="w-4 h-4 mr-1" />
                Confirm
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeclineFriendship(friendship.id);
                }}
              >
                Decline
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderRecommendationCard = (recommendation: FriendshipRecommendation) => (
    <Card key={recommendation.childId} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback>
              {recommendation.childName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{recommendation.childName}</h3>
            <p className="text-sm text-muted-foreground mb-2">{recommendation.reason}</p>
            
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Compatibility</span>
                <span>{Math.round(recommendation.compatibilityScore * 100)}%</span>
              </div>
              <Progress value={recommendation.compatibilityScore * 100} className="h-2" />
            </div>
            
            {recommendation.sharedActivities.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-1">Shared Interests:</div>
                <div className="flex flex-wrap gap-1">
                  {recommendation.sharedActivities.map((activity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {activity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => {/* Handle connecting with parent */}}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {childName}'s Friendships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {confirmedFriendships.length}
              </div>
              <div className="text-sm text-muted-foreground">Confirmed Friends</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {pendingFriendships.length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {recommendations.length}
              </div>
              <div className="text-sm text-muted-foreground">Recommendations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Friendship Tabs */}
      <Tabs defaultValue="confirmed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="confirmed" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Confirmed ({confirmedFriendships.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingFriendships.length})
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Recommendations ({recommendations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="confirmed" className="mt-6">
          <ScrollArea className="h-[500px]">
            {confirmedFriendships.length > 0 ? (
              <AnimatePresence>
                {confirmedFriendships.map((friendship, index) => (
                  <motion.div
                    key={friendship.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {renderFriendshipCard(friendship)}
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No confirmed friendships yet</p>
                <p className="text-sm">Friendships will appear here once confirmed</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <ScrollArea className="h-[500px]">
            {pendingFriendships.length > 0 ? (
              <AnimatePresence>
                {pendingFriendships.map((friendship, index) => (
                  <motion.div
                    key={friendship.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {renderFriendshipCard(friendship, true)}
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No pending friendships</p>
                <p className="text-sm">New friendship detections will appear here</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <ScrollArea className="h-[500px]">
            {recommendations.length > 0 ? (
              <AnimatePresence>
                {recommendations.map((recommendation, index) => (
                  <motion.div
                    key={recommendation.childId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {renderRecommendationCard(recommendation)}
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No recommendations available</p>
                <p className="text-sm">Check back later for friendship suggestions</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Friendship Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Friendship Details
            </DialogTitle>
            <DialogDescription>
              {selectedFriendship && `${childName} & ${selectedFriendship.friend.name}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFriendship && (
            <div className="space-y-6">
              {/* Friendship Overview */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(selectedFriendship.confidenceScore * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">AI Confidence</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedFriendship.interactionCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Interactions</div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="font-semibold mb-3">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Friendship detected</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedFriendship.detectedAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {selectedFriendship.confirmedAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Friendship confirmed</span>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(selectedFriendship.confirmedAt), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Last interaction</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedFriendship.lastInteractionAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shared Activities */}
              {selectedFriendship.sharedActivities.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Shared Activities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFriendship.sharedActivities.map((activity, index) => (
                      <Badge key={index} variant="outline">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedFriendship.status === 'DETECTED' && (
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      onDeclineFriendship(selectedFriendship.id);
                      setShowDetails(false);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                  
                  <Button
                    onClick={() => {
                      onConfirmFriendship(selectedFriendship.id);
                      setShowDetails(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Confirm Friendship
                  </Button>
                </div>
              )}
              
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => onConnectParent(selectedFriendship.friend.parent.id)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Connect with {selectedFriendship.friend.parent.name}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
