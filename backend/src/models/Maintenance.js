const mongoose = require('mongoose');
const { MAINTENANCE_STATUS } = require('../utils/constants');

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    description: { type: String, required: true, trim: true },
    cost: { type: Number, required: true, min: 0, default: 0 },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, default: null },
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.ACTIVE,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Maintenance', maintenanceSchema);
