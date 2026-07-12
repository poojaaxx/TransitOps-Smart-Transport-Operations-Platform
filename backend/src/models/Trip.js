const mongoose = require('mongoose');
const { TRIP_STATUS } = require('../utils/constants');

const tripSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    cargoWeightKg: { type: Number, required: true, min: 0 },
    plannedDistanceKm: { type: Number, required: true, min: 0 },
    actualDistanceKm: { type: Number, default: null },
    revenue: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: Object.values(TRIP_STATUS),
      default: TRIP_STATUS.DRAFT,
    },
    dispatchedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
