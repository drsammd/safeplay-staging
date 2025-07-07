
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  DollarSign,
  Percent,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DiscountCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  category: string;
  status: string;
  currentUses: number;
  maxUses?: number;
  maxUsesPerUser: number;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
  totalUsages?: number;
  successfulUsages?: number;
  totalRevenue?: number;
  isExpired?: boolean;
  isExhausted?: boolean;
}

interface DiscountCodeFormData {
  code: string;
  name: string;
  description: string;
  discountType: string;
  discountValue: number;
  category: string;
  maxUses?: number;
  maxUsesPerUser: number;
  startsAt?: Date;
  expiresAt?: Date;
  applicablePlans: string[];
  minimumPurchase?: number;
  isStackable: boolean;
  restrictToNewUsers: boolean;
  restrictToFirstTime: boolean;
  campaignName?: string;
  notes?: string;
  tags: string[];
  isTest: boolean;
}

const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'FIXED_AMOUNT', label: 'Fixed Amount' },
  { value: 'FREE_TRIAL_EXTENSION', label: 'Free Trial Extension' },
  { value: 'FIRST_MONTH_FREE', label: 'First Month Free' },
  { value: 'LIFETIME_DISCOUNT', label: 'Lifetime Discount' }
];

const DISCOUNT_CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'RETENTION', label: 'Retention' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'SEASONAL', label: 'Seasonal' },
  { value: 'FLASH_SALE', label: 'Flash Sale' },
  { value: 'LOYALTY', label: 'Loyalty' },
  { value: 'WELCOME', label: 'Welcome' },
  { value: 'VENUE_SPECIFIC', label: 'Venue Specific' }
];

const SUBSCRIPTION_PLANS = [
  { value: 'BASIC', label: 'Basic' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'LIFETIME', label: 'Lifetime' }
];

