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

// CORS configuration to support both Vite dev server and Docker
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
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
