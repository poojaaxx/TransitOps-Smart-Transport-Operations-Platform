const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { DRIVER_STATUS } = require('../utils/constants');

const Driver = sequelize.define(
  'Driver',
  {
    _id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    licenseNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    licenseCategory: {
      type: DataTypes.ENUM('LMV', 'HMV', 'HGV', 'PSV', 'Motorcycle', 'Other'),
      allowNull: false,
    },
    licenseExpiryDate: { type: DataTypes.DATE, allowNull: false },
    contactNumber: { type: DataTypes.STRING, allowNull: false },
    // Not in the original field spec, but required to actually deliver the
    // license-expiry reminder emails (bonus feature). Optional so existing
    // records without an email on file don't break anything.
    email: { type: DataTypes.STRING, allowNull: true },
    safetyScore: { type: DataTypes.FLOAT, defaultValue: 100, validate: { min: 0, max: 100 } },
    status: {
      type: DataTypes.ENUM(...Object.values(DRIVER_STATUS)),
      defaultValue: DRIVER_STATUS.AVAILABLE,
    },
    // Tracks whether an expiry reminder email has already gone out, so the
    // cron job doesn't spam the same driver every run.
    expiryReminderSentAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    isLicenseExpired: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.licenseExpiryDate < new Date();
      },
    },
  },
  { tableName: 'drivers', timestamps: true }
);

module.exports = Driver;
