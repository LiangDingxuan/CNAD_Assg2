const express = require('express');
const router = express.Router();
const {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleScheduleStatus,
  getUpcomingAlerts
} = require('../controllers/scheduleController');

// Base route: /api/schedules

// Get all schedules
router.get('/', getSchedules);

// Get upcoming alerts
router.get('/upcoming', getUpcomingAlerts);

// Get single schedule
router.get('/:id', getSchedule);

// Create new schedule
router.post('/', createSchedule);

// Update schedule
router.put('/:id', updateSchedule);

// Delete schedule
router.delete('/:id', deleteSchedule);

// Toggle schedule status
router.patch('/:id/toggle', toggleScheduleStatus);

module.exports = router;
