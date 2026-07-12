const mongoose = require('mongoose');
const { DRIVER_STATUS } = require('../utils/constants');

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    licenseCategory: {
      type: String,
      required: true,
      enum: ['LMV', 'HMV', 'HGV', 'PSV', 'Motorcycle', 'Other'],
    },
    licenseExpiryDate: { type: Date, required: true },
    contactNumber: { type: String, required: true, trim: true },
    // Not in the original field spec, but required to actually deliver the
    // license-expiry reminder emails (bonus feature). Optional so existing
    // records without an email on file don't break anything.
    email: { type: String, trim: true, lowercase: true, default: null },
    safetyScore: { type: Number, min: 0, max: 100, default: 100 },
    status: {
      type: String,
      enum: Object.values(DRIVER_STATUS),
      default: DRIVER_STATUS.AVAILABLE,
    },
    // Tracks whether an expiry reminder email has already gone out, so the
    // cron job doesn't spam the same driver every run.
    expiryReminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

driverSchema.virtual('isLicenseExpired').get(function isLicenseExpired() {
  return this.licenseExpiryDate < new Date();
});

driverSchema.set('toJSON', { virtuals: true });
driverSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Driver', driverSchema);
