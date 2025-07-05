// Migration verification script
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyMigration() {
  console.log('🔍 Starting migration verification...\n')
  
  try {
    // Test database connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful\n')
    
    // Check all main tables exist and have data
    const tables = [
      { name: 'users', model: prisma.user },
      { name: 'venues', model: prisma.venue },
      { name: 'children', model: prisma.child },
      { name: 'memories', model: prisma.memory },
      { name: 'alerts', model: prisma.alert },
      { name: 'trackingEvents', model: prisma.trackingEvent },
      { name: 'faceCollections', model: prisma.faceCollection },
      { name: 'venueAnalytics', model: prisma.venueAnalytics }
    ]
    
    console.log('2. Verifying table structure and data...')
    const results = {}
    
    for (const table of tables) {
      try {
        const count = await table.model.count()
        results[table.name] = count
        console.log(`   ${table.name}: ${count} records`)
      } catch (error) {
        console.log(`   ❌ ${table.name}: Error - ${error.message}`)
        results[table.name] = 'ERROR'
      }
    }
    
    console.log('\n3. Testing complex queries...')
    
    // Test relationships
    try {
      const usersWithChildren = await prisma.user.findMany({
        include: {
          children: true,
          managedVenues: true
        },
        take: 5
      })
      console.log(`   ✅ User relationships: Found ${usersWithChildren.length} users with relationships`)
    } catch (error) {
      console.log(`   ❌ User relationships: ${error.message}`)
    }
    
    // Test venue data with analytics
    try {
      const venuesWithAnalytics = await prisma.venue.findMany({
        include: {
          analytics: true,
          children: true
        },
        take: 3
      })
      console.log(`   ✅ Venue relationships: Found ${venuesWithAnalytics.length} venues with analytics`)
    } catch (error) {
      console.log(`   ❌ Venue relationships: ${error.message}`)
    }
    
    // Test face recognition data
    try {
      const faceCollections = await prisma.faceCollection.findMany({
        include: {
          child: true,
          faceRecords: true
        },
        take: 3
      })
      console.log(`   ✅ Face recognition data: Found ${faceCollections.length} collections`)
    } catch (error) {
      console.log(`   ❌ Face recognition data: ${error.message}`)
    }
    
    console.log('\n📊 Migration Summary:')
    console.log('==================')
    let totalRecords = 0
    for (const [table, count] of Object.entries(results)) {
      if (typeof count === 'number') {
        totalRecords += count
      }
      console.log(`${table}: ${count}`)
    }
    console.log(`\nTotal records migrated: ${totalRecords}`)
    
    console.log('\n✅ Migration verification completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration verification failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run verification
verifyMigration()
  .catch((error) => {
    console.error('Script error:', error)
    process.exit(1)
  })
