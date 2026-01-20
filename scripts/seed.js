const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'taskmanager';

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

const sampleTasks = [
  { 
    title: 'Complete project setup', 
    description: 'Set up the initial project structure and configurations',
    status: 'in-progress', 
    priority: 'high',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    assignedTo: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    title: 'Write documentation', 
    description: 'Document the API endpoints and setup instructions',
    status: 'todo', 
    priority: 'medium',
    assignedTo: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    title: 'Test API endpoints', 
    description: 'Create and run tests for all API endpoints',
    status: 'todo', 
    priority: 'high',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    assignedTo: 'user1',
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
    
    const db = client.db(DB_NAME);
    
    // Drop existing collections if they exist (optional, for clean seed)
    await db.collection('users').drop().catch(() => console.log('Users collection does not exist, creating new one...'));
    await db.collection('tasks').drop().catch(() => console.log('Tasks collection does not exist, creating new one...'));
    
    // Insert sample users
    const usersCollection = db.collection('users');
    const usersResult = await usersCollection.insertMany(sampleUsers);
    console.log(`✅ Successfully inserted ${usersResult.insertedCount} users`);
    
    // Insert sample tasks
    const tasksCollection = db.collection('tasks');
    const tasksResult = await tasksCollection.insertMany(sampleTasks);
    console.log(`✅ Successfully inserted ${tasksResult.insertedCount} tasks`);
    
    // Create indexes
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await tasksCollection.createIndex({ assignedTo: 1 });
    await tasksCollection.createIndex({ status: 1 });
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('🔗 MongoDB URI:', MONGODB_URI.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@'));
    console.log('📊 Database:', DB_NAME);
    
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
