
// Common utility types and functions for safe type conversions

// Safely convert a value to string array
export function toStringArraySafe(value: any): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'number') return item.toString();
        if (item && typeof item === 'object' && 'toString' in item) {
          return item.toString();
        }
        return null;
      })
      .filter((item): item is string => item !== null);
  }
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return toStringArraySafe(parsed);
      }
    } catch {
      // If not valid JSON, treat as single string
      return [value];
    }
  }
  
  return [];
}

// Safely parse JSON with fallback
export function parseJsonSafe<T = any>(value: any, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn('Failed to parse JSON:', error);
      return fallback;
    }
  }
  
  if (value === null || value === undefined) {
    return fallback;
  }
  
  // If it's already an object/array, return as is
  if (typeof value === 'object') {
    return value as T;
  }
  
  return fallback;
}

// Safely convert a value to boolean
export function toBooleanSafe(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const lowercased = value.toLowerCase();
    return lowercased === 'true' || lowercased === '1' || lowercased === 'yes';
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return Boolean(value);
}

// Safely convert to number with fallback
export function toNumberSafe(value: any, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  return fallback;
}

// Safely get nested object property
export function getNestedProperty(obj: any, path: string, fallback: any = null): any {
  if (!obj || typeof obj !== 'object') {
    return fallback;
  }
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return fallback;
    }
    current = current[key];
  }
  
  return current;
}

// Safely convert to date
export function toDateSafe(value: any, fallback?: Date): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? fallback || null : value;
  }
  
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? fallback || null : date;
  }
  
  return fallback || null;
}

// Type guard for checking if value is defined
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Type guard for checking if value is a non-empty string
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// Type guard for checking if value is a non-empty array
export function isNonEmptyArray<T>(value: any): value is T[] {
  return Array.isArray(value) && value.length > 0;
}
