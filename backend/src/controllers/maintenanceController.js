const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../utils/asyncHandler');
const { VEHICLE_STATUS, MAINTENANCE_STATUS } = require('../utils/constants');

// GET /api/maintenance?vehicle=&status=
const listMaintenance = asyncHandler(async (req, res) => {
  const { vehicle, status } = req.query;
  const query = {};
  if (vehicle) query.vehicle = vehicle;
  if (status) query.status = status;

  const records = await Maintenance.find(query)
    .populate('vehicle', 'registrationNumber name')
    .sort({ createdAt: -1 });
  res.json(records);
});

// GET /api/maintenance/:id
const getMaintenance = asyncHandler(async (req, res) => {
  const record = await Maintenance.findById(req.params.id).populate('vehicle');
  if (!record) return res.status(404).json({ message: 'Maintenance record not found' });
  res.json(record);
});

// POST /api/maintenance - creating an Active record puts the vehicle In Shop
const createMaintenance = asyncHandler(async (req, res) => {
  const { vehicle: vehicleId, description, cost, startDate, status } = req.body;
  if (!vehicleId || !description) {
    return res.status(400).json({ message: 'vehicle and description are required' });
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
    return res.status(409).json({ message: 'Cannot open maintenance on a vehicle that is currently on a trip' });
  }

  const record = await Maintenance.create({
    vehicle: vehicleId,
    description,
    cost: cost || 0,
    startDate: startDate || new Date(),
    status: status || MAINTENANCE_STATUS.ACTIVE,
    createdBy: req.user._id,
  });

  if (record.status === MAINTENANCE_STATUS.ACTIVE && vehicle.status !== VEHICLE_STATUS.RETIRED) {
    vehicle.status = VEHICLE_STATUS.IN_SHOP;
    await vehicle.save();
  }

  res.status(201).json(record);
});

// PATCH /api/maintenance/:id/close - restores vehicle to Available unless Retired
const closeMaintenance = asyncHandler(async (req, res) => {
  const record = await Maintenance.findById(req.params.id);
  if (!record) return res.status(404).json({ message: 'Maintenance record not found' });
  if (record.status === MAINTENANCE_STATUS.COMPLETED) {
    return res.status(409).json({ message: 'Maintenance record is already closed' });
  }

  record.status = MAINTENANCE_STATUS.COMPLETED;
  record.endDate = new Date();
  if (req.body.cost != null) record.cost = req.body.cost;
  await record.save();

  const vehicle = await Vehicle.findById(record.vehicle);
  if (vehicle && vehicle.status !== VEHICLE_STATUS.RETIRED) {
    const stillHasActiveWork = await Maintenance.exists({
      vehicle: vehicle._id,
      status: MAINTENANCE_STATUS.ACTIVE,
      _id: { $ne: record._id },
    });
    if (!stillHasActiveWork) {
      vehicle.status = VEHICLE_STATUS.AVAILABLE;
      await vehicle.save();
    }
  }

  res.json(record);
});

// PATCH /api/maintenance/:id - edit non-lifecycle fields
const updateMaintenance = asyncHandler(async (req, res) => {
  const allowedFields = ['description', 'cost', 'startDate'];
  const update = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });

  const record = await Maintenance.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!record) return res.status(404).json({ message: 'Maintenance record not found' });
  res.json(record);
});

module.exports = {
  listMaintenance,
  getMaintenance,
  createMaintenance,
  closeMaintenance,
  updateMaintenance,
};