export default function DiscountCodeManagement() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const initialFormData: DiscountCodeFormData = {
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    category: 'MARKETING',
    maxUsesPerUser: 1,
    applicablePlans: [],
    isStackable: false,
    restrictToNewUsers: false,
    restrictToFirstTime: false,
    tags: [],
    isTest: false
  };

  const [formData, setFormData] = useState<DiscountCodeFormData>(initialFormData);

  // Fetch discount codes
  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory && filterCategory !== 'all' && { category: filterCategory }),
        ...(filterStatus && filterStatus !== 'all' && { status: filterStatus })
      });

      const response = await fetch(`/api/discount-codes?${params}`);
      const data = await response.json();

      if (response.ok) {
        setDiscountCodes(data.discountCodes || []);
        setPagination(data.pagination || pagination);
      } else {
        toast.error(data.error || 'Failed to fetch discount codes');
      }
    } catch (error) {
      toast.error('Failed to fetch discount codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscountCodes();
  }, [pagination.page, searchTerm, filterCategory, filterStatus]);

  // Create discount code
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Discount code created successfully');
        setShowCreateDialog(false);
        setFormData(initialFormData);
        fetchDiscountCodes();
      } else {
        toast.error(data.error || 'Failed to create discount code');
      }
    } catch (error) {
      toast.error('Failed to create discount code');
    }
  };

  // Update discount code
  const handleUpdateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCode) return;

    try {
      const response = await fetch(`/api/discount-codes/${editingCode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Discount code updated successfully');
        setEditingCode(null);
        setFormData(initialFormData);
        fetchDiscountCodes();
      } else {
        toast.error(data.error || 'Failed to update discount code');
      }
    } catch (error) {
      toast.error('Failed to update discount code');
    }
  };

  // Delete discount code
  const handleDeleteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;

    try {
      const response = await fetch(`/api/discount-codes/${codeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Discount code deleted successfully');
        fetchDiscountCodes();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete discount code');
      }
    } catch (error) {
      toast.error('Failed to delete discount code');
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const getStatusBadge = (code: DiscountCode) => {
    if (code.isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (code.isExhausted) {
      return <Badge variant="secondary">Exhausted</Badge>;
    }
    if (code.status === 'ACTIVE') {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="outline">{code.status}</Badge>;
  };

  const getDiscountDisplay = (code: DiscountCode) => {
    if (code.discountType === 'PERCENTAGE') {
      return `${code.discountValue}%`;
    }
    if (code.discountType === 'FIXED_AMOUNT') {
      return `$${code.discountValue}`;
    }
    return code.discountType.replace('_', ' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Discount Code Management</h1>
          <p className="text-muted-foreground">Create and manage promotional discount codes</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowBulkDialog(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Bulk Generate
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Code
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {DISCOUNT_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="EXHAUSTED">Exhausted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Discount Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Discount Codes</CardTitle>
          <CardDescription>
            {pagination.total} total codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {code.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(code.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{code.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {code.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {code.discountType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getDiscountDisplay(code)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {code.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{code.currentUses || 0} / {code.maxUses || '∞'}</div>
                          <div className="text-muted-foreground">
                            {code.successfulUsages || 0} successful
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ${code.totalRevenue?.toFixed(2) || '0.00'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(code)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCode(code);
                              setFormData({
                                ...initialFormData,
                                code: code.code,
                                name: code.name,
                                description: code.description || '',
                                discountType: code.discountType,
                                discountValue: code.discountValue,
                                category: code.category,
                                maxUsesPerUser: code.maxUsesPerUser
                              });
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCode(code.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={showCreateDialog || !!editingCode} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingCode(null);
            setFormData(initialFormData);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
            </DialogTitle>
            <DialogDescription>
              {editingCode ? 'Update the discount code details' : 'Create a new promotional discount code'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editingCode ? handleUpdateCode : handleCreateCode} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        code: e.target.value.toUpperCase() 
                      }))}
                      placeholder="WELCOME20"
                      required
                      disabled={!!editingCode}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        name: e.target.value 
                      }))}
                      placeholder="Welcome Discount"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      description: e.target.value 
                    }))}
                    placeholder="20% off for new customers"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="discountType">Discount Type *</Label>
                    <Select 
                      value={formData.discountType} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        discountType: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISCOUNT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discountValue">Discount Value *</Label>
                    <Input
                      id="discountValue"
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        discountValue: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '10.00'}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        category: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISCOUNT_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="restrictions" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxUses">Max Total Uses</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      value={formData.maxUses || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        maxUses: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxUsesPerUser">Max Uses Per User *</Label>
                    <Input
                      id="maxUsesPerUser"
                      type="number"
                      value={formData.maxUsesPerUser}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        maxUsesPerUser: parseInt(e.target.value) || 1 
                      }))}
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="minimumPurchase">Minimum Purchase Amount</Label>
                  <Input
                    id="minimumPurchase"
                    type="number"
                    step="0.01"
                    value={formData.minimumPurchase || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      minimumPurchase: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>User Restrictions</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="restrictToNewUsers"
                      checked={formData.restrictToNewUsers}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        restrictToNewUsers: !!checked 
                      }))}
                    />
                    <Label htmlFor="restrictToNewUsers">Restrict to new users only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="restrictToFirstTime"
                      checked={formData.restrictToFirstTime}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        restrictToFirstTime: !!checked 
                      }))}
                    />
                    <Label htmlFor="restrictToFirstTime">First-time purchase only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isStackable"
                      checked={formData.isStackable}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        isStackable: !!checked 
                      }))}
                    />
                    <Label htmlFor="isStackable">Allow stacking with other codes</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    value={formData.campaignName || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      campaignName: e.target.value 
                    }))}
                    placeholder="Summer 2024 Campaign"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                    placeholder="Internal notes for team reference"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isTest"
                    checked={formData.isTest}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      isTest: !!checked 
                    }))}
                  />
                  <Label htmlFor="isTest">Test code (won't create Stripe objects)</Label>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingCode(null);
                  setFormData(initialFormData);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCode ? 'Update Code' : 'Create Code'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

