const express = require('express');
const { listUsers, getUser, createUser, updateUser, deleteUser, createStaffOrAdmin, listResidents } = require('../controllers/user.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Public route for fetching residents (for tablet profile selection)
router.get('/residents', listResidents);

// All other user routes require admin role
router.use(requireAuth, requireRole(['admin']));

router.get('/', listUsers);
router.get('/:userId', getUser);
router.post('/', createUser);
router.post('/staff', createStaffOrAdmin);
router.patch('/:userId', updateUser);
router.delete('/:userId', deleteUser);

module.exports = router;
