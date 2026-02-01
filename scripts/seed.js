const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const TASK_DB_NAME = process.env.TASK_DB_NAME || 'Task';
const ACCOUNT_DB_NAME = process.env.ACCOUNT_DB_NAME || 'account';

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

function makeSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt) {
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return derivedKey.toString('hex');
}

// Demo passwords (for prototype only)
function makeUser(username, email, role, unitId, plainPassword, plainPin = '1234') {
  const salt = makeSalt();
  const passwordHash = hashPassword(plainPassword, salt);
  const pinSalt = makeSalt();
  const pinHash = hashPassword(plainPin, pinSalt);
  return {
    username,
    email,
    role,
    unitId: unitId || null,
    passwordSalt: salt,
    passwordHash,
    pinSalt,
    pinHash,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null
  };
}

// Sample data
// Password for all demo users: password123
// PIN for residents: 1234
// Sample unit
const sampleUnit = {
  _id: new ObjectId(),
  unitNumber: 'HDB-01',
  address: '123 Test Street, Singapore 123456',
  capacity: 4,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

const sampleUsers = [
  makeUser('user1', 'user1@example.com', 'resident', sampleUnit._id, 'password123', '1234'),
  makeUser('user2', 'user2@example.com', 'resident', sampleUnit._id, 'password123', '1234'),
  makeUser('staff1', 'staff1@example.com', 'staff', null, 'password123'),
  makeUser('admin', 'admin@example.com', 'admin', null, 'password123')
];

const sampleTasks = [
  { 
    _id: new ObjectId(),
    name: 'Morning Medication',
    description: 'Take prescribed morning medication with water',
    category: 'medication',
    status: 'completed',
    time_taken: 5,
    priority: 'high',
    assignedTo: sampleUsers[0]._id,
    createdBy: sampleUsers[1]._id
  },
  { 
    _id: new ObjectId(),
    name: 'Breakfast',
    description: 'Prepare and eat breakfast',
    category: 'meals',
    status: 'completed',
    time_taken: 20,
    priority: 'medium',
    assignedTo: sampleUsers[0]._id,
    createdBy: sampleUsers[1]._id
  },
  { 
    _id: new ObjectId(),
    name: 'Brush Teeth',
    description: 'Brush teeth for 2 minutes',
    category: 'hygiene',
    status: 'snoozed',
    time_taken: 0,
    priority: 'medium',
    assignedTo: sampleUsers[0]._id,
    createdBy: sampleUsers[1]._id
  },
  { 
    _id: new ObjectId(),
    name: 'Lunch',
    description: 'Prepare and eat lunch',
    category: 'meals',
    status: 'pending',
    time_taken: 0,
    priority: 'medium',
    assignedTo: sampleUsers[0]._id,
    createdBy: sampleUsers[1]._id
  },
  { 
    _id: new ObjectId(),
    name: 'Evening Medication',
    description: 'Take prescribed evening medication with water',
    category: 'medication',
    status: 'pending',
    time_taken: 0,
    priority: 'high',
    assignedTo: sampleUsers[0]._id,
    createdBy: sampleUsers[1]._id
  }
];

const sampleSchedules = [
  {
    _id: new ObjectId(),
    taskId: sampleTasks[0]._id, // Morning Medication
    userId: sampleUsers[0]._id, // Assign to user1
    type: 'daily',
    time: '08:00',
    days: [1, 2, 3, 4, 5, 6, 7], // 1 = Monday, 7 = Sunday
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    taskId: sampleTasks[1]._id, // Breakfast
    userId: sampleUsers[0]._id, // Assign to user1
    type: 'daily',
    time: '08:30',
    days: [1, 2, 3, 4, 5, 6, 7],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    taskId: sampleTasks[2]._id, // Brush Teeth
    userId: sampleUsers[0]._id, // Assign to user1
    type: 'daily',
    time: '08:45',
    days: [1, 2, 3, 4, 5, 6, 7],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    taskId: sampleTasks[3]._id, // Lunch
    userId: sampleUsers[0]._id, // Assign to user1
    type: 'daily',
    time: '12:30',
    days: [1, 2, 3, 4, 5, 6, 7],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    taskId: sampleTasks[4]._id, // Evening Medication
    userId: sampleUsers[0]._id, // Assign to user1
    type: 'daily',
    time: '20:00',
    days: [1, 2, 3, 4, 5, 6, 7],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
async function seedDatabase() {
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

    const accountDb = client.db(ACCOUNT_DB_NAME);
    const taskDb = client.db(TASK_DB_NAME);
    
    // Drop existing collections if they exist (optional, for clean seed)
    await accountDb.collection('users').drop().catch(() => console.log('Users collection does not exist, creating new one...'));
    await accountDb.collection('units').drop().catch(() => console.log('Units collection does not exist, creating new one...'));
    await taskDb.collection('tasks').drop().catch(() => console.log('Tasks collection does not exist, creating new one...'));
    await taskDb.collection('schedules').drop().catch(() =>console.log('Schedules collection does not exist, creating new one...')
);
    
    // Insert sample unit into Account database
    const unitsCollection = accountDb.collection('units');
    await unitsCollection.insertOne(sampleUnit);
    console.log(`✅ Successfully inserted unit into ${ACCOUNT_DB_NAME} database`);
    
    // Insert sample users into Account database
    const usersCollection = accountDb.collection('users');
    const usersResult = await usersCollection.insertMany(sampleUsers);
    console.log(`✅ Successfully inserted ${usersResult.insertedCount} users into ${ACCOUNT_DB_NAME} database`);

    const tasksCollection = taskDb.collection('tasks');
    const tasksResult = await tasksCollection.insertMany(sampleTasks);
    console.log(`✅ Successfully inserted ${tasksResult.insertedCount} tasks into ${TASK_DB_NAME} database`);

    const schedulesCollection = taskDb.collection('schedules');
const schedulesResult = await schedulesCollection.insertMany(sampleSchedules);
console.log(`✅ Successfully inserted ${schedulesResult.insertedCount} schedules into ${TASK_DB_NAME} database`);
    
    // Create indexes
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ role: 1 });

    await tasksCollection.createIndex({ status: 1 });

    console.log('\n🎉 Databases seeded successfully!');
    console.log('📊 Account Database:', ACCOUNT_DB_NAME);
    console.log('📊 Task Database:', TASK_DB_NAME);
    console.log('\n🧪 Demo login creds: username=admin / staff1 / user1 / user2, password=password123');
  } catch (error) {
    console.error('❌ Error seeding database:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

seedDatabase();
