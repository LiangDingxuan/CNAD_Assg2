const mongoose = require('mongoose');

const UserGamificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    points: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompletionDate: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserGamification', UserGamificationSchema);
