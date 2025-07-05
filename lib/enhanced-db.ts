
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma configuration with better error handling and connection management
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Add connection pooling for better performance in serverless environments
    ...(process.env.NODE_ENV === 'production' && {
      datasources: {
        db: {
          url: `${process.env.DATABASE_URL}?connection_limit=5&pool_timeout=10&pgbouncer=true`
        }
      }
    })
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Enhanced connection testing function
export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
  latency?: number;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      connected: true,
      latency
    };
  } catch (error) {
    const err = error as Error;
    return {
      connected: false,
      error: err.message
    };
  }
}

// Enhanced error handler for database operations
export function handleDatabaseError(error: unknown): {
  message: string;
  code?: string;
  isRetryable: boolean;
} {
  const err = error as any;
  
  // Network-related errors (potentially retryable)
  if (err.code === 'P1001' || err.message?.includes("Can't reach database server")) {
    return {
      message: 'Database server is unreachable. Please check your connection.',
      code: 'CONNECTION_ERROR',
      isRetryable: true
    };
  }
  
  // Authentication errors (not retryable)
  if (err.code === 'P1002' || err.message?.includes('authentication failed')) {
    return {
      message: 'Database authentication failed. Please check your credentials.',
      code: 'AUTH_ERROR',
      isRetryable: false
    };
  }
  
  // Database not found (not retryable)
  if (err.code === 'P1003' || err.message?.includes('database') && err.message?.includes('does not exist')) {
    return {
      message: 'Database does not exist. Please check your database name.',
      code: 'DATABASE_NOT_FOUND',
      isRetryable: false
    };
  }
  
  // Timeout errors (potentially retryable)
  if (err.code === 'P1008' || err.message?.includes('timeout')) {
    return {
      message: 'Database operation timed out. Please try again.',
      code: 'TIMEOUT_ERROR',
      isRetryable: true
    };
  }
  
  // SSL/TLS errors (configuration issue, not retryable)
  if (err.message?.includes('SSL') || err.message?.includes('TLS')) {
    return {
      message: 'SSL/TLS connection error. Please check your database SSL configuration.',
      code: 'SSL_ERROR',
      isRetryable: false
    };
  }
  
  // Generic database error
  return {
    message: err.message || 'An unknown database error occurred',
    code: err.code || 'UNKNOWN_ERROR',
    isRetryable: false
  };
}

// Retry mechanism for database operations
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorInfo = handleDatabaseError(error);
      
      // Don't retry if error is not retryable
      if (!errorInfo.isRetryable) {
        throw error;
      }
      
      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
