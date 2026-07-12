const mongoose = require('mongoose');
const { VEHICLE_STATUS } = require('../utils/constants');

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true }, // Vehicle name/model
    type: {
      type: String,
      required: true,
      enum: ['Truck', 'Van', 'Bus', 'Car', 'Trailer', 'Other'],
    },
    maxLoadCapacityKg: { type: Number, required: true, min: 0 },
    odometerKm: { type: Number, required: true, min: 0, default: 0 },
    acquisitionCost: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(VEHICLE_STATUS),
      default: VEHICLE_STATUS.AVAILABLE,
    },
    region: { type: String, trim: true, default: 'Unassigned' },
    documents: [documentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
