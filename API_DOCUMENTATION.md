
# SafePlay™ API Documentation

## Overview

The SafePlay API provides comprehensive endpoints for child safety monitoring, venue management, parent communication, and administrative functions. All endpoints follow RESTful conventions with consistent JSON responses and proper HTTP status codes.

**Base URL**: `https://your-domain.com/api`  
**Version**: 1.4.1  
**Authentication**: NextAuth.js with role-based access control

## Authentication

### Session-Based Authentication
SafePlay uses NextAuth.js for session management with multiple authentication providers:

```typescript
// Check authentication status
GET /api/auth/session
Response: {
  user: {
    id: string,
    email: string,
    role: "COMPANY_ADMIN" | "VENUE_ADMIN" | "PARENT",
    name: string
  },
  expires: string
}
```

### Endpoints
- `POST /api/auth/signup` - User registration with identity verification
- `POST /api/auth/signin` - Secure login with optional MFA
- `POST /api/auth/signout` - Session termination
- `GET /api/auth/user` - Current user information
- `POST /api/auth/verify-auto-signin` - Auto-signin verification

## Core API Endpoints

### User Management

#### Get Current User
```http
GET /api/auth/user
Authorization: Session required
```
**Response:**
```json
{
  "id": "user_123",
  "email": "parent@example.com",
  "role": "PARENT",
  "name": "John Doe",
  "verificationStatus": "VERIFIED",
  "createdAt": "2025-01-13T00:00:00Z"
}
```

#### Update User Profile
```http
PUT /api/auth/user
Authorization: Session required
Content-Type: application/json
```
**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+1234567890",
  "emergencyContact": {
    "name": "Emergency Contact",
    "phone": "+0987654321"
  }
}
```

### Children Management

#### List Children
```http
GET /api/children
Authorization: Parent or Venue Admin session required
```
**Response:**
```json
{
  "children": [
    {
      "id": "child_123",
      "name": "Emma Doe",
      "age": 8,
      "photoUrl": "https://i.pinimg.com/originals/3a/35/75/3a35759475cdd7dc4edf86137782d60b.jpg",
      "allergies": ["nuts", "dairy"],
      "medicalConditions": [],
      "parentId": "user_123",
      "isActive": true,
      "lastLocation": {
        "venueId": "venue_456",
        "zone": "play_area_1",
        "timestamp": "2025-01-13T14:30:00Z"
      }
    }
  ]
}
```

#### Register New Child
```http
POST /api/children
Authorization: Parent session required
Content-Type: application/json
```
**Request Body:**
```json
{
  "name": "Emma Doe",
  "dateOfBirth": "2016-05-15",
  "photoUrl": "https://i.pinimg.com/originals/88/43/06/88430667c332b1f52fbb40ccf062bf59.jpg",
  "allergies": ["nuts"],
  "medicalConditions": ["asthma"],
  "emergencyContacts": [
    {
      "name": "Jane Doe",
      "relationship": "Mother",
      "phone": "+1234567890"
    }
  ],
  "specialInstructions": "Requires inhaler during physical activity"
}
```

#### Update Child Information
```http
PUT /api/children/[id]
Authorization: Parent session required
Content-Type: application/json
```

#### Get Child Location
```http
GET /api/children/[id]/location
Authorization: Parent or Venue Admin session required
```
**Response:**
```json
{
  "childId": "child_123",
  "currentLocation": {
    "venueId": "venue_456",
    "zone": "play_area_1",
    "coordinates": { "x": 125, "y": 89 },
    "timestamp": "2025-01-13T14:30:00Z",
    "confidence": 0.95
  },
  "recentActivity": [
    {
      "zone": "entrance",
      "action": "CHECK_IN",
      "timestamp": "2025-01-13T13:00:00Z"
    }
  ]
}
```

### Check-in/Check-out System

#### Process Check-in
```http
POST /api/check-in-out
Authorization: Venue Admin session required
Content-Type: application/json
```
**Request Body:**
```json
{
  "action": "CHECK_IN",
  "qrCode": "QR_CODE_DATA",
  "childId": "child_123",
  "venueId": "venue_456",
  "timestamp": "2025-01-13T13:00:00Z",
  "staffMemberId": "staff_789"
}
```

#### Bulk Check-in/Check-out
```http
POST /api/check-in-out/bulk
Authorization: Venue Admin session required
Content-Type: application/json
```
**Request Body:**
```json
{
  "action": "CHECK_IN",
  "entries": [
    {
      "childId": "child_123",
      "qrCode": "QR_CODE_DATA_1"
    },
    {
      "childId": "child_456", 
      "qrCode": "QR_CODE_DATA_2"
    }
  ],
  "venueId": "venue_456",
  "staffMemberId": "staff_789"
}
```

### Safety Alerts

#### Get Active Alerts
```http
GET /api/alerts
Authorization: Venue Admin session required
Query Parameters:
  - priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  - status: "ACTIVE" | "RESOLVED" | "ACKNOWLEDGED"
  - venueId: string
