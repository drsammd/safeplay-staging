const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log('🔍 Verifying demo data...');
    
    // Check users
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['parent@mySafePlay.ai', 'John@mySafePlay.ai']
        }
      },
      include: {
        children: true,
        _count: {
          select: {
            children: true
          }
        }
      }
    });
    
    console.log('\n👥 Users created:');
    users.forEach(user => {
      console.log(`  - ${user.email}: ${user.name} (${user._count.children} children)`);
    });
    
    // Check children
    const children = await prisma.child.findMany({
      where: {
        parent: {
          email: {
            in: ['parent@mySafePlay.ai', 'John@mySafePlay.ai']
          }
        }
      },
      include: {
        parent: {
          select: {
            email: true
          }
        }
      }
    });
    
    console.log('\n👶 Children created:');
    children.forEach(child => {
      console.log(`  - ${child.firstName} ${child.lastName} (parent: ${child.parent.email})`);
    });
    
    // Check family members
    const familyMembers = await prisma.familyMember.findMany({
      include: {
        family: {
          select: {
            email: true
          }
        },
        member: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('\n👨‍👩‍👧‍👦 Family members created:');
    familyMembers.forEach(fm => {
      console.log(`  - ${fm.member.name} (${fm.relationship}) for ${fm.family.email}`);
    });
    
    console.log('\n✅ Data verification completed!');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
