require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { getToken } = require('next-auth/jwt');

async function debugSession() {
  console.log('=== Session Debug ===');
  
  // Check what's in the session token
  const secret = process.env.NEXTAUTH_SECRET;
  const cookieValue = 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0.._Fdw4RfDWUGqybEG.V0EsivOL8lomyOGzI-qM3f9fUfugfLzk12vJzSv4MDjTsRcluj1arpnE5MRWzfyFCQPTdtSolGT8H44pLdZ894UwdhVBF0LBvVPju6R-me82e3jJc5moOQX1Kgy6HCpmAMcyCCEO-0KhCdG-U0vsaLsB_jT32Cg1UoLznUs-02lqhGfIG3EDY5QmEMW0q2VLe5KW3IfNE0bPjz8uRUBnAETQjhYDd3IoDfZBiqmconRF_iagjrK8mg.Ml31zNYCaU2PufuTb4xbFA';
  
  try {
    const token = await getToken({ 
      req: { 
        cookies: { 
          'next-auth.session-token': cookieValue 
        } 
      }, 
      secret 
    });
    console.log('Decoded token:', JSON.stringify(token, null, 2));
  } catch (error) {
    console.error('Token decode error:', error.message);
  }

  // Check database state
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'venue@mysafeplay.ai' },
      select: { id: true, email: true, name: true, role: true }
    });
    console.log('\nDatabase user:', JSON.stringify(user, null, 2));

    const venue = await prisma.venue.findFirst({
      where: { adminId: user.id },
      select: { id: true, name: true, adminId: true }
    });
    console.log('\nVenue for this user:', JSON.stringify(venue, null, 2));

  } catch (error) {
    console.error('DB error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugSession();
