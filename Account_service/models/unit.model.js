const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema(
  {
    unitNumber: { type: String, required: true, unique: true, trim: true },
    floor:      { type: Number, default: null },
    block:      { type: String, default: null, trim: true },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Unit', UnitSchema);
