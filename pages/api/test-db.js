// Test database connection endpoint
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  try {
    // Test basic connection
    await prisma.$connect()
    
    // Test a simple query
    const userCount = await prisma.user.count()
    const venueCount = await prisma.venue.count()
    const childCount = await prisma.child.count()
    
    res.status(200).json({
      status: 'success',
      message: 'Database connection successful',
      data: {
        users: userCount,
        venues: venueCount,
        children: childCount
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database connection error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    })
  } finally {
    await prisma.$disconnect()
  }
}
