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

module.exports = router;