```
**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_123",
      "type": "UNAUTHORIZED_AREA_ACCESS",
      "priority": "MEDIUM",
      "childId": "child_123",
      "venueId": "venue_456",
      "zone": "restricted_area",
      "message": "Child detected in restricted staff area",
      "timestamp": "2025-01-13T14:35:00Z",
      "status": "ACTIVE",
      "staffAssigned": "staff_789"
    }
  ],
  "summary": {
    "total": 1,
    "byPriority": {
      "LOW": 0,
      "MEDIUM": 1,
      "HIGH": 0,
      "CRITICAL": 0
    }
  }
}
```

#### Create Safety Alert
```http
POST /api/alerts
Authorization: System or Venue Admin session required
Content-Type: application/json
```
**Request Body:**
```json
{
  "type": "SAFETY_INCIDENT",
  "priority": "HIGH",
  "childId": "child_123",
  "venueId": "venue_456",
  "zone": "play_area_2",
  "message": "Child requires immediate attention",
  "metadata": {
    "cameraId": "cam_001",
    "confidence": 0.87,
    "autoGenerated": true
  }
}
```

#### Update Alert Status
```http
PUT /api/alerts/[id]
Authorization: Venue Admin session required
Content-Type: application/json
```
**Request Body:**
```json
{
  "status": "RESOLVED",
  "resolution": "Issue resolved - parent contacted and child assisted",
  "staffMemberId": "staff_789",
  "resolvedAt": "2025-01-13T14:45:00Z"
}
```

### Subscription Management

#### Get Available Plans
```http
GET /api/stripe/plans
Authorization: Parent session required
```
**Response:**
```json
{
  "plans": [
    {
      "id": "basic_monthly",
      "name": "Basic Plan",
      "price": 2999,
      "currency": "usd",
      "interval": "month",
      "features": [
        "Up to 2 children",
        "Basic tracking",
        "Email notifications"
      ],
      "stripePriceId": "price_basic_monthly"
    },
    {
      "id": "premium_monthly",
      "name": "Premium Plan", 
      "price": 4999,
      "currency": "usd",
      "interval": "month",
      "features": [
        "Up to 5 children",
        "Advanced AI monitoring",
        "Real-time alerts",
        "Photo sharing"
      ],
      "stripePriceId": "price_premium_monthly"
    }
  ]
}
```

#### Create Subscription
```http
POST /api/stripe/subscription
Authorization: Parent session required
Content-Type: application/json
```
**Request Body:**
```json
{
  "planId": "premium_monthly",
  "paymentMethodId": "pm_1234567890",
  "billingAddress": {
    "line1": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "postalCode": "12345",
    "country": "US"
  }
}
```

#### Update Subscription
```http
PUT /api/stripe/subscription
Authorization: Parent session required
Content-Type: application/json
```
**Request Body:**
```json
{
  "newPlanId": "basic_monthly",
  "prorationBehavior": "create_prorations"
}
```

#### Get Payment Methods
```http
GET /api/stripe/payment-methods
Authorization: Parent session required
```

#### Add Payment Method
```http
POST /api/stripe/payment-methods
Authorization: Parent session required
Content-Type: application/json
```
**Request Body:**
```json
{
  "paymentMethodId": "pm_1234567890",
  "setAsDefault": true
}
```

### Venue Management

#### Get Venue Information
```http
GET /api/venues
Authorization: Venue Admin session required
```
**Response:**
```json
{
  "venues": [
    {
      "id": "venue_456",
      "name": "Happy Kids Play Center",
      "address": {
        "line1": "456 Play Street",
        "city": "Funtown",
        "state": "CA",
        "postalCode": "54321"
      },
      "capacity": 100,
      "currentOccupancy": 45,
      "status": "ACTIVE",
      "features": [
        "face_recognition",
        "real_time_tracking",
        "ai_monitoring"
      ],
      "operatingHours": {
        "monday": { "open": "09:00", "close": "18:00" },
        "tuesday": { "open": "09:00", "close": "18:00" }
      }
    }
  ]
}
```

