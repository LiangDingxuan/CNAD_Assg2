// task_service/models/schedule.model.js
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily'
  },
  time: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM)`
    }
  },
  days: {
    type: [Number],
    default: [1, 2, 3, 4, 5, 6, 7], // 1 = Monday, 7 = Sunday
    validate: {
      validator: function(v) {
        return v.every(day => day >= 1 && day <= 7);
      },
      message: 'Days must be between 1 (Monday) and 7 (Sunday)'
    }
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastTriggered: {
    type: Date
  },
  nextTrigger: {
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

// Index for efficient querying
scheduleSchema.index({ taskId: 1 });
scheduleSchema.index({ userId: 1 });
scheduleSchema.index({ isActive: 1 });
scheduleSchema.index({ nextTrigger: 1 });

// Pre-save hook to calculate next trigger time
scheduleSchema.pre('save', function(next) {
  if (this.isModified('time') || this.isModified('days') || this.isModified('isActive')) {
    this.calculateNextTrigger();
  }
  next();
});

// Method to calculate next trigger time
scheduleSchema.methods.calculateNextTrigger = function() {
  if (!this.isActive) {
    this.nextTrigger = null;
    return;
  }

  const now = new Date();
  const [hours, minutes] = this.time.split(':').map(Number);
  
  // Find the next occurrence
  let nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);
  
  // If the time has passed today, move to tomorrow
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  // Find the next valid day
  while (!this.days.includes(nextDate.getDay() === 0 ? 7 : nextDate.getDay())) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  // Check if it's before endDate if specified
  if (this.endDate && nextDate > this.endDate) {
    this.nextTrigger = null;
    this.isActive = false;
  } else {
    this.nextTrigger = nextDate;
  }
};

module.exports = mongoose.model('Schedule', scheduleSchema);
