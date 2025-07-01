
"use client";

import { useState } from "react";
import { Users, Search, Clock, AlertCircle, Check, Eye, Star } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface FaceMatch {
  childId: string;
  childName: string;
  faceId: string;
  similarity: number;
  confidence: number;
  boundingBox: {
    Width: number;
    Height: number;
    Left: number;
    Top: number;
  };
  registeredImage: string;
  registeredAt: string;
}

interface UnmatchedFace {
  id: string;
  boundingBox: {
    Width: number;
    Height: number;
    Left: number;
    Top: number;
  };
  confidence: number;
}

interface FaceRecognitionResultsProps {
  sourceImageUrl: string;
  matches: FaceMatch[];
  unmatched: UnmatchedFace[];
  summary: {
    totalMatches: number;
    bestMatch: FaceMatch | null;
    collectionsSearched: number;
    facesDetected: number;
  };
  isLoading?: boolean;
  onRetry?: () => void;
}

export default function FaceRecognitionResults({
  sourceImageUrl,
  matches,
  unmatched,
  summary,
  isLoading = false,
  onRetry,
}: FaceRecognitionResultsProps) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<FaceMatch | null>(null);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return "text-green-600";
    if (confidence >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBadgeVariant = (confidence: number): "default" | "secondary" | "destructive" => {
    if (confidence >= 95) return "default";
    if (confidence >= 80) return "secondary";
    return "destructive";
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h3 className="text-lg font-medium mb-2">Processing Face Recognition</h3>
        <p className="text-gray-600">
          Analyzing faces and searching registered collections...
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Search className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-semibold">Face Recognition Results</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOverlay(!showOverlay)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showOverlay ? 'Hide' : 'Show'} Overlay
          </Button>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {summary.facesDetected}
          </div>
          <div className="text-sm text-gray-600">Faces Detected</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {summary.totalMatches}
          </div>
          <div className="text-sm text-gray-600">Matches Found</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {summary.collectionsSearched}
          </div>
          <div className="text-sm text-gray-600">Collections Searched</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {unmatched.length}
          </div>
          <div className="text-sm text-gray-600">Unmatched Faces</div>
        </Card>
      </div>

      {/* Source Image with Overlays */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Source Image Analysis</h3>
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={sourceImageUrl}
            alt="Source image for face recognition"
            fill
            className="object-contain"
          />
          
          {showOverlay && (
            <>
              {/* Matched Faces */}
              {matches.map((match, index) => (
                <div
                  key={match.faceId}
                  className="absolute border-2 border-green-400 bg-green-400 bg-opacity-20 cursor-pointer hover:bg-opacity-30 transition-opacity"
                  style={{
                    left: `${match.boundingBox.Left * 100}%`,
                    top: `${match.boundingBox.Top * 100}%`,
                    width: `${match.boundingBox.Width * 100}%`,
                    height: `${match.boundingBox.Height * 100}%`,
                  }}
                  onClick={() => setSelectedMatch(match)}
                >
                  <Badge className="absolute -top-6 left-0 bg-green-500">
                    {match.childName} - {match.similarity.toFixed(1)}%
                  </Badge>
                </div>
              ))}

              {/* Unmatched Faces */}
              {unmatched.map((face, index) => (
                <div
                  key={face.id}
                  className="absolute border-2 border-yellow-400 bg-yellow-400 bg-opacity-20"
                  style={{
                    left: `${face.boundingBox.Left * 100}%`,
                    top: `${face.boundingBox.Top * 100}%`,
                    width: `${face.boundingBox.Width * 100}%`,
                    height: `${face.boundingBox.Height * 100}%`,
                  }}
                >
                  <Badge className="absolute -top-6 left-0 bg-yellow-500">
                    Unmatched
                  </Badge>
                </div>
              ))}
            </>
          )}
        </div>
      </Card>

      {/* Best Match Highlight */}
      {summary.bestMatch && (
        <Alert>
          <Star className="h-4 w-4" />
          <AlertDescription>
            <strong>Best Match:</strong> {summary.bestMatch.childName} with {summary.bestMatch.similarity.toFixed(1)}% similarity
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Match Results */}
      {matches.length > 0 ? (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Matched Children ({matches.length})
          </h3>
          <div className="space-y-4">
            {matches.map((match, index) => (
              <div
                key={match.faceId}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedMatch?.faceId === match.faceId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMatch(match)}
              >
                <div className="flex items-center space-x-4">
                  {/* Registered Image */}
                  <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={match.registeredImage}
                      alt={`${match.childName} registered photo`}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Match Details */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-lg">{match.childName}</h4>
                      <div className="flex items-center space-x-2">
                        {index === 0 && (
                          <Badge variant="outline" className="text-yellow-600">
                            <Star className="h-3 w-3 mr-1" />
                            Best Match
                          </Badge>
                        )}
                        <Badge variant={getConfidenceBadgeVariant(match.similarity)}>
                          {match.similarity.toFixed(1)}% similarity
                        </Badge>
                      </div>
                    </div>

                    {/* Match Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Face Confidence:</span>
                        <span className={`ml-2 font-medium ${getConfidenceColor(match.confidence)}`}>
                          {match.confidence.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Registered:</span>
                        <span className="ml-2">
                          {new Date(match.registeredAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Similarity Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Similarity Score</span>
                        <span>{match.similarity.toFixed(1)}%</span>
                      </div>
                      <Progress value={match.similarity} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No matching faces found in the registered collections. 
            {unmatched.length > 0 && ` Detected ${unmatched.length} unmatched face(s).`}
          </AlertDescription>
        </Alert>
      )}

      {/* Unmatched Faces */}
      {unmatched.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
            Unmatched Faces ({unmatched.length})
          </h3>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Found {unmatched.length} face(s) that do not match any registered children. 
              These may be adults, staff members, or children who are not registered in the system.
            </AlertDescription>
          </Alert>
        </Card>
      )}

      {/* Processing Info */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          Face recognition completed • {summary.collectionsSearched} collections searched • 
          {summary.facesDetected} faces analyzed
        </div>
      </Card>
    </div>
  );
}
