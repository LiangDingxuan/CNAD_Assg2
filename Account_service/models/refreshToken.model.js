const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tabletId:  { type: String, required: true, trim: true },
    token:     { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
