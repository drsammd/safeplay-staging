
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileImage, 
  Calendar, 
  User, 
  Camera, 
  Download, 
  Trash2, 
  Eye,
  MoreHorizontal,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistance } from 'date-fns';

// Import unified types
import type { FloorPlan } from '@/lib/floor-plan-types';

interface FloorPlanListProps {
  venueId: string;
  onSelectFloorPlan: (floorPlan: FloorPlan) => void;
  onDeleteFloorPlan: (floorPlanId: string) => void;
  refreshTrigger?: number;
}

export default function FloorPlanList({ 
  venueId, 
  onSelectFloorPlan, 
  onDeleteFloorPlan,
  refreshTrigger = 0
}: FloorPlanListProps) {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [floorPlanToDelete, setFloorPlanToDelete] = useState<FloorPlan | null>(null);

  useEffect(() => {
    fetchFloorPlans();
  }, [venueId, refreshTrigger]);

  const fetchFloorPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/floor-plans?venueId=${venueId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch floor plans');
      }

      const data = await response.json();
      setFloorPlans(data);
    } catch (error) {
      console.error('Error fetching floor plans:', error);
      setError(error instanceof Error ? error.message : 'Failed to load floor plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (floorPlan: FloorPlan) => {
    setFloorPlanToDelete(floorPlan);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!floorPlanToDelete) return;

    try {
      const response = await fetch(`/api/floor-plans/${floorPlanToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete floor plan');
      }

      onDeleteFloorPlan(floorPlanToDelete.id);
      setFloorPlans(prev => prev.filter(fp => fp.id !== floorPlanToDelete.id));
    } catch (error) {
      console.error('Error deleting floor plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete floor plan');
    } finally {
      setDeleteDialogOpen(false);
      setFloorPlanToDelete(null);
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'dwg':
        return '📐';
      case 'svg':
        return '🎨';
      default:
        return '🖼️';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (floorPlans.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <FileImage className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">No Floor Plans Uploaded</h3>
            <p className="text-gray-600 font-medium mb-6 max-w-md mx-auto">
              Get started by uploading your first floor plan to begin camera placement and management.
            </p>
            <Button 
              onClick={() => {/* Navigate to upload tab - this would need to be passed as a prop */}}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Upload Floor Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {floorPlans.map((floorPlan) => (
        <Card key={floorPlan.id} className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl font-bold text-gray-900">{floorPlan.name}</CardTitle>
                  {floorPlan.isActive && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                    v{floorPlan.version}
                  </Badge>
                </div>
                
                {floorPlan.description && (
                  <CardDescription className="mt-1 text-gray-600 font-medium">
                    {floorPlan.description}
                  </CardDescription>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 border-gray-300">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
                  <DropdownMenuItem 
                    onClick={() => onSelectFloorPlan(floorPlan)}
                    className="font-medium hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Floor Plan
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => window.open(floorPlan.fileUrl, '_blank')}
                    className="font-medium hover:bg-green-50 hover:text-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteClick(floorPlan)}
                    className="font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{getFileTypeIcon(floorPlan.fileType ?? 'PNG')}</span>
                <div>
                  <p className="font-bold text-gray-900">{(floorPlan.fileType ?? 'PNG').toUpperCase()}</p>
                  <p className="text-gray-600 font-medium">{formatFileSize(floorPlan.fileSize ?? 0)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-bold text-gray-900">Uploaded by</p>
                  <p className="text-gray-600 font-medium">{floorPlan.uploader?.name ?? 'Unknown'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-bold text-gray-900">Updated</p>
                  <p className="text-gray-600 font-medium">
                    {formatDistance(new Date(floorPlan.updatedAt ?? new Date()), new Date(), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Camera className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-bold text-gray-900">Cameras</p>
                  <p className="text-gray-600 font-medium">
                    {floorPlan.cameras?.length || 0} placed
                  </p>
                </div>
              </div>
            </div>
            
            {/* Zones summary */}
            {floorPlan.zones && floorPlan.zones.length > 0 && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-bold text-gray-900 mb-3">Defined Zones:</p>
                <div className="flex flex-wrap gap-2">
                  {floorPlan.zones.slice(0, 3).map(zone => (
                    <Badge key={zone.id} className="bg-amber-100 text-amber-800 border-amber-300 font-medium">
                      {zone.name}
                    </Badge>
                  ))}
                  {floorPlan.zones.length > 3 && (
                    <Badge variant="outline" className="bg-white text-amber-700 border-amber-300 font-medium">
                      +{floorPlan.zones.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Button 
                onClick={() => onSelectFloorPlan(floorPlan)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 shadow-md hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                <Eye className="h-5 w-5 mr-2" />
                Open Floor Plan & Configure Cameras
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Floor Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{floorPlanToDelete?.name}"? This action cannot be undone.
              All associated cameras and zones will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
