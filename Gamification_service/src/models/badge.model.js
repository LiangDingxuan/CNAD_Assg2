const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    pointsRequired: { type: Number, default: 0 },
    streakRequired: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Badge', BadgeSchema);
