const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { verifyPassword, makeSalt, hashPassword } = require('../utils/password.utils');

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

async function register(req, res, next) {
  try {
    const { username, email, password, role, unitId } = req.body || {};

    if (!username || !password || !role) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Username, password, and role are required.' } });
    }

    const existing = await User.findOne({ username }).lean();
    if (existing) {
      return res.status(409).json({ error: { code: 'USERNAME_EXISTS', message: 'A user with this username already exists.' } });
    }

    const salt = makeSalt();
    const passwordHash = hashPassword(password, salt);

    const user = await User.create({
      username,
      email: email || null,
      role,
      unitId: unitId || null,
      passwordSalt: salt,
      passwordHash
    });

    return res.status(201).json({
      id: String(user._id), username: user.username, role: user.role, unitId: user.unitId || null
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { code: 'USERNAME_EXISTS', message: 'A user with this username already exists.' } });
    }
    next(err);
  }
}

module.exports = { login, register };
