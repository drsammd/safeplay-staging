
# mySafePlay™(TM) API Documentation

## Overview

mySafePlay™(TM) provides a comprehensive REST API that powers all application functionality. The API is organized into logical modules covering authentication, venue management, support systems, email automation, and more.

## Table of Contents

1. [API Architecture](#api-architecture)
2. [Authentication](#authentication)
3. [API Modules](#api-modules)
4. [Request/Response Format](#requestresponse-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Webhooks](#webhooks)
8. [SDK & Libraries](#sdk--libraries)

## API Architecture

### Base URL Structure

```
Production: https://api.safeplay.com/v1
Staging: https://staging-api.safeplay.com/v1
Development: http://localhost:3000/api
```

### API Design Principles

- **RESTful Design**: Standard HTTP methods and status codes
- **JSON-First**: All requests and responses use JSON
- **Versioned**: API versioning through URL path
- **Consistent**: Uniform naming conventions and response structures
- **Secure**: Authentication required for all endpoints
- **Rate Limited**: Protection against abuse
- **Well Documented**: Comprehensive documentation and examples

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
X-API-Version: v1
X-Client-Version: 3.0.0
```

## Authentication

### JWT Token Authentication

All API requests require a valid JWT token in the Authorization header:

```typescript
// Get authentication token
const getAuthToken = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  return data.token;
};

// Use token in subsequent requests
const makeAuthenticatedRequest = async (endpoint: string, token: string) => {
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};
```

### Token Refresh

```typescript
// Refresh expired token
const refreshToken = async (refreshToken: string) => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  return response.json();
};
```

## API Modules

### 1. Authentication & User Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/refresh` | POST | Refresh JWT token |
| `/api/auth/verify-email` | POST | Verify email address |
| `/api/auth/reset-password` | POST | Password reset |
| `/api/users/profile` | GET/PUT | User profile management |
| `/api/users/preferences` | GET/PUT | User preferences |

### 2. Identity Verification

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/verification/document/upload` | POST | Upload identity document |
| `/api/verification/status/{id}` | GET | Check verification status |
| `/api/verification/phone/send` | POST | Send phone verification code |
| `/api/verification/phone/verify` | POST | Verify phone code |
| `/api/verification/2fa/setup` | POST | Setup 2FA |
| `/api/verification/2fa/verify` | POST | Verify 2FA code |

### 3. Venue Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/venues` | GET/POST | List/create venues |
| `/api/venues/{id}` | GET/PUT/DELETE | Venue CRUD operations |
| `/api/venues/{id}/cameras` | GET/POST | Camera management |
| `/api/venues/{id}/zones` | GET/POST | Zone management |
| `/api/venues/{id}/staff` | GET/POST | Staff management |
| `/api/venues/{id}/analytics` | GET | Venue analytics |

### 4. Child Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/children` | GET/POST | List/add children |
| `/api/children/{id}` | GET/PUT/DELETE | Child CRUD operations |
| `/api/children/{id}/activities` | GET | Child activity history |
| `/api/children/{id}/alerts` | GET | Child-specific alerts |
| `/api/children/{id}/photos` | GET | Child photo memories |

### 5. Alert System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/alerts` | GET | List alerts |
| `/api/alerts/{id}` | GET/PUT | Alert details/update |
| `/api/alerts/{id}/acknowledge` | POST | Acknowledge alert |
| `/api/alerts/{id}/resolve` | POST | Resolve alert |
| `/api/alerts/settings` | GET/PUT | Alert preferences |

### 6. Support System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/support/tickets` | GET/POST | Ticket management |
| `/api/support/tickets/{id}` | GET/PUT | Ticket details/update |
| `/api/support/tickets/{id}/messages` | GET/POST | Ticket messages |
| `/api/support/ai-chat` | POST | AI chat interaction |
| `/api/support/knowledge-base` | GET | Knowledge base articles |
| `/api/support/knowledge-base/search` | GET | Search articles |

### 7. Email Automation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/email-automation/campaigns` | GET/POST | Campaign management |
| `/api/email-automation/templates` | GET/POST | Template management |
| `/api/email-automation/rules` | GET/POST | Automation rules |
| `/api/email-automation/queue` | GET | Email queue status |
| `/api/email-automation/analytics` | GET | Email analytics |

### 8. Demo System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/demo/venues/{id}/start` | POST | Start demo simulation |
| `/api/demo/venues/{id}/stop` | POST | Stop demo simulation |
| `/api/demo/cameras/{id}/settings` | PUT | Update demo camera |
| `/api/demo/alerts/trigger` | POST | Trigger demo alert |

## Request/Response Format

### Standard Request Format

```typescript
// POST/PUT request example
interface APIRequest<T = any> {
  data: T;
  metadata?: {
    clientVersion: string;
    timestamp: string;
    requestId: string;
  };
}

// Example: Create venue
const createVenue = async (venueData: CreateVenueRequest) => {
  const response = await fetch('/api/venues', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      data: venueData,
      metadata: {
        clientVersion: '3.0.0',
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      }
    })
  });
  
  return response.json();
};
```

### Standard Response Format

```typescript
// Success response
interface APIResponse<T = any> {
  success: true;
  data: T;
  metadata: {
    timestamp: string;
    requestId: string;
    version: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error response
interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}
```

### Pagination

```typescript
// Paginated request
const getPaginatedData = async (endpoint: string, options: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}) => {
  const params = new URLSearchParams({
    page: (options.page || 1).toString(),
    limit: (options.limit || 20).toString(),
    ...(options.sortBy && { sortBy: options.sortBy }),
    ...(options.sortOrder && { sortOrder: options.sortOrder }),
    ...(options.filters && { filters: JSON.stringify(options.filters) })
  });
  
  const response = await fetch(`${endpoint}?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
};
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Examples

```typescript
// Validation error (422)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "email": ["Email is required"],
        "password": ["Password must be at least 8 characters"]
      }
    }
  },
  "metadata": {
    "timestamp": "2025-07-04T10:30:00Z",
    "requestId": "req_123456789",
    "version": "v1"
  }
}

// Authentication error (401)
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": {
      "tokenExpired": true,
      "refreshRequired": true
    }
  },
  "metadata": {
    "timestamp": "2025-07-04T10:30:00Z",
    "requestId": "req_123456789",
    "version": "v1"
  }
}
```

### Error Handling Best Practices

```typescript
// Comprehensive error handling
const handleAPIResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  
  if (!response.ok) {
    const error = new APIError(
      data.error.message,
      response.status,
      data.error.code,
      data.error.details
    );
    
    // Handle specific error types
    switch (response.status) {
      case 401:
        // Redirect to login or refresh token
        await handleAuthenticationError(error);
        break;
      case 422:
        // Handle validation errors
        handleValidationErrors(error.details.fields);
        break;
      case 429:
        // Handle rate limiting
        await handleRateLimit(error);
        break;
      default:
        // Generic error handling
        handleGenericError(error);
    }
    
    throw error;
  }
  
  return data.data;
};

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}
```

## Rate Limiting

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1625097600
X-RateLimit-Window: 3600
```

### Rate Limits by Endpoint Category

| Category | Limit | Window |
|----------|-------|--------|
| Authentication | 10 requests | 15 minutes |
| General API | 1000 requests | 1 hour |
| File Upload | 50 requests | 1 hour |
| Email Sending | 100 requests | 1 hour |
| Support Chat | 200 requests | 1 hour |

### Rate Limit Handling

```typescript
const handleRateLimit = async (error: APIError) => {
  if (error.status === 429) {
    const resetTime = error.details?.resetTime;
    const waitTime = resetTime ? new Date(resetTime).getTime() - Date.now() : 60000;
    
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Retry the original request
    return retryRequest();
  }
};
```

## Webhooks

### Webhook Events

mySafePlay™(TM) supports webhooks for real-time event notifications:

```typescript
// Webhook event types
type WebhookEvent = 
  | 'user.created'
  | 'user.verified'
  | 'child.checked_in'
  | 'child.checked_out'
  | 'alert.created'
  | 'alert.resolved'
  | 'ticket.created'
  | 'ticket.resolved'
  | 'email.sent'
  | 'email.delivered';

// Webhook payload structure
interface WebhookPayload {
  event: WebhookEvent;
  data: any;
  timestamp: string;
  signature: string; // HMAC signature for verification
}
```

### Webhook Configuration

```typescript
// Configure webhook endpoint
const configureWebhook = async (webhookConfig: {
  url: string;
  events: WebhookEvent[];
  secret: string;
}) => {
  const response = await fetch('/api/webhooks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(webhookConfig)
  });
  
  return response.json();
};
```

### Webhook Verification

```typescript
// Verify webhook signature
const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
```

## SDK & Libraries

### JavaScript/TypeScript SDK

```typescript
// mySafePlay™(TM) SDK usage
import { mySafePlay™(TM)API } from '@safeplay/sdk';

const api = new mySafePlay™(TM)API({
  baseURL: 'https://api.safeplay.com/v1',
  apiKey: 'your-api-key'
});

// Authentication
await api.auth.login('user@example.com', 'password');

// Venue management
const venues = await api.venues.list();
const venue = await api.venues.create({
  name: 'My Daycare',
  address: '123 Main St',
  type: 'DAYCARE'
});

// Child management
const children = await api.children.list();
const child = await api.children.create({
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '2018-01-01'
});

// Support system
const ticket = await api.support.createTicket({
  title: 'Camera not working',
  description: 'Camera 1 is offline',
  category: 'TECHNICAL_ISSUE'
});
```

### Python SDK

```python
# mySafePlay™(TM) Python SDK
from safeplay import mySafePlay™(TM)API

api = mySafePlay™(TM)API(
    base_url='https://api.safeplay.com/v1',
    api_key='your-api-key'
)

# Authentication
api.auth.login('user@example.com', 'password')

# Venue management
venues = api.venues.list()
venue = api.venues.create({
    'name': 'My Daycare',
    'address': '123 Main St',
    'type': 'DAYCARE'
})

# Analytics
analytics = api.venues.get_analytics(venue['id'], {
    'start_date': '2025-01-01',
    'end_date': '2025-01-31'
})
```

### API Testing

```typescript
// Jest test example
describe('mySafePlay™(TM) API', () => {
  let api: mySafePlay™(TM)API;
  
  beforeEach(() => {
    api = new mySafePlay™(TM)API({
      baseURL: 'http://localhost:3000/api',
      apiKey: process.env.TEST_API_KEY
    });
  });
  
  test('should create venue', async () => {
    const venueData = {
      name: 'Test Venue',
      address: '123 Test St',
      type: 'DAYCARE'
    };
    
    const venue = await api.venues.create(venueData);
    
    expect(venue).toMatchObject(venueData);
    expect(venue.id).toBeDefined();
  });
  
  test('should handle authentication errors', async () => {
    api.setApiKey('invalid-key');
    
    await expect(api.venues.list()).rejects.toThrow('Unauthorized');
  });
});
```

---

*For detailed endpoint documentation and examples, see the specific API module documentation files.*
