const { Op, fn, col } = require('sequelize');
const { Vehicle, Driver, Trip } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = require('../utils/constants');

const buildVehicleFilter = ({ type, status, region }) => {
  const where = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (region) where.region = region;
  return where;
};

// GET /api/dashboard/kpis?type=&status=&region=
const getKpis = asyncHandler(async (req, res) => {
  const vehicleFilter = buildVehicleFilter(req.query);

  const [totalVehicles, activeVehicles, availableVehicles, inMaintenanceVehicles, onTripVehicles] =
    await Promise.all([
      Vehicle.count({ where: vehicleFilter }),
      Vehicle.count({ where: { ...vehicleFilter, status: { [Op.ne]: VEHICLE_STATUS.RETIRED } } }),
      Vehicle.count({ where: { ...vehicleFilter, status: VEHICLE_STATUS.AVAILABLE } }),
      Vehicle.count({ where: { ...vehicleFilter, status: VEHICLE_STATUS.IN_SHOP } }),
      Vehicle.count({ where: { ...vehicleFilter, status: VEHICLE_STATUS.ON_TRIP } }),
    ]);

  // Scope trip counts to the filtered vehicle pool whenever a vehicle filter is active.
  const hasVehicleFilter = Object.keys(vehicleFilter).length > 0;
  let tripWhere = {};
  if (hasVehicleFilter) {
    const matchingVehicles = await Vehicle.findAll({ where: vehicleFilter, attributes: ['_id'], raw: true });
    tripWhere = { vehicleId: { [Op.in]: matchingVehicles.map((v) => v._id) } };
  }

  const [activeTrips, pendingTrips] = await Promise.all([
    Trip.count({ where: { ...tripWhere, status: TRIP_STATUS.DISPATCHED } }),
    Trip.count({ where: { ...tripWhere, status: TRIP_STATUS.DRAFT } }),
  ]);

  const driversOnDuty = await Driver.count({
    where: { status: { [Op.in]: [DRIVER_STATUS.AVAILABLE, DRIVER_STATUS.ON_TRIP] } },
  });

  const fleetUtilization = activeVehicles > 0 ? Number(((onTripVehicles / activeVehicles) * 100).toFixed(1)) : 0;

  res.json({
    activeVehicles,
    availableVehicles,
    inMaintenanceVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilization,
    totalVehicles,
  });
});

// GET /api/dashboard/vehicle-status-breakdown?type=&region=
const getVehicleStatusBreakdown = asyncHandler(async (req, res) => {
  const { type, region } = req.query;
  const where = buildVehicleFilter({ type, region });

  const breakdown = await Vehicle.findAll({
    where,
    attributes: ['status', [fn('COUNT', col('_id')), 'count']],
    group: ['status'],
    raw: true,
  });

  const allStatuses = Object.values(VEHICLE_STATUS);
  const merged = allStatuses.map((status) => ({
    status,
    count: Number(breakdown.find((b) => b.status === status)?.count) || 0,
  }));

  res.json(merged);
});

// GET /api/dashboard/trips-trend?days=14
const getTripsTrend = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 14, 90);
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const trend = await Trip.findAll({
    where: { createdAt: { [Op.gte]: since } },
    attributes: [
      [fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d'), 'date'],
      'status',
      [fn('COUNT', col('_id')), 'count'],
    ],
    group: [fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d'), 'status'],
    raw: true,
  });

  const dayList = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    dayList.push(d.toISOString().slice(0, 10));
  }

  const result = dayList.map((date) => {
    const entry = { date, Draft: 0, Dispatched: 0, Completed: 0, Cancelled: 0 };
    trend
      .filter((t) => t.date === date)
      .forEach((t) => {
        entry[t.status] = Number(t.count);
      });
    return entry;
  });

  res.json(result);
});

module.exports = { getKpis, getVehicleStatusBreakdown, getTripsTrend };
