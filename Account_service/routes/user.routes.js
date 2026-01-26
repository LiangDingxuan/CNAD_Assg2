const express = require('express');
const { listUsers, getUser, createUser, updateUser } = require('../controllers/user.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// All user routes require admin role
router.use(requireAuth, requireRole(['admin']));

router.get('/', listUsers);
router.get('/:userId', getUser);
router.post('/', createUser);
router.patch('/:userId', updateUser);

module.exports = router;
