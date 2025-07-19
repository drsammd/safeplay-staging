
/**
 * SafePlay Missing User Recovery Script
 * Recovers database users for existing Stripe customers
 * 
 * CRITICAL: This script addresses the v1.5.33 issue where
 * Stripe customers exist but database users were not created
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Known Stripe customer data from subscriptions.csv
const STRIPE_CUSTOMERS = [
  { email: 'drsam+137@outlook.com', name: 'drsam+137', planType: 'PREMIUM' },
  { email: 'drsam+136@outlook.com', name: 'drsam+136', planType: 'PREMIUM' },
  { email: 'drsam+135@outlook.com', name: 'drsam+135', planType: 'PREMIUM' },
  { email: 'drsam+134@outlook.com', name: 'drsam+134', planType: 'PREMIUM' },
  { email: 'drsam+133@outlook.com', name: 'drsam+133', planType: 'BASIC' },
  { email: 'drsam+132@outlook.com', name: 'drsam+132', planType: 'BASIC' },
  { email: 'drsam+131@outlook.com', name: 'drsam+131', planType: 'FAMILY' },
  { email: 'drsam+130@outlook.com', name: 'drsam+130', planType: 'FAMILY' },
  { email: 'drsam+129@outlook.com', name: 'drsam+129', planType: 'FAMILY' },
  { email: 'drsam+128@outlook.com', name: 'drsam+128', planType: 'PREMIUM' },
  { email: 'drsam+127@outlook.com', name: 'drsam+127', planType: 'BASIC' },
  { email: 'drsam+126@outlook.com', name: 'drsam+126', planType: 'PREMIUM' },
  { email: 'drsam+125@outlook.com', name: 'drsam+125', planType: 'PREMIUM' },
  { email: 'drsam+124@outlook.com', name: 'drsam+124', planType: 'BASIC' },
  { email: 'drsam+122@outlook.com', name: 'drsam+122', planType: 'BASIC' },
  { email: 'drsam+120@outlook.com', name: 'drsam+120', planType: 'BASIC' },
  { email: 'drsam+115@outlook.com', name: 'drsam+115', planType: 'BASIC' },
  { email: 'drsam+114@outlook.com', name: 'drsam+114', planType: 'PREMIUM' },
  { email: 'drsam+113@outlook.com', name: 'drsam+113', planType: 'FAMILY' },
  { email: 'drsam+112@outlook.com', name: 'drsam+112', planType: 'PREMIUM' },
  { email: 'drsam+111@outlook.com', name: 'drsam+111', planType: 'PREMIUM' },
  { email: 'drsam+110@outlook.com', name: 'drsam+110', planType: 'PREMIUM' },
  { email: 'drsam+107@outlook.com', name: 'drsam+107', planType: 'FREE' },
  { email: 'drsam+106@outlook.com', name: 'drsam+106', planType: 'FREE' },
  { email: 'drsam+105@outlook.com', name: 'drsam+105', planType: 'FREE' },
  { email: 'drsam+104@outlook.com', name: 'drsam+104', planType: 'PREMIUM' },
  { email: 'drsam+103@outlook.com', name: 'drsam+103', planType: 'BASIC' },
];

async function main() {
  console.log('🔄 Starting missing user recovery process...');
  console.log(`📊 Found ${STRIPE_CUSTOMERS.length} Stripe customers to recover`);

  // Default password for recovered accounts
  const defaultPassword = 'TempPassword123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  let recoveredCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const customer of STRIPE_CUSTOMERS) {
    console.log(`\n🔍 Processing: ${customer.email}`);

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: customer.email },
      });

      if (existingUser) {
        console.log(`⏭️  User already exists, skipping: ${customer.email}`);
        skippedCount++;
        continue;
      }

      // Create the missing user
      const newUser = await prisma.user.create({
        data: {
          email: customer.email,
          password: hashedPassword,
          name: customer.name,
          role: 'PARENT',
          isActive: true,
          lastLoginAt: new Date(),
        },
      });

      console.log(`✅ Created user: ${newUser.email} (${newUser.id})`);

      // Create subscription for the user
      const currentTime = new Date();
      const subscription = await prisma.userSubscription.create({
        data: {
          userId: newUser.id,
          planType: customer.planType,
          status: 'ACTIVE',
          autoRenew: customer.planType !== 'FREE',
          cancelAtPeriodEnd: false,
          currentPeriodStart: currentTime,
          currentPeriodEnd: new Date(currentTime.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      console.log(`✅ Created subscription: ${subscription.planType} (${subscription.id})`);

      // Create legal agreements
      const agreements = [
        {
          agreementType: 'TERMS_OF_SERVICE',
          content: 'Terms of Service Agreement'
        },
        {
          agreementType: 'PRIVACY_POLICY',
          content: 'Privacy Policy Agreement'
        },
        {
          agreementType: 'PARENTAL_CONSENT',
          content: 'Parental Consent Agreement'
        }
      ];

      for (const agreement of agreements) {
        await prisma.legalAgreement.create({
          data: {
            userId: newUser.id,
            agreementType: agreement.agreementType,
            version: '1.0',
            agreedAt: currentTime,
            ipAddress: '127.0.0.1',
            userAgent: 'Recovery Script',
            content: agreement.content,
          },
        });
      }

      console.log(`✅ Created legal agreements`);

      // Create email preferences
      await prisma.emailPreferences.create({
        data: {
          userId: newUser.id,
          marketingEmails: true,
          securityAlerts: true,
          productUpdates: true,
          frequency: 'DAILY',
        },
      });

      console.log(`✅ Created email preferences`);

      recoveredCount++;
      console.log(`✅ Successfully recovered account: ${customer.email}`);

    } catch (error) {
      console.error(`❌ Error recovering ${customer.email}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Recovery Summary:');
  console.log(`✅ Recovered accounts: ${recoveredCount}`);
  console.log(`⏭️  Skipped (already exist): ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📋 Total processed: ${STRIPE_CUSTOMERS.length}`);

  // Save recovery log
  const recoveryLog = {
    timestamp: new Date().toISOString(),
    totalProcessed: STRIPE_CUSTOMERS.length,
    recovered: recoveredCount,
    skipped: skippedCount,
    errors: errorCount,
    defaultPassword: defaultPassword,
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'recovery-log.json'),
    JSON.stringify(recoveryLog, null, 2)
  );

  console.log('\n📝 Recovery log saved to recovery-log.json');
  console.log('\n🔐 IMPORTANT: All recovered accounts use password:', defaultPassword);
  console.log('🔐 Users should change their passwords after first login');
}

main()
  .catch((error) => {
    console.error('❌ Recovery script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
