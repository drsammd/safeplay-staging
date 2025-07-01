
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, AWS_CONFIG } from './config';
import { ImageUploadResult, ImageValidationResult } from './types';
import { v4 as uuidv4 } from 'uuid';

export class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = s3Client;
    this.bucket = AWS_CONFIG.s3Bucket;
  }

  /**
   * Validate image file before upload
   */
  validateImage(file: File): ImageValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > AWS_CONFIG.maxImageSize) {
      errors.push(`File size exceeds ${AWS_CONFIG.maxImageSize / (1024 * 1024)}MB limit`);
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !AWS_CONFIG.supportedImageFormats.includes(fileExtension)) {
      errors.push(`Unsupported file format. Supported formats: ${AWS_CONFIG.supportedImageFormats.join(', ')}`);
    }

    // Check MIME type
    if (!file.type.startsWith('image/')) {
      errors.push('File must be an image');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Upload image to S3
   */
  async uploadImage(
    file: File | Buffer, 
    childId: string, 
    fileName?: string
  ): Promise<ImageUploadResult> {
    try {
      // Generate unique key
      const timestamp = Date.now();
      const uuid = uuidv4();
      const extension = fileName ? fileName.split('.').pop() : 'jpg';
      const key = `faces/${childId}/${timestamp}-${uuid}.${extension}`;

      // Prepare upload parameters
      const uploadParams = {
        Bucket: this.bucket,
        Key: key,
        Body: file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file,
        ContentType: file instanceof File ? file.type : 'image/jpeg',
        Metadata: {
          childId,
          uploadedAt: new Date().toISOString(),
        },
      };

      // Upload to S3
      const command = new PutObjectCommand(uploadParams);
      await this.client.send(command);

      // Generate public URL
      const imageUrl = `https://${this.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`;

      return {
        success: true,
        imageUrl,
        imageKey: key,
        bucket: this.bucket,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Get presigned URL for secure image access
   */
  async getPresignedUrl(imageKey: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: imageKey,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Delete image from S3
   */
  async deleteImage(imageKey: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: imageKey,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      return false;
    }
  }

  /**
   * Create image buffer from URL for Rekognition processing
   */
  async getImageBuffer(imageKey: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: imageKey,
      });

      const response = await this.client.send(command);
      const chunks: Uint8Array[] = [];
      
      if (response.Body) {
        // @ts-ignore - Body can be a stream
        for await (const chunk of response.Body) {
          chunks.push(chunk);
        }
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error fetching image buffer:', error);
      throw new Error('Failed to fetch image buffer');
    }
  }
}

// Export singleton instance
export const s3Service = new S3Service();
