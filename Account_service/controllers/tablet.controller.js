const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const TabletSession = require('../models/tabletSession.model');
const RefreshToken = require('../models/refreshToken.model');
const User = require('../models/user.model');
const Unit = require('../models/unit.model');
const { verifyPin } = require('../utils/pin.utils');

async function registerTablet(req, res, next) {
  try {
    const { tabletId, unitId } = req.body || {};

    if (!tabletId || !unitId) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Tablet ID and unit ID are required.' } });
    }

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ error: { code: 'UNIT_NOT_FOUND', message: 'Unit not found.' } });
    }

    const existing = await TabletSession.findOne({ tabletId });
    if (existing) {
      return res.status(409).json({ error: { code: 'TABLET_EXISTS', message: 'Tablet already registered.' } });
    }

    const deviceSecret = crypto.randomBytes(32).toString('hex');

    const session = await TabletSession.create({
      tabletId,
      unitId,
      deviceSecret,
      loggedInUsers: [],
    });

    return res.status(201).json({
      tabletId: session.tabletId,
      unitId: String(session.unitId),
      deviceSecret,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid unit ID format.' } });
    }
    next(err);
  }
}

async function loginResident(req, res, next) {
  try {
    const { tabletId } = req.params;
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'User ID is required.' } });
    }

    const session = await TabletSession.findOne({ tabletId });
    if (!session) {
      return res.status(404).json({ error: { code: 'TABLET_NOT_FOUND', message: 'Tablet not registered.' } });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    }

    if (user.role !== 'resident') {
      return res.status(400).json({ error: { code: 'INVALID_ROLE', message: 'Only residents can be logged into tablets.' } });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: { code: 'ACCOUNT_DEACTIVATED', message: 'User account is deactivated.' } });
    }

    if (String(user.unitId) !== String(session.unitId)) {
      return res.status(403).json({ error: { code: 'UNIT_MISMATCH', message: 'Resident unit does not match tablet unit.' } });
    }

    if (session.loggedInUsers.length >= 2) {
      return res.status(403).json({ error: { code: 'TABLET_FULL', message: 'Tablet already has 2 residents logged in.' } });
    }

    // Check if already logged in
    if (session.loggedInUsers.some(id => String(id) === String(userId))) {
      return res.status(409).json({ error: { code: 'ALREADY_LOGGED_IN', message: 'User is already logged into this tablet.' } });
    }

    await TabletSession.findByIdAndUpdate(session._id, {
      $addToSet: { loggedInUsers: userId },
    });

    const updated = await TabletSession.findById(session._id).populate('loggedInUsers', 'username');

    return res.json({
      tabletId: updated.tabletId,
      loggedInUsers: updated.loggedInUsers.map(u => ({
        id: String(u._id),
        username: u.username,
      })),
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid ID format.' } });
    }
    next(err);
  }
}

async function verifyPinEndpoint(req, res, next) {
  try {
    const { tabletId } = req.params;
    const { userId, pin } = req.body || {};

    if (!userId || !pin) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'User ID and PIN are required.' } });
    }

    const session = req.tabletSession; // Set by requireDeviceSecret middleware

    // Check user is logged into tablet
    if (!session.loggedInUsers.some(id => String(id) === String(userId))) {
      return res.status(404).json({ error: { code: 'NOT_LOGGED_IN', message: 'User is not logged into this tablet.' } });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: { code: 'ACCOUNT_DEACTIVATED', message: 'User account is deactivated.' } });
    }

    // Verify PIN
    const pinValid = verifyPin(pin, user.pinSalt, user.pinHash);
    if (!pinValid) {
      return res.status(401).json({ error: { code: 'INVALID_PIN', message: 'Invalid PIN.' } });
    }

    // Issue access token (1 hour for residents)
    const token = jwt.sign(
      {
        sub: String(user._id),
        username: user.username,
        role: user.role,
        unitId: user.unitId ? String(user.unitId) : null,
        tabletId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Issue refresh token (7 days)
    const refreshTokenValue = crypto.randomBytes(32).toString('hex');
    await RefreshToken.create({
      userId: user._id,
      tabletId,
      token: refreshTokenValue,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Set httpOnly cookie for refresh token
    res.cookie('refreshToken', refreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      token,
      user: {
        id: String(user._id),
        username: user.username,
        unitId: user.unitId ? String(user.unitId) : null,
      },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid ID format.' } });
    }
    next(err);
  }
}

async function logoutResident(req, res, next) {
  try {
    const { tabletId } = req.params;
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'User ID is required.' } });
    }

    const session = await TabletSession.findOne({ tabletId });
    if (!session) {
      return res.status(404).json({ error: { code: 'TABLET_NOT_FOUND', message: 'Tablet not registered.' } });
    }

    // Remove user from tablet
    await TabletSession.findByIdAndUpdate(session._id, {
      $pull: { loggedInUsers: userId },
    });

    // Delete refresh tokens for this user on this tablet
    await RefreshToken.deleteMany({ userId, tabletId });

    const updated = await TabletSession.findById(session._id).populate('loggedInUsers', 'username');

    return res.json({
      tabletId: updated.tabletId,
      loggedInUsers: updated.loggedInUsers.map(u => ({
        id: String(u._id),
        username: u.username,
      })),
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid ID format.' } });
    }
    next(err);
  }
}

async function getSessions(req, res, next) {
  try {
    const session = req.tabletSession; // Set by requireDeviceSecret middleware

    const populated = await TabletSession.findById(session._id).populate('loggedInUsers', 'username');

    return res.json({
      tabletId: populated.tabletId,
      unitId: String(populated.unitId),
      loggedInUsers: populated.loggedInUsers.map(u => ({
        id: String(u._id),
        username: u.username,
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerTablet, loginResident, verifyPinEndpoint, logoutResident, getSessions };
