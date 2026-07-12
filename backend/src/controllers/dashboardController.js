const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const asyncHandler = require('../utils/asyncHandler');
const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = require('../utils/constants');

const buildVehicleFilter = ({ type, status, region }) => {
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (region) filter.region = region;
  return filter;
};

// GET /api/dashboard/kpis?type=&status=&region=
const getKpis = asyncHandler(async (req, res) => {
  const vehicleFilter = buildVehicleFilter(req.query);

  const [totalVehicles, activeVehicles, availableVehicles, inMaintenanceVehicles, onTripVehicles] =
    await Promise.all([
      Vehicle.countDocuments(vehicleFilter),
      Vehicle.countDocuments({ ...vehicleFilter, status: { $ne: VEHICLE_STATUS.RETIRED } }),
      Vehicle.countDocuments({ ...vehicleFilter, status: VEHICLE_STATUS.AVAILABLE }),
      Vehicle.countDocuments({ ...vehicleFilter, status: VEHICLE_STATUS.IN_SHOP }),
      Vehicle.countDocuments({ ...vehicleFilter, status: VEHICLE_STATUS.ON_TRIP }),
    ]);

  // Scope trip counts to the filtered vehicle pool whenever a vehicle filter is active.
  const hasVehicleFilter = Object.keys(vehicleFilter).length > 0;
  let tripVehicleIds = null;
  if (hasVehicleFilter) {
    tripVehicleIds = await Vehicle.find(vehicleFilter).distinct('_id');
  }
  const tripQuery = tripVehicleIds ? { vehicle: { $in: tripVehicleIds } } : {};

  const [activeTrips, pendingTrips] = await Promise.all([
    Trip.countDocuments({ ...tripQuery, status: TRIP_STATUS.DISPATCHED }),
    Trip.countDocuments({ ...tripQuery, status: TRIP_STATUS.DRAFT }),
  ]);

  const driversOnDuty = await Driver.countDocuments({
    status: { $in: [DRIVER_STATUS.AVAILABLE, DRIVER_STATUS.ON_TRIP] },
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
  const filter = buildVehicleFilter({ type, region });

  const breakdown = await Vehicle.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
  ]);

  const allStatuses = Object.values(VEHICLE_STATUS);
  const merged = allStatuses.map((status) => ({
    status,
    count: breakdown.find((b) => b.status === status)?.count || 0,
  }));

  res.json(merged);
});

// GET /api/dashboard/trips-trend?days=14
const getTripsTrend = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 14, 90);
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const trend = await Trip.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const dayList = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    dayList.push(d.toISOString().slice(0, 10));
  }

  const result = dayList.map((date) => {
    const entry = { date, Draft: 0, Dispatched: 0, Completed: 0, Cancelled: 0 };
    trend
      .filter((t) => t._id.date === date)
      .forEach((t) => {
        entry[t._id.status] = t.count;
      });
    return entry;
  });

  res.json(result);
});

module.exports = { getKpis, getVehicleStatusBreakdown, getTripsTrend };
