
# Database Schema Documentation

## Overview

mySafePlay™(TM) uses a comprehensive SQLite database schema designed to handle all aspects of child safety management, from user authentication to real-time monitoring and support systems. The schema includes 50+ models with complex relationships and optimized indexes.

## Table of Contents

1. [Schema Architecture](#schema-architecture)
2. [Core Models](#core-models)
3. [Authentication & Verification](#authentication--verification)
4. [Venue & Child Management](#venue--child-management)
5. [Support System Models](#support-system-models)
6. [Email Automation Models](#email-automation-models)
7. [Analytics & Reporting](#analytics--reporting)
8. [Relationships & Indexes](#relationships--indexes)
9. [Migration Guide](#migration-guide)

## Schema Architecture

### Database Configuration

```prisma
generator client {
    provider = "prisma-client-js"
    binaryTargets = ["native", "linux-musl-arm64-openssl-3.0.x"]
}

datasource db {
    provider = "sqlite"
    url      = env("DATABASE_URL")
}
```

### Model Categories

The database schema is organized into logical categories:

1. **User Management** - Users, authentication, verification
2. **Venue Operations** - Venues, cameras, zones, staff
3. **Child Safety** - Children, activities, alerts, monitoring
4. **Support System** - Tickets, chat, knowledge base, agents
5. **Email Automation** - Templates, campaigns, queues, analytics
6. **Communication** - Messaging, notifications, media sharing
7. **Analytics** - Reports, metrics, performance tracking
8. **Legal & Compliance** - Agreements, privacy, audit trails

## Core Models

### User Model

The central user model with comprehensive verification and relationship fields:

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String
  name              String
  role              UserRole
  phone             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Identity & Phone Verification Fields
  phoneVerified     Boolean   @default(false)
  phoneVerifiedAt   DateTime?
  identityVerified  Boolean   @default(false)
  identityVerifiedAt DateTime?
  verificationLevel VerificationLevel @default(UNVERIFIED)
  twoFactorEnabled  Boolean   @default(false)
  twoFactorSecret   String?   // For authenticator apps
  twoFactorPhone    String?   // Phone number for SMS 2FA
  verificationNotes String?   // Admin notes about verification status
  
  // Relationships (50+ relations)
  accounts          Account[]
  children          Child[]   @relation("ParentChildren")
  managedVenues     Venue[]   @relation("VenueAdmin")
  supportTickets    SupportTicket[] @relation("UserSupportTickets")
  supportAgent      SupportAgent?   @relation("UserSupportAgent")
  // ... many more relationships
  
  @@map("users")
}
```

### User Roles & Verification Levels

```prisma
enum UserRole {
  PARENT
  GUARDIAN
  VENUE_ADMIN
  STAFF_MEMBER
  SUPPORT_AGENT
  SYSTEM_ADMIN
  SUPER_ADMIN
}

enum VerificationLevel {
  UNVERIFIED
  EMAIL_VERIFIED
  PHONE_VERIFIED
  IDENTITY_VERIFIED
  FULLY_VERIFIED
}
```

### Venue Model

Comprehensive venue management with zones, cameras, and staff:

```prisma
model Venue {
  id                String    @id @default(cuid())
  name              String
  address           String
  city              String
  state             String
  zipCode           String
  country           String    @default("US")
  phone             String?
  email             String?
  website           String?
  
  // Venue Configuration
  type              VenueType
  capacity          Int
  ageGroups         Json      // Supported age groups
  operatingHours    Json      // Daily operating hours
  timezone          String    @default("America/New_York")
  
  // Safety Configuration
  alertSettings     Json      // Alert configuration
  emergencyContacts Json      // Emergency contact information
  safetyProtocols   Json      // Safety protocols and procedures
  
  // Status & Metadata
  status            VenueStatus @default(ACTIVE)
  subscriptionTier  SubscriptionTier @default(BASIC)
  features          Json      // Enabled features
  
  // Relationships
  adminId           String
  admin             User      @relation("VenueAdmin", fields: [adminId], references: [id])
  cameras           Camera[]  @relation("VenueCameras")
  zones             Zone[]    @relation("VenueZones")
  children          Child[]   @relation("VenueChildren")
  staff             Staff[]   @relation("VenueStaff")
  alerts            Alert[]   @relation("VenueAlerts")
  supportTickets    SupportTicket[] @relation("VenueSupportTickets")
  
  @@map("venues")
}
```

### Child Model

Detailed child information with safety and activity tracking:

```prisma
model Child {
  id                     String                 @id @default(cuid())
  firstName              String
  lastName               String
  dateOfBirth            DateTime
  profilePhoto           String?
  
  // Safety Information
  medicalConditions      Json?                  // Medical conditions and allergies
  emergencyContacts      Json                   // Emergency contact information
  specialInstructions    Json?                  // Special care instructions
  
  // Venue Assignment
  venueId                String?
  venue                  Venue?                 @relation("VenueChildren", fields: [venueId], references: [id])
  
  // Parent Relationships
  parentId               String
  parent                 User                   @relation("ParentChildren", fields: [parentId], references: [id])
  
  // Activity & Safety Tracking
  activities             Activity[]             @relation("ChildActivities")
  alerts                 Alert[]                @relation("ChildAlerts")
  checkInOutEvents       CheckInOutEvent[]      @relation("ChildCheckInOut")
  memories               Memory[]               @relation("ChildMemories")
  
  @@map("children")
}
```

## Authentication & Verification

### Identity Verification Models

```prisma
model IdentityVerification {
  id                String                    @id @default(cuid())
  userId            String
  documentType      IdentityDocumentType
  documentNumber    String?
  documentImages    Json                      // Uploaded document images
  
  // AI Verification Results
  aiProcessingStatus AIProcessingStatus       @default(PENDING)
  aiConfidence      Float?                    // 0-1 confidence score
  aiResults         Json?                     // Detailed AI analysis results
  extractedData     Json?                     // Extracted document data
  
  // Manual Review
  reviewStatus      ReviewStatus              @default(PENDING)
  reviewedBy        String?
  reviewedAt        DateTime?
  reviewNotes       String?
  
  // Status & Timestamps
  status            VerificationStatus        @default(PENDING)
  submittedAt       DateTime                  @default(now())
  completedAt       DateTime?
  expiresAt         DateTime?
  
  // Relations
  user              User                      @relation("UserIdentityVerifications", fields: [userId], references: [id])
  
  @@map("identity_verifications")
}

model TwoFactorAttempt {
  id                String                    @id @default(cuid())
  userId            String
  method            TwoFactorMethod
  code              String                    // Hashed verification code
  isUsed            Boolean                   @default(false)
  expiresAt         DateTime
  createdAt         DateTime                  @default(now())
  
  user              User                      @relation("UserTwoFactorAttempts", fields: [userId], references: [id])
  
  @@map("two_factor_attempts")
}
```

### WebAuthn Support

```prisma
model WebAuthnCredential {
  id                String                    @id @default(cuid())
  userId            String
  credentialId      String                    @unique
  publicKey         String
  counter           Int                       @default(0)
  deviceName        String?
  createdAt         DateTime                  @default(now())
  lastUsedAt        DateTime?
  
  user              User                      @relation("UserWebAuthnCredentials", fields: [userId], references: [id])
  
  @@map("webauthn_credentials")
}
```

## Venue & Child Management

### Camera & Zone Models

```prisma
model Camera {
  id                String                    @id @default(cuid())
  name              String
  venueId           String
  zoneId            String?
  
  // Camera Configuration
  ipAddress         String?
  streamUrl         String?
  recordingEnabled  Boolean                   @default(true)
  motionDetection   Boolean                   @default(true)
  faceRecognition   Boolean                   @default(true)
  
  // AI Processing Settings
  aiEnabled         Boolean                   @default(true)
  confidenceThreshold Float                  @default(0.8)
  processingInterval Int                      @default(5) // seconds
  
  // Status & Health
  status            CameraStatus              @default(OFFLINE)
  lastPing          DateTime?
  healthScore       Float?                    // 0-1 health score
  
  // Relations
  venue             Venue                     @relation("VenueCameras", fields: [venueId], references: [id])
  zone              Zone?                     @relation("ZoneCameras", fields: [zoneId], references: [id])
  alerts            Alert[]                   @relation("CameraAlerts")
  activities        Activity[]                @relation("CameraActivities")
  
  @@map("cameras")
}

model Zone {
  id                String                    @id @default(cuid())
  name              String
  venueId           String
  
  // Zone Configuration
  type              ZoneType
  capacity          Int?
  ageRestrictions   Json?                     // Age-based access rules
  safetyLevel       SafetyLevel               @default(NORMAL)
  
  // Geometric Definition
  coordinates       Json                      // Zone boundary coordinates
  floorPlanId       String?
  
  // Relations
  venue             Venue                     @relation("VenueZones", fields: [venueId], references: [id])
  cameras           Camera[]                  @relation("ZoneCameras")
  activities        Activity[]                @relation("ZoneActivities")
  alerts            Alert[]                   @relation("ZoneAlerts")
  
  @@map("zones")
}
```

### Activity & Alert Models

```prisma
model Activity {
  id                String                    @id @default(cuid())
  childId           String
  venueId           String
  cameraId          String?
  zoneId            String?
  
  // Activity Details
  type              ActivityType
  description       String?
  confidence        Float                     // AI confidence score
  
  // Temporal Information
  startTime         DateTime                  @default(now())
  endTime           DateTime?
  duration          Int?                      // Duration in seconds
  
  // Spatial Information
  coordinates       Json?                     // Location coordinates
  boundingBox       Json?                     // Detection bounding box
  
  // AI Analysis
  aiAnalysis        Json?                     // Detailed AI analysis
  riskScore         Float?                    // Risk assessment score
  
  // Relations
  child             Child                     @relation("ChildActivities", fields: [childId], references: [id])
  venue             Venue                     @relation("VenueActivities", fields: [venueId], references: [id])
  camera            Camera?                   @relation("CameraActivities", fields: [cameraId], references: [id])
  zone              Zone?                     @relation("ZoneActivities", fields: [zoneId], references: [id])
  
  @@map("activities")
}

model Alert {
  id                String                    @id @default(cuid())
  type              AlertType
  severity          AlertSeverity
  title             String
  description       String
  
  // Context Information
  childId           String?
  venueId           String
  cameraId          String?
  zoneId            String?
  
  // Alert Status
  status            AlertStatus               @default(ACTIVE)
  acknowledgedAt    DateTime?
  acknowledgedBy    String?
  resolvedAt        DateTime?
  resolvedBy        String?
  resolution        String?
  
  // AI Information
  aiGenerated       Boolean                   @default(false)
  aiConfidence      Float?
  aiRecommendations Json?
  
  // Relations
  child             Child?                    @relation("ChildAlerts", fields: [childId], references: [id])
  venue             Venue                     @relation("VenueAlerts", fields: [venueId], references: [id])
  camera            Camera?                   @relation("CameraAlerts", fields: [cameraId], references: [id])
  zone              Zone?                     @relation("ZoneAlerts", fields: [zoneId], references: [id])
  
  @@map("alerts")
}
```

## Support System Models

### Support Ticket System

```prisma
model SupportTicket {
  id                      String                    @id @default(cuid())
  ticketNumber            String                    @unique // Auto-generated (e.g., "SP-2025-001")
  title                   String
  description             String
  userId                  String                    // User who created the ticket
  userRole                UserRole                  // Role of the user (for routing)
  venueId                 String?                   // Associated venue (if applicable)
  category                SupportTicketCategory
  subCategory             String?                   // More specific categorization
  priority                SupportTicketPriority     @default(MEDIUM)
  status                  SupportTicketStatus       @default(OPEN)
  severity                SupportTicketSeverity     @default(NORMAL)
  source                  SupportTicketSource       @default(WEB_FORM)
  
  // AI Processing Fields
  aiProcessed             Boolean                   @default(false)
  aiSuggestions           Json?                     // AI-generated suggestions
  aiConfidence            Float?                    // AI confidence (0-1)
  aiResponse              String?                   // AI-generated response
  aiResolutionAttempted   Boolean                   @default(false)
  aiEscalationReason      String?                   // Why AI escalated
  
  // Assignment & Escalation
  assignedToId            String?
  assignedAt              DateTime?
  escalationLevel         Int                       @default(1)
  escalatedAt             DateTime?
  escalationReason        String?
  
  // Resolution Tracking
  firstResponseAt         DateTime?
  resolvedAt              DateTime?
  closedAt                DateTime?
  resolutionTime          Int?                      // Minutes to resolution
  customerSatisfaction    Int?                      // 1-5 rating
  satisfactionFeedback    String?
  
  // SLA Tracking
  slaBreached             Boolean                   @default(false)
  slaTarget               DateTime?                 // Target resolution time
  
  // Timestamps
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime                  @updatedAt
  
  // Relations
  user                    User                      @relation("UserSupportTickets", fields: [userId], references: [id])
  venue                   Venue?                    @relation("VenueSupportTickets", fields: [venueId], references: [id])
  assignedTo              SupportAgent?             @relation("AssignedSupportTickets", fields: [assignedToId], references: [id])
  messages                SupportTicketMessage[]
  timelineEntries         SupportTicketTimeline[]
  escalations             TicketEscalation[]
  
  @@index([status, priority])
  @@index([userId, status])
  @@index([assignedToId, status])
  @@map("support_tickets")
}

model SupportAgent {
  id                      String                    @id @default(cuid())
  userId                  String                    @unique
  agentLevel              SupportAgentLevel         @default(L1)
  department              SupportDepartment
  specializations         Json?                     // Areas of expertise
  languages               Json?                     // Supported languages
  status                  AgentStatus               @default(OFFLINE)
  isActive                Boolean                   @default(true)
  maxConcurrentTickets    Int                       @default(10)
  currentTicketLoad       Int                       @default(0)
  
  // Performance Metrics
  totalTicketsHandled     Int                       @default(0)
  averageResolutionTime   Float?                    // Average in minutes
  customerSatisfactionAvg Float?                    // Average CSAT score
  firstResponseTimeAvg    Float?                    // Average first response time
  
  // Availability
  workingHours            Json?                     // Working hours schedule
  timezone                String                    @default("America/New_York")
  lastActiveAt            DateTime?
  
  // Relations
  user                    User                      @relation("UserSupportAgent", fields: [userId], references: [id])
  assignedTickets         SupportTicket[]           @relation("AssignedSupportTickets")
  chatSessions            SupportChatSession[]      @relation("AgentChatSessions")
  
  @@map("support_agents")
}
```

### Knowledge Base System

```prisma
model KnowledgeBaseArticle {
  id                      String                    @id @default(cuid())
  title                   String
  slug                    String                    @unique
  content                 String                    // Rich HTML content
  summary                 String?                   // Brief summary
  
  // Categorization
  category                String
  tags                    Json                      // Array of tags
  difficulty              ArticleDifficulty         @default(BEGINNER)
  
  // Visibility & Access
  isPublished             Boolean                   @default(false)
  visibleToRoles          Json                      // Array of user roles
  requiresAuth            Boolean                   @default(false)
  
  // SEO & Metadata
  metaTitle               String?
  metaDescription         String?
  keywords                Json?                     // SEO keywords
  
  // Analytics
  viewCount               Int                       @default(0)
  helpfulVotes            Int                       @default(0)
  notHelpfulVotes         Int                       @default(0)
  averageRating           Float?
  estimatedReadTime       Int?                      // Minutes
  
  // Content Management
  authorId                String
  lastUpdatedBy           String?
  version                 Int                       @default(1)
  
  // Timestamps
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime                  @updatedAt
  publishedAt             DateTime?
  
  // Relations
  author                  User                      @relation("UserAuthoredArticles", fields: [authorId], references: [id])
  updater                 User?                     @relation("UserUpdatedArticles", fields: [lastUpdatedBy], references: [id])
  feedback                ArticleFeedback[]
  
  @@index([category, isPublished])
  @@index([tags, isPublished])
  @@map("knowledge_base_articles")
}
```

## Email Automation Models

### Email Templates & Campaigns

```prisma
model EmailTemplate {
  id                String              @id @default(cuid())
  name              String
  subject           String
  htmlContent       String              // Handlebars template
  textContent       String?             // Plain text version
  
  // Template Configuration
  category          EmailTemplateCategory
  language          String              @default("en")
  isActive          Boolean             @default(true)
  
  // Handlebars Variables
  requiredVariables Json                // Required template variables
  sampleData        Json?               // Sample data for preview
  
  // Design & Layout
  designTemplate    String?             // Base design template
  customCSS         String?             // Custom CSS styles
  previewText       String?             // Email preview text
  
  // Metadata
  createdBy         String
  lastUpdatedBy     String?
  version           Int                 @default(1)
  
  // Timestamps
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  // Relations
  creator           User                @relation("UserCreatedTemplates", fields: [createdBy], references: [id])
  updater           User?               @relation("UserUpdatedTemplates", fields: [lastUpdatedBy], references: [id])
  campaigns         EmailCampaign[]     @relation("CampaignTemplate")
  sentEmails        EmailLog[]          @relation("EmailTemplate")
  automationRules   EmailAutomationRule[] @relation("AutomationTemplate")
  
  @@map("email_templates")
}

model EmailAutomationRule {
  id                String                    @id @default(cuid())
  name              String
  description       String?
  trigger           EmailTrigger
  triggerConditions Json                      // Conditions that must be met
  templateId        String
  delay             Int                       @default(0) // Delay in minutes
  isActive          Boolean                   @default(true)
  maxSends          Int?                      // Max sends per user
  sendOnWeekends    Boolean                   @default(true)
  
  // Scheduling
  scheduleType      ScheduleType              @default(IMMEDIATE)
  cronExpression    String?                   // For scheduled sends
  timezone          String                    @default("America/New_York")
  
  // Targeting
  userRoles         Json?                     // Target user roles
  emailSegmentId    String?                   // Target segment
  
  // Metadata
  createdBy         String
  createdAt         DateTime                  @default(now())
  updatedAt         DateTime                  @updatedAt
  
  // Relations
  template          EmailTemplate             @relation("AutomationTemplate", fields: [templateId], references: [id])
  emailSegment      EmailSegment?             @relation("AutomationEmailSegment", fields: [emailSegmentId], references: [id])
  creator           User                      @relation("UserAutomationRules", fields: [createdBy], references: [id])
  executions        EmailAutomationExecution[] @relation("RuleExecutions")
  
  @@map("email_automation_rules")
}
```

### Email Queue & Delivery

```prisma
model EmailQueue {
  id                String              @id @default(cuid())
  emailLogId        String              @unique
  priority          EmailPriority       @default(NORMAL)
  scheduledAt       DateTime
  attempts          Int                 @default(0)
  maxAttempts       Int                 @default(3)
  status            EmailQueueStatus    @default(PENDING)
  lastAttemptAt     DateTime?
  nextAttemptAt     DateTime?
  errorMessage      String?
  
  // Processing Information
  processingStartedAt DateTime?
  processingCompletedAt DateTime?
  processingDuration Int?              // Milliseconds
  
  // Relations
  emailLog          EmailLog            @relation("EmailQueue", fields: [emailLogId], references: [id])
  
  @@index([status, scheduledAt])
  @@index([priority, scheduledAt])
  @@map("email_queue")
}

model EmailLog {
  id                String              @id @default(cuid())
  recipientId       String
  templateId        String?
  campaignId        String?
  subject           String
  
  // Content
  htmlContent       String?
  textContent       String?
  
  // Delivery Information
  status            EmailStatus         @default(PENDING)
  scheduledAt       DateTime?
  sentAt            DateTime?
  deliveredAt       DateTime?
  openedAt          DateTime?
  clickedAt         DateTime?
  bouncedAt         DateTime?
  unsubscribedAt    DateTime?
  
  // Provider Information
  externalId        String?             // Provider's message ID
  provider          EmailProvider       @default(SENDGRID)
  providerResponse  Json?               // Provider response data
  
  // Tracking
  openCount         Int                 @default(0)
  clickCount        Int                 @default(0)
  trackingEnabled   Boolean             @default(true)
  
  // Error Handling
  errorMessage      String?
  retryCount        Int                 @default(0)
  
  // Timestamps
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  // Relations
  template          EmailTemplate?      @relation("EmailTemplate", fields: [templateId], references: [id])
  recipient         User                @relation("UserEmailLogs", fields: [recipientId], references: [id])
  automationExec    EmailAutomationExecution? @relation("AutomationEmail")
  clickEvents       EmailClickEvent[]   @relation("EmailClicks")
  queueEntry        EmailQueue?         @relation("EmailQueue")
  
  @@index([recipientId, sentAt])
  @@index([status, scheduledAt])
  @@map("email_logs")
}
```

## Analytics & Reporting

### Support Analytics

```prisma
model SupportAnalytics {
  id                      String                    @id @default(cuid())
  date                    DateTime                  // Date for daily aggregation
  
  // Ticket Metrics
  ticketsCreated          Int                       @default(0)
  ticketsResolved         Int                       @default(0)
  ticketsClosed           Int                       @default(0)
  ticketsEscalated        Int                       @default(0)
  
  // Response Time Metrics
  avgFirstResponseTime    Float?                    // Minutes
  avgResolutionTime       Float?                    // Minutes
  slaBreaches             Int                       @default(0)
  
  // AI Metrics
  aiInteractions          Int                       @default(0)
  aiResolutions           Int                       @default(0)
  aiEscalations           Int                       @default(0)
  avgAiConfidence         Float?
  
  // Customer Satisfaction
  csatResponses           Int                       @default(0)
  avgCsatScore            Float?
  
  // Agent Performance
  activeAgents            Int                       @default(0)
  avgAgentLoad            Float?
  
  // Knowledge Base
  kbArticleViews          Int                       @default(0)
  kbSearches              Int                       @default(0)
  kbHelpfulVotes          Int                       @default(0)
  
  // Timestamps
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime                  @updatedAt
  
  @@unique([date])
  @@map("support_analytics")
}
```

## Relationships & Indexes

### Key Relationships

1. **User  Multiple Entities**: Users can be parents, venue admins, support agents
2. **Venue  Children**: Many-to-many through enrollment
3. **Child  Activities**: One-to-many activity tracking
4. **Support Ticket  Messages**: One-to-many conversation thread
5. **Email Template  Campaigns**: Many-to-many template reuse
6. **AI Chat  Escalation**: Seamless AI-to-human handoff

### Performance Indexes

```prisma
// Critical performance indexes
@@index([status, priority])           // Support tickets
@@index([userId, createdAt])          // User activities
@@index([venueId, timestamp])         // Venue events
@@index([recipientId, sentAt])        // Email delivery
@@index([category, isPublished])      // Knowledge base
@@index([aiConfidence, status])       // AI processing
```

### Database Constraints

```prisma
// Unique constraints
@@unique([email])                     // User email uniqueness
@@unique([ticketNumber])              // Support ticket numbers
@@unique([slug])                      // Knowledge base article slugs
@@unique([credentialId])              // WebAuthn credentials

// Foreign key constraints with cascade rules
@relation(onDelete: Cascade)          // Child records deleted with parent
@relation(onDelete: SetNull)          // Optional relationships
@relation(onDelete: Restrict)         // Prevent deletion with dependencies
```

## Migration Guide

### Database Migrations

```bash
# Generate migration
npx prisma migrate dev --name add_support_system

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Schema Evolution

```prisma
// Example migration: Adding new support features
model SupportTicket {
  // ... existing fields
  
  // New fields added in migration
  aiProcessingVersion   String?               // Track AI model version
  customerFeedback      Json?                 // Structured feedback
  resolutionCategory    String?               // Resolution categorization
  
  // New indexes
  @@index([aiProcessingVersion, status])
  @@index([resolutionCategory, resolvedAt])
}
```

### Data Seeding

```typescript
// Database seeding script
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@safeplay.com',
      name: 'System Administrator',
      role: 'SYSTEM_ADMIN',
      password: await hashPassword('secure-password'),
      verificationLevel: 'FULLY_VERIFIED'
    }
  });
  
  // Create demo venue
  const venue = await prisma.venue.create({
    data: {
      name: 'Demo Daycare Center',
      address: '123 Safety Street',
      city: 'Demo City',
      state: 'CA',
      zipCode: '90210',
      type: 'DAYCARE',
      capacity: 50,
      adminId: admin.id
    }
  });
  
  // Create support agent
  await prisma.supportAgent.create({
    data: {
      userId: admin.id,
      agentLevel: 'SUPERVISOR',
      department: 'TECHNICAL',
      specializations: ['CAMERA_SUPPORT', 'TECHNICAL_ISSUE']
    }
  });
  
  // Create email templates
  await prisma.emailTemplate.create({
    data: {
      name: 'Welcome Email',
      subject: 'Welcome to mySafePlay™(TM)!',
      htmlContent: '<h1>Welcome {{user.name}}!</h1>',
      category: 'ONBOARDING',
      createdBy: admin.id
    }
  });
}

seedDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

*This schema documentation provides a comprehensive overview of the mySafePlay™(TM) database structure. For specific implementation details and migration procedures, refer to the Prisma documentation and migration files.*
