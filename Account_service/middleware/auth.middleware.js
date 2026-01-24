const jwt = require('jsonwebtoken');

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

module.exports = { requireAuth, requireRole };
