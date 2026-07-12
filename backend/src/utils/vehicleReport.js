const Vehicle = require('../models/Vehicle');
const FuelLog = require('../models/FuelLog');
const Maintenance = require('../models/Maintenance');
const Trip = require('../models/Trip');

// Builds the per-vehicle analytics rows shared by the JSON, CSV, and PDF
// report endpoints so all three stay consistent.
const buildVehicleReport = async () => {
  const [vehicles, fuelAgg, maintenanceAgg, tripAgg] = await Promise.all([
    Vehicle.find().lean(),
    FuelLog.aggregate([
      { $group: { _id: '$vehicle', totalFuelCost: { $sum: '$cost' }, totalLiters: { $sum: '$liters' } } },
    ]),
    Maintenance.aggregate([
      { $group: { _id: '$vehicle', totalMaintenanceCost: { $sum: '$cost' } } },
    ]),
    Trip.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: '$vehicle',
          totalDistance: { $sum: { $ifNull: ['$actualDistanceKm', '$plannedDistanceKm'] } },
          totalRevenue: { $sum: '$revenue' },
          tripCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const fuelMap = new Map(fuelAgg.map((f) => [f._id.toString(), f]));
  const maintMap = new Map(maintenanceAgg.map((m) => [m._id.toString(), m]));
  const tripMap = new Map(tripAgg.map((t) => [t._id.toString(), t]));

  return vehicles.map((v) => {
    const id = v._id.toString();
    const fuel = fuelMap.get(id) || { totalFuelCost: 0, totalLiters: 0 };
    const maint = maintMap.get(id) || { totalMaintenanceCost: 0 };
    const trip = tripMap.get(id) || { totalDistance: 0, totalRevenue: 0, tripCount: 0 };

    const operationalCost = fuel.totalFuelCost + maint.totalMaintenanceCost;
    const fuelEfficiency = fuel.totalLiters > 0 ? trip.totalDistance / fuel.totalLiters : null;
    const roi =
      v.acquisitionCost > 0 ? (trip.totalRevenue - operationalCost) / v.acquisitionCost : null;

    return {
      _id: id,
      registrationNumber: v.registrationNumber,
      name: v.name,
      type: v.type,
      status: v.status,
      totalDistanceKm: trip.totalDistance,
      totalFuelLiters: fuel.totalLiters,
      fuelEfficiencyKmPerL: fuelEfficiency !== null ? Number(fuelEfficiency.toFixed(2)) : null,
      totalFuelCost: fuel.totalFuelCost,
      totalMaintenanceCost: maint.totalMaintenanceCost,
      operationalCost,
      totalRevenue: trip.totalRevenue,
      completedTrips: trip.tripCount,
      acquisitionCost: v.acquisitionCost,
      roi: roi !== null ? Number(roi.toFixed(3)) : null,
    };
  });
};

module.exports = { buildVehicleReport };
