
// Setup Face Collections for SafePlay Venues
const { CreateCollectionCommand, ListCollectionsCommand } = require('@aws-sdk/client-rekognition');

// Import AWS config and database connection
let rekognitionClient, prisma;

async function initializeServices() {
  try {
    // Use dynamic import for compiled JS modules
    const awsConfig = await import('../lib/aws/config.js');
    const db = await import('../lib/db.js');
    
    console.log('AWS Config imported:', !!awsConfig);
    console.log('Available exports:', Object.keys(awsConfig));
    
    // Try to access the named exports from the default export
    const awsModule = awsConfig.default || awsConfig;
    console.log('AWS Module keys:', Object.keys(awsModule));
    
    console.log('DB exports:', Object.keys(db));
    console.log('DB default:', Object.keys(db.default || {}));
    
    rekognitionClient = awsModule.rekognitionClient || awsConfig.rekognitionClient;
    prisma = db.prisma || db.default?.prisma;
    
    console.log('Rekognition client found:', !!rekognitionClient);
    console.log('Prisma found:', !!prisma);
    
    if (!rekognitionClient) {
      throw new Error('rekognitionClient is undefined');
    }
    if (!prisma) {
      throw new Error('prisma is undefined');
    }
    
  } catch (error) {
    console.error('Failed to initialize services:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

async function setupFaceCollections() {
  console.log('🔐 Setting up Face Collections for SafePlay Venues\n');

  // Initialize services first
  await initializeServices();

  try {
    // Test AWS connection first (skip if no ListCollections permission)
    console.log('Testing AWS Rekognition connection...');
    let existingCollections = { CollectionIds: [] };
    try {
      const listCommand = new ListCollectionsCommand({});
      existingCollections = await rekognitionClient.send(listCommand);
      console.log('✅ AWS Rekognition connected successfully!');
      console.log('Existing collections:', existingCollections.CollectionIds?.length || 0);
    } catch (listError) {
      if (listError.name === 'AccessDeniedException') {
        console.log('⚠️  ListCollections permission not available, proceeding without checking existing collections...');
        existingCollections = { CollectionIds: [] };
      } else {
        throw listError;
      }
    }
    console.log('');

    // Get all venues from database
    console.log('Fetching venues from database...');
    const venues = await prisma.venue.findMany({
      select: {
        id: true,
        name: true
      }
    });
    console.log(`Found ${venues.length} venues`);
    console.log('');

    let collectionsCreated = 0;
    let collectionsExisted = 0;

    // Create face collection for each venue
    for (const venue of venues) {
      const collectionId = `safeplay-venue-${venue.id}`;
      
      try {
        // Check if collection already exists (if we have permission)
        if (existingCollections.CollectionIds?.includes(collectionId)) {
          console.log(`✓ Collection already exists: ${collectionId} (${venue.name})`);
          collectionsExisted++;
          continue;
        }

        // Create new collection
        const createCommand = new CreateCollectionCommand({
          CollectionId: collectionId
        });
        
        await rekognitionClient.send(createCommand);
        console.log(`✅ Created collection: ${collectionId} (${venue.name})`);
        collectionsCreated++;

        // Update venue with collection ID
        await prisma.venue.update({
          where: { id: venue.id },
          data: {
            faceCollectionId: collectionId,
            faceRecognitionEnabled: true
          }
        });

      } catch (error) {
        if (error.name === 'ResourceAlreadyExistsException') {
          console.log(`✓ Collection already exists: ${collectionId} (${venue.name})`);
          collectionsExisted++;
          
          // Still update venue with collection ID
          await prisma.venue.update({
            where: { id: venue.id },
            data: {
              faceCollectionId: collectionId,
              faceRecognitionEnabled: true
            }
          });
        } else {
          console.log(`❌ Failed to create collection for ${venue.name}: ${error.message}`);
        }
      }
    }

    console.log('');
    console.log('📊 Summary:');
    console.log(`Collections created: ${collectionsCreated}`);
    console.log(`Collections existed: ${collectionsExisted}`);
    console.log(`Total venues: ${venues.length}`);
    console.log('');

    // Create demo collections if needed
    console.log('Setting up demo collections...');
    await setupDemoCollections();

    console.log('✅ Face collection setup completed!');

  } catch (error) {
    console.log('❌ Face collection setup failed:');
    console.log('Error:', error.message);
    
    if (error.name === 'AccessDeniedException') {
      console.log('');
      console.log('🔧 Required IAM Permissions:');
      console.log('- rekognition:CreateCollection');
      console.log('- rekognition:ListCollections');
      console.log('- rekognition:DescribeCollection');
      console.log('');
      console.log('Please check the AWS_REKOGNITION_SETUP_GUIDE.md for setup instructions.');
    }
    
    process.exit(1);
  }
}

async function setupDemoCollections() {
  const demoCollections = [
    'safeplay-demo-main',
    'safeplay-demo-test'
  ];

  for (const collectionId of demoCollections) {
    try {
      const createCommand = new CreateCollectionCommand({
        CollectionId: collectionId
      });
      
      await rekognitionClient.send(createCommand);
      console.log(`✅ Created demo collection: ${collectionId}`);
    } catch (error) {
      if (error.name === 'ResourceAlreadyExistsException') {
        console.log(`✓ Demo collection already exists: ${collectionId}`);
      } else {
        console.log(`❌ Failed to create demo collection ${collectionId}: ${error.message}`);
      }
    }
  }
}

if (require.main === module) {
  setupFaceCollections();
}

module.exports = setupFaceCollections;
