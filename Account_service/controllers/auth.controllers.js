const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { verifyPassword, makeSalt, hashPassword } = require('../utils/password');

async function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'username and password required' });
  }

  const user = await User.findOne({ username }).lean();
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { sub: String(user._id), username: user.username, role: user.role, unitId: user.unitId || null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return res.json({
    token,
    user: { id: String(user._id), username: user.username, email: user.email, role: user.role, unitId: user.unitId || null }
  });
}

// Optional: useful for demo/testing
async function register(req, res) {
  const { username, email, password, role, unitId } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'username, email, password required' });
  }

  const existing = await User.findOne({ $or: [{ username }, { email }] }).lean();
  if (existing) return res.status(409).json({ message: 'username/email already exists' });

  const salt = makeSalt();
  const passwordHash = hashPassword(password, salt);

  const user = await User.create({
    username,
    email,
    role: role || 'user',
    unitId: unitId || null,
    passwordSalt: salt,
    passwordHash
  });

  return res.status(201).json({
    id: String(user._id),
    username: user.username,
    email: user.email,
    role: user.role,
    unitId: user.unitId || null
  });
}

module.exports = { login, register };
