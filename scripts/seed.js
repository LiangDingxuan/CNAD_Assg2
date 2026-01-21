const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const TASK_DB_NAME = process.env.TASK_DB_NAME || 'Task';
const ACCOUNT_DB_NAME = process.env.ACCOUNT_DB_NAME || 'account';

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

// Sample data
const sampleUsers = [
  { 
    username: 'user1', 
    email: 'user1@example.com', 
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    username: 'admin', 
    email: 'admin@example.com', 
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const { ObjectId } = require('mongodb');

const sampleTasks = [
  { 
    _id: new ObjectId(),
    name: 'Morning Medication',
    description: 'Take prescribed morning medication with water',
    status: 'completed',
    time_taken: 5
  },
  { 
    _id: new ObjectId(),
    name: 'Breakfast',
    description: 'Prepare and eat breakfast',
    status: 'completed',
    time_taken: 20
  },
  { 
    _id: new ObjectId(),
    name: 'Brush Teeth',
    description: 'Brush teeth for 2 minutes',
    status: 'snoozed',
    time_taken: 0
  },
  { 
    _id: new ObjectId(),
    name: 'Lunch',
    description: 'Prepare and eat lunch',
    status: 'pending',
    time_taken: 0
  },
  { 
    _id: new ObjectId(),
    name: 'Evening Medication',
    description: 'Take prescribed evening medication with water',
    status: 'pending',
    time_taken: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedDatabase() {
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    // Connect the client to the server
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    
    // Connect to Account database for users
    const accountDb = client.db(ACCOUNT_DB_NAME);
    const taskDb = client.db(TASK_DB_NAME);
    
    // Drop existing collections if they exist (optional, for clean seed)
    await accountDb.collection('users').drop().catch(() => console.log('Users collection does not exist, creating new one...'));
    await taskDb.collection('tasks').drop().catch(() => console.log('Tasks collection does not exist, creating new one...'));
    
    // Insert sample users into Account database
    const usersCollection = accountDb.collection('users');
    const usersResult = await usersCollection.insertMany(sampleUsers);
    console.log(`✅ Successfully inserted ${usersResult.insertedCount} users into ${ACCOUNT_DB_NAME} database`);
    
    // Insert sample tasks into Task database
    const tasksCollection = taskDb.collection('tasks');
    const tasksResult = await tasksCollection.insertMany(sampleTasks);
    console.log(`✅ Successfully inserted ${tasksResult.insertedCount} tasks into ${TASK_DB_NAME} database`);
    
    // Create indexes
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await tasksCollection.createIndex({ status: 1 });
    
    console.log('\n🎉 Databases seeded successfully!');
    console.log('🔗 MongoDB URI:', MONGODB_URI.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@'));
    console.log('📊 Account Database:', ACCOUNT_DB_NAME);
    console.log('📊 Task Database:', TASK_DB_NAME);
    
  } catch (error) {
    console.error('❌ Error seeding database:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔴 Could not connect to MongoDB. Please check:');
      console.error('1. Is your MongoDB server running?');
      console.error('2. Is the connection string in .env file correct?');
      console.error('3. Do you have network access to MongoDB?');
    } else if (error.code === 8000) {
      console.error('\n🔴 Authentication failed. Please check:');
      console.error('1. Is your MongoDB username and password correct?');
      console.error('2. Does your user have the correct permissions?');
    }
    
    process.exit(1);
  } finally {
    // Close the connection
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

seedDatabase();
