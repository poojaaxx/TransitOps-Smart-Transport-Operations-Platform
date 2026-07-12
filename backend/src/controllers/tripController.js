const { sequelize, Trip, Vehicle, Driver } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = require('../utils/constants');

// GET /api/trips?status=&vehicle=&driver=&sortBy=&sortDir=
const listTrips = asyncHandler(async (req, res) => {
  const { status, vehicle, driver, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
  const where = {};
  if (status) where.status = status;
  if (vehicle) where.vehicleId = vehicle;
  if (driver) where.driverId = driver;

  const trips = await Trip.findAll({
    where,
    include: [
      { model: Vehicle, as: 'vehicle', attributes: ['_id', 'registrationNumber', 'name', 'type'] },
      { model: Driver, as: 'driver', attributes: ['_id', 'name', 'licenseNumber'] },
    ],
    order: [[sortBy, sortDir === 'asc' ? 'ASC' : 'DESC']],
  });
  res.json(trips);
});

// GET /api/trips/:id
const getTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findByPk(req.params.id, {
    include: [
      { model: Vehicle, as: 'vehicle' },
      { model: Driver, as: 'driver' },
    ],
  });
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

  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
    return res.status(409).json({ message: `Vehicle is ${vehicle.status} and is not eligible for dispatch` });
  }

  const driver = await Driver.findByPk(driverId);
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
    vehicleId,
    driverId,
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
  const trip = await Trip.findByPk(req.params.id);
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
    const vehicle = await Vehicle.findByPk(trip.vehicleId);
    if (update.cargoWeightKg > vehicle.maxLoadCapacityKg) {
      return res.status(409).json({
        message: `Cargo weight (${update.cargoWeightKg}kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacityKg}kg)`,
      });
    }
  }

  await trip.update(update);
  res.json(trip);
});

// POST /api/trips/:id/dispatch
const dispatchTrip = asyncHandler(async (req, res) => {
  const result = await sequelize.transaction(async (t) => {
    const trip = await Trip.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!trip) return { status: 404, body: { message: 'Trip not found' } };
    if (trip.status !== TRIP_STATUS.DRAFT) {
      return { status: 409, body: { message: `Only Draft trips can be dispatched (current status: ${trip.status})` } };
    }

    const vehicle = await Vehicle.findByPk(trip.vehicleId, { transaction: t, lock: t.LOCK.UPDATE });
    const driver = await Driver.findByPk(trip.driverId, { transaction: t, lock: t.LOCK.UPDATE });

    if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
      return { status: 409, body: { message: `Vehicle is ${vehicle.status} and cannot be dispatched` } };
    }
    if (driver.status !== DRIVER_STATUS.AVAILABLE) {
      return { status: 409, body: { message: `Driver is ${driver.status} and cannot be dispatched` } };
    }
    if (driver.licenseExpiryDate < new Date()) {
      return { status: 409, body: { message: 'Driver license is expired and cannot be dispatched' } };
    }

    await trip.update({ status: TRIP_STATUS.DISPATCHED, dispatchedAt: new Date() }, { transaction: t });
    await vehicle.update({ status: VEHICLE_STATUS.ON_TRIP }, { transaction: t });
    await driver.update({ status: DRIVER_STATUS.ON_TRIP }, { transaction: t });

    return { status: 200, body: trip };
  });

  res.status(result.status).json(result.body);
});

// POST /api/trips/:id/complete
const completeTrip = asyncHandler(async (req, res) => {
  const { actualDistanceKm, revenue } = req.body;

  const result = await sequelize.transaction(async (t) => {
    const trip = await Trip.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!trip) return { status: 404, body: { message: 'Trip not found' } };
    if (trip.status !== TRIP_STATUS.DISPATCHED) {
      return { status: 409, body: { message: `Only Dispatched trips can be completed (current status: ${trip.status})` } };
    }

    const vehicle = await Vehicle.findByPk(trip.vehicleId, { transaction: t, lock: t.LOCK.UPDATE });
    const driver = await Driver.findByPk(trip.driverId, { transaction: t, lock: t.LOCK.UPDATE });

    const tripUpdate = { status: TRIP_STATUS.COMPLETED, completedAt: new Date() };
    if (actualDistanceKm != null) tripUpdate.actualDistanceKm = actualDistanceKm;
    if (revenue != null) tripUpdate.revenue = revenue;
    await trip.update(tripUpdate, { transaction: t });

    if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
      await vehicle.update({ status: VEHICLE_STATUS.AVAILABLE }, { transaction: t });
    }
    if (driver.status === DRIVER_STATUS.ON_TRIP) {
      await driver.update({ status: DRIVER_STATUS.AVAILABLE }, { transaction: t });
    }

    return { status: 200, body: trip };
  });

  res.status(result.status).json(result.body);
});

// POST /api/trips/:id/cancel
const cancelTrip = asyncHandler(async (req, res) => {
  const result = await sequelize.transaction(async (t) => {
    const trip = await Trip.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!trip) return { status: 404, body: { message: 'Trip not found' } };
    if (![TRIP_STATUS.DRAFT, TRIP_STATUS.DISPATCHED].includes(trip.status)) {
      return { status: 409, body: { message: `Only Draft or Dispatched trips can be cancelled (current status: ${trip.status})` } };
    }

    const wasDispatched = trip.status === TRIP_STATUS.DISPATCHED;
    await trip.update({ status: TRIP_STATUS.CANCELLED, cancelledAt: new Date() }, { transaction: t });

    if (wasDispatched) {
      const vehicle = await Vehicle.findByPk(trip.vehicleId, { transaction: t, lock: t.LOCK.UPDATE });
      const driver = await Driver.findByPk(trip.driverId, { transaction: t, lock: t.LOCK.UPDATE });
      if (vehicle && vehicle.status === VEHICLE_STATUS.ON_TRIP) {
        await vehicle.update({ status: VEHICLE_STATUS.AVAILABLE }, { transaction: t });
      }
      if (driver && driver.status === DRIVER_STATUS.ON_TRIP) {
        await driver.update({ status: DRIVER_STATUS.AVAILABLE }, { transaction: t });
      }
    }

    return { status: 200, body: trip };
  });

  res.status(result.status).json(result.body);
});

// DELETE /api/trips/:id - only Draft trips can be deleted outright
const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findByPk(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (trip.status !== TRIP_STATUS.DRAFT) {
    return res.status(409).json({ message: 'Only Draft trips can be deleted; cancel dispatched trips instead' });
  }
  await trip.destroy();
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
