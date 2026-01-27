const express = require('express');
const { listUsers, getUser, createUser, updateUser, deleteUser, createStaffOrAdmin } = require('../controllers/user.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// All user routes require admin role
router.use(requireAuth, requireRole(['admin']));

router.get('/', listUsers);
router.get('/:userId', getUser);
router.post('/', createUser);
router.post('/staff', createStaffOrAdmin);
router.patch('/:userId', updateUser);
router.delete('/:userId', deleteUser);

module.exports = router;
