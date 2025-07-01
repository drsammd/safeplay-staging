
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Database operation wrapper types
export interface DBOperationResult<T> {
  success: boolean;
  data?: T;
  error?: DBError;
}

export interface DBError {
  type: 'VALIDATION' | 'CONSTRAINT' | 'NOT_FOUND' | 'CONFLICT' | 'TIMEOUT' | 'CONNECTION' | 'UNKNOWN';
  code: string;
  message: string;
  field?: string;
  originalError?: any;
  retryable: boolean;
}

// Enhanced database error handler
export class DatabaseErrorHandler {
  private static instance: DatabaseErrorHandler;

  static getInstance(): DatabaseErrorHandler {
    if (!DatabaseErrorHandler.instance) {
      DatabaseErrorHandler.instance = new DatabaseErrorHandler();
    }
    return DatabaseErrorHandler.instance;
  }

  // Handle Prisma errors
  handlePrismaError(error: any): DBError {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handleKnownRequestError(error);
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return {
        type: 'UNKNOWN',
        code: 'UNKNOWN_DATABASE_ERROR',
        message: 'An unknown database error occurred',
        originalError: error,
        retryable: true,
      };
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return {
        type: 'CONNECTION',
        code: 'DATABASE_PANIC',
        message: 'Database connection panic occurred',
        originalError: error,
        retryable: true,
      };
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return {
        type: 'CONNECTION',
        code: 'DATABASE_INITIALIZATION_ERROR',
        message: 'Failed to initialize database connection',
        originalError: error,
        retryable: true,
      };
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return {
        type: 'VALIDATION',
        code: 'DATABASE_VALIDATION_ERROR',
        message: 'Database validation error',
        originalError: error,
        retryable: false,
      };
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        type: 'VALIDATION',
        code: 'SCHEMA_VALIDATION_ERROR',
        message: `Validation failed: ${error.issues.map(i => i.message).join(', ')}`,
        originalError: error,
        retryable: false,
      };
    }

    // Generic error
    return {
      type: 'UNKNOWN',
      code: 'GENERIC_DATABASE_ERROR',
      message: error.message || 'An unexpected database error occurred',
      originalError: error,
      retryable: true,
    };
  }

  private handleKnownRequestError(error: Prisma.PrismaClientKnownRequestError): DBError {
    switch (error.code) {
      case 'P2000':
        return {
          type: 'VALIDATION',
          code: 'VALUE_TOO_LONG',
          message: 'The provided value is too long for the field',
          field: error.meta?.column_name as string,
          originalError: error,
          retryable: false,
        };

      case 'P2001':
        return {
          type: 'NOT_FOUND',
          code: 'RECORD_NOT_FOUND',
          message: 'The record does not exist',
          originalError: error,
          retryable: false,
        };

      case 'P2002':
        const target = error.meta?.target;
        const targetString = Array.isArray(target) ? target.join(', ') : target || 'value';
        const fieldName = Array.isArray(target) ? target[0] : target;
        return {
          type: 'CONFLICT',
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `A record with this ${targetString} already exists`,
          field: fieldName as string | undefined,
          originalError: error,
          retryable: false,
        };

      case 'P2003':
        return {
          type: 'CONSTRAINT',
          code: 'FOREIGN_KEY_CONSTRAINT',
          message: 'Foreign key constraint failed',
          field: error.meta?.field_name as string,
          originalError: error,
          retryable: false,
        };

      case 'P2004':
        return {
          type: 'CONSTRAINT',
          code: 'CONSTRAINT_FAILED',
          message: 'A constraint failed on the database',
          originalError: error,
          retryable: false,
        };

      case 'P2005':
        return {
          type: 'VALIDATION',
          code: 'INVALID_VALUE',
          message: 'The value provided is invalid for the field type',
          field: error.meta?.field_name as string,
          originalError: error,
          retryable: false,
        };

      case 'P2006':
        return {
          type: 'VALIDATION',
          code: 'INVALID_VALUE',
          message: 'The provided value is not valid',
          originalError: error,
          retryable: false,
        };

      case 'P2007':
        return {
          type: 'VALIDATION',
          code: 'DATA_VALIDATION_ERROR',
          message: 'Data validation error',
          originalError: error,
          retryable: false,
        };

      case 'P2008':
        return {
          type: 'VALIDATION',
          code: 'QUERY_PARSING_ERROR',
          message: 'Failed to parse the query',
          originalError: error,
          retryable: false,
        };

      case 'P2009':
        return {
          type: 'VALIDATION',
          code: 'QUERY_VALIDATION_ERROR',
          message: 'Failed to validate the query',
          originalError: error,
          retryable: false,
        };

      case 'P2010':
        return {
          type: 'VALIDATION',
          code: 'RAW_QUERY_FAILED',
          message: 'Raw query failed',
          originalError: error,
          retryable: false,
        };

      case 'P2011':
        return {
          type: 'CONSTRAINT',
          code: 'NULL_CONSTRAINT_VIOLATION',
          message: 'Null constraint violation',
          field: error.meta?.constraint as string,
          originalError: error,
          retryable: false,
        };

      case 'P2012':
        return {
          type: 'VALIDATION',
          code: 'MISSING_REQUIRED_VALUE',
          message: 'Missing a required value',
          originalError: error,
          retryable: false,
        };

      case 'P2013':
        return {
          type: 'VALIDATION',
          code: 'MISSING_REQUIRED_ARGUMENT',
          message: 'Missing the required argument',
          field: error.meta?.argument_name as string,
          originalError: error,
          retryable: false,
        };

      case 'P2014':
        return {
          type: 'VALIDATION',
          code: 'INVALID_RELATION',
          message: 'The change you are trying to make would violate the required relation',
          originalError: error,
          retryable: false,
        };

      case 'P2015':
        return {
          type: 'NOT_FOUND',
          code: 'RELATED_RECORD_NOT_FOUND',
          message: 'A related record could not be found',
          originalError: error,
          retryable: false,
        };

      case 'P2016':
        return {
          type: 'VALIDATION',
          code: 'QUERY_INTERPRETATION_ERROR',
          message: 'Query interpretation error',
          originalError: error,
          retryable: false,
        };

      case 'P2017':
        return {
          type: 'NOT_FOUND',
          code: 'RECORDS_NOT_CONNECTED',
          message: 'The records for relation are not connected',
          originalError: error,
          retryable: false,
        };

      case 'P2018':
        return {
          type: 'NOT_FOUND',
          code: 'REQUIRED_CONNECTED_RECORDS_NOT_FOUND',
          message: 'The required connected records were not found',
          originalError: error,
          retryable: false,
        };

      case 'P2024':
        return {
          type: 'TIMEOUT',
          code: 'TIMEOUT',
          message: 'Timed out fetching a new connection from the connection pool',
          originalError: error,
          retryable: true,
        };

      case 'P2025':
        return {
          type: 'NOT_FOUND',
          code: 'RECORD_NOT_FOUND',
          message: 'An operation failed because it depends on one or more records that were required but not found',
          originalError: error,
          retryable: false,
        };

      default:
        return {
          type: 'UNKNOWN',
          code: error.code,
          message: error.message,
          originalError: error,
          retryable: true,
        };
    }
  }

  // Execute database operation with error handling
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: string = 'database operation'
  ): Promise<DBOperationResult<T>> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const dbError = this.handlePrismaError(error);
      
      // Log the error
      console.error(`Database error in ${context}:`, {
        type: dbError.type,
        code: dbError.code,
        message: dbError.message,
        field: dbError.field,
        retryable: dbError.retryable,
      });

      return { success: false, error: dbError };
    }
  }

  // Execute with retry logic for retryable errors
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'database operation',
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<DBOperationResult<T>> {
    let lastError: DBError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.executeWithErrorHandling(operation, context);
      
      if (result.success) {
        return result;
      }

      lastError = result.error!;

      // Don't retry if error is not retryable or this is the last attempt
      if (!lastError.retryable || attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying database operation in ${delay}ms (attempt ${attempt + 1}/${maxRetries}): ${context}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return { success: false, error: lastError! };
  }

  // Transaction wrapper with error handling
  async executeTransaction<T>(
    operation: (tx: any) => Promise<T>,
    context: string = 'transaction'
  ): Promise<DBOperationResult<T>> {
    try {
      const { prisma } = await import('@/lib/db');
      const data = await prisma.$transaction(operation);
      return { success: true, data };
    } catch (error) {
      const dbError = this.handlePrismaError(error);
      
      console.error(`Transaction error in ${context}:`, {
        type: dbError.type,
        code: dbError.code,
        message: dbError.message,
        field: dbError.field,
      });

      return { success: false, error: dbError };
    }
  }
}

// Export singleton instance
export const dbErrorHandler = DatabaseErrorHandler.getInstance();

// Helper functions
export async function safeDBOperation<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<DBOperationResult<T>> {
  return dbErrorHandler.executeWithErrorHandling(operation, context);
}

export async function retryableDBOperation<T>(
  operation: () => Promise<T>,
  context?: string,
  maxRetries?: number
): Promise<DBOperationResult<T>> {
  return dbErrorHandler.executeWithRetry(operation, context, maxRetries);
}

export async function safeTransaction<T>(
  operation: (tx: any) => Promise<T>,
  context?: string
): Promise<DBOperationResult<T>> {
  return dbErrorHandler.executeTransaction(operation, context);
}
