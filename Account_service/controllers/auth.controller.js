const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const TabletSession = require('../models/tabletSession.model');
const { verifyPassword, hashPassword, makeSalt } = require('../utils/password.utils');

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Username and password are required.' } });
    }

    const user = await User.findOne({ username }).lean();

    if (!user || user.role === 'resident') {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' } });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: { code: 'ACCOUNT_DEACTIVATED', message: 'This account has been deactivated.' } });
    }

    const ok = verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' } });
    }

    const token = jwt.sign(
      { sub: String(user._id), username: user.username, role: user.role, unitId: user.unitId || null },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      token,
      user: { id: String(user._id), username: user.username, role: user.role, unitId: user.unitId || null }
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  // Stateless logout - client discards token
  return res.status(204).send();
}

async function refresh(req, res, next) {
  try {
    const refreshTokenValue = req.cookies?.refreshToken;

    if (!refreshTokenValue) {
      return res.status(401).json({ error: { code: 'MISSING_REFRESH_TOKEN', message: 'No refresh token provided.' } });
    }

    const tokenDoc = await RefreshToken.findOne({ token: refreshTokenValue });
    if (!tokenDoc) {
      return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token not found.' } });
    }

    if (new Date() > tokenDoc.expiresAt) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      return res.status(401).json({ error: { code: 'EXPIRED_REFRESH_TOKEN', message: 'Refresh token has expired.' } });
    }

    const user = await User.findById(tokenDoc.userId).lean();
    if (!user || !user.isActive) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      return res.status(401).json({ error: { code: 'USER_INVALID', message: 'User no longer active.' } });
    }

    // Verify user is still logged into the tablet
    const session = await TabletSession.findOne({ tabletId: tokenDoc.tabletId });
    if (!session || !session.loggedInUsers.some(id => String(id) === String(user._id))) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      return res.status(401).json({ error: { code: 'NOT_LOGGED_IN', message: 'User no longer logged into tablet.' } });
    }

    // Issue new access token (1 hour for residents)
    const token = jwt.sign(
      {
        sub: String(user._id),
        username: user.username,
        role: user.role,
        unitId: user.unitId ? String(user.unitId) : null,
        tabletId: tokenDoc.tabletId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    next(err);
  }
}

// TEMPORARY: Register endpoint for initial admin creation
async function register(req, res, next) {
  try {
    const { username, password, role = 'admin' } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Username and password are required.' } });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: { code: 'USER_EXISTS', message: 'Username already exists.' } });
    }

    // Hash password
    const salt = makeSalt();
    const hash = hashPassword(password, salt);

    // Create admin user
    const user = await User.create({
      username,
      passwordSalt: salt,
      passwordHash: hash,
      role,
      isActive: true
    });

    return res.status(201).json({
      message: 'Admin user created successfully',
      user: { id: String(user._id), username: user.username, role: user.role }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, refresh, register };
