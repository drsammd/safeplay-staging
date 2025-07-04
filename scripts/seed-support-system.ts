// @ts-nocheck

import { prisma as db } from '../lib/db'

async function seedSupportSystem() {
  console.log('Seeding support system...')

  try {
    // Create AI chat configuration
    const aiConfig = await db.aIChatConfig.upsert({
      where: { name: 'Default SafePlay Support AI' },
      update: {},
      create: {
        name: 'Default SafePlay Support AI',
        isActive: true,
        aiModel: 'gpt-4o-mini',
        maxTokens: 1000,
        temperature: 0.7,
        systemPrompt: `You are SafePlay AI, an intelligent support assistant for SafePlay, a comprehensive child safety and venue management platform.

SafePlay provides:
- Child tracking and safety monitoring in entertainment venues
- Face recognition technology for child identification  
- Real-time alerts and notifications for parents
- Venue management tools for staff
- Mobile apps for parents and venue administrators
- Check-in/check-out systems
- Emergency response protocols

Your role:
- Provide helpful, accurate information about SafePlay features
- Search knowledge base for relevant articles
- Guide users to appropriate solutions
- Escalate complex issues to human agents
- Maintain a friendly, professional tone
- Focus on child safety and peace of mind

Always prioritize child safety concerns and escalate emergency situations immediately.`,
        welcomeMessage: 'Hi! I\'m SafePlay AI, your intelligent support assistant. I\'m here to help you with any questions about child safety, venue management, or using the SafePlay platform. How can I assist you today?',
        escalationPrompt: `Should this conversation be escalated to a human agent? Consider escalating if:
- User expresses frustration or dissatisfaction
- Technical issue requires complex troubleshooting
- Emergency or safety-critical situation
- Request for refund, billing disputes, or account changes
- Complex venue setup or configuration
- Legal or compliance questions
- User specifically requests human agent

Respond with "ESCALATE" if yes, or "CONTINUE" if AI can handle it.`,
        escalationConfidenceThreshold: 0.6,
        maxAIInteractions: 8,
        escalationTimeLimit: 15,
        kbIntegrationEnabled: true,
        kbSearchLimit: 3,
        ticketCreationEnabled: true,
        escalationKeywords: JSON.stringify([
          'human agent', 'speak to person', 'escalate', 'manager', 'supervisor',
          'frustrated', 'angry', 'terrible', 'awful', 'emergency', 'urgent',
          'billing issue', 'refund', 'cancel subscription', 'legal', 'lawsuit',
          'not working', 'broken', 'bug', 'error', 'crashed'
        ]),
        fallbackResponse: 'I apologize, but I\'m having trouble understanding your request. Let me connect you with one of our human support agents who can better assist you.',
        contentFilters: JSON.stringify(['inappropriate', 'offensive', 'spam']),
        sensitiveTopics: JSON.stringify(['legal advice', 'medical advice', 'emergency procedures'])
      }
    })

    console.log('✅ AI chat configuration created')

    // Create knowledge base articles
    const articles = [
      {
        title: 'Getting Started with SafePlay',
        content: `# Getting Started with SafePlay

SafePlay is your comprehensive child safety and venue management platform. This guide will help you get started quickly.

## For Parents

1. **Download the Mobile App**: Get the SafePlay parent app from your app store
2. **Create Your Account**: Sign up with your email and verify your account
3. **Add Your Children**: Register your children's profiles with photos for face recognition
4. **Connect with Venues**: Find and connect with your favorite family entertainment venues

## For Venue Administrators

1. **Set Up Your Venue Profile**: Complete your venue information and contact details
2. **Install Camera Systems**: Follow our camera installation guide
3. **Configure Safety Zones**: Set up play areas and safety zones on your floor plan
4. **Train Your Staff**: Ensure your team understands the SafePlay system

## Key Features

- **Real-time Child Tracking**: Know where your child is at all times
- **Instant Alerts**: Get notified of any safety concerns immediately
- **Memory Capture**: Automatically capture precious moments of your child playing
- **Check-in/Check-out**: Streamlined entry and exit processes
- **Emergency Protocols**: Comprehensive safety and emergency response systems

Need help? Contact our support team or use the AI chat assistant for instant help.`,
        summary: 'Complete guide to getting started with SafePlay for both parents and venue administrators.',
        category: 'GETTING_STARTED',
        slug: 'getting-started-with-safeplay',
        tags: JSON.stringify(['setup', 'onboarding', 'parents', 'venues', 'getting started']),
        searchKeywords: JSON.stringify(['setup', 'start', 'begin', 'onboarding', 'new user']),
        isPublic: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        metaDescription: 'Learn how to get started with SafePlay child safety platform for parents and venues',
        metaKeywords: JSON.stringify(['safeplay', 'child safety', 'getting started', 'setup'])
      },
      {
        title: 'Setting Up Face Recognition',
        content: `# Setting Up Face Recognition

Face recognition is a core feature of SafePlay that helps identify and track your child safely within entertainment venues.

## For Parents

### Registering Your Child's Face
1. **Take High-Quality Photos**: Use clear, well-lit photos of your child's face
2. **Multiple Angles**: Provide 3-5 photos from different angles
3. **Recent Photos**: Use recent photos that accurately represent your child's current appearance
4. **Good Lighting**: Ensure photos are taken in good lighting conditions

### Privacy and Consent
- Your child's facial data is encrypted and stored securely
- Data is only used for safety and identification purposes
- You can revoke consent at any time
- We comply with all privacy regulations including COPPA

## For Venues

### Camera Requirements
- Minimum 1080p resolution cameras
- Proper lighting in all monitored areas
- Strategic camera placement for optimal coverage
- Network connectivity for real-time processing

### Configuration Steps
1. **Install Cameras**: Follow the camera installation guide
2. **Configure Zones**: Set up monitoring zones on your floor plan
3. **Test Recognition**: Run test scenarios to ensure accuracy
4. **Train Staff**: Ensure staff understand the alert system

## Troubleshooting

**Poor Recognition Accuracy**
- Check camera positioning and lighting
- Verify photo quality in child profiles
- Adjust recognition sensitivity settings

**False Alerts**
- Review camera placement for obstructions
- Check for reflective surfaces causing interference
- Adjust alert thresholds

Need technical support? Contact our camera support team for specialized help.`,
        summary: 'Complete guide to setting up and troubleshooting face recognition for child safety.',
        category: 'FACE_RECOGNITION',
        slug: 'setting-up-face-recognition',
        tags: JSON.stringify(['face recognition', 'setup', 'cameras', 'troubleshooting', 'accuracy']),
        searchKeywords: JSON.stringify(['face', 'recognition', 'camera', 'setup', 'photos', 'accuracy']),
        isPublic: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        metaDescription: 'Learn how to set up face recognition for child safety monitoring',
        metaKeywords: JSON.stringify(['face recognition', 'child safety', 'camera setup', 'monitoring'])
      },
      {
        title: 'Emergency Procedures and Safety Protocols',
        content: `# Emergency Procedures and Safety Protocols

SafePlay includes comprehensive emergency response features to ensure child safety in all situations.

## Emergency Alert Types

### Missing Child Alert
- Immediate notification to all venue staff
- Automatic lockdown of exits
- Parent notification via app and SMS
- Security team activation

### Medical Emergency
- Direct connection to medical services
- Parent and emergency contact notification
- Medical information sharing with responders
- Incident documentation

### Evacuation Procedures
- Automated evacuation route guidance
- Real-time child location tracking
- Parent pickup coordination
- External agency coordination

## For Parents

### Emergency Contacts
1. **Set Up Multiple Contacts**: Add at least 2 emergency contacts
2. **Include Medical Information**: Add allergies, medications, medical conditions
3. **Keep Information Updated**: Review and update quarterly
4. **Test Notifications**: Ensure you receive test alerts

### During an Emergency
- **Stay Calm**: Follow venue staff instructions
- **Check Your App**: Monitor real-time updates
- **Follow Procedures**: Adhere to evacuation or safety protocols
- **Contact Staff**: Report any additional concerns immediately

## For Venues

### Staff Training Requirements
- Monthly emergency drills
- SafePlay system emergency procedures
- Communication protocols
- Child safety best practices

### Emergency Equipment
- Emergency communication systems
- First aid and medical supplies
- Backup power for safety systems
- Emergency contact information displays

## Prevention Measures

### Daily Safety Checks
- Camera system functionality
- Emergency equipment inspection
- Staff briefing on daily protocols
- Venue safety hazard assessment

### Incident Documentation
- All incidents must be documented in SafePlay
- Photos and witness statements when appropriate
- Follow-up communication with parents
- Review and improvement recommendations

Remember: Child safety is our top priority. When in doubt, always err on the side of caution and activate emergency protocols.`,
        summary: 'Comprehensive guide to emergency procedures and safety protocols for venues and parents.',
        category: 'CHILD_SAFETY',
        slug: 'emergency-procedures-safety-protocols',
        tags: JSON.stringify(['emergency', 'safety', 'protocols', 'alerts', 'evacuation']),
        searchKeywords: JSON.stringify(['emergency', 'safety', 'alert', 'evacuation', 'missing child', 'protocol']),
        isPublic: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        metaDescription: 'Learn about emergency procedures and safety protocols in SafePlay',
        metaKeywords: JSON.stringify(['emergency procedures', 'child safety', 'safety protocols', 'alerts'])
      },
      {
        title: 'Mobile App Setup and Features',
        content: `# Mobile App Setup and Features

The SafePlay mobile app puts child safety and venue information at your fingertips.

## Download and Installation

### System Requirements
- iOS 12.0 or later / Android 8.0 or later
- 2GB RAM minimum
- 500MB available storage
- Camera and location permissions

### App Store Links
- **iOS**: Download from the Apple App Store
- **Android**: Download from Google Play Store

## Initial Setup

### Account Creation
1. **Email Registration**: Use a valid email address
2. **Phone Verification**: Verify your phone number for alerts
3. **Profile Setup**: Complete your parent profile
4. **Security Settings**: Set up two-factor authentication

### Adding Children
1. **Child Profile**: Enter name, age, and basic information
2. **Photos**: Upload 3-5 clear face photos
3. **Medical Info**: Add allergies and medical conditions
4. **Emergency Contacts**: Set up trusted contacts

## Key Features

### Real-Time Tracking
- Live location updates when child is at connected venues
- Movement history and timeline
- Zone entry/exit notifications
- Automatic check-in/check-out alerts

### Photo Memories
- Automatically captured photos during play
- Purchase and download favorite memories
- Share with family members
- Create digital albums

### Safety Alerts
- Instant notifications for safety events
- Emergency alert escalation
- Venue announcement delivery
- System status updates

### Venue Information
- Find connected venues near you
- View venue safety ratings and features
- Read other parent reviews
- Access venue contact information

## Privacy and Security

### Data Protection
- All data encrypted in transit and at rest
- Facial recognition data stored securely
- Location data only shared with connected venues
- Full control over data sharing preferences

### Privacy Settings
- Control photo sharing permissions
- Manage notification preferences
- Set data retention periods
- Review connected venue access

## Troubleshooting

### Common Issues
**App Won't Load**
- Check internet connection
- Update to latest app version
- Restart your device
- Clear app cache (Android)

**No Location Updates**
- Ensure location permissions are enabled
- Check venue connectivity
- Verify child is in a monitored area
- Contact venue if issues persist

**Photo Not Loading**
- Check internet connection
- Verify photo purchase status
- Clear app cache
- Contact support for missing photos

### Getting Help
- In-app help center and FAQs
- Live chat support
- Email support team
- Phone support for emergencies

The mobile app is your primary interface with SafePlay. Keep it updated and configured properly for the best experience.`,
        summary: 'Complete guide to setting up and using the SafePlay mobile app for parents.',
        category: 'MOBILE_APP',
        slug: 'mobile-app-setup-features',
        tags: JSON.stringify(['mobile app', 'setup', 'features', 'tracking', 'photos', 'notifications']),
        searchKeywords: JSON.stringify(['mobile', 'app', 'download', 'setup', 'phone', 'notifications', 'tracking']),
        isPublic: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        metaDescription: 'Learn how to set up and use the SafePlay mobile app for child safety monitoring',
        metaKeywords: JSON.stringify(['mobile app', 'child safety', 'real-time tracking', 'notifications'])
      },
      {
        title: 'Billing and Subscription Management',
        content: `# Billing and Subscription Management

Manage your SafePlay subscription, billing, and payment methods easily through your account.

## Subscription Plans

### Parent Plans
- **Basic Plan**: Essential safety features for up to 2 children
- **Family Plan**: Full features for up to 5 children
- **Premium Plan**: Advanced features and priority support

### Venue Plans
- **Starter**: Small venues (up to 50 daily visitors)
- **Professional**: Medium venues (up to 200 daily visitors)
- **Enterprise**: Large venues (unlimited visitors)

## Managing Your Subscription

### Upgrading or Downgrading
1. **Go to Account Settings**: Access through app or web dashboard
2. **Select Subscription**: Choose your current plan
3. **Change Plan**: Select new plan and confirm
4. **Payment**: Complete payment for upgrades immediately

### Cancellation Policy
- Cancel anytime before next billing cycle
- No cancellation fees
- Access continues until end of paid period
- Data export available for 30 days after cancellation

## Payment and Billing

### Accepted Payment Methods
- Credit cards (Visa, MasterCard, American Express)
- PayPal
- Bank transfer (annual plans only)
- Apple Pay / Google Pay (mobile app)

### Billing Cycles
- Monthly billing on the same date each month
- Annual billing with 2 months free
- Pro-rated charges for mid-cycle changes
- Automatic renewal unless cancelled

### Payment Issues
**Failed Payment**
- Automatic retry after 3 days
- Email notification of payment failure
- 7-day grace period before service suspension
- Update payment method to restore service

**Billing Disputes**
- Contact billing support within 30 days
- Provide transaction details
- Investigation typically completed in 5-7 business days
- Refunds processed within 10 business days

## Refund Policy

### Eligible Refunds
- Technical issues preventing service use
- Billing errors or duplicate charges
- Service downtime exceeding SLA
- Cancellation within 14 days of first subscription

### Refund Process
1. **Contact Support**: Submit refund request
2. **Provide Details**: Include reason and supporting information
3. **Review**: Refund reviewed within 5 business days
4. **Processing**: Approved refunds processed within 10 days

## Account Management

### Updating Payment Information
- Access through account settings
- Changes take effect immediately
- Old payment method kept as backup
- Email confirmation of changes

### Invoice and Receipt Access
- Download from account dashboard
- Email copies available on request
- Historical invoices available for 7 years
- Custom invoice details for business accounts

### Business Accounts
- Purchase orders accepted
- Net 30 payment terms available
- Custom billing cycles
- Dedicated account manager

## Cost Optimization

### Usage Monitoring
- View monthly usage statistics
- Set usage alerts and limits
- Optimize plan based on actual usage
- Seasonal plan adjustments available

### Discounts Available
- Annual payment discount (2 months free)
- Multi-venue discounts
- Non-profit organization discounts
- Early adopter pricing for new features

Need help with billing? Contact our billing support team for personalized assistance.`,
        summary: 'Complete guide to managing SafePlay subscriptions, billing, and payment methods.',
        category: 'BILLING_PAYMENTS',
        slug: 'billing-subscription-management',
        tags: JSON.stringify(['billing', 'subscription', 'payment', 'refund', 'plans', 'pricing']),
        searchKeywords: JSON.stringify(['billing', 'payment', 'subscription', 'refund', 'cancel', 'upgrade', 'invoice']),
        isPublic: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        metaDescription: 'Learn how to manage your SafePlay subscription, billing, and payments',
        metaKeywords: JSON.stringify(['billing', 'subscription management', 'payment methods', 'refunds'])
      }
    ]

    for (const article of articles) {
      await db.knowledgeBaseArticle.upsert({
        where: { slug: article.slug },
        update: article,
        create: article
      })
    }

    console.log('✅ Knowledge base articles created')

    // Create sample support workflows
    const workflows = [
      {
        name: 'Basic Ticket Routing',
        description: 'Routes tickets based on category and priority',
        workflowType: 'TICKET_ROUTING',
        triggerConditions: JSON.stringify({
          categories: ['TECHNICAL_ISSUE', 'GENERAL_INQUIRY'],
          priorities: ['LOW', 'MEDIUM']
        }),
        steps: JSON.stringify([
          { step: 1, action: 'categorize', department: 'TECHNICAL' },
          { step: 2, action: 'assign_agent', level: 'L1' },
          { step: 3, action: 'notify_user', template: 'ticket_assigned' }
        ]),
        aiEnabled: true,
        aiPromptTemplate: 'Provide initial technical support for this issue. If you cannot resolve it, escalate to human agent.',
        autoEscalationTime: 60,
        slaTime: 240,
        isActive: true
      },
      {
        name: 'Emergency Escalation',
        description: 'Immediate escalation for emergency situations',
        workflowType: 'ESCALATION',
        triggerConditions: JSON.stringify({
          categories: ['EMERGENCY', 'CHILD_SAFETY'],
          priorities: ['URGENT', 'CRITICAL']
        }),
        steps: JSON.stringify([
          { step: 1, action: 'immediate_escalation', level: 'SUPERVISOR' },
          { step: 2, action: 'notify_emergency_team' },
          { step: 3, action: 'create_incident_record' }
        ]),
        aiEnabled: false,
        autoEscalationTime: 0,
        slaTime: 15,
        isActive: true
      }
    ]

    for (const workflow of workflows) {
      await db.supportWorkflow.upsert({
        where: { name: workflow.name },
        update: workflow,
        create: workflow
      })
    }

    console.log('✅ Support workflows created')

    console.log('🎉 Support system seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding support system:', error)
    throw error
  }
}

export { seedSupportSystem }

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedSupportSystem()
    .then(() => {
      console.log('✅ Seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}
