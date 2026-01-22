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
    default: null
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: true
  },
  time: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM`
    }
  },
  days: [{
    type: Number,
    min: 1,
    max: 7, // 1 = Monday, 7 = Sunday
    required: function() {
      return this.type === 'weekly' || this.type === 'custom';
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  nextAlert: {
    type: Date,
    default: null
  },
  lastAlerted: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster querying
scheduleSchema.index({ isActive: 1, nextAlert: 1 });
scheduleSchema.index({ taskId: 1 });
scheduleSchema.index({ userId: 1 });

// Virtual for task details
scheduleSchema.virtual('task', {
  ref: 'Task',
  localField: 'taskId',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to calculate next alert time
scheduleSchema.pre('save', function(next) {
  if (this.isModified('time') || this.isModified('days') || this.isModified('type') || this.isNew) {
    this.nextAlert = this.calculateNextAlert();
  }
  next();
});

// Method to calculate next alert time
scheduleSchema.methods.calculateNextAlert = function() {
  const now = new Date();
  const [hours, minutes] = this.time.split(':').map(Number);
  
  let nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);
  
  if (now > nextDate) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  if (this.days && this.days.length > 0) {
    const dayOfWeek = nextDate.getDay() || 7; // Convert Sunday (0) to 7
    let daysToAdd = 0;
    
    // Find the next scheduled day
    const nextDay = this.days.sort((a, b) => a - b).find(d => d >= dayOfWeek) || this.days[0];
    
    if (nextDay > dayOfWeek) {
      daysToAdd = nextDay - dayOfWeek;
    } else if (nextDay < dayOfWeek) {
      daysToAdd = 7 - (dayOfWeek - nextDay);
    } else if (now > nextDate) {
      daysToAdd = 7; // Same day but time has passed, schedule for next week
    }
    
    nextDate.setDate(nextDate.getDate() + daysToAdd);
  }
  
  return nextDate;
};

// Method to check if schedule should trigger now
scheduleSchema.methods.shouldTrigger = function() {
  if (!this.isActive || !this.nextAlert) return false;
  
  const now = new Date();
  const timeDiff = this.nextAlert.getTime() - now.getTime();
  
  // Trigger if the next alert time is within the next minute
  return timeDiff > 0 && timeDiff <= 60000;
};

// Method to update last alerted time and calculate next alert
scheduleSchema.methods.updateAlertTime = function() {
  this.lastAlerted = new Date();
  this.nextAlert = this.calculateNextAlert();
  return this.save();
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
