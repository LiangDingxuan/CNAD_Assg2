const User = require('../models/user.model');
const Unit = require('../models/unit.model');
const TabletSession = require('../models/tabletSession.model');
const RefreshToken = require('../models/refreshToken.model');
const { hashPassword, makeSalt: makePasswordSalt } = require('../utils/password.utils');
const { hashPin, makeSalt: makePinSalt } = require('../utils/pin.utils');

function sanitizeUser(user) {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email || null,
    role: user.role,
    unitId: user.unitId ? String(user.unitId) : null,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function listUsers(req, res, next) {
  try {
    const filter = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.unitId) {
      filter.unitId = req.query.unitId;
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const users = await User.find(filter).sort({ username: 1 }).lean();
    return res.json(users.map(sanitizeUser));
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    }

    return res.json(sanitizeUser(user));
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid user ID format.' } });
    }
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { username, email, role, password, pin, unitId } = req.body || {};

    if (!username || !role) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Username and role are required.' } });
    }

    if (!['admin', 'staff', 'resident'].includes(role)) {
      return res.status(400).json({ error: { code: 'INVALID_ROLE', message: 'Role must be admin, staff, or resident.' } });
    }

    // Staff/admin need password, resident needs PIN
    if (role === 'resident') {
      if (!pin) {
        return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'PIN is required for residents.' } });
      }
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: { code: 'INVALID_PIN_FORMAT', message: 'PIN must be exactly 4 digits.' } });
      }
      if (!unitId) {
        return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Unit ID is required for residents.' } });
      }
    } else {
      if (!password) {
        return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Password is required for staff/admin.' } });
      }
    }

    // Verify unit exists if provided
    if (unitId) {
      const unit = await Unit.findById(unitId);
      if (!unit) {
        return res.status(404).json({ error: { code: 'UNIT_NOT_FOUND', message: 'Unit not found.' } });
      }
      if (!unit.isActive) {
        return res.status(400).json({ error: { code: 'UNIT_INACTIVE', message: 'Cannot assign user to inactive unit.' } });
      }
    }

    // Check duplicate username
    const existing = await User.findOne({ username }).lean();
    if (existing) {
      return res.status(409).json({ error: { code: 'USERNAME_EXISTS', message: 'A user with this username already exists.' } });
    }

    const userData = {
      username,
      email: email || null,
      role,
      unitId: unitId || null,
      isActive: true,
    };

    if (role === 'resident') {
      const salt = makePinSalt();
      userData.pinSalt = salt;
      userData.pinHash = hashPin(pin, salt);
    } else {
      const salt = makePasswordSalt();
      userData.passwordSalt = salt;
      userData.passwordHash = hashPassword(password, salt);
    }

    const user = await User.create(userData);
    return res.status(201).json(sanitizeUser(user));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { code: 'USERNAME_EXISTS', message: 'A user with this username already exists.' } });
    }
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { userId } = req.params;
    const { username, email, password, pin, unitId, isActive } = req.body || {};

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    }

    // Check username uniqueness if changing
    if (username !== undefined && username !== user.username) {
      const existing = await User.findOne({ username }).lean();
      if (existing) {
        return res.status(409).json({ error: { code: 'USERNAME_EXISTS', message: 'A user with this username already exists.' } });
      }
      user.username = username;
    }

    if (email !== undefined) {
      user.email = email || null;
    }

    // Handle password update (staff/admin only)
    if (password !== undefined) {
      if (user.role === 'resident') {
        return res.status(400).json({ error: { code: 'INVALID_OPERATION', message: 'Residents use PIN, not password.' } });
      }
      const salt = makePasswordSalt();
      user.passwordSalt = salt;
      user.passwordHash = hashPassword(password, salt);
    }

    // Handle PIN update (resident only)
    if (pin !== undefined) {
      if (user.role !== 'resident') {
        return res.status(400).json({ error: { code: 'INVALID_OPERATION', message: 'Only residents use PIN.' } });
      }
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: { code: 'INVALID_PIN_FORMAT', message: 'PIN must be exactly 4 digits.' } });
      }
      const salt = makePinSalt();
      user.pinSalt = salt;
      user.pinHash = hashPin(pin, salt);
    }

    // Handle unit change
    if (unitId !== undefined && String(user.unitId) !== String(unitId)) {
      if (unitId) {
        const unit = await Unit.findById(unitId);
        if (!unit) {
          return res.status(404).json({ error: { code: 'UNIT_NOT_FOUND', message: 'Unit not found.' } });
        }
        if (!unit.isActive) {
          return res.status(400).json({ error: { code: 'UNIT_INACTIVE', message: 'Cannot assign user to inactive unit.' } });
        }
      }

      // Remove from old unit's tablet sessions
      await TabletSession.updateMany(
        { loggedInUsers: user._id },
        { $pull: { loggedInUsers: user._id } }
      );
      await RefreshToken.deleteMany({ userId: user._id });

      user.unitId = unitId || null;
    }

    // Handle deactivation
    if (isActive !== undefined && isActive === false && user.isActive === true) {
      await TabletSession.updateMany(
        { loggedInUsers: user._id },
        { $pull: { loggedInUsers: user._id } }
      );
      await RefreshToken.deleteMany({ userId: user._id });
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    await user.save();
    return res.json(sanitizeUser(user));
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid user ID format.' } });
    }
    if (err.code === 11000) {
      return res.status(409).json({ error: { code: 'USERNAME_EXISTS', message: 'A user with this username already exists.' } });
    }
    next(err);
  }
}

module.exports = { listUsers, getUser, createUser, updateUser };
