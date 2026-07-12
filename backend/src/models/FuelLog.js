const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    liters: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    odometerKm: { type: Number, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FuelLog', fuelLogSchema);
