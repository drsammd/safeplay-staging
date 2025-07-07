
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDemoData() {
  try {
    console.log('🌱 Starting demo data seeding...');

    // Create or update parent@mySafePlay.ai
    const parentEmail = 'parent@mySafePlay.ai';
    const hashedPassword = await bcrypt.hash('demo123', 12);

    let parentUser = await prisma.user.upsert({
      where: { email: parentEmail },
      update: {
        name: 'Demo Parent',
        role: 'PARENT',
        phoneVerified: true,
        identityVerified: true,
        twoFactorEnabled: false,
        verificationLevel: 'FULLY_VERIFIED'
      },
      create: {
        email: parentEmail,
        name: 'Demo Parent',
        password: hashedPassword,
        role: 'PARENT',
        phoneVerified: true,
        identityVerified: true,
        twoFactorEnabled: false,
        verificationLevel: 'FULLY_VERIFIED'
      }
    });

    // Create children for parent@mySafePlay.ai
    const parentChildren = [
      {
        firstName: 'Emma',
        lastName: 'Johnson',
        dateOfBirth: new Date('2017-03-15'),
        profilePhoto: 'https://thumbs.dreamstime.com/z/portrait-cute-young-girl-pigtails-isolated-white-68910712.jpg'
      },
      {
        firstName: 'Lucas',
        lastName: 'Johnson',
        dateOfBirth: new Date('2019-07-22'),
        profilePhoto: 'https://i.pinimg.com/originals/be/e3/55/bee3559c606717fec5f0d7b753a5f788.png'
      }
    ];

    for (const childData of parentChildren) {
      const fullName = `${childData.firstName} ${childData.lastName}`;
      const existingChild = await prisma.child.findFirst({
        where: {
          parentId: parentUser.id,
          firstName: childData.firstName,
          lastName: childData.lastName
        }
      });

      if (existingChild) {
        await prisma.child.update({
          where: { id: existingChild.id },
          data: childData
        });
      } else {
        await prisma.child.create({
          data: {
            ...childData,
            parentId: parentUser.id,
            status: 'ACTIVE'
          }
        });
      }
    }

    // Create family members for parent@mySafePlay.ai
    const familyMembers = [
      { name: 'Father Johnson', relationship: 'PARENT', email: 'father@example.com' },
      { name: 'Uncle Mike', relationship: 'AUNT_UNCLE', email: 'uncle@example.com' },
      { name: 'Sarah Caregiver', relationship: 'CAREGIVER', email: 'caregiver@example.com' }
    ];

    for (const memberData of familyMembers) {
      // Create user account for family member
      const memberUser = await prisma.user.upsert({
        where: { email: memberData.email },
        update: {
          name: memberData.name,
          role: 'PARENT'
        },
        create: {
          email: memberData.email,
          name: memberData.name,
          password: hashedPassword,
          role: 'PARENT'
        }
      });

      // Create family relationship
      await prisma.familyMember.upsert({
        where: {
          familyId_memberId: {
            familyId: parentUser.id,
            memberId: memberUser.id
          }
        },
        update: {
          relationship: memberData.relationship as any
        },
        create: {
          familyId: parentUser.id,
          memberId: memberUser.id,
          relationship: memberData.relationship as any,
          status: 'ACTIVE'
        }
      });
    }

    // Create or update John@mySafePlay.ai
    const johnEmail = 'John@mySafePlay.ai';
    let johnUser = await prisma.user.upsert({
      where: { email: johnEmail },
      update: {
        name: 'John Demo',
        role: 'PARENT',
        phoneVerified: true,
        identityVerified: true,
        twoFactorEnabled: true,
        verificationLevel: 'FULLY_VERIFIED'
      },
      create: {
        email: johnEmail,
        name: 'John Demo',
        password: hashedPassword,
        role: 'PARENT',
        phoneVerified: true,
        identityVerified: true,
        twoFactorEnabled: true,
        verificationLevel: 'FULLY_VERIFIED'
      }
    });

    // Create children for John@mySafePlay.ai
    const johnChildren = [
      {
        firstName: 'Sophia',
        lastName: 'Wilson',
        dateOfBirth: new Date('2016-08-10'),
        profilePhoto: 'https://i.pinimg.com/originals/88/ed/d8/88edd897f7ed1ef75a69a5f6f6815c12.jpg'
      },
      {
        firstName: 'Oliver',
        lastName: 'Wilson',
        dateOfBirth: new Date('2018-12-05'),
        profilePhoto: 'https://i.pinimg.com/originals/be/e3/55/bee3559c606717fec5f0d7b753a5f788.png'
      }
    ];

    for (const childData of johnChildren) {
      const existingChild = await prisma.child.findFirst({
        where: {
          parentId: johnUser.id,
          firstName: childData.firstName,
          lastName: childData.lastName
        }
      });

      if (existingChild) {
        await prisma.child.update({
          where: { id: existingChild.id },
          data: childData
        });
      } else {
        await prisma.child.create({
          data: {
            ...childData,
            parentId: johnUser.id,
            status: 'ACTIVE'
          }
        });
      }
    }

    // Create family members for John@mySafePlay.ai
    const johnFamilyMembers = [
      { name: 'Father Wilson', relationship: 'PARENT', email: 'father.wilson@example.com' },
      { name: 'Uncle Tom', relationship: 'AUNT_UNCLE', email: 'uncle.tom@example.com' },
      { name: 'Mary Caregiver', relationship: 'CAREGIVER', email: 'mary.caregiver@example.com' }
    ];

    for (const memberData of johnFamilyMembers) {
      // Create user account for family member
      const memberUser = await prisma.user.upsert({
        where: { email: memberData.email },
        update: {
          name: memberData.name,
          role: 'PARENT'
        },
        create: {
          email: memberData.email,
          name: memberData.name,
          password: hashedPassword,
          role: 'PARENT'
        }
      });

      // Create family relationship
      await prisma.familyMember.upsert({
        where: {
          familyId_memberId: {
            familyId: johnUser.id,
            memberId: memberUser.id
          }
        },
        update: {
          relationship: memberData.relationship as any
        },
        create: {
          familyId: johnUser.id,
          memberId: memberUser.id,
          relationship: memberData.relationship as any,
          status: 'ACTIVE'
        }
      });
    }

    console.log('✅ Demo data seeding completed successfully!');
    console.log(`👨‍👩‍👧‍👦 Created/updated parent@mySafePlay.ai with 2 children and 3 family members`);
    console.log(`👨‍👩‍👧‍👦 Created/updated John@mySafePlay.ai with 2 children and 3 family members`);

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedDemoData().catch((error) => {
  console.error('Failed to seed demo data:', error);
  process.exit(1);
});
