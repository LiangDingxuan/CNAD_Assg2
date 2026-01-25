const cron = require('node-cron');
const Schedule = require('../models/schedule');
const Task = require('../models/task');
const logger = require('../utils/logger');

// Store active jobs
const activeJobs = new Map();

// Function to schedule a single alert
const scheduleAlert = (schedule) => {
  if (!schedule.isActive) return;

  const job = cron.schedule('* * * * *', async () => {
    try {
      // Refresh the schedule to get the latest data
      const freshSchedule = await Schedule.findById(schedule._id);
      
      if (!freshSchedule || !freshSchedule.isActive) {
        job.stop();
        activeJobs.delete(schedule._id.toString());
        return;
      }

      if (freshSchedule.shouldTrigger()) {
        const task = await Task.findById(freshSchedule.taskId);
        
        if (task) {
          // Here you would typically send a notification
          logger.info(`ALERT: Time to ${task.name} - ${task.description}`);
          
          // Update the last alerted time and calculate next alert
          await freshSchedule.updateAlertTime();
          
          logger.info(`Next alert for ${task.name} at ${freshSchedule.nextAlert}`);
        }
      }
    } catch (error) {
      logger.error(`Error in alert job for schedule ${schedule._id}:`, error);
    }
  });

  // Store the job reference
  activeJobs.set(schedule._id.toString(), job);
  logger.info(`Scheduled alert for task ${schedule.taskId} at ${schedule.time}`);
};

// Initialize all active schedules
const initializeScheduler = async () => {
  try {
    logger.info('Initializing scheduler...');
    
    // Clear any existing jobs
    activeJobs.forEach(job => job.stop());
    activeJobs.clear();
    
    // Get all active schedules
    const now = new Date();
    const schedules = await Schedule.find({
      isActive: true,
      $or: [
        { nextAlert: { $gte: now } },
        { nextAlert: null }
      ]
    });
    
    // Schedule each active alert
    schedules.forEach(schedule => {
      scheduleAlert(schedule);
    });
    
    logger.info(`Scheduler initialized with ${schedules.length} active schedules`);
  } catch (error) {
    logger.error('Error initializing scheduler:', error);
  }
};

// Add a new schedule to the scheduler
const addSchedule = (schedule) => {
  if (activeJobs.has(schedule._id.toString())) {
    const existingJob = activeJobs.get(schedule._id.toString());
    existingJob.stop();
  }
  
  if (schedule.isActive) {
    scheduleAlert(schedule);
  }
};

// Remove a schedule from the scheduler
const removeSchedule = (scheduleId) => {
  const job = activeJobs.get(scheduleId);
  if (job) {
    job.stop();
    activeJobs.delete(scheduleId);
  }
};

// Update an existing schedule in the scheduler
const updateSchedule = (schedule) => {
  removeSchedule(schedule._id.toString());
  
  if (schedule.isActive) {
    scheduleAlert(schedule);
  }
};

module.exports = {
  initializeScheduler,
  addSchedule,
  removeSchedule,
  updateSchedule
};
