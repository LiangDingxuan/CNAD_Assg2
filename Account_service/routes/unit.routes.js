const express = require('express');
const { listUnits, createUnit, updateUnit } = require('../controllers/unit.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, requireRole(['admin', 'staff']), listUnits);
router.post('/', requireAuth, requireRole(['admin']), createUnit);
router.patch('/:unitId', requireAuth, requireRole(['admin']), updateUnit);

module.exports = router;