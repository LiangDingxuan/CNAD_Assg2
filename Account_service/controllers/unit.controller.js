const crypto = require('crypto');
const Unit = require('../models/unit.model');
const User = require('../models/user.model');
const TabletSession = require('../models/tabletSession.model');

async function listUnits(req, res, next) {
  try {
    const filter = {};

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const units = await Unit.find(filter).sort({ unitNumber: 1 }).lean();
    const formattedUnits = units.map(unit => ({
      id: String(unit._id),
      unitNumber: unit.unitNumber,
      floor: unit.floor,
      block: unit.block,
      isActive: unit.isActive
    }));
    return res.json(formattedUnits);
  } catch (err) {
    next(err);
  }
}

async function getUnit(req, res, next) {
  try {
    const { unitId } = req.params;

    const unit = await Unit.findById(unitId).lean();
    if (!unit) {
      return res.status(404).json({ error: { code: 'UNIT_NOT_FOUND', message: 'Unit not found.' } });
    }

    return res.json({
      id: String(unit._id),
      unitNumber: unit.unitNumber,
      floor: unit.floor,
      block: unit.block,
      isActive: unit.isActive
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid unit ID format.' } });
    }
    next(err);
  }
}

async function createUnit(req, res, next) {
  try {
    const { unitNumber, floor, block } = req.body || {};

    if (!unitNumber) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Unit number is required.' } });
    }

    const unit = await Unit.create({
      unitNumber,
      floor: floor ?? null,
      block: block ?? null
    });

    const tabletId = `${unitNumber}-tablet`;
    const deviceSecret = crypto.randomBytes(32).toString('hex');

    const tablet = await TabletSession.create({
      tabletId,
      unitId: unit._id,
      deviceSecret
    });

    return res.status(201).json({
      unit: {
        id: String(unit._id),
        unitNumber: unit.unitNumber,
        floor: unit.floor,
        block: unit.block,
        isActive: unit.isActive
      },
      tablet: {
        tabletId: tablet.tabletId,
        deviceSecret: tablet.deviceSecret
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { code: 'UNIT_EXISTS', message: 'A unit with this number already exists.' } });
    }
    next(err);
  }
}

async function updateUnit(req, res, next) {
  try {
    const { unitId } = req.params;
    const { unitNumber, floor, block, isActive } = req.body || {};

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ error: { code: 'UNIT_NOT_FOUND', message: 'Unit not found.' } });
    }

    if (unitNumber !== undefined) unit.unitNumber = unitNumber;
    if (floor !== undefined) unit.floor = floor;
    if (block !== undefined) unit.block = block;
    if (isActive !== undefined) unit.isActive = isActive;

    await unit.save();

    return res.json({
      id: String(unit._id),
      unitNumber: unit.unitNumber,
      floor: unit.floor,
      block: unit.block,
      isActive: unit.isActive
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { code: 'UNIT_EXISTS', message: 'A unit with this number already exists.' } });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid unit ID format.' } });
    }
    next(err);
  }
}

async function deleteUnit(req, res, next) {
  try {
    const { unitId } = req.params;

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ error: { code: 'UNIT_NOT_FOUND', message: 'Unit not found.' } });
    }

    // Block if any users belong to this unit
    const userCount = await User.countDocuments({ unitId });
    if (userCount > 0) {
      return res.status(409).json({ error: { code: 'CANNOT_DELETE', message: 'Unit has assigned users. Reassign them first.' } });
    }

    // Block if any tablets belong to this unit
    const tabletCount = await TabletSession.countDocuments({ unitId });
    if (tabletCount > 0) {
      return res.status(409).json({ error: { code: 'CANNOT_DELETE', message: 'Unit has registered tablets. Delete them first.' } });
    }

    await Unit.deleteOne({ _id: unit._id });
    return res.status(204).send();
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid unit ID format.' } });
    }
    next(err);
  }
}

module.exports = { listUnits, getUnit, createUnit, updateUnit, deleteUnit };
