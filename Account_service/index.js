const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.ACCOUNT_SERVICE_PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Account Service is running' });
});

app.use('/api/auth', authRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Account Service running on port ${PORT}`);
  });
});
