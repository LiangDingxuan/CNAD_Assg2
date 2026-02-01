// task_service/controllers/task.controller.js
const Task = require('../models/task.model');
const Schedule = require('../models/schedule.model');
const Alert = require('../models/alert.model');

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const { userId, status, category } = req.query;
    const filter = {};
    
    if (userId) filter.assignedTo = userId;
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new task (for staff)
exports.createTask = async (req, res) => {
  try {
    // Add createdBy from authenticated user
    const taskData = {
      ...req.body,
      createdBy: req.user ? req.user.id : null
    };
    
    const task = new Task(taskData);
    await task.save();
    
    // If schedule is provided, create it
    if (req.body.schedule) {
      const scheduleData = {
        taskId: task._id,
        userId: req.body.schedule.userId,
        type: req.body.schedule.type || 'daily',
        time: req.body.schedule.time,
        days: req.body.schedule.days || [1, 2, 3, 4, 5, 6, 7],
        startDate: req.body.schedule.startDate || new Date(),
        endDate: req.body.schedule.endDate,
        isActive: req.body.schedule.isActive !== false
      };
      
      const schedule = new Schedule(scheduleData);
      await schedule.save();
      
      // Return task with schedule
      task.schedule = schedule;
    }
    
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'in_progress', 'completed', 'snoozed', 'missed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user's timetable
exports.getUserTimetable = async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay(); // Convert Sunday to 7
    
    const schedules = await Schedule.find({
      userId: userId,
      isActive: true,
      days: { $in: [dayOfWeek] },
      $or: [
        { startDate: { $lte: targetDate } },
        { startDate: { $exists: false } }
      ],
      $or: [
        { endDate: { $gte: targetDate } },
        { endDate: { $exists: false } }
      ]
    })
    .populate({
      path: 'taskId',
      populate: [
        { path: 'assignedTo', select: 'username email' },
        { path: 'createdBy', select: 'username email' }
      ]
    })
    .sort({ time: 1 });
    
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user alerts
exports.getUserAlerts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, type } = req.query;
    
    const filter = { userId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const alerts = await Alert.find(filter)
      .populate('taskId', 'name description category')
      .populate('scheduleId', 'time days')
      .sort({ scheduledTime: -1 });
    
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create alert
exports.createAlert = async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();
    
    const populatedAlert = await Alert.findById(alert._id)
      .populate('taskId', 'name description category')
      .populate('scheduleId', 'time days')
      .populate('userId', 'username email');
    
    res.status(201).json(populatedAlert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Acknowledge alert
exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    await alert.acknowledge();
    res.status(200).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dismiss alert
exports.dismissAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    await alert.dismiss();
    res.status(200).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};