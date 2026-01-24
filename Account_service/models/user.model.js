const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username:     { type: String, required: true, unique: true, trim: true },
    email:        { type: String, trim: true, default: null },
    role:         { type: String, enum: ['admin', 'staff', 'resident'], required: true },
    unitId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', default: null },
    passwordHash: { type: String, default: null },
    passwordSalt: { type: String, default: null },
    pinHash:      { type: String, default: null },
    pinSalt:      { type: String, default: null },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique email only when email is not null (allows multiple null values)
UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);

module.exports = mongoose.model('User', UserSchema);
