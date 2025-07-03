

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Camera, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { DocumentType } from '@prisma/client';

interface AutomatedIdentityVerificationProps {
  onVerificationComplete?: (result: any) => void;
}

interface VerificationResult {
  success: boolean;
  verificationId?: string;
  autoApproved: boolean;
  autoRejected: boolean;
  requiresManualReview: boolean;
  confidence: number;
  reason: string;
  error?: string;
}

const DOCUMENT_TYPES = [
  { value: 'DRIVERS_LICENSE', label: "Driver's License" },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'STATE_ID', label: 'State ID' }
];

export default function AutomatedIdentityVerification({ onVerificationComplete }: AutomatedIdentityVerificationProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      setError(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
  };

  const submitVerification = async () => {
    if (!documentType || selectedFiles.length === 0) {
      setError('Please select a document type and upload at least one image');
      return;
    }

    setStep('processing');
    setError(null);
    simulateProgress();

    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('metadata', JSON.stringify({
        uploadedAt: new Date().toISOString(),
        userAgent: navigator.userAgent
      }));

      selectedFiles.forEach((file, index) => {
        formData.append('documentImages', file);
      });

      const response = await fetch('/api/verification/identity/automated', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setProgress(100);

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setResult(data);
      setStep('result');
      onVerificationComplete?.(data);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      setStep('upload');
      setProgress(0);
    }
  };

  const getStatusIcon = () => {
    if (!result) return null;
    
    if (result.autoApproved) {
      return <CheckCircle className="h-12 w-12 text-green-500" />;
    } else if (result.autoRejected) {
      return <XCircle className="h-12 w-12 text-red-500" />;
    } else if (result.requiresManualReview) {
      return <Clock className="h-12 w-12 text-yellow-500" />;
    }
    return <AlertTriangle className="h-12 w-12 text-orange-500" />;
  };

  const getStatusMessage = () => {
    if (!result) return '';
    
    if (result.autoApproved) {
      return 'Identity verification completed successfully! Your document has been automatically approved.';
    } else if (result.autoRejected) {
      return 'Identity verification was rejected. Please check your document and try again.';
    } else if (result.requiresManualReview) {
      return 'Your document is under manual review. You will be notified once the review is complete.';
    }
    return 'Verification processing completed.';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (step === 'upload') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Automated Identity Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Upload Document Images
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-xs text-gray-500">
              Supported formats: JPG, PNG, HEIC (max 10MB per file)
            </p>
          </div>

          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Files:</p>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">AI-Powered Verification</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Automatic document analysis using AWS Textract</li>
                <li>• Real-time authenticity and fraud detection</li>
                <li>• Instant approval for high-confidence documents</li>
                <li>• Manual review only when needed</li>
              </ul>
            </div>
            
            <Button
              onClick={submitVerification}
              disabled={!documentType || selectedFiles.length === 0}
              className="w-full"
            >
              Start Verification
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'processing') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Processing Your Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-4">
              Our AI is analyzing your document for authenticity and extracting information...
            </p>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}% complete</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Document upload</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Text extraction</span>
              {progress > 30 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full animate-spin border-t-blue-600"></div>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Authenticity analysis</span>
              {progress > 60 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Fraud detection</span>
              {progress > 85 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Verification Complete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold mt-4 mb-2">
            {result?.autoApproved && 'Automatically Approved'}
            {result?.autoRejected && 'Automatically Rejected'}
            {result?.requiresManualReview && 'Under Manual Review'}
          </h3>
          <p className="text-gray-600">{getStatusMessage()}</p>
        </div>

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Confidence Score</p>
                <p className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                  {(result.confidence * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Status</p>
                <Badge
                  variant={result.autoApproved ? 'default' : result.autoRejected ? 'destructive' : 'secondary'}
                  className="mt-1"
                >
                  {result.autoApproved && 'Approved'}
                  {result.autoRejected && 'Rejected'}
                  {result.requiresManualReview && 'Manual Review'}
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Analysis Result</p>
              <p className="text-sm text-gray-900">{result.reason}</p>
            </div>

            {result.verificationId && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Verification ID</p>
                <p className="text-xs font-mono text-blue-800">{result.verificationId}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setStep('upload');
              setSelectedFiles([]);
              setDocumentType('');
              setResult(null);
              setError(null);
              setProgress(0);
            }}
            className="flex-1"
          >
            Upload Another Document
          </Button>
          {result?.autoApproved && (
            <Button onClick={() => window.location.reload()} className="flex-1">
              Continue
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

