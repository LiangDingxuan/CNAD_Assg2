const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../Account_service/models/user.model');
const { hashPassword, makeSalt } = require('../Account_service/utils/password.utils');

async function registerAdmin() {
  try {
    const dbUri = process.env.MONGODB_URI;
    const dbName = process.env.ACCOUNT_DB_NAME || 'account';

    if (!dbUri) {
      console.error('ERROR: MONGODB_URI not found in environment variables');
      console.error('Please ensure .env file exists with MONGODB_URI');
      process.exit(1);
    }

    await mongoose.connect(dbUri, { dbName });
    console.log(`Connected to MongoDB (database: ${dbName})`);

    // Admin credentials
    const username = 'admin';
    const password = 'Admin123!';
    const role = 'admin';

    // Check if admin already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Admin user already exists!');
      console.log('\nLogin Credentials:');
      console.log('==================');
      console.log(`Username: ${username}`);
      console.log(`Password: ${password}`);
      console.log(`Role: ${role}`);
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

    console.log('Admin user created successfully!');
    console.log('\nLogin Credentials:');
    console.log('==================');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);
    console.log(`User ID: ${admin._id}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

registerAdmin();
