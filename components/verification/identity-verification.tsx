
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Upload, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  X,
  Eye
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

interface IdentityVerificationProps {
  isVerified?: boolean;
  verificationStatus?: string;
  onVerificationSubmitted?: () => void;
}

const documentTypes = [
  { value: 'DRIVERS_LICENSE', label: "Driver's License" },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'NATIONAL_ID', label: 'National ID Card' },
  { value: 'STATE_ID', label: 'State ID' },
  { value: 'MILITARY_ID', label: 'Military ID' },
  { value: 'OTHER', label: 'Other Government ID' }
];

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'OTHER', label: 'Other' }
];

export function IdentityVerification({ 
  isVerified = false, 
  verificationStatus,
  onVerificationSubmitted 
}: IdentityVerificationProps) {
  const [formData, setFormData] = useState({
    documentType: '',
    documentNumber: '',
    documentCountry: '',
    documentState: '',
    documentExpiryDate: ''
  });
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);
  
  const documentInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload only image files');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Each file must be less than 10MB');
        return;
      }
    }

    setDocumentFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
    setError('');
  };

  const handleSelfieFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload only image files');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be less than 10MB');
      return;
    }

    setSelfieFile(file);
    setSelfiePreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const removeDocumentFile = (index: number) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      // Clean up the removed URL
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
  };

  const removeSelfieFile = () => {
    setSelfieFile(null);
    if (selfiePreviewUrl) {
      URL.revokeObjectURL(selfiePreviewUrl);
      setSelfiePreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.documentType) {
      setError('Please select a document type');
      return;
    }
    if (documentFiles.length === 0) {
      setError('Please upload at least one document image');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const submitFormData = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          submitFormData.append(key, value);
        }
      });

      // Add document files
      documentFiles.forEach(file => {
        submitFormData.append('documentImages', file);
      });

      // Add selfie if provided
      if (selfieFile) {
        submitFormData.append('selfieImage', selfieFile);
      }

      const response = await fetch('/api/verification/identity/upload', {
        method: 'POST',
        body: submitFormData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Documents uploaded successfully",
          description: "Your identity verification is now under review.",
        });
        onVerificationSubmitted?.();
        
        // Reset form
        setFormData({
          documentType: '',
          documentNumber: '',
          documentCountry: '',
          documentState: '',
          documentExpiryDate: ''
        });
        setDocumentFiles([]);
        setSelfieFile(null);
        setPreviewUrls([]);
        setSelfiePreviewUrl(null);
      } else {
        setError(data.error || 'Failed to upload documents');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'APPROVED':
        return (
          <Badge variant="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'PENDING':
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (isVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Identity Verification
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Your identity has been verified and your account is secured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              Identity verification completed
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Identity Verification
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Upload a government-issued ID to verify your identity and unlock enhanced security features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Document Type Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Document Type *
          </label>
          <Select
            value={formData.documentType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your document type" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Document Number
            </label>
            <Input
              value={formData.documentNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
              placeholder="Enter document number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Country of Issue
            </label>
            <Select
              value={formData.documentCountry}
              onValueChange={(value) => setFormData(prev => ({ ...prev, documentCountry: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.documentCountry === 'US' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                State
              </label>
              <Input
                value={formData.documentState}
                onChange={(e) => setFormData(prev => ({ ...prev, documentState: e.target.value }))}
                placeholder="Enter state"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Expiry Date
            </label>
            <Input
              type="date"
              value={formData.documentExpiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, documentExpiryDate: e.target.value }))}
            />
          </div>
        </div>

        {/* Document Upload */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Document Images *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Upload clear photos of your document (front and back if applicable)
              </p>
              <Button
                variant="outline"
                onClick={() => documentInputRef.current?.click()}
                disabled={isLoading}
              >
                Choose Files
              </Button>
              <input
                ref={documentInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleDocumentFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Document Previews */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-video relative rounded-lg overflow-hidden border">
                    <Image
                      src={url}
                      alt={`Document ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeDocumentFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selfie Upload */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Selfie (Optional but Recommended)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Take a selfie for enhanced verification
              </p>
              <Button
                variant="outline"
                onClick={() => selfieInputRef.current?.click()}
                disabled={isLoading}
              >
                Take/Upload Selfie
              </Button>
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleSelfieFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Selfie Preview */}
          {selfiePreviewUrl && (
            <div className="relative group w-48 mx-auto">
              <div className="aspect-square relative rounded-lg overflow-hidden border">
                <Image
                  src={selfiePreviewUrl}
                  alt="Selfie"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={removeSelfieFile}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Important Notice */}
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Make sure your documents are clear, well-lit, and all text is readable. 
            Blurry or unclear images may cause verification delays.
          </AlertDescription>
        </Alert>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || !formData.documentType || documentFiles.length === 0}
          className="w-full"
        >
          {isLoading ? 'Uploading...' : 'Submit for Verification'}
        </Button>
      </CardContent>
    </Card>
  );
}
