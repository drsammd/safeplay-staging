
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Tag, 
  Calendar, 
  DollarSign, 
  Percent, 
  Gift,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DiscountUsage {
  id: string;
  code: string;
  usageStatus: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  planType?: string;
  appliedAt: string;
  redeemedAt?: string;
  discountCode: {
    name: string;
    description?: string;
    discountType: string;
    discountValue: number;
    category: string;
  };
}

interface UserDiscountHistoryProps {
  userId?: string;
  compact?: boolean;
}

export default function UserDiscountHistory({ 
  userId, 
  compact = false 
}: UserDiscountHistoryProps) {
  const [discountHistory, setDiscountHistory] = useState<DiscountUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSavings, setTotalSavings] = useState(0);

  const fetchDiscountHistory = async () => {
    try {
      setLoading(true);
      const url = userId 
        ? `/api/users/${userId}/discount-history`
        : `/api/discount-codes/my-history`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setDiscountHistory(data.history || []);
        setTotalSavings(data.totalSavings || 0);
      } else {
        toast.error(data.error || 'Failed to fetch discount history');
      }
    } catch (error) {
      toast.error('Failed to fetch discount history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscountHistory();
  }, [userId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REDEEMED':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'APPLIED':
        return <Tag className="h-4 w-4 text-blue-500" />;
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Tag className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      REDEEMED: 'default',
      APPLIED: 'secondary',
      CANCELLED: 'destructive',
      REFUNDED: 'outline'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toLowerCase()}
      </Badge>
    );
  };

  const getDiscountDisplay = (usage: DiscountUsage) => {
    const { discountCode } = usage;
    if (discountCode.discountType === 'PERCENTAGE') {
      return `${discountCode.discountValue}% off`;
    }
    if (discountCode.discountType === 'FIXED_AMOUNT') {
      return `$${discountCode.discountValue} off`;
    }
    return discountCode.discountType.replace('_', ' ');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      MARKETING: 'bg-blue-100 text-blue-800',
      WELCOME: 'bg-green-100 text-green-800',
      SEASONAL: 'bg-orange-100 text-orange-800',
      LOYALTY: 'bg-purple-100 text-purple-800',
      PARTNER: 'bg-indigo-100 text-indigo-800',
      RETENTION: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Discount History</CardTitle>
              <CardDescription>Your recent discount code usage</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchDiscountHistory}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {totalSavings > 0 && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Total Savings: ${totalSavings.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {discountHistory.length === 0 ? (
            <div className="text-center py-6">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No discount codes used yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {discountHistory.slice(0, 5).map((usage) => (
                <div key={usage.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(usage.usageStatus)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {usage.code}
                        </Badge>
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(usage.discountCode.category)}`}>
                          {usage.discountCode.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {usage.discountCode.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      -${usage.discountAmount.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(usage.appliedAt), 'MMM dd')}
                    </div>
                  </div>
                </div>
              ))}
              
              {discountHistory.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm">
                    View All ({discountHistory.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Discount Code History</h1>
          <p className="text-muted-foreground">Track your discount code usage and savings</p>
        </div>
        <Button variant="outline" onClick={fetchDiscountHistory}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Card */}
      {totalSavings > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${totalSavings.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">Total Savings</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {discountHistory.filter(h => h.usageStatus === 'REDEEMED').length}
                </div>
                <p className="text-sm text-muted-foreground">Codes Used</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {discountHistory.length > 0 
                    ? (totalSavings / discountHistory.filter(h => h.usageStatus === 'REDEEMED').length).toFixed(2)
                    : '0.00'
                  }
                </div>
                <p className="text-sm text-muted-foreground">Avg. Savings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
          <CardDescription>Complete history of your discount code usage</CardDescription>
        </CardHeader>
        <CardContent>
          {discountHistory.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No discount codes used yet</h3>
              <p className="text-muted-foreground">
                Start saving by applying discount codes during checkout!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Final</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountHistory.map((usage) => (
                  <TableRow key={usage.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {usage.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{usage.discountCode.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {usage.discountCode.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {usage.discountCode.discountType === 'PERCENTAGE' ? (
                          <Percent className="h-3 w-3" />
                        ) : (
                          <DollarSign className="h-3 w-3" />
                        )}
                        <span className="text-sm">
                          {getDiscountDisplay(usage)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>${usage.originalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      -${usage.discountAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${usage.finalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(usage.appliedAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(usage.usageStatus)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

