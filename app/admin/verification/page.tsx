
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  FileText, 
  Phone, 
  Users,
  AlertCircle, 
  CheckCircle, 
  Clock,
  Eye,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Bot,
  BarChart3,
  MessageSquare,
  Zap
} from "lucide-react";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface VerificationStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalIdentityVerifications: number;
  totalPhoneVerifications: number;
  totalUsersVerified: number;
  // Enhanced stats
  autoApprovedCount?: number;
  autoRejectedCount?: number;
  manualReviewCount?: number;
  automationRate?: number;
  averageConfidence?: number;
}

interface IdentityVerification {
  id: string;
  verificationType: string;
  status: string;
  documentType: string;
  documentCountry?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    verificationLevel: string;
  };
}

export default function AdminVerificationPage() {
  const { data: session, status } = useSession();
  const [verifications, setVerifications] = useState<IdentityVerification[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [enhancedAnalytics, setEnhancedAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [useEnhancedFeatures, setUseEnhancedFeatures] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      redirect("/unauthorized");
    }
    fetchVerifications();
  }, [session, status, statusFilter, typeFilter, currentPage]);

  const fetchVerifications = async () => {
    try {
      setError('');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter,
        type: typeFilter
      });

      // Try to fetch enhanced analytics first
      if (useEnhancedFeatures) {
        try {
          const analyticsResponse = await fetch('/api/admin/verification/analytics');
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            if (analyticsData.success) {
              setEnhancedAnalytics(analyticsData.analytics);
              // Merge enhanced stats with regular stats
              if (stats) {
                setStats({
                  ...stats,
                  autoApprovedCount: analyticsData.analytics.autoApprovedCount,
                  autoRejectedCount: analyticsData.analytics.autoRejectedCount,
                  manualReviewCount: analyticsData.analytics.manualReviewCount,
                  automationRate: analyticsData.analytics.automationRate,
                  averageConfidence: analyticsData.analytics.averageConfidence
                });
              }
            }
          }
        } catch (enhancedError) {
          console.log('Enhanced analytics not available');
          setUseEnhancedFeatures(false);
        }
      }

      const response = await fetch(`/api/admin/verification/pending?${params}`);
      const data = await response.json();

      if (data.success) {
        setVerifications(data.pendingReviews || data.identityVerifications || []);
        setStats(data.stats || {
          totalPending: data.pendingReviews?.length || 0,
          totalApproved: 0,
          totalRejected: 0,
          totalIdentityVerifications: 0,
          totalPhoneVerifications: 0,
          totalUsersVerified: 0
        });
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setError(data.error || 'Failed to load verifications');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchVerifications();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Under Review</Badge>;
      case 'SUBMITTED':
        return <Badge variant="secondary"><FileText className="h-3 w-3 mr-1" />Submitted</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getPriorityBadge = (verification: IdentityVerification) => {
    const daysSinceSubmission = Math.floor(
      (new Date().getTime() - new Date(verification.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceSubmission > 3) {
      return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
    } else if (daysSinceSubmission > 1) {
      return <Badge variant="outline" className="text-xs">High</Badge>;
    }
    return null;
  };

  const filteredVerifications = verifications.filter(verification =>
    verification.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.documentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Verification Management</h1>
              {useEnhancedFeatures && enhancedAnalytics && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Bot className="h-3 w-3 mr-1" />
                  AI Analytics
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Review and manage user verification requests with AI-powered insights
            </p>
          </div>
          
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalPending}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalApproved}</p>
                      <p className="text-xs text-muted-foreground">Approved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalRejected}</p>
                      <p className="text-xs text-muted-foreground">Rejected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalIdentityVerifications}</p>
                      <p className="text-xs text-muted-foreground">Total Identity</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalPhoneVerifications}</p>
                      <p className="text-xs text-muted-foreground">Total Phone</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalUsersVerified}</p>
                      <p className="text-xs text-muted-foreground">Verified Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced AI Analytics */}
            {enhancedAnalytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    AI Verification Analytics
                  </CardTitle>
                  <CardDescription>
                    Automated verification performance and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Auto Approved</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {enhancedAnalytics.autoApprovedCount || 0}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Auto Rejected</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {enhancedAnalytics.autoRejectedCount || 0}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Automation Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {enhancedAnalytics.automationRate?.toFixed(1) || 0}%
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Avg Confidence</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {enhancedAnalytics.averageConfidence ? (enhancedAnalytics.averageConfidence * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>

                  {enhancedAnalytics.automationRate && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Automation Efficiency</span>
                        <span>{enhancedAnalytics.automationRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${enhancedAnalytics.automationRate}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {enhancedAnalytics.automationRate > 80 
                          ? "Excellent automation efficiency" 
                          : enhancedAnalytics.automationRate > 60 
                          ? "Good automation efficiency" 
                          : "Room for automation improvement"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email, name, or document type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="identity">Identity Only</SelectItem>
                  <SelectItem value="phone">Phone Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Verification List */}
        <Card>
          <CardHeader>
            <CardTitle>Identity Verification Requests</CardTitle>
            <CardDescription>
              Click on any verification to review details and make decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredVerifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No verification requests found</p>
                <p className="text-sm">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVerifications.map((verification) => (
                  <Link 
                    key={verification.id} 
                    href={`/admin/verification/identity/${verification.id}`}
                  >
                    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{verification.user.name}</h3>
                              <VerificationBadge 
                                verificationLevel={verification.user.verificationLevel}
                                size="sm"
                              />
                              {getPriorityBadge(verification)}
                            </div>
                            <p className="text-sm text-muted-foreground">{verification.user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {verification.documentType.replace('_', ' ')}
                              </Badge>
                              {verification.documentCountry && (
                                <Badge variant="outline" className="text-xs">
                                  {verification.documentCountry}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Submitted {new Date(verification.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(verification.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                          
                          {getStatusBadge(verification.status)}
                          
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
