const { fn, col } = require('sequelize');
const { Vehicle, FuelLog, MaintenanceLog, Trip } = require('../models');

// Builds the per-vehicle analytics rows shared by the JSON, CSV, and PDF
// report endpoints so all three stay consistent.
const buildVehicleReport = async () => {
  const [vehicles, fuelAgg, maintenanceAgg, tripAgg] = await Promise.all([
    Vehicle.findAll({ raw: true }),
    FuelLog.findAll({
      attributes: ['vehicleId', [fn('SUM', col('cost')), 'totalFuelCost'], [fn('SUM', col('liters')), 'totalLiters']],
      group: ['vehicleId'],
      raw: true,
    }),
    MaintenanceLog.findAll({
      attributes: ['vehicleId', [fn('SUM', col('cost')), 'totalMaintenanceCost']],
      group: ['vehicleId'],
      raw: true,
    }),
    Trip.findAll({
      where: { status: 'Completed' },
      attributes: [
        'vehicleId',
        [fn('SUM', fn('COALESCE', col('actualDistanceKm'), col('plannedDistanceKm'))), 'totalDistance'],
        [fn('SUM', col('revenue')), 'totalRevenue'],
        [fn('COUNT', col('_id')), 'tripCount'],
      ],
      group: ['vehicleId'],
      raw: true,
    }),
  ]);

  const fuelMap = new Map(fuelAgg.map((f) => [String(f.vehicleId), f]));
  const maintMap = new Map(maintenanceAgg.map((m) => [String(m.vehicleId), m]));
  const tripMap = new Map(tripAgg.map((t) => [String(t.vehicleId), t]));

  return vehicles.map((v) => {
    const id = String(v._id);
    const fuel = fuelMap.get(id) || { totalFuelCost: 0, totalLiters: 0 };
    const maint = maintMap.get(id) || { totalMaintenanceCost: 0 };
    const trip = tripMap.get(id) || { totalDistance: 0, totalRevenue: 0, tripCount: 0 };

    const totalFuelCost = Number(fuel.totalFuelCost) || 0;
    const totalLiters = Number(fuel.totalLiters) || 0;
    const totalMaintenanceCost = Number(maint.totalMaintenanceCost) || 0;
    const totalDistance = Number(trip.totalDistance) || 0;
    const totalRevenue = Number(trip.totalRevenue) || 0;
    const tripCount = Number(trip.tripCount) || 0;

    const operationalCost = totalFuelCost + totalMaintenanceCost;
    const fuelEfficiency = totalLiters > 0 ? totalDistance / totalLiters : null;
    const roi = v.acquisitionCost > 0 ? (totalRevenue - operationalCost) / v.acquisitionCost : null;

    return {
      _id: v._id,
      registrationNumber: v.registrationNumber,
      name: v.name,
      type: v.type,
      status: v.status,
      totalDistanceKm: totalDistance,
      totalFuelLiters: totalLiters,
      fuelEfficiencyKmPerL: fuelEfficiency !== null ? Number(fuelEfficiency.toFixed(2)) : null,
      totalFuelCost,
      totalMaintenanceCost,
      operationalCost,
      totalRevenue,
      completedTrips: tripCount,
      acquisitionCost: v.acquisitionCost,
      roi: roi !== null ? Number(roi.toFixed(3)) : null,
    };
  });
};

module.exports = { buildVehicleReport };
