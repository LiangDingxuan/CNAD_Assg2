const express = require('express');
const { listUnits, getUnit, createUnit, updateUnit, deleteUnit } = require('../controllers/unit.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, requireRole(['admin', 'staff']), listUnits);
router.get('/:unitId', requireAuth, requireRole(['admin', 'staff']), getUnit);
router.post('/', requireAuth, requireRole(['admin']), createUnit);
router.patch('/:unitId', requireAuth, requireRole(['admin']), updateUnit);
router.delete('/:unitId', requireAuth, requireRole(['admin']), deleteUnit);

module.exports = router;