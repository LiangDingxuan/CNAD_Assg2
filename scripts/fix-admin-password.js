const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connectDB } = require('../Account_service/config/db');
const User = require('../Account_service/models/user.model');
const { hashPassword, makeSalt } = require('../Account_service/utils/password.utils');

async function fixAdminPassword() {
  try {
    await connectDB();

    const password = 'Admin123!';
    const salt = makeSalt();
    const hash = hashPassword(password, salt);

    // Update the admin user with proper password hash
    const result = await User.updateOne(
      { username: 'admin' },
      {
        $set: {
          passwordSalt: salt,
          passwordHash: hash,
          isActive: true
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✓ Admin password updated successfully!');
      console.log('\n==================');
      console.log('LOGIN CREDENTIALS:');
      console.log('==================');
      console.log('Username: admin');
      console.log('Password: Admin123!');
      console.log('Role: admin');
      console.log('==================\n');
    } else if (result.matchedCount > 0) {
      console.log('✓ Admin user already has correct password format');
      console.log('\n==================');
      console.log('LOGIN CREDENTIALS:');
      console.log('==================');
      console.log('Username: admin');
      console.log('Password: Admin123!');
      console.log('Role: admin');
      console.log('==================\n');
    } else {
      console.log('❌ Admin user not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAdminPassword();
