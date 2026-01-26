const express = require('express');
const { registerTablet, loginResident, verifyPinEndpoint, logoutResident, getSessions } = require('../controllers/tablet.controller');
const { requireAuth, requireRole, requireDeviceSecret } = require('../middleware/auth.middleware');
const { pinLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Admin-only routes
router.post('/register', requireAuth, requireRole(['admin']), registerTablet);
router.post('/:tabletId/login', requireAuth, requireRole(['admin']), loginResident);
router.post('/:tabletId/logout', requireAuth, requireRole(['admin']), logoutResident);

// Device-secret authenticated routes (tablet calls these)
router.post('/:tabletId/verify-pin', pinLimiter, requireDeviceSecret, verifyPinEndpoint);
router.get('/:tabletId/sessions', requireDeviceSecret, getSessions);

module.exports = router;
