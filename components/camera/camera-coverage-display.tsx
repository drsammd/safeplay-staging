
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  Shield, 
  AlertTriangle, 
  RefreshCw, 
  BarChart3,
  MapPin,
  Zap
} from 'lucide-react';

interface CoverageData {
  floorPlan: {
    id: string;
    name: string;
    dimensions: { width: number; height: number };
  };
  cameras: Array<{
    cameraId: string;
    cameraName: string;
    coverage: {
      polygon: Array<{ x: number; y: number }>;
      area: number;
      percentage: number;
      blindSpots: Array<{
        type: string;
        position: { x: number; y: number };
        area: number;
      }>;
    } | null;
  }>;
  totalCoverage: {
    coveragePercentage: number;
    coveredArea: number;
    totalArea: number;
    uncoveredAreas: Array<{
      center: { x: number; y: number };
      size: number;
    }>;
  } | null;
}

interface CameraCoverageDisplayProps {
  venueId: string;
  floorPlanId?: string;
  cameraId?: string;
  onRefresh?: () => void;
}

export default function CameraCoverageDisplay({
  venueId,
  floorPlanId,
  cameraId,
  onRefresh
}: CameraCoverageDisplayProps) {
  const [coverageData, setCoverageData] = useState<CoverageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoverageData();
  }, [venueId, floorPlanId, cameraId]);

  const fetchCoverageData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let url = `/api/cameras/coverage?venueId=${venueId}`;
      if (floorPlanId) url += `&floorPlanId=${floorPlanId}`;
      if (cameraId) url += `&cameraId=${cameraId}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch coverage data');
      }

      const data = await response.json();
      setCoverageData(data);
    } catch (error) {
      console.error('Error fetching coverage data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load coverage data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchCoverageData();
    onRefresh?.();
  };

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCoverageStatus = (percentage: number) => {
    if (percentage >= 80) return { status: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (percentage >= 60) return { status: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage >= 40) return { status: 'Fair', color: 'bg-orange-100 text-orange-800' };
    return { status: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Coverage Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Coverage Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!coverageData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Coverage Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No coverage data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Coverage Summary */}
      {coverageData.totalCoverage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Overall Coverage
                </CardTitle>
                <CardDescription>
                  {coverageData.floorPlan.name} • {coverageData.cameras.length} camera{coverageData.cameras.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Coverage Percentage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Coverage Percentage</span>
                  <Badge className={getCoverageStatus(coverageData.totalCoverage.coveragePercentage).color}>
                    {getCoverageStatus(coverageData.totalCoverage.coveragePercentage).status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Progress 
                    value={coverageData.totalCoverage.coveragePercentage} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{Math.round(coverageData.totalCoverage.coveragePercentage)}% covered</span>
                    <span>{Math.round(100 - coverageData.totalCoverage.coveragePercentage)}% uncovered</span>
                  </div>
                </div>
              </div>

              {/* Coverage Statistics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(coverageData.totalCoverage.coveredArea)}m²
                  </p>
                  <p className="text-sm text-muted-foreground">Covered Area</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {Math.round(coverageData.totalCoverage.totalArea - coverageData.totalCoverage.coveredArea)}m²
                  </p>
                  <p className="text-sm text-muted-foreground">Uncovered Area</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(coverageData.totalCoverage.totalArea)}m²
                  </p>
                  <p className="text-sm text-muted-foreground">Total Area</p>
                </div>
              </div>

              {/* Uncovered Areas Alert */}
              {coverageData.totalCoverage.uncoveredAreas.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{coverageData.totalCoverage.uncoveredAreas.length} uncovered area{coverageData.totalCoverage.uncoveredAreas.length !== 1 ? 's' : ''} detected.</strong>
                    {' '}Largest uncovered area is {Math.round(coverageData.totalCoverage.uncoveredAreas[0]?.size || 0)}m².
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Camera Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Individual Camera Coverage
          </CardTitle>
          <CardDescription>
            Coverage analysis for each camera
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {coverageData.cameras.map((camera) => (
              <div key={camera.cameraId} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{camera.cameraName}</h4>
                    <p className="text-sm text-muted-foreground">Camera ID: {camera.cameraId}</p>
                  </div>
                  
                  {camera.coverage && (
                    <Badge className={getCoverageStatus(camera.coverage.percentage).color}>
                      {Math.round(camera.coverage.percentage)}%
                    </Badge>
                  )}
                </div>

                {camera.coverage ? (
                  <div className="space-y-3">
                    {/* Coverage Progress */}
                    <div>
                      <Progress 
                        value={camera.coverage.percentage} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>{Math.round(camera.coverage.area)}m² covered</span>
                        <span>{Math.round(camera.coverage.percentage)}%</span>
                      </div>
                    </div>

                    {/* Blind Spots */}
                    {camera.coverage.blindSpots.length > 0 && (
                      <Alert>
                        <MapPin className="h-4 w-4" />
                        <AlertDescription>
                          {camera.coverage.blindSpots.length} blind spot{camera.coverage.blindSpots.length !== 1 ? 's' : ''} detected
                          {camera.coverage.blindSpots[0] && ` (largest: ${Math.round(camera.coverage.blindSpots[0].area)}m²)`}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      Coverage calculation not available. Camera may not be properly positioned or configured.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      {coverageData.totalCoverage && coverageData.totalCoverage.coveragePercentage < 80 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Optimization Suggestions
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {coverageData.totalCoverage.coveragePercentage < 60 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Low coverage detected.</strong> Consider adding more cameras or adjusting existing camera positions.
                  </AlertDescription>
                </Alert>
              )}
              
              {coverageData.totalCoverage.uncoveredAreas.length > 0 && (
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Uncovered areas found.</strong> Consider placing cameras near coordinates:
                    {' '}{coverageData.totalCoverage.uncoveredAreas.slice(0, 2).map(area => 
                      `(${Math.round(area.center.x)}, ${Math.round(area.center.y)})`
                    ).join(', ')}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="text-sm text-muted-foreground">
                Use the camera recommendation system to get specific suggestions for optimal camera placement.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
