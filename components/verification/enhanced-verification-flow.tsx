
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddressAutocomplete } from './address-autocomplete';
import { SelfieCapture } from './selfie-capture';
import { 
  FileText, 
  MapPin, 
  Camera, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Zap,
  TrendingUp,
  User,
  Home,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface AddressValidationResult {
  isValid: boolean;
  confidence: number;
  standardizedAddress?: any;
  originalInput: string;
  suggestions?: any[];
  error?: string;
}

interface EnhancedVerificationResult {
  success: boolean;
  verificationId: string;
  autoApproved: boolean;
  autoRejected: boolean;
  requiresManualReview: boolean;
  confidence: number;
  reason: string;
  overallVerificationScore?: number;
  scoringBreakdown?: {
    documentScore: number;
    addressScore: number;
    photoScore: number;
  };
  addressComparison?: {
    matchScore: number;
    isMatch: boolean;
    differences: string[];
  };
  faceComparison?: {
    similarity: number;
    isMatch: boolean;
    qualityScore: number;
  };
  recommendations?: string[];
  riskFactors?: string[];
}

interface EnhancedVerificationFlowProps {
  onComplete?: (result: EnhancedVerificationResult) => void;
  className?: string;
}

export function EnhancedVerificationFlow({ onComplete, className = "" }: EnhancedVerificationFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<EnhancedVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [documentType, setDocumentType] = useState<string>('');
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [userAddress, setUserAddress] = useState<string>('');
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [riskTolerance, setRiskTolerance] = useState<string>('MEDIUM');

  const steps = [
    { id: 1, title: 'Document Upload', icon: FileText, description: 'Upload your ID document' },
    { id: 2, title: 'Address Verification', icon: MapPin, description: 'Verify your address' },
    { id: 3, title: 'Photo Verification', icon: Camera, description: 'Take a verification selfie' },
    { id: 4, title: 'Review & Submit', icon: Shield, description: 'Review and submit verification' }
  ];

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 2:
        return documentType && documentFiles.length > 0;
      case 3:
        return userAddress && addressValidation?.isValid;
      case 4:
        return selfieBlob;
      default:
        return true;
    }
  };

  const handleDocumentUpload = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setDocumentFiles(fileArray);
    }
  };

  const handleSubmitVerification = async () => {
    if (!documentFiles.length || !selfieBlob || !userAddress || !documentType) {
      setError('Please complete all required steps');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('userAddress', userAddress);
      formData.append('riskTolerance', riskTolerance);
      formData.append('metadata', JSON.stringify({
        addressValidation,
        submittedAt: new Date().toISOString()
      }));

      // Add document images
      documentFiles.forEach((file, index) => {
        formData.append('documentImages', file);
      });

      // Add selfie
      formData.append('selfieImage', selfieBlob, 'selfie.jpg');

      const response = await fetch('/api/verification/identity/enhanced', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setVerificationResult(result);
        setCurrentStep(5); // Results step
        onComplete?.(result);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('An error occurred during verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Upload
              </CardTitle>
              <CardDescription>
                Upload a clear photo of your government-issued ID (driver's license, passport, or state ID)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                    <SelectItem value="NATIONAL_ID">State ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="documentFiles">Document Images</Label>
                <Input
                  id="documentFiles"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleDocumentUpload(e.target.files)}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload both front and back if applicable. Max 10MB per file.
                </p>
              </div>

              {documentFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded files:</p>
                  {documentFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Verification
              </CardTitle>
              <CardDescription>
                Enter your current address. This will be compared with the address on your ID document.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddressAutocomplete
                value={userAddress}
                onChange={setUserAddress}
                onValidationChange={setAddressValidation}
                placeholder="Enter your full address"
                required
                countryRestriction={['us', 'ca']}
              />
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <SelfieCapture
            onCapture={setSelfieBlob}
            onQualityCheck={(quality) => {
              console.log('Selfie quality:', quality);
            }}
          />
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Review & Submit
              </CardTitle>
              <CardDescription>
                Review your information before submitting for enhanced verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Document Review */}
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document Information
                </h3>
                <div className="pl-6 space-y-1">
                  <p className="text-sm"><strong>Type:</strong> {documentType}</p>
                  <p className="text-sm"><strong>Files:</strong> {documentFiles.length} uploaded</p>
                </div>
              </div>

              {/* Address Review */}
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Address Information
                </h3>
                <div className="pl-6 space-y-1">
                  <p className="text-sm"><strong>Address:</strong> {userAddress}</p>
                  {addressValidation && (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={addressValidation.isValid ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {addressValidation.isValid ? 'Verified' : 'Unverified'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Confidence: {Math.round(addressValidation.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Review */}
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Photo Verification
                </h3>
                <div className="pl-6">
                  <p className="text-sm">
                    <strong>Selfie:</strong> {selfieBlob ? 'Captured' : 'Not captured'}
                  </p>
                </div>
              </div>

              {/* Risk Tolerance */}
              <div className="space-y-2">
                <Label htmlFor="riskTolerance">Verification Strictness</Label>
                <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">Standard (Recommended)</SelectItem>
                    <SelectItem value="MEDIUM">Balanced</SelectItem>
                    <SelectItem value="LOW">Strict</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Strict verification provides higher security but may require manual review more often
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        );

      case 5:
        return verificationResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {verificationResult.autoApproved ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : verificationResult.autoRejected ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Clock className="h-5 w-5 text-orange-500" />
                )}
                Verification Results
              </CardTitle>
              <CardDescription>
                {verificationResult.autoApproved && 'Your identity has been automatically verified!'}
                {verificationResult.autoRejected && 'Verification could not be completed automatically.'}
                {verificationResult.requiresManualReview && 'Your verification is under manual review.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Score */}
              {verificationResult.overallVerificationScore !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Overall Verification Score</span>
                    <span className="text-lg font-bold">
                      {Math.round(verificationResult.overallVerificationScore * 100)}%
                    </span>
                  </div>
                  <Progress value={verificationResult.overallVerificationScore * 100} />
                </div>
              )}

              {/* Score Breakdown */}
              {verificationResult.scoringBreakdown && (
                <div className="space-y-4">
                  <h3 className="font-medium">Score Breakdown</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">Document Verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={verificationResult.scoringBreakdown.documentScore * 100} 
                          className="w-20"
                        />
                        <span className="text-sm font-medium w-12">
                          {Math.round(verificationResult.scoringBreakdown.documentScore * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">Address Verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={verificationResult.scoringBreakdown.addressScore * 100} 
                          className="w-20"
                        />
                        <span className="text-sm font-medium w-12">
                          {Math.round(verificationResult.scoringBreakdown.addressScore * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        <span className="text-sm">Photo Verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={verificationResult.scoringBreakdown.photoScore * 100} 
                          className="w-20"
                        />
                        <span className="text-sm font-medium w-12">
                          {Math.round(verificationResult.scoringBreakdown.photoScore * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Results */}
              <Tabs defaultValue="address" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="address">Address Match</TabsTrigger>
                  <TabsTrigger value="photo">Photo Match</TabsTrigger>
                </TabsList>
                
                <TabsContent value="address" className="space-y-4">
                  {verificationResult.addressComparison && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Address Match Score</span>
                        <Badge variant={verificationResult.addressComparison.isMatch ? "default" : "destructive"}>
                          {Math.round(verificationResult.addressComparison.matchScore * 100)}%
                        </Badge>
                      </div>
                      
                      {verificationResult.addressComparison.differences.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Differences found:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {verificationResult.addressComparison.differences.map((diff, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                {diff}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="photo" className="space-y-4">
                  {verificationResult.faceComparison && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Face Similarity</span>
                        <Badge variant={verificationResult.faceComparison.isMatch ? "default" : "destructive"}>
                          {Math.round(verificationResult.faceComparison.similarity)}%
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Image Quality</span>
                        <span className="text-sm font-medium">
                          {Math.round(verificationResult.faceComparison.qualityScore * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Recommendations */}
              {verificationResult.recommendations && verificationResult.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Recommendations</h3>
                  <ul className="text-sm space-y-1">
                    {verificationResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Factors */}
              {verificationResult.riskFactors && verificationResult.riskFactors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Risk Factors</h3>
                  <ul className="text-sm space-y-1">
                    {verificationResult.riskFactors.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (currentStep === 5 && verificationResult) {
    return (
      <div className={className}>
        {renderStepContent()}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.slice(0, 4).map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                <step.icon className="h-5 w-5" />
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 w-24 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            {steps.find(step => step.id === currentStep)?.title}
          </h2>
          <p className="text-gray-600">
            {steps.find(step => step.id === currentStep)?.description}
          </p>
        </div>
      </div>

      {/* Step content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 1}
        >
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceedToStep(currentStep + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmitVerification}
            disabled={isSubmitting || !canProceedToStep(4)}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Submit Verification
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
