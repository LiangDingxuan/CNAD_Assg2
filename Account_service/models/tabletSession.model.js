const mongoose = require('mongoose');

const TabletSessionSchema = new mongoose.Schema(
  {
    tabletId:     { type: String, required: true, unique: true, trim: true },
    unitId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    deviceSecret: { type: String, required: true },
    loggedInUsers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      validate: {
        validator: v => v.length <= 2,
        message: 'Maximum 2 residents per tablet',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TabletSession', TabletSessionSchema);
