const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const asyncHandler = require('../utils/asyncHandler');
const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = require('../utils/constants');

// GET /api/trips?status=&vehicle=&driver=&sortBy=&sortDir=
const listTrips = asyncHandler(async (req, res) => {
  const { status, vehicle, driver, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
  const query = {};
  if (status) query.status = status;
  if (vehicle) query.vehicle = vehicle;
  if (driver) query.driver = driver;

  const trips = await Trip.find(query)
    .populate('vehicle', 'registrationNumber name type')
    .populate('driver', 'name licenseNumber')
    .sort({ [sortBy]: sortDir === 'asc' ? 1 : -1 });
  res.json(trips);
});

// GET /api/trips/:id
const getTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id)
    .populate('vehicle')
    .populate('driver');
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  res.json(trip);
});

// POST /api/trips - creates a Draft trip after validating the vehicle/driver pool.
const createTrip = asyncHandler(async (req, res) => {
  const { source, destination, vehicle: vehicleId, driver: driverId, cargoWeightKg, plannedDistanceKm, revenue } =
    req.body;

  if (!source || !destination || !vehicleId || !driverId || cargoWeightKg == null || plannedDistanceKm == null) {
    return res.status(400).json({
      message: 'source, destination, vehicle, driver, cargoWeightKg, and plannedDistanceKm are required',
    });
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
    return res.status(409).json({ message: `Vehicle is ${vehicle.status} and is not eligible for dispatch` });
  }

  const driver = await Driver.findById(driverId);
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  if (driver.status !== DRIVER_STATUS.AVAILABLE) {
    return res.status(409).json({ message: `Driver is ${driver.status} and cannot be assigned to a trip` });
  }
  if (driver.licenseExpiryDate < new Date()) {
    return res.status(409).json({ message: 'Driver license is expired and cannot be assigned to a trip' });
  }

  if (cargoWeightKg > vehicle.maxLoadCapacityKg) {
    return res.status(409).json({
      message: `Cargo weight (${cargoWeightKg}kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacityKg}kg)`,
    });
  }

  const trip = await Trip.create({
    source,
    destination,
    vehicle: vehicleId,
    driver: driverId,
    cargoWeightKg,
    plannedDistanceKm,
    revenue: revenue || 0,
    status: TRIP_STATUS.DRAFT,
    createdBy: req.user._id,
  });

  res.status(201).json(trip);
});

// PATCH /api/trips/:id - edit a Draft trip's details (not lifecycle transitions)
const updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (trip.status !== TRIP_STATUS.DRAFT) {
    return res.status(409).json({ message: 'Only Draft trips can be edited' });
  }

  const allowedFields = ['source', 'destination', 'cargoWeightKg', 'plannedDistanceKm', 'revenue'];
  const update = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });

  if (update.cargoWeightKg != null) {
    const vehicle = await Vehicle.findById(trip.vehicle);
    if (update.cargoWeightKg > vehicle.maxLoadCapacityKg) {
      return res.status(409).json({
        message: `Cargo weight (${update.cargoWeightKg}kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacityKg}kg)`,
      });
    }
  }

  Object.assign(trip, update);
  await trip.save();
  res.json(trip);
});

// POST /api/trips/:id/dispatch
const dispatchTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (trip.status !== TRIP_STATUS.DRAFT) {
    return res.status(409).json({ message: `Only Draft trips can be dispatched (current status: ${trip.status})` });
  }

  const vehicle = await Vehicle.findById(trip.vehicle);
  const driver = await Driver.findById(trip.driver);

  if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
    return res.status(409).json({ message: `Vehicle is ${vehicle.status} and cannot be dispatched` });
  }
  if (driver.status !== DRIVER_STATUS.AVAILABLE) {
    return res.status(409).json({ message: `Driver is ${driver.status} and cannot be dispatched` });
  }
  if (driver.licenseExpiryDate < new Date()) {
    return res.status(409).json({ message: 'Driver license is expired and cannot be dispatched' });
  }

  trip.status = TRIP_STATUS.DISPATCHED;
  trip.dispatchedAt = new Date();
  vehicle.status = VEHICLE_STATUS.ON_TRIP;
  driver.status = DRIVER_STATUS.ON_TRIP;

  await Promise.all([trip.save(), vehicle.save(), driver.save()]);
  res.json(trip);
});

// POST /api/trips/:id/complete
const completeTrip = asyncHandler(async (req, res) => {
  const { actualDistanceKm, revenue } = req.body;
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (trip.status !== TRIP_STATUS.DISPATCHED) {
    return res.status(409).json({ message: `Only Dispatched trips can be completed (current status: ${trip.status})` });
  }

  const vehicle = await Vehicle.findById(trip.vehicle);
  const driver = await Driver.findById(trip.driver);

  trip.status = TRIP_STATUS.COMPLETED;
  trip.completedAt = new Date();
  if (actualDistanceKm != null) trip.actualDistanceKm = actualDistanceKm;
  if (revenue != null) trip.revenue = revenue;

  if (vehicle.status === VEHICLE_STATUS.ON_TRIP) vehicle.status = VEHICLE_STATUS.AVAILABLE;
  if (driver.status === DRIVER_STATUS.ON_TRIP) driver.status = DRIVER_STATUS.AVAILABLE;

  await Promise.all([trip.save(), vehicle.save(), driver.save()]);
  res.json(trip);
});

// POST /api/trips/:id/cancel
const cancelTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (![TRIP_STATUS.DRAFT, TRIP_STATUS.DISPATCHED].includes(trip.status)) {
    return res.status(409).json({ message: `Only Draft or Dispatched trips can be cancelled (current status: ${trip.status})` });
  }

  const wasDispatched = trip.status === TRIP_STATUS.DISPATCHED;
  trip.status = TRIP_STATUS.CANCELLED;
  trip.cancelledAt = new Date();
  await trip.save();

  if (wasDispatched) {
    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);
    if (vehicle && vehicle.status === VEHICLE_STATUS.ON_TRIP) {
      vehicle.status = VEHICLE_STATUS.AVAILABLE;
      await vehicle.save();
    }
    if (driver && driver.status === DRIVER_STATUS.ON_TRIP) {
      driver.status = DRIVER_STATUS.AVAILABLE;
      await driver.save();
    }
  }

  res.json(trip);
});

// DELETE /api/trips/:id - only Draft trips can be deleted outright
const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (trip.status !== TRIP_STATUS.DRAFT) {
    return res.status(409).json({ message: 'Only Draft trips can be deleted; cancel dispatched trips instead' });
  }
  await trip.deleteOne();
  res.json({ message: 'Trip deleted' });
});

module.exports = {
  listTrips,
  getTrip,
  createTrip,
  updateTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  deleteTrip,
};
