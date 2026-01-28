const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const TabletSession = require('../models/tabletSession.model');

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Missing or malformed Bearer token.' } });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token.' } });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: { code: 'INSUFFICIENT_ROLE', message: 'You do not have permission to perform this action.' } });
    }
    next();
  };
}

async function requireDeviceSecret(req, res, next) {
  try {
    const { tabletId } = req.params;
    const deviceSecret = req.headers['x-device-secret'];

    if (!deviceSecret) {
      return res.status(401).json({ error: { code: 'INVALID_DEVICE_SECRET', message: 'Missing device secret header.' } });
    }

    const session = await TabletSession.findOne({ tabletId });
    if (!session) {
      return res.status(404).json({ error: { code: 'TABLET_NOT_FOUND', message: 'Tablet not registered.' } });
    }

    const expected = Buffer.from(session.deviceSecret, 'utf8');
    const provided = Buffer.from(deviceSecret, 'utf8');

    if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
      return res.status(401).json({ error: { code: 'INVALID_DEVICE_SECRET', message: 'Invalid device secret.' } });
    }

    req.tabletSession = session;
    next();
  } catch (err) {
    next(err);
  }
}

// Middleware that accepts EITHER admin JWT for tablet access (no device secret needed)
async function requireTabletAccess(req, res, next) {
  try {
    const { tabletId } = req.params;

    // Try JWT auth (admin access)
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type === 'Bearer' && token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // Only admin can access tablet endpoints via JWT
        if (payload.role === 'admin') {
          req.user = payload;
          // Load tablet session for the controller
          const session = await TabletSession.findOne({ tabletId });
          if (!session) {
            return res.status(404).json({ error: { code: 'TABLET_NOT_FOUND', message: 'Tablet not registered.' } });
          }
          req.tabletSession = session;
          return next();
        }
      } catch {
        // JWT invalid
      }
    }

    // No valid admin auth
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Admin JWT required.' } });
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, requireRole, requireDeviceSecret, requireTabletAccess };
