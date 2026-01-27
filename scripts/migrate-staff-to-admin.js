const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connectDB } = require('../Account_service/config/db');
const User = require('../Account_service/models/user.model');

async function migrate() {
  try {
    await connectDB();

    const result = await User.updateMany(
      { role: 'staff' },
      { $set: { role: 'admin' } }
    );

    console.log(`Migration complete: ${result.modifiedCount} staff users converted to admin`);

    const staffCount = await User.countDocuments({ role: 'staff' });
    console.log(`Remaining staff users: ${staffCount} (should be 0)`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
