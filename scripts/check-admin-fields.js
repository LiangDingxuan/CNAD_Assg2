const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connectDB } = require('../Account_service/config/db');
const User = require('../Account_service/models/user.model');

async function checkAdmin() {
  try {
    await connectDB();

    const admin = await User.findOne({ username: 'admin' }).lean();

    if (!admin) {
      console.log('Admin user not found');
    } else {
      console.log('Admin user fields:');
      console.log(JSON.stringify(admin, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmin();
