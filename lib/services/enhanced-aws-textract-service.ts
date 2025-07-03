
import { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/db';
import { DocumentType } from '@prisma/client';
import { googlePlacesService } from './google-places-service';

interface ExtractedAddressData {
  fullAddress?: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  extractionConfidence: number;
  rawExtractedText: string[];
  fieldConfidences: Record<string, number>;
}

interface EnhancedDocumentField {
  key: string;
  value: string;
  confidence: number;
  fieldType: 'NAME' | 'ADDRESS' | 'DATE' | 'NUMBER' | 'OTHER';
  coordinates?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

interface EnhancedDocumentAnalysisResult {
  success: boolean;
  confidence: number;
  authenticityScore: number;
  qualityScore: number;
  extractedText: string;
  extractedFields: EnhancedDocumentField[];
  extractedAddress?: ExtractedAddressData;
  fraudIndicators: string[];
  addressValidationResult?: any;
  error?: string;
}

export class EnhancedAWSTextractService {
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

  async analyzeDocumentWithAddressExtraction(
    identityVerificationId: string,
    documentType: DocumentType,
    imageBuffer: Buffer,
    fileName: string
  ): Promise<EnhancedDocumentAnalysisResult> {
    try {
      // Upload document to S3
      const s3Key = `identity-verification/${identityVerificationId}/${fileName}`;
      await this.uploadToS3(imageBuffer, s3Key);

      // Start Textract analysis with enhanced features
      const textractJobId = await this.startEnhancedTextractAnalysis(s3Key);
      
      // Update document analysis record with job ID
      await prisma.documentAnalysis.upsert({
        where: { identityVerificationId },
        create: {
          identityVerificationId,
          documentType,
          textractJobId,
          processingStatus: 'PROCESSING',
          analysisProvider: 'AWS_TEXTRACT_ENHANCED'
        },
        update: {
          textractJobId,
          processingStatus: 'PROCESSING'
        }
      });

      // Poll for results
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const result = await this.getTextractResults(textractJobId);
        if (result.JobStatus === 'SUCCEEDED') {
          const analysisResult = await this.processEnhancedTextractResult(result, documentType);
          
          // Extract and validate address if this is a driver's license
          if (documentType === 'DRIVERS_LICENSE' && analysisResult.extractedAddress) {
            try {
              const addressValidation = await googlePlacesService.validateAndStandardizeAddress(
                analysisResult.extractedAddress.fullAddress || '',
                ['us', 'ca']
              );
              analysisResult.addressValidationResult = addressValidation;
            } catch (error) {
              console.error('Address validation error:', error);
            }
          }
          
          // Update document analysis record with enhanced data
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
              extractedAddressData: analysisResult.extractedAddress as any,
              addressExtractionConfidence: analysisResult.extractedAddress?.extractionConfidence || 0,
              addressValidationResult: analysisResult.addressValidationResult,
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
      console.error('Enhanced Textract analysis error:', error);
      
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

  private async startEnhancedTextractAnalysis(s3Key: string): Promise<string> {
    const command = new StartDocumentAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: this.bucketName,
          Name: s3Key
        }
      },
      FeatureTypes: ['FORMS', 'TABLES', 'LAYOUT'] // Enhanced feature detection
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

  private async processEnhancedTextractResult(result: any, documentType: DocumentType): Promise<EnhancedDocumentAnalysisResult> {
    const blocks = result.Blocks || [];
    
    // Extract text
    const textBlocks = blocks.filter((block: any) => block.BlockType === 'LINE');
    const extractedText = textBlocks.map((block: any) => block.Text).join('\n');

    // Extract enhanced key-value pairs with coordinates
    const extractedFields: EnhancedDocumentField[] = [];
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
            confidence: block.Confidence || 0,
            fieldType: this.classifyFieldType(keyText, valueText),
            coordinates: block.Geometry?.BoundingBox ? {
              left: block.Geometry.BoundingBox.Left,
              top: block.Geometry.BoundingBox.Top,
              width: block.Geometry.BoundingBox.Width,
              height: block.Geometry.BoundingBox.Height
            } : undefined
          });
        }
      }
    }

    // Extract address information for driver's licenses
    let extractedAddress: ExtractedAddressData | undefined;
    if (documentType === 'DRIVERS_LICENSE') {
      extractedAddress = this.extractAddressFromDriversLicense(extractedFields, extractedText);
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
      extractedAddress,
      fraudIndicators
    };
  }

  private extractAddressFromDriversLicense(fields: EnhancedDocumentField[], fullText: string): ExtractedAddressData {
    // Look for address-related fields
    const addressFields = fields.filter(field => 
      field.fieldType === 'ADDRESS' || 
      this.isAddressField(field.key) ||
      this.containsAddressPattern(field.value)
    );

    // Also extract from full text using patterns
    const addressPatterns = this.extractAddressPatternsFromText(fullText);

    let fullAddress = '';
    let streetNumber = '';
    let streetName = '';
    let city = '';
    let state = '';
    let zipCode = '';
    let country = 'US'; // Default for US driver's licenses

    const confidences: Record<string, number> = {};
    const rawExtractedText: string[] = [];

    // Process address fields
    for (const field of addressFields) {
      rawExtractedText.push(`${field.key}: ${field.value}`);
      
      if (this.isStreetAddressField(field.key)) {
        const parsed = this.parseStreetAddress(field.value);
        streetNumber = parsed.number;
        streetName = parsed.street;
        confidences.street = field.confidence;
      } else if (this.isCityField(field.key)) {
        city = field.value;
        confidences.city = field.confidence;
      } else if (this.isStateField(field.key)) {
        state = this.normalizeState(field.value);
        confidences.state = field.confidence;
      } else if (this.isZipField(field.key)) {
        zipCode = this.normalizeZipCode(field.value);
        confidences.zip = field.confidence;
      } else if (this.isFullAddressField(field.key)) {
        fullAddress = field.value;
        confidences.full = field.confidence;
      }
    }

    // If we don't have a full address, construct one
    if (!fullAddress && (streetNumber || streetName) && city && state) {
      const streetPart = `${streetNumber} ${streetName}`.trim();
      fullAddress = `${streetPart}, ${city}, ${state} ${zipCode}`.trim();
    }

    // Use pattern-extracted addresses if field extraction failed
    if (!fullAddress && addressPatterns.length > 0) {
      fullAddress = addressPatterns[0].address;
      const parsed = this.parseFullAddress(fullAddress);
      streetNumber = parsed.streetNumber;
      streetName = parsed.streetName;
      city = parsed.city;
      state = parsed.state;
      zipCode = parsed.zipCode;
    }

    // Calculate overall extraction confidence
    const confidenceValues = Object.values(confidences);
    const extractionConfidence = confidenceValues.length > 0 
      ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length / 100
      : 0;

    return {
      fullAddress,
      streetNumber,
      streetName,
      city,
      state,
      zipCode,
      country,
      extractionConfidence,
      rawExtractedText,
      fieldConfidences: confidences
    };
  }

  private extractAddressPatternsFromText(text: string): Array<{address: string, confidence: number}> {
    const patterns: Array<{address: string, confidence: number}> = [];
    
    // US address pattern: number + street + city + state + zip
    const usAddressRegex = /(\d+[\w\s\-\.]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|court|ct|place|pl|way|circle|cir|trail|tr)[\w\s\-\.]*),?\s*([a-z\s]+),?\s*([a-z]{2})\s*(\d{5}(?:-\d{4})?)/gi;
    
    let match;
    while ((match = usAddressRegex.exec(text)) !== null) {
      const [fullMatch, street, city, state, zip] = match;
      patterns.push({
        address: `${street}, ${city}, ${state} ${zip}`,
        confidence: 0.8
      });
    }

    // Simpler pattern for partial addresses
    const partialAddressRegex = /(\d+\s+[a-z\s\-\.]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln))/gi;
    while ((match = partialAddressRegex.exec(text)) !== null) {
      patterns.push({
        address: match[0],
        confidence: 0.6
      });
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  private isAddressField(key: string): boolean {
    const addressKeywords = ['address', 'addr', 'street', 'residence', 'home', 'location'];
    return addressKeywords.some(keyword => key.toLowerCase().includes(keyword));
  }

  private containsAddressPattern(value: string): boolean {
    // Check if value contains address-like patterns
    const addressIndicators = [
      /\d+\s+[a-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)/i,
      /\d{5}(?:-\d{4})?/, // ZIP code
      /[a-z\s]+,\s*[a-z]{2}\s*\d{5}/i // city, state zip
    ];
    
    return addressIndicators.some(pattern => pattern.test(value));
  }

  private isStreetAddressField(key: string): boolean {
    return /address|street|addr/i.test(key) && !/city|state|zip|postal/i.test(key);
  }

  private isCityField(key: string): boolean {
    return /city|town|locality/i.test(key);
  }

  private isStateField(key: string): boolean {
    return /state|province|region/i.test(key);
  }

  private isZipField(key: string): boolean {
    return /zip|postal|code/i.test(key);
  }

  private isFullAddressField(key: string): boolean {
    return /^address$/i.test(key) || /full\s*address/i.test(key);
  }

  private parseStreetAddress(address: string): {number: string, street: string} {
    const match = address.match(/^(\d+)\s+(.+)$/);
    if (match) {
      return { number: match[1], street: match[2] };
    }
    return { number: '', street: address };
  }

  private parseFullAddress(address: string): {
    streetNumber: string;
    streetName: string;
    city: string;
    state: string;
    zipCode: string;
  } {
    // Simple parsing - could be enhanced with more sophisticated logic
    const parts = address.split(',').map(part => part.trim());
    const result = { streetNumber: '', streetName: '', city: '', state: '', zipCode: '' };

    if (parts.length >= 3) {
      // Parse street address
      const streetMatch = parts[0].match(/^(\d+)\s+(.+)$/);
      if (streetMatch) {
        result.streetNumber = streetMatch[1];
        result.streetName = streetMatch[2];
      } else {
        result.streetName = parts[0];
      }

      result.city = parts[1];

      // Parse state and zip from last part
      const stateZipMatch = parts[2].match(/^([a-z]{2})\s*(\d{5}(?:-\d{4})?)$/i);
      if (stateZipMatch) {
        result.state = stateZipMatch[1];
        result.zipCode = stateZipMatch[2];
      } else {
        result.state = parts[2];
      }
    }

    return result;
  }

  private normalizeState(state: string): string {
    // Convert state names to abbreviations
    const stateMap: Record<string, string> = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
      'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
      // Add more states as needed
    };

    const normalized = state.toLowerCase().trim();
    return stateMap[normalized] || state.toUpperCase();
  }

  private normalizeZipCode(zip: string): string {
    // Extract just the digits and format properly
    const digits = zip.replace(/\D/g, '');
    if (digits.length === 9) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits.slice(0, 5);
  }

  private classifyFieldType(key: string, value: string): 'NAME' | 'ADDRESS' | 'DATE' | 'NUMBER' | 'OTHER' {
    const keyLower = key.toLowerCase();
    
    if (/name|first|last|given|family/i.test(keyLower)) {
      return 'NAME';
    }
    
    if (this.isAddressField(key) || this.containsAddressPattern(value)) {
      return 'ADDRESS';
    }
    
    if (/date|birth|expir|issued/i.test(keyLower) || /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value)) {
      return 'DATE';
    }
    
    if (/number|id|license|dl/i.test(keyLower) || /^\d+$/.test(value)) {
      return 'NUMBER';
    }
    
    return 'OTHER';
  }

  // ... (rest of the methods from the original service)

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
    return average / 100;
  }

  private calculateAuthenticityScore(fields: EnhancedDocumentField[], documentType: DocumentType): number {
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
    const hasName = fields.some(f => f.fieldType === 'NAME');
    if (hasName) score += 0.1;

    return Math.min(score, 1.0);
  }

  private calculateQualityScore(blocks: any[]): number {
    const textBlocks = blocks.filter((block: any) => block.BlockType === 'LINE');
    if (textBlocks.length === 0) return 0;

    const avgConfidence = textBlocks.reduce((sum, block) => sum + (block.Confidence || 0), 0) / textBlocks.length;
    return avgConfidence / 100;
  }

  private detectFraudIndicators(fields: EnhancedDocumentField[], text: string, documentType: DocumentType): string[] {
    const indicators: string[] = [];

    // Check for common fraud patterns
    if (text.includes('COPY') || text.includes('DUPLICATE')) {
      indicators.push('Document contains copy/duplicate watermarks');
    }

    // Check for inconsistent dates
    const dateFields = fields.filter(f => f.fieldType === 'DATE');
    for (const field of dateFields) {
      if (field.confidence < 70) {
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
        return ['name', 'license', 'expires', 'birth', 'address'];
      case 'PASSPORT':
        return ['passport', 'name', 'country', 'birth'];
      case 'NATIONAL_ID':
        return ['name', 'id', 'birth'];
      default:
        return ['name'];
    }
  }

  private getReviewReason(result: EnhancedDocumentAnalysisResult): string {
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
}

export const enhancedAWSTextractService = new EnhancedAWSTextractService();
