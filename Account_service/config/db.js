const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbName = process.env.ACCOUNT_DB_NAME || 'account';

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`Connected to MongoDB (db: ${dbName})`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };
