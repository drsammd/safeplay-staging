
// Mock database entities
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'PARENT',
  venueId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockVenueAdmin = {
  id: 'venue-admin-123',
  email: 'admin@venue.com',
  name: 'Venue Admin',
  role: 'VENUE_ADMIN',
  venueId: 'venue-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockCompanyAdmin = {
  id: 'company-admin-123',
  email: 'admin@company.com',
  name: 'Company Admin',
  role: 'SUPER_ADMIN',
  venueId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockVenue = {
  id: 'venue-123',
  name: 'Test Venue',
  address: '123 Test St, Test City, TC 12345',
  phoneNumber: '+1234567890',
  emailAddress: 'contact@testvenue.com',
  isActive: true,
  settings: {
    allowPhotos: true,
    requireParentConsent: true,
    maxCheckInDuration: 480,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockChild = {
  id: 'child-123',
  firstName: 'Test',
  lastName: 'Child',
  dateOfBirth: new Date('2015-01-01'),
  parentId: 'user-123',
  isActive: true,
  specialNeeds: null,
  allergies: [],
  emergencyContacts: [
    {
      name: 'Emergency Contact',
      phone: '+1234567890',
      relationship: 'Grandparent',
    },
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  parent: mockUser,
}

export const mockFace = {
  id: 'face-123',
  faceId: 'aws-face-id-123',
  childId: 'child-123',
  imageUrl: 'https://www.labelvisor.com/content/images/2023/12/Screenshot_1-1-1.png',
  confidence: 99.8,
  boundingBox: {
    width: 0.5,
    height: 0.5,
    left: 0.25,
    top: 0.25,
  },
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  child: mockChild,
}

export const mockCheckIn = {
  id: 'checkin-123',
  childId: 'child-123',
  venueId: 'venue-123',
  checkInTime: new Date('2024-01-01T10:00:00Z'),
  checkOutTime: null,
  status: 'CHECKED_IN',
  notes: null,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  child: mockChild,
  venue: mockVenue,
}

export const mockSubscription = {
  id: 'sub-123',
  userId: 'user-123',
  planId: 'plan-basic',
  status: 'ACTIVE',
  currentPeriodStart: new Date('2024-01-01'),
  currentPeriodEnd: new Date('2024-02-01'),
  cancelAtPeriodEnd: false,
  stripeSubscriptionId: 'stripe-sub-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: mockUser,
}

// Database Mock Factory
export const createDatabaseMock = () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  venue: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  child: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  face: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  checkIn: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  subscription: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
})

// Export prismaMock for use in tests
export const prismaMock = createDatabaseMock()