### QR Code Management

#### Generate QR Code
```http
POST /api/qr-codes
Authorization: Venue Admin session required
Content-Type: application/json
```
**Request Body:**
```json
{
  "familyId": "family_123",
  "venueId": "venue_456",
  "validUntil": "2025-12-31T23:59:59Z",
  "maxUses": 100,
  "metadata": {
    "generatedBy": "staff_789",
    "purpose": "family_access"
  }
}
```

#### Validate QR Code
```http
POST /api/qr-codes/validate
Authorization: Venue Admin session required
Content-Type: application/json
```
**Request Body:**
```json
{
  "qrCodeData": "encrypted_qr_data",
  "venueId": "venue_456"
}
```

### Address Autocomplete

#### Get Address Suggestions
```http
GET /api/verification/address
Authorization: Authenticated session required
Query Parameters:
  - query: string (minimum 3 characters)
  - limit: number (default: 5)
  - country: string (default: "US")
```
**Response:**
```json
{
  "suggestions": [
    {
      "formatted": "123 Main Street, Anytown, CA 12345, USA",
      "line1": "123 Main Street",
      "city": "Anytown",
      "state": "CA",
      "postalCode": "12345",
      "country": "US",
      "placeId": "geoapify_place_123"
    }
  ]
}
```

### Analytics and Reporting

#### Get Venue Analytics
```http
GET /api/analytics/venues/[venueId]
Authorization: Venue Admin or Company Admin session required
Query Parameters:
  - startDate: ISO date string
  - endDate: ISO date string
  - metrics: comma-separated list
```

#### Get Safety Reports
```http
GET /api/analytics/safety
Authorization: Venue Admin session required
Query Parameters:
  - period: "daily" | "weekly" | "monthly"
  - venueId: string
```

### Emergency Contacts

#### Get Emergency Contacts
```http
GET /api/emergency-contacts
Authorization: Parent or Venue Admin session required
```

#### Update Emergency Contact
```http
PUT /api/emergency-contacts/[id]
Authorization: Parent session required
Content-Type: application/json
```
**Request Body:**
```json
{
  "name": "Updated Contact Name",
  "phone": "+1234567890",
  "relationship": "Guardian",
  "isPrimary": true
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Valid email address is required"
      }
    ]
  },
  "timestamp": "2025-01-13T14:30:00Z",
  "requestId": "req_123456"
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED` (401) - Valid session required
- `INSUFFICIENT_PERMISSIONS` (403) - User lacks required permissions
- `RESOURCE_NOT_FOUND` (404) - Requested resource doesn't exist
- `VALIDATION_ERROR` (400) - Request validation failed
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_SERVER_ERROR` (500) - Server error occurred

## Rate Limiting

- **General API calls**: 100 requests per minute per user
- **Authentication endpoints**: 10 requests per minute per IP
- **Real-time location updates**: 60 requests per minute per child
- **File uploads**: 10 requests per minute per user

## Webhooks

### Stripe Payment Webhooks
```http
POST /api/stripe/webhooks
Content-Type: application/json
```
Handles Stripe payment events for subscription management.

### System Status
```http
GET /api/health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-13T14:30:00Z",
  "version": "1.4.1",
  "services": {
    "database": "connected",
    "stripe": "operational",
    "aws": "operational",
    "geoapify": "operational"
  }
}
```

## SDK and Integration

### JavaScript SDK Example
```javascript
import { SafePlayAPI } from '@safeplay/sdk';

const client = new SafePlayAPI({
  baseURL: 'https://your-domain.com/api',
  sessionToken: 'your-session-token'
});

// Get child location
const location = await client.children.getLocation('child_123');

// Create safety alert
const alert = await client.alerts.create({
  type: 'SAFETY_INCIDENT',
  childId: 'child_123',
  message: 'Child needs assistance'
});
```

## Version Information

**API Version**: 1.4.1  
**Last Updated**: January 13, 2025  
**Compatibility**: Backward compatible with v1.4.x  
**Documentation**: Complete and up-to-date

---

For technical support or API questions, contact the SafePlay development team or refer to the comprehensive documentation at `/docs`.
