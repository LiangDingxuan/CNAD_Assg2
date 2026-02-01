const mongoose = require('mongoose');

const VoucherRedemptionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    pointsSpent: { type: Number, required: true },
    voucherCode: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('VoucherRedemption', VoucherRedemptionSchema);
