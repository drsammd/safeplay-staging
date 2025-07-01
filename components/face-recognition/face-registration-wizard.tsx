
"use client";

import { useState, useCallback } from "react";
import { Upload, Check, AlertCircle, Camera, User, Shield } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  faceRecognitionEnabled: boolean;
  faceRecognitionConsent: boolean;
}

interface FaceRegistrationWizardProps {
  child: Child;
  onComplete: () => void;
  onCancel: () => void;
}

interface DetectedFace {
  id: string;
  boundingBox: {
    Width: number;
    Height: number;
    Left: number;
    Top: number;
  };
  confidence: number;
}

interface UploadedImage {
  file: File;
  preview: string;
  faces: DetectedFace[];
  isProcessing: boolean;
  error?: string;
}

export default function FaceRegistrationWizard({
  child,
  onComplete,
  onCancel,
}: FaceRegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [consent, setConsent] = useState(child.faceRecognitionConsent);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCollection, setHasCollection] = useState(false);

  const steps = [
    { number: 1, title: "Consent & Setup", description: "Privacy and consent information" },
    { number: 2, title: "Upload Photos", description: "Add photos of your child" },
    { number: 3, title: "Review & Confirm", description: "Review and complete setup" },
  ];

  // Handle consent and collection creation
  const handleConsentNext = async () => {
    if (!consent) {
      alert("Parental consent is required to proceed with face recognition setup.");
      return;
    }

    try {
      // Create face collection if it doesn't exist
      const response = await fetch('/api/faces/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: child.id,
          consent: true,
        }),
      });

      if (response.ok) {
        setHasCollection(true);
        setCurrentStep(2);
      } else {
        const error = await response.json();
        if (response.status === 409) {
          // Collection already exists
          setHasCollection(true);
          setCurrentStep(2);
        } else {
          alert(error.error || 'Failed to setup face recognition');
        }
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to setup face recognition. Please try again.');
    }
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const preview = URL.createObjectURL(file);
      const newImage: UploadedImage = {
        file,
        preview,
        faces: [],
        isProcessing: true,
      };

      setUploadedImages(prev => [...prev, newImage]);

      // Detect faces in the uploaded image
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('analyzeDetails', 'true');

        const response = await fetch('/api/faces/detect', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          
          setUploadedImages(prev => prev.map(img => 
            img.preview === preview 
              ? { ...img, faces: result.faces || [], isProcessing: false }
              : img
          ));
        } else {
          const error = await response.json();
          setUploadedImages(prev => prev.map(img => 
            img.preview === preview 
              ? { ...img, isProcessing: false, error: error.error }
              : img
          ));
        }
      } catch (error) {
        console.error('Face detection error:', error);
        setUploadedImages(prev => prev.map(img => 
          img.preview === preview 
            ? { ...img, isProcessing: false, error: 'Face detection failed' }
            : img
        ));
      }
    }
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Remove uploaded image
  const removeImage = (preview: string) => {
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.preview !== preview);
      URL.revokeObjectURL(preview);
      return updated;
    });
  };

  // Register faces
  const handleRegistration = async () => {
    setIsSubmitting(true);

    try {
      const validImages = uploadedImages.filter(img => 
        img.faces.length > 0 && !img.error && !img.isProcessing
      );

      if (validImages.length === 0) {
        alert('Please upload at least one image with a detectable face.');
        setIsSubmitting(false);
        return;
      }

      const registrationPromises = validImages.map(async (image) => {
        const formData = new FormData();
        formData.append('image', image.file);
        formData.append('childId', child.id);
        formData.append('notes', notes);

        const response = await fetch('/api/faces/register', {
          method: 'POST',
          body: formData,
        });

        return response.json();
      });

      const results = await Promise.all(registrationPromises);
      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);

      if (successful.length > 0) {
        if (failed.length > 0) {
          alert(`${successful.length} faces registered successfully. ${failed.length} failed.`);
        }
        onComplete();
      } else {
        alert('Failed to register faces. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Face registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Face Recognition Setup</h3>
              <p className="text-gray-600">
                Enable facial recognition for {child.firstName} to enhance safety and 
                automatically identify them in venue photos.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Privacy & Security</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Face data is securely stored using AWS encryption</li>
                <li>• Only authorized venue staff can access recognition features</li>
                <li>• You can disable or delete face data at any time</li>
                <li>• Face recognition helps quickly locate your child in emergencies</li>
              </ul>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="consent" className="text-sm font-medium cursor-pointer">
                  I give my explicit consent to collect and process facial recognition data 
                  for my child {child.firstName} {child.lastName} for safety and identification purposes.
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  This consent can be withdrawn at any time through your child's profile settings.
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleConsentNext} disabled={!consent}>
                Continue
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Camera className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Photos</h3>
              <p className="text-gray-600">
                Upload 2-5 clear photos of {child.firstName}'s face for the best recognition accuracy.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Photo Guidelines</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Use clear, well-lit, front-facing photos</li>
                <li>• Avoid sunglasses, hats, or face coverings</li>
                <li>• Include photos from different angles (slight variations)</li>
                <li>• Ensure the face takes up most of the photo</li>
                <li>• Use recent photos (within the last 6 months)</li>
              </ul>
            </div>

            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop photos here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG (max 15MB each)
              </p>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
            </div>

            {/* Uploaded Images */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedImages.map((image, index) => (
                  <Card key={index} className="p-4">
                    <div className="relative">
                      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={image.preview}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        
                        {/* Face Detection Overlay */}
                        {image.faces.map((face, faceIndex) => (
                          <div
                            key={faceIndex}
                            className="absolute border-2 border-green-400 bg-green-400 bg-opacity-20"
                            style={{
                              left: `${face.boundingBox.Left * 100}%`,
                              top: `${face.boundingBox.Top * 100}%`,
                              width: `${face.boundingBox.Width * 100}%`,
                              height: `${face.boundingBox.Height * 100}%`,
                            }}
                          >
                            <Badge className="absolute -top-6 left-0 bg-green-500">
                              {face.confidence.toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2"
                        onClick={() => removeImage(image.preview)}
                      >
                        ×
                      </Button>
                    </div>

                    <div className="mt-3">
                      {image.isProcessing ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          <span className="text-sm text-gray-600">Detecting faces...</span>
                        </div>
                      ) : image.error ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {image.error}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {image.faces.length} face(s) detected
                          </span>
                          {image.faces.length > 0 && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes about these photos..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)}
                disabled={uploadedImages.filter(img => img.faces.length > 0 && !img.error).length === 0}
              >
                Review
              </Button>
            </div>
          </div>
        );

      case 3:
        const validImages = uploadedImages.filter(img => img.faces.length > 0 && !img.error);
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="h-16 w-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Review & Confirm</h3>
              <p className="text-gray-600">
                Review the photos and face detection results before completing the setup.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Setup Summary</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Child: {child.firstName} {child.lastName}</li>
                <li>• Photos to register: {validImages.length}</li>
                <li>• Total faces detected: {validImages.reduce((sum, img) => sum + img.faces.length, 0)}</li>
                <li>• Face recognition will be enabled after registration</li>
              </ul>
            </div>

            {/* Image Review */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {validImages.map((image, index) => (
                <div key={index} className="relative">
                  <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={image.preview}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-green-500">
                      {image.faces.length} face(s)
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                By proceeding, you confirm that you have the right to upload these photos 
                and consent to facial recognition processing for safety purposes.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back to Photos
              </Button>
              <Button 
                onClick={handleRegistration}
                disabled={isSubmitting || validImages.length === 0}
              >
                {isSubmitting ? 'Registering...' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex items-center ${
                step.number < steps.length ? 'flex-1' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.number
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {step.number < steps.length && (
                <div className="flex-1 h-px bg-gray-300 mx-4"></div>
              )}
            </div>
          ))}
        </div>
        <Progress value={(currentStep / steps.length) * 100} className="w-full" />
      </div>

      {/* Step Content */}
      <Card className="p-8">
        {renderStep()}
      </Card>
    </div>
  );
}
