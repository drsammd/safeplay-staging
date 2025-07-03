

import { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '@/lib/db';
import { DocumentType } from '@prisma/client';

interface DocumentField {
  key: string;
  value: string;
  confidence: number;
}

interface DocumentAnalysisResult {
  success: boolean;
  confidence: number;
  authenticityScore: number;
  qualityScore: number;
  extractedText: string;
  extractedFields: DocumentField[];
  fraudIndicators: string[];
  error?: string;
}

export class AWSTextractService {
  private textractClient: TextractClient;
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.textractClient = new TextractClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'safeplay-documents';
  }

  async analyzeDocument(
    identityVerificationId: string,
    documentType: DocumentType,
    imageBuffer: Buffer,
    fileName: string
  ): Promise<DocumentAnalysisResult> {
    try {
      // Upload document to S3
      const s3Key = `identity-verification/${identityVerificationId}/${fileName}`;
      await this.uploadToS3(imageBuffer, s3Key);

      // Start Textract analysis
      const textractJobId = await this.startTextractAnalysis(s3Key);
      
      // Update document analysis record with job ID
      await prisma.documentAnalysis.upsert({
        where: { identityVerificationId },
        create: {
          identityVerificationId,
          documentType,
          textractJobId,
          processingStatus: 'PROCESSING',
          analysisProvider: 'AWS_TEXTRACT'
        },
        update: {
          textractJobId,
          processingStatus: 'PROCESSING'
        }
      });

      // Poll for results (simplified - in production, use SNS notifications)
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const result = await this.getTextractResults(textractJobId);
        if (result.JobStatus === 'SUCCEEDED') {
          const analysisResult = await this.processTextractResult(result, documentType);
          
          // Update document analysis record
          await prisma.documentAnalysis.update({
            where: { identityVerificationId },
            data: {
              processingStatus: 'COMPLETED',
              extractedText: analysisResult.extractedText,
              extractedFields: analysisResult.extractedFields as any,
              confidence: analysisResult.confidence,
              authenticityScore: analysisResult.authenticityScore,
              qualityScore: analysisResult.qualityScore,
              fraudIndicators: analysisResult.fraudIndicators,
              textractResponse: result,
              processedAt: new Date(),
              autoApproved: analysisResult.confidence >= 0.9 && analysisResult.authenticityScore >= 0.8,
              autoRejected: analysisResult.confidence < 0.5 || analysisResult.fraudIndicators.length > 2,
              requiresManualReview: analysisResult.confidence < 0.9 || analysisResult.authenticityScore < 0.8,
              reviewReason: this.getReviewReason(analysisResult)
            }
          });

          return analysisResult;
        } else if (result.JobStatus === 'FAILED') {
          await prisma.documentAnalysis.update({
            where: { identityVerificationId },
            data: {
              processingStatus: 'FAILED',
              processingError: result.StatusMessage || 'Textract analysis failed'
            }
          });
          
          return {
            success: false,
            confidence: 0,
            authenticityScore: 0,
            qualityScore: 0,
            extractedText: '',
            extractedFields: [],
            fraudIndicators: [],
            error: result.StatusMessage || 'Textract analysis failed'
          };
        }
        
        attempts++;
      }

      // Timeout
      await prisma.documentAnalysis.update({
        where: { identityVerificationId },
        data: {
          processingStatus: 'FAILED',
          processingError: 'Analysis timeout'
        }
      });

      return {
        success: false,
        confidence: 0,
        authenticityScore: 0,
        qualityScore: 0,
        extractedText: '',
        extractedFields: [],
        fraudIndicators: [],
        error: 'Analysis timeout'
      };

    } catch (error) {
      console.error('Textract analysis error:', error);
      
      await prisma.documentAnalysis.update({
        where: { identityVerificationId },
        data: {
          processingStatus: 'FAILED',
          processingError: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        success: false,
        confidence: 0,
        authenticityScore: 0,
        qualityScore: 0,
        extractedText: '',
        extractedFields: [],
        fraudIndicators: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async uploadToS3(buffer: Buffer, key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg'
    });

    await this.s3Client.send(command);
    return key;
  }

  private async startTextractAnalysis(s3Key: string): Promise<string> {
    const command = new StartDocumentAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: this.bucketName,
          Name: s3Key
        }
      },
      FeatureTypes: ['FORMS', 'TABLES']
    });

    const response = await this.textractClient.send(command);
    if (!response.JobId) {
      throw new Error('Failed to start Textract analysis');
    }

    return response.JobId;
  }

  private async getTextractResults(jobId: string): Promise<any> {
    const command = new GetDocumentAnalysisCommand({
      JobId: jobId
    });

    return await this.textractClient.send(command);
  }

  private async processTextractResult(result: any, documentType: DocumentType): Promise<DocumentAnalysisResult> {
    const blocks = result.Blocks || [];
    
    // Extract text
    const textBlocks = blocks.filter((block: any) => block.BlockType === 'LINE');
    const extractedText = textBlocks.map((block: any) => block.Text).join('\n');

    // Extract key-value pairs
    const extractedFields: DocumentField[] = [];
    const keyValueBlocks = blocks.filter((block: any) => block.BlockType === 'KEY_VALUE_SET');
    
    for (const block of keyValueBlocks) {
      if (block.EntityTypes?.includes('KEY')) {
        const keyText = this.getBlockText(block, blocks);
        const valueBlock = this.findValueBlock(block, blocks);
        const valueText = valueBlock ? this.getBlockText(valueBlock, blocks) : '';
        
        if (keyText && valueText) {
          extractedFields.push({
            key: keyText,
            value: valueText,
            confidence: block.Confidence || 0
          });
        }
      }
    }

    // Calculate scores
    const confidence = this.calculateConfidenceScore(blocks);
    const authenticityScore = this.calculateAuthenticityScore(extractedFields, documentType);
    const qualityScore = this.calculateQualityScore(blocks);
    const fraudIndicators = this.detectFraudIndicators(extractedFields, extractedText, documentType);

    return {
      success: true,
      confidence,
      authenticityScore,
      qualityScore,
      extractedText,
      extractedFields,
      fraudIndicators
    };
  }

  private getBlockText(block: any, blocks: any[]): string {
    if (block.Text) return block.Text;
    
    if (block.Relationships) {
      const childBlocks = block.Relationships
        .filter((rel: any) => rel.Type === 'CHILD')
        .flatMap((rel: any) => rel.Ids)
        .map((id: string) => blocks.find((b: any) => b.Id === id))
        .filter(Boolean);
      
      return childBlocks.map((child: any) => child.Text).join(' ');
    }
    
    return '';
  }

  private findValueBlock(keyBlock: any, blocks: any[]): any {
    const valueRelation = keyBlock.Relationships?.find((rel: any) => rel.Type === 'VALUE');
    if (valueRelation?.Ids?.[0]) {
      return blocks.find((block: any) => block.Id === valueRelation.Ids[0]);
    }
    return null;
  }

  private calculateConfidenceScore(blocks: any[]): number {
    const confidenceScores = blocks
      .filter((block: any) => block.Confidence)
      .map((block: any) => block.Confidence);
    
    if (confidenceScores.length === 0) return 0;
    
    const average = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
    return average / 100; // Convert to 0-1 scale
  }

  private calculateAuthenticityScore(fields: DocumentField[], documentType: DocumentType): number {
    // Basic authenticity checks based on document type
    let score = 0.5; // Base score
    
    switch (documentType) {
      case 'DRIVERS_LICENSE':
        if (fields.some(f => f.key.toLowerCase().includes('license'))) score += 0.2;
        if (fields.some(f => f.key.toLowerCase().includes('expires'))) score += 0.1;
        if (fields.some(f => f.key.toLowerCase().includes('class'))) score += 0.1;
        break;
      
      case 'PASSPORT':
        if (fields.some(f => f.key.toLowerCase().includes('passport'))) score += 0.2;
        if (fields.some(f => f.key.toLowerCase().includes('country'))) score += 0.1;
        if (fields.some(f => f.key.toLowerCase().includes('number'))) score += 0.1;
        break;
      
      case 'NATIONAL_ID':
        if (fields.some(f => f.key.toLowerCase().includes('id'))) score += 0.2;
        if (fields.some(f => f.key.toLowerCase().includes('number'))) score += 0.1;
        break;
    }

    // Check for required fields
    const hasName = fields.some(f => 
      f.key.toLowerCase().includes('name') || 
      f.key.toLowerCase().includes('first') || 
      f.key.toLowerCase().includes('last')
    );
    if (hasName) score += 0.1;

    return Math.min(score, 1.0);
  }

  private calculateQualityScore(blocks: any[]): number {
    // Simple quality assessment based on text detection confidence
    const textBlocks = blocks.filter((block: any) => block.BlockType === 'LINE');
    if (textBlocks.length === 0) return 0;

    const avgConfidence = textBlocks.reduce((sum, block) => sum + (block.Confidence || 0), 0) / textBlocks.length;
    return avgConfidence / 100;
  }

  private detectFraudIndicators(fields: DocumentField[], text: string, documentType: DocumentType): string[] {
    const indicators: string[] = [];

    // Check for common fraud patterns
    if (text.includes('COPY') || text.includes('DUPLICATE')) {
      indicators.push('Document contains copy/duplicate watermarks');
    }

    // Check for inconsistent dates
    const dateFields = fields.filter(f => 
      f.key.toLowerCase().includes('date') || 
      f.key.toLowerCase().includes('expires') ||
      f.key.toLowerCase().includes('birth')
    );

    for (const field of dateFields) {
      if (field.confidence < 0.7) {
        indicators.push(`Low confidence date field: ${field.key}`);
      }
    }

    // Check for missing required fields
    const requiredFields = this.getRequiredFields(documentType);
    for (const required of requiredFields) {
      const hasField = fields.some(f => f.key.toLowerCase().includes(required.toLowerCase()));
      if (!hasField) {
        indicators.push(`Missing required field: ${required}`);
      }
    }

    return indicators;
  }

  private getRequiredFields(documentType: DocumentType): string[] {
    switch (documentType) {
      case 'DRIVERS_LICENSE':
        return ['name', 'license', 'expires', 'birth'];
      case 'PASSPORT':
        return ['passport', 'name', 'country', 'birth'];
      case 'NATIONAL_ID':
        return ['name', 'id', 'birth'];
      default:
        return ['name'];
    }
  }

  private getReviewReason(result: DocumentAnalysisResult): string {
    if (result.confidence < 0.7) {
      return 'Low confidence score from automated analysis';
    }
    if (result.authenticityScore < 0.8) {
      return 'Document authenticity concerns detected';
    }
    if (result.fraudIndicators.length > 0) {
      return `Potential fraud indicators: ${result.fraudIndicators.join(', ')}`;
    }
    return 'Standard review process';
  }

  // Quick document analysis for simpler documents
  async quickAnalyzeDocument(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
    try {
      const command = new DetectDocumentTextCommand({
        Document: {
          Bytes: imageBuffer
        }
      });

      const result = await this.textractClient.send(command);
      const blocks = result.Blocks || [];
      
      const textBlocks = blocks.filter((block: any) => block.BlockType === 'LINE');
      const text = textBlocks.map((block: any) => block.Text).join('\n');
      const confidence = this.calculateConfidenceScore(blocks);

      return { text, confidence };
    } catch (error) {
      console.error('Quick Textract analysis error:', error);
      return { text: '', confidence: 0 };
    }
  }
}

export const awsTextractService = new AWSTextractService();

