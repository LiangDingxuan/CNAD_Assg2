const Unit = require('../models/unit.model');

async function listUnits(req, res, next) {
  try {
    const filter = {};

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const units = await Unit.find(filter).sort({ unitNumber: 1 }).lean();
    return res.json(units);
  } catch (err) {
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

    return res.status(201).json({
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

module.exports = { listUnits, createUnit, updateUnit };
