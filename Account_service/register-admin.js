const mongoose = require('mongoose');
const User = require('./models/user.model');
const { hashPassword, makeSalt } = require('./utils/password.utils');

async function registerAdmin() {
  try {
    // Connect to MongoDB
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.ACCOUNT_DB_NAME || 'account';

    await mongoose.connect(`${dbUri}/${dbName}`);
    console.log('Connected to MongoDB');

    // Admin credentials
    const username = 'admin';
    const password = 'Admin123!';
    const role = 'admin';

    // Check if admin already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Admin user already exists!');
      console.log('\n==================');
      console.log('LOGIN CREDENTIALS:');
      console.log('==================');
      console.log(`Username: ${username}`);
      console.log(`Password: ${password}`);
      console.log(`Role: ${role}`);
      console.log('==================\n');
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const salt = makeSalt();
    const hash = hashPassword(password, salt);

    const admin = await User.create({
      username,
      passwordSalt: salt,
      passwordHash: hash,
      role,
      isActive: true
    });

    console.log('✓ Admin user created successfully!');
    console.log('\n==================');
    console.log('LOGIN CREDENTIALS:');
    console.log('==================');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);
    console.log(`User ID: ${admin._id}`);
    console.log('==================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

registerAdmin();
