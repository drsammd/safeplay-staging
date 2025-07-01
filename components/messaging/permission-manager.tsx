
'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Check,
  X,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Video,
  FileText,
  Users,
  Calendar,
  Eye,
  EyeOff,
  Shield,
  Heart,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface MediaPermission {
  id: string;
  mediaTitle: string;
  childName: string;
  requestedAt: Date;
  expiresAt: Date;
  context?: string;
  mediaType: 'PHOTO' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  uploaderName: string;
  thumbnailUrl?: string;
}

interface PermissionManagerProps {
  permissions: MediaPermission[];
  onApprove: (permissionId: string, reason?: string) => void;
  onDeny: (permissionId: string, reason?: string) => void;
  onBulkAction: (permissionIds: string[], action: 'approve' | 'deny') => void;
  isLoading?: boolean;
}

export default function PermissionManager({
  permissions,
  onApprove,
  onDeny,
  onBulkAction,
  isLoading = false,
}: PermissionManagerProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDenyDialog, setShowDenyDialog] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<MediaPermission | null>(null);
  const [reason, setReason] = useState('');

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'PHOTO':
        return <ImageIcon className="w-4 h-4" />;
      case 'VIDEO':
        return <Video className="w-4 h-4" />;
      case 'AUDIO':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getUrgencyColor = (expiresAt: Date) => {
    const hoursRemaining = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursRemaining < 12) return 'destructive';
    if (hoursRemaining < 24) return 'secondary';
    return 'default';
  };

  const handleSelectPermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === permissions.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(permissions.map(p => p.id));
    }
  };

  const handleApprove = (permission: MediaPermission) => {
    setSelectedPermission(permission);
    setShowApprovalDialog(true);
  };

  const handleDeny = (permission: MediaPermission) => {
    setSelectedPermission(permission);
    setShowDenyDialog(true);
  };

  const confirmApproval = () => {
    if (selectedPermission) {
      onApprove(selectedPermission.id, reason);
      setShowApprovalDialog(false);
      setSelectedPermission(null);
      setReason('');
    }
  };

  const confirmDeny = () => {
    if (selectedPermission) {
      onDeny(selectedPermission.id, reason);
      setShowDenyDialog(false);
      setSelectedPermission(null);
      setReason('');
    }
  };

  const renderPermissionCard = (permission: MediaPermission, index: number) => (
    <motion.div
      key={permission.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Selection Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedPermissions.includes(permission.id)}
                onChange={() => handleSelectPermission(permission.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Media Preview */}
            <div className="relative">
              {permission.thumbnailUrl ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={permission.thumbnailUrl}
                    alt={permission.mediaTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  {getMediaIcon(permission.mediaType)}
                </div>
              )}
              
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 text-xs"
              >
                {permission.mediaType}
              </Badge>
            </div>

            {/* Permission Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm truncate">
                    {permission.mediaTitle || 'Untitled Media'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Child: <span className="font-medium">{permission.childName}</span>
                  </p>
                </div>
                
                <Badge variant={getUrgencyColor(permission.expiresAt)} className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(permission.expiresAt), { addSuffix: true })}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {permission.uploaderName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  Shared by {permission.uploaderName}
                </span>
              </div>

              {permission.context && (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded mb-3">
                  "{permission.context}"
                </p>
              )}

              <div className="text-xs text-muted-foreground">
                Requested {formatDistanceToNow(new Date(permission.requestedAt), { addSuffix: true })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => handleApprove(permission)}
                className="bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeny(permission)}
                className="border-red-300 text-red-600 hover:bg-red-50"
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-1" />
                Deny
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Bulk Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Media Permission Requests
            </CardTitle>
            
            <Badge variant="secondary" className="text-lg py-1 px-3">
              {permissions.length} pending
            </Badge>
          </div>
        </CardHeader>
        
        {permissions.length > 0 && (
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedPermissions.length === permissions.length ? 'Deselect All' : 'Select All'}
                </Button>
                
                {selectedPermissions.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedPermissions.length} selected
                  </span>
                )}
              </div>
              
              {selectedPermissions.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onBulkAction(selectedPermissions, 'approve')}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve Selected
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onBulkAction(selectedPermissions, 'deny')}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Deny Selected
                  </Button>
                </div>
              )}
            </div>
            
            <Separator />
          </CardContent>
        )}
      </Card>

      {/* Permission List */}
      <div>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                      <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : permissions.length > 0 ? (
          <ScrollArea className="h-[600px]">
            <AnimatePresence>
              {permissions.map((permission, index) => renderPermissionCard(permission, index))}
            </AnimatePresence>
          </ScrollArea>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center text-muted-foreground">
                <Heart className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">All caught up!</p>
                <p className="text-sm">No pending permission requests at the moment.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Approve Media Sharing
            </DialogTitle>
            <DialogDescription>
              You're about to approve sharing of "{selectedPermission?.mediaTitle}" 
              featuring {selectedPermission?.childName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Optional note (visible to uploader):</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add a note about why you're approving this..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmApproval}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve Sharing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-600" />
              Deny Media Sharing
            </DialogTitle>
            <DialogDescription>
              You're about to deny sharing of "{selectedPermission?.mediaTitle}" 
              featuring {selectedPermission?.childName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for denial (optional):</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're not comfortable with this sharing..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDenyDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeny}
                variant="destructive"
              >
                Deny Sharing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
