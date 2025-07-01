
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Error types for categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  AWS_SERVICE = 'AWS_SERVICE',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  INTERNAL = 'INTERNAL',
  NETWORK = 'NETWORK',
}

// Severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Standard error response interface
export interface APIError {
  success: false;
  error: {
    type: ErrorType;
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
    severity: ErrorSeverity;
    recoverable: boolean;
    retryAfter?: number;
  };
}

// Success response interface
export interface APISuccess<T = any> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

// API response type
export type APIResponse<T = any> = APISuccess<T> | APIError;

class APIErrorHandler {
  private static instance: APIErrorHandler;
  private requestCounter = 0;

  static getInstance(): APIErrorHandler {
    if (!APIErrorHandler.instance) {
      APIErrorHandler.instance = new APIErrorHandler();
    }
    return APIErrorHandler.instance;
  }

  private generateRequestId(): string {
    this.requestCounter++;
    return `req_${Date.now()}_${this.requestCounter}`;
  }

  private logError(error: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
      severity: this.getSeverity(error),
    };

    // In production, send to logging service
    console.error('API Error:', logEntry);
  }

  private getSeverity(error: any): ErrorSeverity {
    // Critical errors that require immediate attention
    if (error instanceof Error && (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('timeout') ||
      error.message.includes('Out of memory')
    )) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity for authentication/authorization
    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return ErrorSeverity.HIGH;
    }

    // AWS service errors
    if (error.name?.includes('AWS') || error.code?.startsWith('AWS')) {
      return ErrorSeverity.HIGH;
    }

    // Database errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return ErrorSeverity.MEDIUM;
    }

    // Validation errors are typically low severity
    if (error instanceof ZodError) {
      return ErrorSeverity.LOW;
    }

    return ErrorSeverity.MEDIUM;
  }

  // Create success response
  createSuccessResponse<T>(data: T, requestId?: string): NextResponse<APISuccess<T>> {
    const response: APISuccess<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId: requestId || this.generateRequestId(),
    };

    return NextResponse.json(response);
  }

  // Create error response
  createErrorResponse(
    type: ErrorType,
    code: string,
    message: string,
    statusCode: number,
    details?: any,
    options?: {
      requestId?: string;
      retryAfter?: number;
      recoverable?: boolean;
    }
  ): NextResponse<APIError> {
    const error: APIError = {
      success: false,
      error: {
        type,
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId: options?.requestId || this.generateRequestId(),
        severity: this.getSeverity({ message, code }),
        recoverable: options?.recoverable ?? true,
        retryAfter: options?.retryAfter,
      },
    };

    // Log the error
    this.logError(error, `API Error Response: ${code}`);

    return NextResponse.json(error, { 
      status: statusCode,
      headers: options?.retryAfter ? { 'Retry-After': options.retryAfter.toString() } : undefined
    });
  }

  // Handle different types of errors
  handleError(error: any, context?: string): NextResponse<APIError> {
    this.logError(error, context);

    // Validation errors (Zod)
    if (error instanceof ZodError) {
      return this.createErrorResponse(
        ErrorType.VALIDATION,
        'VALIDATION_ERROR',
        'Request validation failed',
        400,
        {
          issues: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        },
        { recoverable: true }
      );
    }

    // Prisma database errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(error);
    }

    // AWS service errors
    if (error.name?.includes('AWS') || error.$metadata) {
      return this.handleAWSError(error);
    }

    // Network/timeout errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return this.createErrorResponse(
        ErrorType.NETWORK,
        'NETWORK_ERROR',
        'Network connection failed',
        503,
        { originalError: error.code },
        { recoverable: true, retryAfter: 30 }
      );
    }

    // Authentication errors
    if (error.message?.includes('Unauthorized') || error.status === 401) {
      return this.createErrorResponse(
        ErrorType.AUTHENTICATION,
        'AUTHENTICATION_REQUIRED',
        'Authentication required',
        401,
        undefined,
        { recoverable: false }
      );
    }

    // Authorization errors
    if (error.message?.includes('Forbidden') || error.status === 403) {
      return this.createErrorResponse(
        ErrorType.AUTHORIZATION,
        'INSUFFICIENT_PERMISSIONS',
        'Insufficient permissions',
        403,
        undefined,
        { recoverable: false }
      );
    }

    // Not found errors
    if (error.status === 404 || error.message?.includes('not found')) {
      return this.createErrorResponse(
        ErrorType.NOT_FOUND,
        'RESOURCE_NOT_FOUND',
        'Resource not found',
        404,
        undefined,
        { recoverable: false }
      );
    }

    // Rate limiting
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return this.createErrorResponse(
        ErrorType.RATE_LIMIT,
        'RATE_LIMIT_EXCEEDED',
        'Rate limit exceeded',
        429,
        undefined,
        { recoverable: true, retryAfter: 60 }
      );
    }

    // Generic internal server error
    return this.createErrorResponse(
      ErrorType.INTERNAL,
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      500,
      process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        stack: error.stack,
      } : undefined,
      { recoverable: true, retryAfter: 30 }
    );
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse<APIError> {
    switch (error.code) {
      case 'P2002':
        return this.createErrorResponse(
          ErrorType.CONFLICT,
          'UNIQUE_CONSTRAINT_VIOLATION',
          'Resource already exists',
          409,
          { field: error.meta?.target },
          { recoverable: false }
        );

      case 'P2025':
        return this.createErrorResponse(
          ErrorType.NOT_FOUND,
          'RECORD_NOT_FOUND',
          'Record not found',
          404,
          undefined,
          { recoverable: false }
        );

      case 'P2003':
        return this.createErrorResponse(
          ErrorType.VALIDATION,
          'FOREIGN_KEY_CONSTRAINT',
          'Related record not found',
          400,
          { field: error.meta?.field_name },
          { recoverable: false }
        );

      case 'P2014':
        return this.createErrorResponse(
          ErrorType.VALIDATION,
          'INVALID_RELATION',
          'Invalid relation in request',
          400,
          undefined,
          { recoverable: false }
        );

      default:
        return this.createErrorResponse(
          ErrorType.DATABASE,
          'DATABASE_ERROR',
          'Database operation failed',
          500,
          process.env.NODE_ENV === 'development' ? { code: error.code, meta: error.meta } : undefined,
          { recoverable: true, retryAfter: 10 }
        );
    }
  }

  private handleAWSError(error: any): NextResponse<APIError> {
    const errorCode = error.name || error.code || 'AWS_UNKNOWN_ERROR';
    const errorMessage = error.message || 'AWS service error';

    // Handle specific AWS errors
    switch (errorCode) {
      case 'ResourceNotFoundException':
        return this.createErrorResponse(
          ErrorType.NOT_FOUND,
          'AWS_RESOURCE_NOT_FOUND',
          'AWS resource not found',
          404,
          undefined,
          { recoverable: false }
        );

      case 'ThrottlingException':
      case 'ProvisionedThroughputExceededException':
        return this.createErrorResponse(
          ErrorType.RATE_LIMIT,
          'AWS_RATE_LIMIT',
          'AWS service rate limit exceeded',
          429,
          undefined,
          { recoverable: true, retryAfter: 60 }
        );

      case 'InvalidParameterException':
        return this.createErrorResponse(
          ErrorType.VALIDATION,
          'AWS_INVALID_PARAMETER',
          'Invalid parameter for AWS service',
          400,
          { originalMessage: errorMessage },
          { recoverable: false }
        );

      case 'AccessDeniedException':
        return this.createErrorResponse(
          ErrorType.AUTHORIZATION,
          'AWS_ACCESS_DENIED',
          'AWS access denied',
          403,
          undefined,
          { recoverable: false }
        );

      case 'ServiceUnavailableException':
        return this.createErrorResponse(
          ErrorType.AWS_SERVICE,
          'AWS_SERVICE_UNAVAILABLE',
          'AWS service temporarily unavailable',
          503,
          undefined,
          { recoverable: true, retryAfter: 30 }
        );

      default:
        return this.createErrorResponse(
          ErrorType.AWS_SERVICE,
          'AWS_SERVICE_ERROR',
          'AWS service error',
          500,
          process.env.NODE_ENV === 'development' ? { errorCode, errorMessage } : undefined,
          { recoverable: true, retryAfter: 30 }
        );
    }
  }
}

// Export singleton instance
export const apiErrorHandler = APIErrorHandler.getInstance();

// Wrapper function for API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<any>>
) {
  return async (...args: T): Promise<NextResponse<any>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return apiErrorHandler.handleError(error, handler.name);
    }
  };
}

// Async operation wrapper
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ data: T | null; error: any | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    console.error(`Safe async error${context ? ` in ${context}` : ''}:`, error);
    return { data: null, error };
  }
}

// Type-safe error checking
export function isAPIError(response: any): response is APIError {
  return response && response.success === false && response.error;
}

export function isAPISuccess<T>(response: any): response is APISuccess<T> {
  return response && response.success === true && response.data !== undefined;
}
