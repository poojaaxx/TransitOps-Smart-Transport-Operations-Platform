const Vehicle = require('../models/Vehicle');
const FuelLog = require('../models/FuelLog');
const Maintenance = require('../models/Maintenance');
const Trip = require('../models/Trip');
const asyncHandler = require('../utils/asyncHandler');
const { VEHICLE_STATUS } = require('../utils/constants');

// GET /api/vehicles?search=&type=&status=&region=&sortBy=&sortDir=
const listVehicles = asyncHandler(async (req, res) => {
  const { search, type, status, region, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { registrationNumber: new RegExp(search, 'i') },
      { name: new RegExp(search, 'i') },
    ];
  }
  if (type) query.type = type;
  if (status) query.status = status;
  if (region) query.region = region;

  const vehicles = await Vehicle.find(query).sort({ [sortBy]: sortDir === 'asc' ? 1 : -1 });
  res.json(vehicles);
});

// GET /api/vehicles/available - eligible dispatch pool (excludes In Shop / Retired / On Trip)
const listAvailableVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ status: VEHICLE_STATUS.AVAILABLE }).sort({ name: 1 });
  res.json(vehicles);
});

// GET /api/vehicles/:id - includes computed operational cost
const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

  const [fuelAgg] = await FuelLog.aggregate([
    { $match: { vehicle: vehicle._id } },
    { $group: { _id: null, totalFuelCost: { $sum: '$cost' }, totalLiters: { $sum: '$liters' } } },
  ]);
  const [maintenanceAgg] = await Maintenance.aggregate([
    { $match: { vehicle: vehicle._id } },
    { $group: { _id: null, totalMaintenanceCost: { $sum: '$cost' } } },
  ]);
  const [tripAgg] = await Trip.aggregate([
    { $match: { vehicle: vehicle._id, status: 'Completed' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue' },
        totalDistance: { $sum: { $ifNull: ['$actualDistanceKm', '$plannedDistanceKm'] } },
        tripCount: { $sum: 1 },
      },
    },
  ]);

  const totalFuelCost = fuelAgg?.totalFuelCost || 0;
  const totalMaintenanceCost = maintenanceAgg?.totalMaintenanceCost || 0;

  res.json({
    ...vehicle.toObject(),
    costSummary: {
      totalFuelCost,
      totalLiters: fuelAgg?.totalLiters || 0,
      totalMaintenanceCost,
      totalOperationalCost: totalFuelCost + totalMaintenanceCost,
      totalRevenue: tripAgg?.totalRevenue || 0,
      totalDistance: tripAgg?.totalDistance || 0,
      completedTrips: tripAgg?.tripCount || 0,
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

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

  if (update.status && vehicle.status === VEHICLE_STATUS.ON_TRIP && update.status !== VEHICLE_STATUS.ON_TRIP) {
    const activeTrip = await Trip.findOne({ vehicle: vehicle._id, status: 'Dispatched' });
    if (activeTrip) {
      return res
        .status(409)
        .json({ message: 'Vehicle is on an active dispatched trip; resolve the trip before changing status manually' });
    }
  }

  Object.assign(vehicle, update);
  await vehicle.save();
  res.json(vehicle);
});

// DELETE /api/vehicles/:id
const deleteVehicle = asyncHandler(async (req, res) => {
  const activeTrip = await Trip.findOne({
    vehicle: req.params.id,
    status: { $in: ['Draft', 'Dispatched'] },
  });
  if (activeTrip) {
    return res.status(409).json({ message: 'Cannot delete a vehicle with draft or dispatched trips' });
  }

  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
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
