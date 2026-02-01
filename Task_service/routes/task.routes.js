// task_service/routes/task.routes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');

// Task routes
router.get('/', taskController.getAllTasks);
router.post('/', taskController.createTask);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.patch('/:id/status', taskController.updateTaskStatus);

// Schedule and Timetable routes
router.get('/user/:userId/timetable', taskController.getUserTimetable);

// Alert routes
router.get('/user/:userId/alerts', taskController.getUserAlerts);
router.post('/alerts', taskController.createAlert);
router.patch('/alerts/:id/acknowledge', taskController.acknowledgeAlert);
router.patch('/alerts/:id/dismiss', taskController.dismissAlert);

module.exports = router;