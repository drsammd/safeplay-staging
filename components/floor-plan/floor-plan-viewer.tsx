
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move, 
  MousePointer,
  Camera,
  Layers,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloorPlanViewerProps {
  floorPlan: {
    id: string;
    name: string;
    fileUrl: string;
    dimensions?: {
      width: number;
      height: number;
      scale?: number;
    };
  };
  cameras?: Array<{
    id: string;
    name: string;
    position?: { x: number; y: number };
    status: string;
    viewAngle?: number;
    viewDistance?: number;
    rotation?: number;
  }>;
  zones?: Array<{
    id: string;
    name: string;
    type: string;
    coordinates: Array<{ x: number; y: number }>;
    color: string;
  }>;
  mode?: 'view' | 'edit' | 'camera-placement';
  onCameraSelect?: (camera: any) => void;
  onCameraMove?: (cameraId: string, position: { x: number; y: number }) => void;
  onCanvasClick?: (position: { x: number; y: number }) => void;
  showCoverageAreas?: boolean;
  coverageAreas?: Array<{
    cameraId: string;
    polygon: Array<{ x: number; y: number }>;
    confidence: number;
  }>;
}

export default function FloorPlanViewer({
  floorPlan,
  cameras = [],
  zones = [],
  mode = 'view',
  onCameraSelect,
  onCameraMove,
  onCanvasClick,
  showCoverageAreas = false,
  coverageAreas = []
}: FloorPlanViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  // Safe zoom setter to prevent negative or zero values
  const setSafeZoom = (value: number | ((prev: number) => number)) => {
    setZoom(prev => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      return Math.max(0.1, Math.abs(newValue));
    });
  };
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [draggedCamera, setDraggedCamera] = useState<string | null>(null);

  // Load and setup the floor plan image
  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setIsImageLoaded(true);
      fitToContainer();
    };
    image.onerror = () => {
      console.error('Failed to load floor plan image');
    };
    image.src = floorPlan.fileUrl;
  }, [floorPlan.fileUrl]);

  // Redraw canvas when any dependency changes
  useEffect(() => {
    if (isImageLoaded) {
      drawCanvas();
    }
  }, [isImageLoaded, zoom, pan, cameras, zones, selectedCamera, showCoverageAreas, coverageAreas]);

  const fitToContainer = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;

    const container = containerRef.current;
    const image = imageRef.current;
    
    const containerWidth = Math.max(1, container.clientWidth - 40); // Account for padding, ensure positive
    const containerHeight = Math.max(1, container.clientHeight - 100); // Account for controls, ensure positive
    
    // Ensure image dimensions are valid
    const imageWidth = Math.max(1, image.width);
    const imageHeight = Math.max(1, image.height);
    
    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;
    const newZoom = Math.max(0.1, Math.min(scaleX, scaleY, 1)); // Don't scale up beyond original size, ensure minimum zoom
    
    setSafeZoom(newZoom);
    setPan({
      x: (containerWidth - imageWidth * newZoom) / 2,
      y: (containerHeight - imageHeight * newZoom) / 2
    });
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context
      ctx.save();

    // Apply transformations
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw floor plan image
    ctx.drawImage(image, 0, 0);

    // Draw zones
    zones.forEach(zone => {
      ctx.save();
      ctx.fillStyle = zone.color + '40'; // 25% opacity
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      zone.coordinates.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw zone label
      const center = getPolygonCenter(zone.coordinates);
      ctx.fillStyle = zone.color;
      const safeZoom = Math.max(0.1, Math.abs(zoom));
      ctx.font = `${Math.max(8, 12 / safeZoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(zone.name, center.x, center.y);
      
      ctx.restore();
    });

    // Draw camera coverage areas
    if (showCoverageAreas) {
      coverageAreas.forEach(area => {
        const camera = cameras.find(c => c.id === area.cameraId);
        if (!camera) return;

        ctx.save();
        ctx.fillStyle = `rgba(59, 130, 246, ${0.1 * area.confidence})`; // Blue with confidence-based opacity
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        area.polygon.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
      });
    }

    // Draw cameras
    cameras.forEach(camera => {
      if (!camera.position) return;

      ctx.save();
      
      const isSelected = selectedCamera === camera.id;
      const isDragged = draggedCamera === camera.id;
      
      // Camera body - ensure zoom is positive and radius is valid
      const safeZoom = Math.max(0.1, Math.abs(zoom));
      const radius = Math.max(1, 8 / safeZoom);
      ctx.fillStyle = getStatusColor(camera.status);
      ctx.strokeStyle = isSelected ? '#3B82F6' : '#374151';
      ctx.lineWidth = Math.max(1, (isSelected ? 3 : 2) / safeZoom);
      
      ctx.beginPath();
      ctx.arc(camera.position.x, camera.position.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Camera direction indicator
      if (camera.rotation !== undefined) {
        const rotation = (camera.rotation * Math.PI) / 180;
        const indicatorLength = Math.max(5, 15 / safeZoom);
        
        ctx.strokeStyle = isSelected ? '#3B82F6' : '#6B7280';
        ctx.lineWidth = Math.max(1, 2 / safeZoom);
        ctx.beginPath();
        ctx.moveTo(camera.position.x, camera.position.y);
        ctx.lineTo(
          camera.position.x + Math.cos(rotation) * indicatorLength,
          camera.position.y + Math.sin(rotation) * indicatorLength
        );
        ctx.stroke();
      }

      // Camera label
      ctx.fillStyle = '#1F2937';
      ctx.font = `${Math.max(8, 10 / safeZoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(
        camera.name,
        camera.position.x,
        camera.position.y + Math.max(15, 25 / safeZoom)
      );

      ctx.restore();
    });

      // Restore context
      ctx.restore();
    } catch (error) {
      console.error('Error drawing canvas:', error);
      // Clear canvas and show a simple error state
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Canvas rendering error', canvas.width / 2, canvas.height / 2);
    }
  }, [zoom, pan, cameras, zones, selectedCamera, draggedCamera, showCoverageAreas, coverageAreas]);

  const getPolygonCenter = (coordinates: Array<{ x: number; y: number }>) => {
    const sumX = coordinates.reduce((sum, point) => sum + point.x, 0);
    const sumY = coordinates.reduce((sum, point) => sum + point.y, 0);
    return {
      x: sumX / coordinates.length,
      y: sumY / coordinates.length
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return '#10B981';
      case 'OFFLINE': return '#EF4444';
      case 'MAINTENANCE': return '#F59E0B';
      case 'ERROR': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    
    return { x, y };
  };

  const getCameraAtPosition = (x: number, y: number) => {
    const safeZoom = Math.max(0.1, Math.abs(zoom));
    const threshold = Math.max(5, 15 / safeZoom); // Click threshold with minimum value
    
    return cameras.find(camera => {
      if (!camera.position) return false;
      
      const distance = Math.sqrt(
        Math.pow(x - camera.position.x, 2) + Math.pow(y - camera.position.y, 2)
      );
      
      return distance <= threshold;
    });
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    const clickedCamera = getCameraAtPosition(coords.x, coords.y);

    if (clickedCamera) {
      setSelectedCamera(clickedCamera.id);
      onCameraSelect?.(clickedCamera);
      
      if (mode === 'camera-placement') {
        setDraggedCamera(clickedCamera.id);
      }
    } else {
      setSelectedCamera(null);
      
      if (mode === 'camera-placement') {
        onCanvasClick?.(coords);
      } else {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedCamera) {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      onCameraMove?.(draggedCamera, coords);
    } else if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedCamera(null);
  };

  // Zoom controls
  const handleZoomIn = () => setSafeZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setSafeZoom(prev => Math.max(prev / 1.2, 0.1));
  const handleResetView = () => fitToContainer();

  // Resize canvas to match container
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawCanvas]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {floorPlan.name}
            </CardTitle>
            {floorPlan.dimensions && (
              <p className="text-sm text-muted-foreground mt-1">
                {floorPlan.dimensions.width} × {floorPlan.dimensions.height}
                {floorPlan.dimensions.scale && ` (${floorPlan.dimensions.scale}m/unit)`}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mode indicator */}
            <Badge variant={mode === 'view' ? 'default' : 'secondary'}>
              {mode === 'view' && <MousePointer className="h-3 w-3 mr-1" />}
              {mode === 'edit' && <Settings className="h-3 w-3 mr-1" />}
              {mode === 'camera-placement' && <Camera className="h-3 w-3 mr-1" />}
              {mode.replace('-', ' ')}
            </Badge>
            
            {/* Camera count */}
            {cameras.length > 0 && (
              <Badge variant="outline">
                <Camera className="h-3 w-3 mr-1" />
                {cameras.length} camera{cameras.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <div className="ml-4 text-sm text-muted-foreground">
            Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative overflow-hidden">
        <div 
          ref={containerRef}
          className="w-full h-full relative bg-gray-50"
        >
          <canvas
            ref={canvasRef}
            className={cn(
              "absolute inset-0 cursor-grab",
              isDragging && "cursor-grabbing",
              mode === 'camera-placement' && "cursor-crosshair"
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          
          {!isImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading floor plan...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
