const { Op, fn, col } = require('sequelize');
const { Driver, Trip } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { DRIVER_STATUS } = require('../utils/constants');

// GET /api/drivers?search=&status=&licenseCategory=&sortBy=&sortDir=
const listDrivers = asyncHandler(async (req, res) => {
  const { search, status, licenseCategory, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { licenseNumber: { [Op.like]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;
  if (licenseCategory) where.licenseCategory = licenseCategory;

  const drivers = await Driver.findAll({
    where,
    order: [[sortBy, sortDir === 'asc' ? 'ASC' : 'DESC']],
  });
  res.json(drivers);
});

// GET /api/drivers/available - eligible dispatch pool
// (excludes Suspended, Off Duty, On Trip, and expired-license drivers)
const listAvailableDrivers = asyncHandler(async (req, res) => {
  const drivers = await Driver.findAll({
    where: {
      status: DRIVER_STATUS.AVAILABLE,
      licenseExpiryDate: { [Op.gte]: new Date() },
    },
    order: [['name', 'ASC']],
  });
  res.json(drivers);
});

// GET /api/drivers/:id
const getDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByPk(req.params.id);
  if (!driver) return res.status(404).json({ message: 'Driver not found' });

  const tripStats = await Trip.findOne({
    where: { driverId: driver._id, status: 'Completed' },
    attributes: [
      [fn('COUNT', col('_id')), 'tripCount'],
      [fn('SUM', fn('COALESCE', col('actualDistanceKm'), col('plannedDistanceKm'))), 'totalDistance'],
    ],
    raw: true,
  });

  res.json({
    ...driver.toJSON(),
    tripStats: {
      tripCount: Number(tripStats?.tripCount) || 0,
      totalDistance: Number(tripStats?.totalDistance) || 0,
    },
  });
});

// POST /api/drivers
const createDriver = asyncHandler(async (req, res) => {
  const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, email, safetyScore, status } =
    req.body;

  const driver = await Driver.create({
    name,
    licenseNumber,
    licenseCategory,
    licenseExpiryDate,
    contactNumber,
    email,
    safetyScore,
    status,
  });
  res.status(201).json(driver);
});

// PATCH /api/drivers/:id
const updateDriver = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'licenseNumber',
    'licenseCategory',
    'licenseExpiryDate',
    'contactNumber',
    'email',
    'safetyScore',
    'status',
  ];
  const update = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });

  const driver = await Driver.findByPk(req.params.id);
  if (!driver) return res.status(404).json({ message: 'Driver not found' });

  if (update.status && driver.status === DRIVER_STATUS.ON_TRIP && update.status !== DRIVER_STATUS.ON_TRIP) {
    const activeTrip = await Trip.findOne({ where: { driverId: driver._id, status: 'Dispatched' } });
    if (activeTrip) {
      return res
        .status(409)
        .json({ message: 'Driver is on an active dispatched trip; resolve the trip before changing status manually' });
    }
  }

  await driver.update(update);
  res.json(driver);
});

// DELETE /api/drivers/:id
const deleteDriver = asyncHandler(async (req, res) => {
  const activeTrip = await Trip.findOne({
    where: { driverId: req.params.id, status: { [Op.in]: ['Draft', 'Dispatched'] } },
  });
  if (activeTrip) {
    return res.status(409).json({ message: 'Cannot delete a driver with draft or dispatched trips' });
  }

  const driver = await Driver.findByPk(req.params.id);
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  await driver.destroy();
  res.json({ message: 'Driver deleted' });
});

module.exports = {
  listDrivers,
  listAvailableDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
};
