const FuelLog = require('../models/FuelLog');
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/fuel-logs?vehicle=&from=&to=
const listFuelLogs = asyncHandler(async (req, res) => {
  const { vehicle, from, to } = req.query;
  const query = {};
  if (vehicle) query.vehicle = vehicle;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const logs = await FuelLog.find(query).populate('vehicle', 'registrationNumber name').sort({ date: -1 });
  res.json(logs);
});

// POST /api/fuel-logs
const createFuelLog = asyncHandler(async (req, res) => {
  const { vehicle: vehicleId, liters, cost, date, odometerKm } = req.body;
  if (!vehicleId || liters == null || cost == null) {
    return res.status(400).json({ message: 'vehicle, liters, and cost are required' });
  }
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

  const log = await FuelLog.create({
    vehicle: vehicleId,
    liters,
    cost,
    date: date || new Date(),
    odometerKm,
    createdBy: req.user._id,
  });
  res.status(201).json(log);
});

// DELETE /api/fuel-logs/:id
const deleteFuelLog = asyncHandler(async (req, res) => {
  const log = await FuelLog.findByIdAndDelete(req.params.id);
  if (!log) return res.status(404).json({ message: 'Fuel log not found' });
  res.json({ message: 'Fuel log deleted' });
});

module.exports = { listFuelLogs, createFuelLog, deleteFuelLog };
