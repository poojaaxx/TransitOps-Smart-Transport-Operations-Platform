const { Op } = require('sequelize');
const { sequelize, MaintenanceLog, Vehicle } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { VEHICLE_STATUS, MAINTENANCE_STATUS } = require('../utils/constants');

// GET /api/maintenance?vehicle=&status=
const listMaintenance = asyncHandler(async (req, res) => {
  const { vehicle, status } = req.query;
  const where = {};
  if (vehicle) where.vehicleId = vehicle;
  if (status) where.status = status;

  const records = await MaintenanceLog.findAll({
    where,
    include: [{ model: Vehicle, as: 'vehicle', attributes: ['_id', 'registrationNumber', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(records);
});

// GET /api/maintenance/:id
const getMaintenance = asyncHandler(async (req, res) => {
  const record = await MaintenanceLog.findByPk(req.params.id, { include: [{ model: Vehicle, as: 'vehicle' }] });
  if (!record) return res.status(404).json({ message: 'Maintenance record not found' });
  res.json(record);
});

// POST /api/maintenance - creating an Active record puts the vehicle In Shop
const createMaintenance = asyncHandler(async (req, res) => {
  const { vehicle: vehicleId, description, cost, startDate, status } = req.body;
  if (!vehicleId || !description) {
    return res.status(400).json({ message: 'vehicle and description are required' });
  }

  const result = await sequelize.transaction(async (t) => {
    const vehicle = await Vehicle.findByPk(vehicleId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!vehicle) return { status: 404, body: { message: 'Vehicle not found' } };
    if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
      return { status: 409, body: { message: 'Cannot open maintenance on a vehicle that is currently on a trip' } };
    }

    const record = await MaintenanceLog.create(
      {
        vehicleId,
        description,
        cost: cost || 0,
        startDate: startDate || new Date(),
        status: status || MAINTENANCE_STATUS.ACTIVE,
        createdBy: req.user._id,
      },
      { transaction: t }
    );

    if (record.status === MAINTENANCE_STATUS.ACTIVE && vehicle.status !== VEHICLE_STATUS.RETIRED) {
      await vehicle.update({ status: VEHICLE_STATUS.IN_SHOP }, { transaction: t });
    }

    return { status: 201, body: record };
  });

  res.status(result.status).json(result.body);
});

// PATCH /api/maintenance/:id/close - restores vehicle to Available unless Retired
const closeMaintenance = asyncHandler(async (req, res) => {
  const result = await sequelize.transaction(async (t) => {
    const record = await MaintenanceLog.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!record) return { status: 404, body: { message: 'Maintenance record not found' } };
    if (record.status === MAINTENANCE_STATUS.COMPLETED) {
      return { status: 409, body: { message: 'Maintenance record is already closed' } };
    }

    const recordUpdate = { status: MAINTENANCE_STATUS.COMPLETED, endDate: new Date() };
    if (req.body.cost != null) recordUpdate.cost = req.body.cost;
    await record.update(recordUpdate, { transaction: t });

    const vehicle = await Vehicle.findByPk(record.vehicleId, { transaction: t, lock: t.LOCK.UPDATE });
    if (vehicle && vehicle.status !== VEHICLE_STATUS.RETIRED) {
      const stillHasActiveWork = await MaintenanceLog.findOne({
        where: { vehicleId: vehicle._id, status: MAINTENANCE_STATUS.ACTIVE, _id: { [Op.ne]: record._id } },
        transaction: t,
      });
      if (!stillHasActiveWork) {
        await vehicle.update({ status: VEHICLE_STATUS.AVAILABLE }, { transaction: t });
      }
    }

    return { status: 200, body: record };
  });

  res.status(result.status).json(result.body);
});

// PATCH /api/maintenance/:id - edit non-lifecycle fields
const updateMaintenance = asyncHandler(async (req, res) => {
  const allowedFields = ['description', 'cost', 'startDate'];
  const update = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });

  const record = await MaintenanceLog.findByPk(req.params.id);
  if (!record) return res.status(404).json({ message: 'Maintenance record not found' });
  await record.update(update);
  res.json(record);
});

module.exports = {
  listMaintenance,
  getMaintenance,
  createMaintenance,
  closeMaintenance,
  updateMaintenance,
};
