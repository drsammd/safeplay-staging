
import QRCode from 'qrcode';

export interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  width?: number;
}

export interface QRCodeData {
  id: string;
  type: 'child' | 'parent' | 'venue' | 'emergency';
  childId?: string;
  parentId?: string;
  venueId?: string;
  purpose: string;
  securityLevel: string;
  expiresAt?: string;
  maxUsage?: number;
  biometricRequired?: boolean;
  metadata?: Record<string, any>;
}

export class QRCodeGenerator {
  private static defaultOptions: QRCodeOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    width: 256,
  };

  /**
   * Generate QR code data string from structured data
   */
  static generateQRData(data: QRCodeData): string {
    const qrData = {
      id: data.id,
      type: data.type,
      purpose: data.purpose,
      security: data.securityLevel,
      timestamp: Date.now(),
      ...(data.childId && { childId: data.childId }),
      ...(data.parentId && { parentId: data.parentId }),
      ...(data.venueId && { venueId: data.venueId }),
      ...(data.expiresAt && { expiresAt: data.expiresAt }),
      ...(data.maxUsage && { maxUsage: data.maxUsage }),
      ...(data.biometricRequired && { biometric: true }),
      ...(data.metadata && { meta: data.metadata }),
    };

    // Create a compact, secure QR code string
    return `SAFEPLAY:${Buffer.from(JSON.stringify(qrData)).toString('base64')}`;
  }

  /**
   * Parse QR code data string back to structured data
   */
  static parseQRData(qrString: string): QRCodeData | null {
    try {
      if (!qrString.startsWith('SAFEPLAY:')) {
        return null;
      }

      const base64Data = qrString.replace('SAFEPLAY:', '');
      const jsonData = Buffer.from(base64Data, 'base64').toString('utf-8');
      const data = JSON.parse(jsonData);

      return {
        id: data.id,
        type: data.type,
        purpose: data.purpose,
        securityLevel: data.security,
        childId: data.childId,
        parentId: data.parentId,
        venueId: data.venueId,
        expiresAt: data.expiresAt,
        maxUsage: data.maxUsage,
        biometricRequired: data.biometric || false,
        metadata: data.meta,
      };
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      return null;
    }
  }

  /**
   * Generate QR code image as data URL
   */
  static async generateQRCodeImage(
    data: QRCodeData,
    options: Partial<QRCodeOptions> = {}
  ): Promise<string> {
    const qrString = this.generateQRData(data);
    const qrOptions = { ...this.defaultOptions, ...options };

    try {
      const dataURL = await QRCode.toDataURL(qrString, qrOptions);
      return dataURL;
    } catch (error) {
      console.error('Error generating QR code image:', error);
      throw new Error('Failed to generate QR code image');
    }
  }

  /**
   * Generate QR code as SVG string
   */
  static async generateQRCodeSVG(
    data: QRCodeData,
    options: Partial<QRCodeOptions> = {}
  ): Promise<string> {
    const qrString = this.generateQRData(data);
    const qrOptions = { ...this.defaultOptions, ...options };

    try {
      const svg = await QRCode.toString(qrString, { 
        ...qrOptions, 
        type: 'svg' as any 
      });
      return svg;
    } catch (error) {
      console.error('Error generating QR code SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }

  /**
   * Generate multiple QR codes for batch operations
   */
  static async generateBatchQRCodes(
    dataArray: QRCodeData[],
    options: Partial<QRCodeOptions> = {}
  ): Promise<Array<{ data: QRCodeData; qrString: string; imageURL: string }>> {
    const results = [];

    for (const data of dataArray) {
      try {
        const qrString = this.generateQRData(data);
        const imageURL = await this.generateQRCodeImage(data, options);
        
        results.push({
          data,
          qrString,
          imageURL,
        });
      } catch (error) {
        console.error(`Error generating QR code for ${data.id}:`, error);
        results.push({
          data,
          qrString: '',
          imageURL: '',
        });
      }
    }

    return results;
  }

  /**
   * Validate QR code data
   */
  static validateQRData(data: QRCodeData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.id) errors.push('ID is required');
    if (!data.type) errors.push('Type is required');
    if (!data.purpose) errors.push('Purpose is required');
    if (!data.securityLevel) errors.push('Security level is required');

    if (data.type === 'child' && !data.childId) {
      errors.push('Child ID is required for child QR codes');
    }

    if (data.type === 'parent' && !data.parentId) {
      errors.push('Parent ID is required for parent QR codes');
    }

    if (data.expiresAt) {
      const expiryDate = new Date(data.expiresAt);
      if (expiryDate <= new Date()) {
        errors.push('Expiry date must be in the future');
      }
    }

    if (data.maxUsage && data.maxUsage <= 0) {
      errors.push('Max usage must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate secure QR code with enhanced security features
   */
  static async generateSecureQRCode(
    data: QRCodeData,
    securityOptions: {
      includeTimestamp?: boolean;
      includeChecksum?: boolean;
      encryptData?: boolean;
    } = {},
    qrOptions: Partial<QRCodeOptions> = {}
  ): Promise<{ qrString: string; imageURL: string; securityHash: string }> {
    const enhancedData = { ...data };

    if (securityOptions.includeTimestamp) {
      enhancedData.metadata = {
        ...enhancedData.metadata,
        timestamp: Date.now(),
      };
    }

    if (securityOptions.includeChecksum) {
      const checksum = this.generateChecksum(enhancedData);
      enhancedData.metadata = {
        ...enhancedData.metadata,
        checksum,
      };
    }

    const qrString = this.generateQRData(enhancedData);
    const imageURL = await this.generateQRCodeImage(enhancedData, qrOptions);
    const securityHash = this.generateSecurityHash(enhancedData);

    return {
      qrString,
      imageURL,
      securityHash,
    };
  }

  /**
   * Generate checksum for data integrity
   */
  private static generateChecksum(data: QRCodeData): string {
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Generate security hash for verification
   */
  private static generateSecurityHash(data: QRCodeData): string {
    const securityString = `${data.id}-${data.type}-${data.securityLevel}-${Date.now()}`;
    return Buffer.from(securityString).toString('base64');
  }

  /**
   * Verify QR code security hash
   */
  static verifySecurityHash(data: QRCodeData, hash: string): boolean {
    try {
      const decoded = Buffer.from(hash, 'base64').toString('utf-8');
      const parts = decoded.split('-');
      
      return parts[0] === data.id && 
             parts[1] === data.type && 
             parts[2] === data.securityLevel;
    } catch (error) {
      return false;
    }
  }
}

export default QRCodeGenerator;
