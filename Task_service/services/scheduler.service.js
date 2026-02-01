// task_service/services/scheduler.service.js
const Schedule = require('../models/schedule.model');
const Alert = require('../models/alert.model');
const Task = require('../models/task.model');

class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting task scheduler...');
    this.isRunning = true;
    
    // Check for due tasks every minute
    this.intervalId = setInterval(async () => {
      await this.checkAndCreateAlerts();
    }, 60000); // 1 minute

    // Run immediately on start
    this.checkAndCreateAlerts();
  }

  // Stop the scheduler
  stop() {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    console.log('Stopping task scheduler...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Check schedules and create alerts
  async checkAndCreateAlerts() {
    try {
      const now = new Date();
      const oneMinuteFromNow = new Date(now.getTime() + 60000); // 1 minute from now

      // Find schedules that need to trigger alerts
      const dueSchedules = await Schedule.find({
        isActive: true,
        nextTrigger: { $lte: oneMinuteFromNow, $gte: now }
      })
      .populate('taskId')
      .populate('userId', 'username email');

      for (const schedule of dueSchedules) {
        await this.createAlertForSchedule(schedule, now);
        
        // Update next trigger time
        schedule.lastTriggered = now;
        schedule.calculateNextTrigger();
        await schedule.save();
      }

      // Check for overdue tasks
      await this.checkOverdueTasks(now);

    } catch (error) {
      console.error('Error in scheduler:', error);
    }
  }

  // Create alert for a schedule
  async createAlertForSchedule(schedule, now) {
    try {
      // Check if alert already exists for this schedule and time
      const existingAlert = await Alert.findOne({
        scheduleId: schedule._id,
        scheduledTime: {
          $gte: new Date(now.getTime() - 300000), // 5 minutes ago
          $lte: new Date(now.getTime() + 300000)  // 5 minutes from now
        }
      });

      if (existingAlert) {
        return; // Alert already created
      }

      // Create new alert
      const alert = new Alert({
        userId: schedule.userId._id,
        taskId: schedule.taskId._id,
        scheduleId: schedule._id,
        type: 'reminder',
        title: `Task Reminder: ${schedule.taskId.name}`,
        message: `It's time to ${schedule.taskId.name.toLowerCase()}. ${schedule.taskId.description}`,
        scheduledTime: now
      });

      await alert.save();
      console.log(`Created alert for task "${schedule.taskId.name}" for user ${schedule.userId.username}`);

    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }

  // Check for overdue tasks and create alerts
  async checkOverdueTasks(now) {
    try {
      const fiveMinutesAgo = new Date(now.getTime() - 300000); // 5 minutes ago

      // Find schedules that should have triggered 5 minutes ago but task is not completed
      const overdueSchedules = await Schedule.find({
        isActive: true,
        lastTriggered: { $lte: fiveMinutesAgo }
      })
      .populate({
        path: 'taskId',
        match: { status: { $nin: ['completed'] } }
      })
      .populate('userId', 'username email');

      for (const schedule of overdueSchedules) {
        if (!schedule.taskId) continue; // Skip if task is completed

        // Check if overdue alert already exists
        const existingOverdueAlert = await Alert.findOne({
          scheduleId: schedule._id,
          type: 'overdue',
          status: { $nin: ['acknowledged', 'dismissed'] },
          createdAt: { $gte: fiveMinutesAgo }
        });

        if (existingOverdueAlert) continue;

        // Create overdue alert
        const alert = new Alert({
          userId: schedule.userId._id,
          taskId: schedule.taskId._id,
          scheduleId: schedule._id,
          type: 'overdue',
          title: `Task Overdue: ${schedule.taskId.name}`,
          message: `You missed your scheduled task: ${schedule.taskId.name}. Please complete it as soon as possible.`,
          scheduledTime: now
        });

        await alert.save();
        console.log(`Created overdue alert for task "${schedule.taskId.name}" for user ${schedule.userId.username}`);
      }

    } catch (error) {
      console.error('Error checking overdue tasks:', error);
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    };
  }
}

module.exports = new SchedulerService();
