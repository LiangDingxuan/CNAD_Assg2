const mongoose = require('mongoose');

const UserBadgeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: true },
    awardedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserBadge', UserBadgeSchema);
