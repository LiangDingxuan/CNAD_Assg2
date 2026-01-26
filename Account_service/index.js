const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const unitRoutes = require('./routes/unit.routes');
const userRoutes = require('./routes/user.routes');
const tabletRoutes = require('./routes/tablet.routes');

const app = express();
const PORT = process.env.ACCOUNT_SERVICE_PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Account Service is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tablets', tabletRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message || err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
});

connectDB().then(async () => {
  const User = require('./models/user.model');
  // Drop stale non-sparse email index if it exists, then rebuild
  try { await User.collection.dropIndex('email_1'); } catch (e) { /* index may not exist */ }
  await User.syncIndexes();
  app.listen(PORT, () => {
    console.log(`Account Service running on port ${PORT}`);
  });
});
