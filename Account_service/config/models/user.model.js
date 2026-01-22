const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'staff', 'resident', 'user'],
      default: 'user',
    },

    // For login
    passwordSalt: { type: String, required: true },
    passwordHash: { type: String, required: true },

    // Optional: for household/unit mapping later
    unitId: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
