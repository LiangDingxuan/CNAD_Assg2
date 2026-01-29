const crypto = require('crypto');

function hashPin(pin, salt) {
  const derivedKey = crypto.scryptSync(pin, salt, 64);
  return derivedKey.toString('hex');
}

function makeSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function verifyPin(pin, salt, expectedHash) {
  const actual = hashPin(pin, salt);
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { hashPin, makeSalt, verifyPin };
