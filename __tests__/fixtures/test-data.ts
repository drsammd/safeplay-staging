
// Test fixture data for consistent testing
export const testUsers = {
  parent: {
    id: 'user-parent-123',
    email: 'parent@test.com',
    name: 'Test Parent',
    role: 'PARENT' as const,
    venueId: null,
    hashedPassword: '$2b$12$test.hashed.password',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  venueAdmin: {
    id: 'user-venue-admin-123',
    email: 'venue-admin@test.com',
    name: 'Test Venue Admin',
    role: 'VENUE_ADMIN' as const,
    venueId: 'venue-123',
    hashedPassword: '$2b$12$test.hashed.password',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  companyAdmin: {
    id: 'user-company-admin-123',
    email: 'company-admin@test.com',
    name: 'Test Company Admin',
    role: 'SUPER_ADMIN' as const,
    venueId: null,
    hashedPassword: '$2b$12$test.hashed.password',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}

export const testVenues = {
  active: {
    id: 'venue-123',
    name: 'Test Fun Center',
    address: '123 Test Street, Test City, TC 12345',
    phoneNumber: '+1234567890',
    emailAddress: 'contact@testfuncenter.com',
    isActive: true,
    settings: {
      allowPhotos: true,
      requireParentConsent: true,
      maxCheckInDuration: 480, // 8 hours
      alertThresholds: {
        unauthorizedEntry: true,
        extendedStay: 6, // hours
        parentNotification: 4, // hours
      },
    },
    subscriptionPlan: 'PREMIUM',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  inactive: {
    id: 'venue-456',
    name: 'Inactive Test Center',
    address: '456 Test Avenue, Test City, TC 12345',
    phoneNumber: '+1234567891',
    emailAddress: 'contact@inactivetest.com',
    isActive: false,
    settings: {
      allowPhotos: false,
      requireParentConsent: true,
      maxCheckInDuration: 240,
    },
    subscriptionPlan: 'BASIC',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}

export const testChildren = {
  active: {
    id: 'child-123',
    firstName: 'Alex',
    lastName: 'Johnson',
    dateOfBirth: new Date('2015-06-15'),
    parentId: 'user-parent-123',
    isActive: true,
    specialNeeds: null,
    allergies: ['Peanuts', 'Shellfish'],
    emergencyContacts: [
      {
        name: 'Sarah Johnson',
        phone: '+1234567892',
        relationship: 'Mother',
        isPrimary: true,
      },
      {
        name: 'Mike Johnson',
        phone: '+1234567893',
        relationship: 'Father',
        isPrimary: false,
      },
    ],
    medicalInfo: {
      conditions: [],
      medications: [],
      dietaryRestrictions: ['Vegetarian'],
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  withSpecialNeeds: {
    id: 'child-456',
    firstName: 'Sam',
    lastName: 'Smith',
    dateOfBirth: new Date('2016-03-20'),
    parentId: 'user-parent-123',
    isActive: true,
    specialNeeds: 'Autism Spectrum Disorder - requires quiet spaces',
    allergies: [],
    emergencyContacts: [
      {
        name: 'Lisa Smith',
        phone: '+1234567894',
        relationship: 'Mother',
        isPrimary: true,
      },
    ],
    medicalInfo: {
      conditions: ['Autism Spectrum Disorder'],
      medications: [],
      dietaryRestrictions: [],
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}

export const testFaces = {
  registered: {
    id: 'face-123',
    faceId: 'aws-face-id-123',
    childId: 'child-123',
    imageUrl: 'https://i.ytimg.com/vi/Osx-UEg_gbo/maxresdefault.jpg',
    confidence: 99.8,
    boundingBox: {
      width: 0.4,
      height: 0.6,
      left: 0.3,
      top: 0.2,
    },
    isActive: true,
    registrationDate: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  lowConfidence: {
    id: 'face-456',
    faceId: 'aws-face-id-456',
    childId: 'child-456',
    imageUrl: 'https://sources.roboflow.com/WhUy87cMYoP6SWRkY3xcQxn761D2/V9scmBv8LEXvIIefzACt/original.jpg',
    confidence: 75.2,
    boundingBox: {
      width: 0.3,
      height: 0.5,
      left: 0.35,
      top: 0.25,
    },
    isActive: false,
    registrationDate: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}

export const testCheckIns = {
  active: {
    id: 'checkin-123',
    childId: 'child-123',
    venueId: 'venue-123',
    checkInTime: new Date('2024-01-01T10:00:00Z'),
    checkOutTime: null,
    status: 'CHECKED_IN' as const,
    checkInMethod: 'FACIAL_RECOGNITION' as const,
    notes: null,
    alertsTriggered: [],
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  },
  completed: {
    id: 'checkin-456',
    childId: 'child-123',
    venueId: 'venue-123',
    checkInTime: new Date('2024-01-01T09:00:00Z'),
    checkOutTime: new Date('2024-01-01T15:00:00Z'),
    status: 'CHECKED_OUT' as const,
    checkInMethod: 'FACIAL_RECOGNITION' as const,
    notes: 'Great day at the venue!',
    alertsTriggered: [],
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T15:00:00Z'),
  },
}

export const testSubscriptions = {
  active: {
    id: 'sub-123',
    userId: 'user-parent-123',
    planId: 'plan-premium',
    status: 'ACTIVE' as const,
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: 'stripe_sub_123',
    stripeCustomerId: 'stripe_cus_123',
    planDetails: {
      name: 'Premium Plan',
      price: 2999, // $29.99
      features: ['Unlimited children', 'Advanced analytics', 'Priority support'],
      childLimit: null,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  canceled: {
    id: 'sub-456',
    userId: 'user-parent-123',
    planId: 'plan-basic',
    status: 'CANCELED' as const,
    currentPeriodStart: new Date('2023-12-01'),
    currentPeriodEnd: new Date('2024-01-01'),
    cancelAtPeriodEnd: true,
    stripeSubscriptionId: 'stripe_sub_456',
    stripeCustomerId: 'stripe_cus_456',
    planDetails: {
      name: 'Basic Plan',
      price: 999, // $9.99
      features: ['Up to 3 children', 'Basic tracking'],
      childLimit: 3,
    },
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-01'),
  },
}

export const testApiRequests = {
  validChildRegistration: {
    firstName: 'New',
    lastName: 'Child',
    dateOfBirth: '2016-05-20',
    allergies: ['Dairy'],
    specialNeeds: '',
    emergencyContacts: [
      {
        name: 'Parent One',
        phone: '+1234567890',
        relationship: 'Mother',
      },
    ],
  },
  invalidChildRegistration: {
    firstName: '', // Invalid: empty name
    lastName: 'Child',
    dateOfBirth: '2030-01-01', // Invalid: future date
    allergies: [],
    emergencyContacts: [], // Invalid: no emergency contacts
  },
  validFaceRegistration: {
    childId: 'child-123',
    image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Mock base64 image
  },
  invalidFaceRegistration: {
    childId: '', // Invalid: empty child ID
    image: 'invalid-image-data', // Invalid: not a valid image
  },
}
