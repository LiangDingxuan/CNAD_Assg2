const Schedule = require('../models/schedule');
const Task = require('../models/task');
const logger = require('../utils/logger');

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Public
const getSchedules = async (req, res, next) => {
  try {
    const { taskId, userId, isActive } = req.query;
    const query = {};
    
    if (taskId) query.taskId = taskId;
    if (userId) query.userId = userId;
    if (isActive) query.isActive = isActive === 'true';
    
    const schedules = await Schedule.find(query)
      .populate('task', 'name description status')
      .sort({ nextAlert: 1 });
      
    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single schedule
// @route   GET /api/schedules/:id
// @access  Public
const getSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate('task', 'name description status');
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new schedule
// @route   POST /api/schedules
// @access  Public
const createSchedule = async (req, res, next) => {
  try {
    // Check if task exists
    const task = await Task.findById(req.body.taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    const schedule = await Schedule.create(req.body);
    
    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update schedule
// @route   PUT /api/schedules/:id
// @access  Public
const updateSchedule = async (req, res, next) => {
  try {
    let schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    // Check if task exists if taskId is being updated
    if (req.body.taskId) {
      const task = await Task.findById(req.body.taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }
    }
    
    // Update schedule
    schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('task', 'name description status');
    
    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete schedule
// @route   DELETE /api/schedules/:id
// @access  Public
const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    await schedule.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle schedule active status
// @route   PATCH /api/schedules/:id/toggle
// @access  Public
const toggleScheduleStatus = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    schedule.isActive = !schedule.isActive;
    await schedule.save();
    
    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming alerts
// @route   GET /api/schedules/upcoming
// @access  Public
const getUpcomingAlerts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const now = new Date();
    
    const upcomingAlerts = await Schedule.find({
      isActive: true,
      nextAlert: { $gte: now }
    })
      .populate('task', 'name description')
      .sort({ nextAlert: 1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: upcomingAlerts.length,
      data: upcomingAlerts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleScheduleStatus,
  getUpcomingAlerts
};
