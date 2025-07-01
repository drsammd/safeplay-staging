require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
  try {
    console.log('=== USERS ===');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, name: true }
    });
    console.log(JSON.stringify(users, null, 2));
    
    console.log('\n=== VENUES ===');
    const venues = await prisma.venue.findMany({
      select: { id: true, name: true, adminId: true, admin: { select: { email: true, name: true } } }
    });
    console.log(JSON.stringify(venues, null, 2));
    
    console.log('\n=== FLOOR PLANS ===');
    const floorPlans = await prisma.floorPlan.findMany({
      select: { id: true, name: true, venueId: true, venue: { select: { name: true } } }
    });
    console.log(JSON.stringify(floorPlans, null, 2));
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
