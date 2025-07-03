
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  User, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Camera,
  Flag,
  Calendar,
  MapPin,
  Shield,
  Eye,
  Download
} from "lucide-react";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import Image from "next/image";

interface IdentityVerification {
  id: string;
  verificationType: string;
  status: string;
  documentType: string;
  documentNumber?: string;
  documentCountry?: string;
  documentState?: string;
  documentExpiryDate?: string;
  documentImages: string[];
  selfieImageUrl?: string;
  verificationMethod: string;
  confidence?: number;
  verificationNotes?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  verifiedAt?: string;
  expiresAt?: string;
  resubmissionAllowed: boolean;
  resubmissionCount: number;
  maxResubmissions: number;
  complianceFlags?: string[];
  fraudFlags?: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phoneVerified: boolean;
    identityVerified: boolean;
    twoFactorEnabled: boolean;
    verificationLevel: string;
    phone?: string;
    createdAt: string;
  };
}

interface VerificationHistory {
  id: string;
  previousLevel: string;
  newLevel: string;
  changeReason: string;
  changedBy?: string;
  createdAt: string;
}

export default function IdentityVerificationDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { data: session, status } = useSession();
  const [verification, setVerification] = useState<IdentityVerification | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedComplianceFlags, setSelectedComplianceFlags] = useState<string[]>([]);
  const [selectedFraudFlags, setSelectedFraudFlags] = useState<string[]>([]);
  const [expiryDate, setExpiryDate] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== 'COMPANY_ADMIN') {
      redirect("/unauthorized");
    }
    fetchVerificationDetails();
  }, [session, status, params.id]);

  const fetchVerificationDetails = async () => {
    try {
      setError('');
      const response = await fetch(`/api/admin/verification/identity/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setVerification(data.verification);
        setVerificationHistory(data.verificationHistory || []);
        setReviewNotes(data.verification.verificationNotes || '');
        setRejectionReason(data.verification.rejectionReason || '');
        setSelectedComplianceFlags(data.verification.complianceFlags || []);
        setSelectedFraudFlags(data.verification.fraudFlags || []);
        
        // Set default expiry to 2 years from now
        if (!data.verification.expiresAt) {
          const defaultExpiry = new Date();
          defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 2);
          setExpiryDate(defaultExpiry.toISOString().split('T')[0]);
        } else {
          setExpiryDate(new Date(data.verification.expiresAt).toISOString().split('T')[0]);
        }
      } else {
        setError(data.error || 'Failed to load verification details');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/verification/identity/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          notes: reviewNotes,
          complianceFlags: selectedComplianceFlags,
          fraudFlags: selectedFraudFlags,
          expiresAt: expiryDate
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Verification approved",
          description: "The identity verification has been approved successfully.",
        });
        fetchVerificationDetails(); // Refresh data
      } else {
        setError(data.error || 'Failed to approve verification');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/verification/identity/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          notes: reviewNotes,
          rejectionReason,
          complianceFlags: selectedComplianceFlags,
          fraudFlags: selectedFraudFlags
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Verification rejected",
          description: "The identity verification has been rejected.",
        });
        fetchVerificationDetails(); // Refresh data
      } else {
        setError(data.error || 'Failed to reject verification');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Under Review</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const complianceFlagOptions = [
    'Missing Information',
    'Document Quality Issues',
    'Expired Document',
    'Suspicious Activity',
    'Age Verification Required',
    'Address Mismatch',
    'Name Discrepancy',
    'Multiple Accounts Detected'
  ];

  const fraudFlagOptions = [
    'Document Tampering Suspected',
    'Fake Document Detected',
    'Identity Theft Risk',
    'Unusual Submission Pattern',
    'High Risk Country',
    'Blacklisted Document',
    'Machine Learning Flag',
    'Manual Review Required'
  ];

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'COMPANY_ADMIN') {
    return null; // Will redirect
  }

  if (!verification) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Verification not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/verification">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Identity Verification Review</h1>
            <p className="text-muted-foreground">
              Review and process identity verification for {verification.user.name}
            </p>
          </div>
          {getStatusBadge(verification.status)}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Document Review */}
          <div className="space-y-6">
            {/* Document Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Document Type</label>
                    <p className="text-sm text-muted-foreground">
                      {verification.documentType.replace('_', ' ')}
                    </p>
                  </div>
                  
                  {verification.documentNumber && (
                    <div>
                      <label className="text-sm font-medium">Document Number</label>
                      <p className="text-sm text-muted-foreground">{verification.documentNumber}</p>
                    </div>
                  )}

                  {verification.documentCountry && (
                    <div>
                      <label className="text-sm font-medium">Country</label>
                      <p className="text-sm text-muted-foreground">{verification.documentCountry}</p>
                    </div>
                  )}

                  {verification.documentState && (
                    <div>
                      <label className="text-sm font-medium">State</label>
                      <p className="text-sm text-muted-foreground">{verification.documentState}</p>
                    </div>
                  )}

                  {verification.documentExpiryDate && (
                    <div>
                      <label className="text-sm font-medium">Expiry Date</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(verification.documentExpiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Verification Type</label>
                    <p className="text-sm text-muted-foreground">{verification.verificationType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Document Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {verification.documentImages.map((imageUrl, index) => (
                    <div key={index} className="space-y-2">
                      <label className="text-sm font-medium">Document {index + 1}</label>
                      <div className="relative aspect-video rounded-lg overflow-hidden border bg-gray-100">
                        <Image
                          src={imageUrl}
                          alt={`Document ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Button size="sm" variant="secondary" asChild>
                            <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selfie Image */}
            {verification.selfieImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Selfie Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-64 mx-auto">
                    <div className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
                      <Image
                        src={verification.selfieImageUrl}
                        alt="Selfie"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Button size="sm" variant="secondary" asChild>
                          <a href={verification.selfieImageUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - User Info & Review */}
          <div className="space-y-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{verification.user.name}</h3>
                    <p className="text-sm text-muted-foreground">{verification.user.email}</p>
                  </div>
                  <VerificationBadge 
                    verificationLevel={verification.user.verificationLevel}
                    phoneVerified={verification.user.phoneVerified}
                    identityVerified={verification.user.identityVerified}
                    twoFactorEnabled={verification.user.twoFactorEnabled}
                    showDetails
                  />
                </div>

                <Separator />

                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <span className="font-medium">Role:</span>
                    <span className="ml-2 text-muted-foreground">{verification.user.role}</span>
                  </div>
                  
                  {verification.user.phone && (
                    <div>
                      <span className="font-medium">Phone:</span>
                      <span className="ml-2 text-muted-foreground">{verification.user.phone}</span>
                    </div>
                  )}

                  <div>
                    <span className="font-medium">Member Since:</span>
                    <span className="ml-2 text-muted-foreground">
                      {new Date(verification.user.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="font-medium">Submitted:</span>
                    <span className="ml-2 text-muted-foreground">
                      {new Date(verification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge variant={verification.user.phoneVerified ? "success" : "outline"}>
                    Phone {verification.user.phoneVerified ? "Verified" : "Unverified"}
                  </Badge>
                  <Badge variant={verification.user.twoFactorEnabled ? "success" : "outline"}>
                    2FA {verification.user.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Review Decision */}
            {['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(verification.status) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Review Decision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Review Notes</label>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add your review notes..."
                      className="min-h-20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Rejection Reason (if rejecting)</label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide specific reason for rejection..."
                      className="min-h-16"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Verification Expiry (if approving)</label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? 'Processing...' : 'Approve'}
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isProcessing || !rejectionReason.trim()}
                      className="flex-1"
                    >
                      {isProcessing ? 'Processing...' : 'Reject'}
                      <XCircle className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Status */}
            {!['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(verification.status) && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    {getStatusBadge(verification.status)}
                  </div>

                  {verification.reviewedAt && (
                    <div>
                      <span className="text-sm font-medium">Reviewed:</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {new Date(verification.reviewedAt).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {verification.verificationNotes && (
                    <div>
                      <span className="text-sm font-medium">Notes:</span>
                      <p className="text-sm text-muted-foreground mt-1">{verification.verificationNotes}</p>
                    </div>
                  )}

                  {verification.rejectionReason && (
                    <div>
                      <span className="text-sm font-medium">Rejection Reason:</span>
                      <p className="text-sm text-muted-foreground mt-1">{verification.rejectionReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Verification History */}
            {verificationHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Verification History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {verificationHistory.slice(0, 5).map((entry, index) => (
                      <div key={entry.id} className="flex items-start gap-3 text-sm">
                        <div className="p-1 bg-blue-100 rounded-full mt-1">
                          <Shield className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{entry.changeReason}</p>
                          <p className="text-muted-foreground">
                            {entry.previousLevel} → {entry.newLevel}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
