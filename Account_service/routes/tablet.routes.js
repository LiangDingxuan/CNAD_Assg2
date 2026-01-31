const express = require('express');
const { registerTablet, loginResident, verifyPinEndpoint, logoutResident, getSessions, listTablets, deleteTablet } = require('../controllers/tablet.controller');
const { requireAuth, requireRole, requireTabletAccess } = require('../middleware/auth.middleware');
const { pinLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Admin-only routes
router.get('/', requireAuth, requireRole(['admin']), listTablets);
router.post('/register', requireAuth, requireRole(['admin']), registerTablet);
router.post('/:tabletId/login', requireAuth, requireRole(['admin']), loginResident);
router.post('/:tabletId/logout', requireAuth, requireRole(['admin']), logoutResident);
router.delete('/:tabletId', requireAuth, requireRole(['admin']), deleteTablet);

// Admin-authenticated routes for tablet access (replaces device secret)
router.post('/:tabletId/verify-pin', pinLimiter, requireTabletAccess, verifyPinEndpoint);
router.get('/:tabletId/sessions', requireTabletAccess, getSessions);

module.exports = router;
