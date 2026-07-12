const { Op } = require('sequelize');
const { FuelLog, Vehicle } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/fuel-logs?vehicle=&from=&to=
const listFuelLogs = asyncHandler(async (req, res) => {
  const { vehicle, from, to } = req.query;
  const where = {};
  if (vehicle) where.vehicleId = vehicle;
  if (from || to) {
    where.date = {};
    if (from) where.date[Op.gte] = new Date(from);
    if (to) where.date[Op.lte] = new Date(to);
  }

  const logs = await FuelLog.findAll({
    where,
    include: [{ model: Vehicle, as: 'vehicle', attributes: ['_id', 'registrationNumber', 'name'] }],
    order: [['date', 'DESC']],
  });
  res.json(logs);
});

// POST /api/fuel-logs
const createFuelLog = asyncHandler(async (req, res) => {
  const { vehicle: vehicleId, liters, cost, date, odometerKm } = req.body;
  if (!vehicleId || liters == null || cost == null) {
    return res.status(400).json({ message: 'vehicle, liters, and cost are required' });
  }
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

  const log = await FuelLog.create({
    vehicleId,
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
  const log = await FuelLog.findByPk(req.params.id);
  if (!log) return res.status(404).json({ message: 'Fuel log not found' });
  await log.destroy();
  res.json({ message: 'Fuel log deleted' });
});

module.exports = { listFuelLogs, createFuelLog, deleteFuelLog };
