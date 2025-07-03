
import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';

async function setupDemoVerificationData() {
  console.log('🔧 Setting up demo verification data...\n');

  try {
    // 1. Create verification requirements
    console.log('1. Creating verification requirements...');
    
    const requirements = [
      {
        name: 'CHILD_REGISTRATION',
        description: 'Adding children requires identity verification for safety compliance',
        requiredLevel: 'IDENTITY_VERIFIED',
        requiredPhone: true,
        requiredIdentity: true,
        requiredTwoFactor: false,
        applicableRoles: ['PARENT'],
        applicableActions: ['add_child', 'register_child'],
        gracePeriodDays: 7,
        enforced: true
      },
      {
        name: 'BIOMETRIC_ENROLLMENT',
        description: 'Biometric enrollment requires full verification for security',
        requiredLevel: 'FULL_VERIFIED',
        requiredPhone: true,
        requiredIdentity: true,
        requiredTwoFactor: true,
        applicableRoles: ['PARENT'],
        applicableActions: ['biometric_enrollment', 'face_registration'],
        gracePeriodDays: 0,
        enforced: true
      },
      {
        name: 'ADMIN_FUNCTIONS',
        description: 'Administrative functions require full verification',
        requiredLevel: 'FULL_VERIFIED',
        requiredPhone: true,
        requiredIdentity: true,
        requiredTwoFactor: true,
        applicableRoles: ['VENUE_ADMIN', 'COMPANY_ADMIN'],
        applicableActions: ['admin_access', 'user_management', 'venue_configuration'],
        gracePeriodDays: 0,
        enforced: true
      }
    ];

    for (const req of requirements) {
      await prisma.verificationRequirement.upsert({
        where: { name: req.name },
        update: req,
        create: req
      });
      console.log(`   ✅ Created requirement: ${req.name}`);
    }

    // 2. Update demo user (john@doe.com) with some verification status
    console.log('\n2. Setting up demo user verification status...');
    
    const demoUser = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });

    if (demoUser) {
      // Give the demo user phone verification
      await prisma.user.update({
        where: { id: demoUser.id },
        data: {
          phone: '+1234567890',
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          verificationLevel: 'PHONE_VERIFIED'
        }
      });

      // Create a verification history entry
      await prisma.verificationStatusHistory.create({
        data: {
          userId: demoUser.id,
          previousLevel: 'UNVERIFIED',
          newLevel: 'PHONE_VERIFIED',
          changeReason: 'Demo setup - phone verification',
          phoneVerified: true,
          identityVerified: false,
          twoFactorEnabled: false
        }
      });

      console.log(`   ✅ Updated demo user verification status`);
      console.log(`   📱 Phone: +1234567890 (verified)`);
      console.log(`   🆔 Identity: Not verified`);
      console.log(`   🔐 2FA: Not enabled`);
      console.log(`   🎯 Level: PHONE_VERIFIED`);
    } else {
      console.log('   ⚠️  Demo user (john@doe.com) not found');
    }

    // 3. Create some sample system notifications
    console.log('\n3. Creating sample system notifications...');
    
    const notifications = [
      {
        type: 'VERIFICATION_REMINDER',
        title: 'Complete Your Account Verification',
        message: 'Enhance your account security by completing identity verification.',
        actionUrl: '/verification',
        actionText: 'Verify Now',
        priority: 'NORMAL'
      },
      {
        type: 'SECURITY_ALERT',
        title: 'New Security Features Available',
        message: 'Two-factor authentication is now available to protect your account.',
        actionUrl: '/verification#two-factor',
        actionText: 'Enable 2FA',
        priority: 'LOW'
      }
    ];

    for (const notification of notifications) {
      await prisma.systemNotification.create({
        data: {
          ...notification,
          metadata: { demo: true, createdAt: new Date().toISOString() }
        }
      });
      console.log(`   ✅ Created notification: ${notification.title}`);
    }

    // 4. Create directories for file uploads
    console.log('\n4. Setting up upload directories...');
    
    const fs = require('fs').promises;
    const path = require('path');
    
    const uploadDirs = [
      'public/uploads/identity-verification',
      'public/uploads/temp'
    ];

    for (const dir of uploadDirs) {
      try {
        await fs.mkdir(path.join(process.cwd(), dir), { recursive: true });
        console.log(`   ✅ Created directory: ${dir}`);
      } catch (error) {
        console.log(`   ⚠️  Directory ${dir} may already exist`);
      }
    }

    console.log('\n🎉 Demo verification data setup completed!');
    console.log('\n📋 What was created:');
    console.log('   ✅ 3 verification requirements for different actions');
    console.log('   ✅ Demo user phone verification status');
    console.log('   ✅ Sample system notifications');
    console.log('   ✅ Upload directories for identity documents');
    
    console.log('\n🧪 Testing the system:');
    console.log('   1. Login as john@doe.com / johndoe123');
    console.log('   2. Visit /verification to see verification status');
    console.log('   3. Try to add a child (should require identity verification)');
    console.log('   4. Complete phone verification (already done for demo)');
    console.log('   5. Upload identity documents for review');
    console.log('   6. Enable 2FA for full verification');
    
    console.log('\n👨‍💼 Admin testing:');
    console.log('   1. Login as an admin user');
    console.log('   2. Visit /admin/verification to review submissions');
    console.log('   3. Test approval/rejection workflows');

  } catch (error) {
    console.error('❌ Error setting up demo data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDemoVerificationData();
