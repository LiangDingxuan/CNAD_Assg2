const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connectDB } = require('../Account_service/config/db');
const User = require('../Account_service/models/user.model');

async function activateUsers() {
  try {
    await connectDB();

    // Update all users that don't have isActive set or have it set to false
    const result = await User.updateMany(
      { $or: [{ isActive: { $exists: false } }, { isActive: false }] },
      { $set: { isActive: true } }
    );

    console.log(`✓ Migration complete: ${result.modifiedCount} users activated`);

    // Show all users and their status
    const users = await User.find({}, 'username role isActive').lean();
    console.log('\nCurrent user status:');
    console.log('====================');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.role}): isActive = ${user.isActive}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

activateUsers();
