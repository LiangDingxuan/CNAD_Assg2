// task_service/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const taskRoutes = require('./routes/task.routes');
const { connectDB } = require('./config/db');
const schedulerService = require('./services/scheduler.service');

const app = express();
const PORT = process.env.TASK_SERVICE_PORT || 3002;

// CORS configuration to support credentials
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Task Service is running' });
});

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Task Service running on port ${PORT}`);
    
    // Start the scheduler after a short delay to ensure DB is ready
    setTimeout(() => {
      schedulerService.start();
      console.log('Task scheduler started');
    }, 2000);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  schedulerService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  schedulerService.stop();
  process.exit(0);
});