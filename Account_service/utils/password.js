const crypto = require('crypto');

function hashPassword(password, salt) {
  // scrypt is built-in (no extra deps). Output length 64 bytes is plenty for demo.
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return derivedKey.toString('hex');
}

function makeSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function verifyPassword(password, salt, expectedHash) {
  const actual = hashPassword(password, salt);
  // timing-safe compare
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { hashPassword, makeSalt, verifyPassword };
