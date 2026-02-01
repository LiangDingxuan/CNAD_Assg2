const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const ACCOUNT_DB_NAME = process.env.ACCOUNT_DB_NAME || 'account';

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

async function setupTablet() {
  const client = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    
    const db = client.db(ACCOUNT_DB_NAME);
    
    // Create a sample tablet session
    const tabletSession = {
      _id: new ObjectId(),
      tabletId: 'TABLET-001',
      unitId: null, // Will be set after creating/getting unit
      deviceSecret: 'sample-secret-for-testing',
      loggedInUsers: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create a sample unit if it doesn't exist
    const unitCollection = db.collection('units');
    let unit = await unitCollection.findOne({ unitNumber: 'HDB-01' });
    
    if (!unit) {
      unit = {
        _id: new ObjectId(),
        unitNumber: 'HDB-01',
        address: '123 Test Street',
        capacity: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await unitCollection.insertOne(unit);
      console.log('✅ Created sample unit: HDB-01');
    } else {
      console.log('✅ Unit HDB-01 already exists');
    }

    // Set the unitId for the tablet
    tabletSession.unitId = unit._id;

    // Insert tablet session
    const tabletCollection = db.collection('tabletsessions');
    await tabletCollection.deleteOne({ tabletId: 'TABLET-001' }); // Remove existing if any
    await tabletCollection.insertOne(tabletSession);
    console.log('✅ Created tablet session: TABLET-001');

    // Get resident users
    const userCollection = db.collection('users');
    const residents = await userCollection.find({ role: 'resident' }).toArray();
    
    if (residents.length === 0) {
      console.log('⚠️  No resident users found. Please run seed.js first.');
    } else {
      console.log(`✅ Found ${residents.length} resident users:`);
      residents.forEach(user => {
        console.log(`   - ${user.username} (ID: ${user._id})`);
      });
    }

    console.log('\n🎉 Tablet setup complete!');
    console.log('\n📋 Login Information:');
    console.log('   Tablet ID: TABLET-001');
    console.log('   Admin username: admin');
    console.log('   Admin password: password123');
    console.log('\n👥 Resident Users (for PIN entry):');
    console.log('   Username: user1, PIN: 1234');
    console.log('   Username: user2, PIN: 1234');
    
  } catch (error) {
    console.error('❌ Error setting up tablet:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

setupTablet();
