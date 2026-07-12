const { Op, fn, col } = require('sequelize');
const { Vehicle, VehicleDocument, FuelLog, MaintenanceLog, Trip } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { VEHICLE_STATUS } = require('../utils/constants');

// GET /api/vehicles?search=&type=&status=&region=&sortBy=&sortDir=
const listVehicles = asyncHandler(async (req, res) => {
  const { search, type, status, region, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { registrationNumber: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
    ];
  }
  if (type) where.type = type;
  if (status) where.status = status;
  if (region) where.region = region;

  const vehicles = await Vehicle.findAll({
    where,
    order: [[sortBy, sortDir === 'asc' ? 'ASC' : 'DESC']],
  });
  res.json(vehicles);
});

// GET /api/vehicles/available - eligible dispatch pool (excludes In Shop / Retired / On Trip)
const listAvailableVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.findAll({
    where: { status: VEHICLE_STATUS.AVAILABLE },
    order: [['name', 'ASC']],
  });
  res.json(vehicles);
});

// GET /api/vehicles/:id - includes computed operational cost
const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id, {
    include: [{ model: VehicleDocument, as: 'documents' }],
  });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

  const vehicleId = vehicle._id;

  const [totalFuelCost, totalLiters, totalMaintenanceCost, tripAgg] = await Promise.all([
    FuelLog.sum('cost', { where: { vehicleId } }),
    FuelLog.sum('liters', { where: { vehicleId } }),
    MaintenanceLog.sum('cost', { where: { vehicleId } }),
    Trip.findOne({
      where: { vehicleId, status: 'Completed' },
      attributes: [
        [fn('SUM', col('revenue')), 'totalRevenue'],
        [fn('SUM', fn('COALESCE', col('actualDistanceKm'), col('plannedDistanceKm'))), 'totalDistance'],
        [fn('COUNT', col('_id')), 'tripCount'],
      ],
      raw: true,
    }),
  ]);

  res.json({
    ...vehicle.toJSON(),
    costSummary: {
      totalFuelCost: totalFuelCost || 0,
      totalLiters: totalLiters || 0,
      totalMaintenanceCost: totalMaintenanceCost || 0,
      totalOperationalCost: (totalFuelCost || 0) + (totalMaintenanceCost || 0),
      totalRevenue: Number(tripAgg?.totalRevenue) || 0,
      totalDistance: Number(tripAgg?.totalDistance) || 0,
      completedTrips: Number(tripAgg?.tripCount) || 0,
    },
  });
});

// POST /api/vehicles
const createVehicle = asyncHandler(async (req, res) => {
  const { registrationNumber, name, type, maxLoadCapacityKg, odometerKm, acquisitionCost, status, region } =
    req.body;

  const vehicle = await Vehicle.create({
    registrationNumber,
    name,
    type,
    maxLoadCapacityKg,
    odometerKm,
    acquisitionCost,
    status,
    region,
  });
  res.status(201).json(vehicle);
});

// PATCH /api/vehicles/:id
const updateVehicle = asyncHandler(async (req, res) => {
  const allowedFields = [
    'registrationNumber',
    'name',
    'type',
    'maxLoadCapacityKg',
    'odometerKm',
    'acquisitionCost',
    'status',
    'region',
  ];
  const update = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });

  const vehicle = await Vehicle.findByPk(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

  if (update.status && vehicle.status === VEHICLE_STATUS.ON_TRIP && update.status !== VEHICLE_STATUS.ON_TRIP) {
    const activeTrip = await Trip.findOne({ where: { vehicleId: vehicle._id, status: 'Dispatched' } });
    if (activeTrip) {
      return res
        .status(409)
        .json({ message: 'Vehicle is on an active dispatched trip; resolve the trip before changing status manually' });
    }
  }

  await vehicle.update(update);
  res.json(vehicle);
});

// DELETE /api/vehicles/:id
const deleteVehicle = asyncHandler(async (req, res) => {
  const activeTrip = await Trip.findOne({
    where: { vehicleId: req.params.id, status: { [Op.in]: ['Draft', 'Dispatched'] } },
  });
  if (activeTrip) {
    return res.status(409).json({ message: 'Cannot delete a vehicle with draft or dispatched trips' });
  }

  const vehicle = await Vehicle.findByPk(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  await vehicle.destroy();
  res.json({ message: 'Vehicle deleted' });
});

module.exports = {
  listVehicles,
  listAvailableVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
