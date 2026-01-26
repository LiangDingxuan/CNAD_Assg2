const express = require('express');
const cookieParser = require('cookie-parser');
const { login, register, logout, refresh } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(cookieParser());

router.post('/login', loginLimiter, login);
router.post('/register', register);
router.post('/logout', requireAuth, logout);
router.post('/refresh', refresh);

// simple "who am I"
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
