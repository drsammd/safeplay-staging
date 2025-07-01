
// Mock AWS service responses for testing

// Mock AWS Rekognition responses
export const mockDetectFacesResponse = {
  FaceDetails: [
    {
      BoundingBox: {
        Width: 0.5,
        Height: 0.5,
        Left: 0.25,
        Top: 0.25,
      },
      Confidence: 99.5,
      AgeRange: {
        Low: 8,
        High: 12,
      },
      Gender: {
        Value: 'Male',
        Confidence: 95.0,
      },
      Emotions: [
        {
          Type: 'HAPPY',
          Confidence: 98.5,
        },
      ],
    },
  ],
}

export const mockSearchFacesByImageResponse = {
  FaceMatches: [
    {
      Face: {
        FaceId: 'test-face-id-123',
        BoundingBox: {
          Width: 0.5,
          Height: 0.5,
          Left: 0.25,
          Top: 0.25,
        },
        ImageId: 'test-image-id-123',
        ExternalImageId: 'child-123',
        Confidence: 99.8,
      },
      Similarity: 98.5,
    },
  ],
  SearchedFaceBoundingBox: {
    Width: 0.5,
    Height: 0.5,
    Left: 0.25,
    Top: 0.25,
  },
}

export const mockIndexFacesResponse = {
  FaceRecords: [
    {
      Face: {
        FaceId: 'new-face-id-456',
        BoundingBox: {
          Width: 0.5,
          Height: 0.5,
          Left: 0.25,
          Top: 0.25,
        },
        ImageId: 'new-image-id-456',
        ExternalImageId: 'child-456',
        Confidence: 99.9,
      },
      FaceDetail: {
        BoundingBox: {
          Width: 0.5,
          Height: 0.5,
          Left: 0.25,
          Top: 0.25,
        },
        Confidence: 99.9,
      },
    },
  ],
}

// Mock S3 responses
export const mockS3PutObjectResponse = {
  ETag: '"test-etag-123"',
  Location: 'https://test-bucket.s3.amazonaws.com/test-key',
}

export const mockS3GetObjectResponse = {
  Body: new Uint8Array([1, 2, 3, 4, 5]),
  ContentType: 'image/jpeg',
  ContentLength: 1024,
}

// AWS Service Mock Factory
export const createAWSServiceMock = () => ({
  rekognition: {
    detectFaces: jest.fn().mockResolvedValue(mockDetectFacesResponse),
    searchFacesByImage: jest.fn().mockResolvedValue(mockSearchFacesByImageResponse),
    indexFaces: jest.fn().mockResolvedValue(mockIndexFacesResponse),
  },
  s3: {
    putObject: jest.fn().mockResolvedValue(mockS3PutObjectResponse),
    getObject: jest.fn().mockResolvedValue(mockS3GetObjectResponse),
    deleteObject: jest.fn().mockResolvedValue({}),
    getSignedUrl: jest.fn().mockResolvedValue('https://test-bucket.s3.amazonaws.com/signed-url'),
  },
})
