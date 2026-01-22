const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'snoozed'],
    default: 'pending'
  },
  time_taken: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for schedules
// taskSchema.virtual('schedules', {
//   ref: 'Schedule',
//   localField: '_id',
//   foreignField: 'taskId'
// });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
