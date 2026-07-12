const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const asyncHandler = require('../utils/asyncHandler');
const { DRIVER_STATUS } = require('../utils/constants');

// GET /api/drivers?search=&status=&licenseCategory=&sortBy=&sortDir=
const listDrivers = asyncHandler(async (req, res) => {
  const { search, status, licenseCategory, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { licenseNumber: new RegExp(search, 'i') },
    ];
  }
  if (status) query.status = status;
  if (licenseCategory) query.licenseCategory = licenseCategory;

  const drivers = await Driver.find(query).sort({ [sortBy]: sortDir === 'asc' ? 1 : -1 });
  res.json(drivers);
});

// GET /api/drivers/available - eligible dispatch pool
// (excludes Suspended, Off Duty, On Trip, and expired-license drivers)
const listAvailableDrivers = asyncHandler(async (req, res) => {
  const drivers = await Driver.find({
    status: DRIVER_STATUS.AVAILABLE,
    licenseExpiryDate: { $gte: new Date() },
  }).sort({ name: 1 });
  res.json(drivers);
});

// GET /api/drivers/:id
const getDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) return res.status(404).json({ message: 'Driver not found' });

  const tripStats = await Trip.aggregate([
    { $match: { driver: driver._id, status: 'Completed' } },
    { $group: { _id: null, tripCount: { $sum: 1 }, totalDistance: { $sum: { $ifNull: ['$actualDistanceKm', '$plannedDistanceKm'] } } } },
  ]);

  res.json({ ...driver.toObject(), tripStats: tripStats[0] || { tripCount: 0, totalDistance: 0 } });
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

  const driver = await Driver.findById(req.params.id);
  if (!driver) return res.status(404).json({ message: 'Driver not found' });

  if (update.status && driver.status === DRIVER_STATUS.ON_TRIP && update.status !== DRIVER_STATUS.ON_TRIP) {
    const activeTrip = await Trip.findOne({ driver: driver._id, status: 'Dispatched' });
    if (activeTrip) {
      return res
        .status(409)
        .json({ message: 'Driver is on an active dispatched trip; resolve the trip before changing status manually' });
    }
  }

  Object.assign(driver, update);
  await driver.save();
  res.json(driver);
});

// DELETE /api/drivers/:id
const deleteDriver = asyncHandler(async (req, res) => {
  const activeTrip = await Trip.findOne({
    driver: req.params.id,
    status: { $in: ['Draft', 'Dispatched'] },
  });
  if (activeTrip) {
    return res.status(409).json({ message: 'Cannot delete a driver with draft or dispatched trips' });
  }

  const driver = await Driver.findByIdAndDelete(req.params.id);
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
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
