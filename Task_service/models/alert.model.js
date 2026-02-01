// task_service/models/alert.model.js
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true
  },
  type: {
    type: String,
    enum: ['reminder', 'overdue', 'missed', 'snoozed'],
    default: 'reminder'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'acknowledged', 'dismissed'],
    default: 'pending'
  },
  acknowledgedAt: {
    type: Date
  },
  dismissedAt: {
    type: Date
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  nextRetryAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
alertSchema.index({ userId: 1 });
alertSchema.index({ taskId: 1 });
alertSchema.index({ scheduleId: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ scheduledTime: 1 });
alertSchema.index({ nextRetryAt: 1 });

// Pre-save hook to set retry schedule
alertSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'pending' && this.retryCount < this.maxRetries) {
    const retryDelay = Math.pow(2, this.retryCount) * 5 * 60 * 1000; // Exponential backoff: 5min, 10min, 20min
    this.nextRetryAt = new Date(Date.now() + retryDelay);
  }
  next();
});

// Method to acknowledge alert
alertSchema.methods.acknowledge = function() {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  return this.save();
};

// Method to dismiss alert
alertSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  this.dismissedAt = new Date();
  return this.save();
};

// Method to increment retry count
alertSchema.methods.incrementRetry = function() {
  this.retryCount += 1;
  if (this.retryCount >= this.maxRetries) {
    this.status = 'missed';
  }
  return this.save();
};

module.exports = mongoose.model('Alert', alertSchema);
