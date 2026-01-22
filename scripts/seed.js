const { MongoClient, ServerApiVersion } = require('mongodb');
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
function makeUser(username, email, role, unitId, plainPassword) {
  const salt = makeSalt();
  const passwordHash = hashPassword(plainPassword, salt);
  return {
    username,
    email,
    role,
    unitId: unitId || null,
    passwordSalt: salt,
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Sample data
// Password for all demo users: password123
const sampleUsers = [
  makeUser('user1', 'user1@example.com', 'resident', 'HDB-01', 'password123'),
  makeUser('user2', 'user2@example.com', 'resident', 'HDB-01', 'password123'),
  makeUser('staff1', 'staff1@example.com', 'staff', null, 'password123'),
  makeUser('admin', 'admin@example.com', 'admin', null, 'password123')
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

    await accountDb.collection('users').drop().catch(() => console.log('Users collection does not exist, creating new one.'));
    await taskDb.collection('tasks').drop().catch(() => console.log('Tasks collection does not exist, creating new one.'));

    const usersCollection = accountDb.collection('users');
    const usersResult = await usersCollection.insertMany(sampleUsers);
    console.log(`✅ Successfully inserted ${usersResult.insertedCount} users into ${ACCOUNT_DB_NAME} database`);

    const tasksCollection = taskDb.collection('tasks');
    const tasksResult = await tasksCollection.insertMany(sampleTasks);
    console.log(`✅ Successfully inserted ${tasksResult.insertedCount} tasks into ${TASK_DB_NAME} database`);

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
