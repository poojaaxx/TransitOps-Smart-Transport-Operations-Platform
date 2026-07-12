const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { TRIP_STATUS } = require('../utils/constants');

const Trip = sequelize.define(
  'Trip',
  {
    _id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    source: { type: DataTypes.STRING, allowNull: false },
    destination: { type: DataTypes.STRING, allowNull: false },
    vehicleId: { type: DataTypes.INTEGER, allowNull: false },
    driverId: { type: DataTypes.INTEGER, allowNull: false },
    cargoWeightKg: { type: DataTypes.FLOAT, allowNull: false, validate: { min: 0 } },
    plannedDistanceKm: { type: DataTypes.FLOAT, allowNull: false, validate: { min: 0 } },
    actualDistanceKm: { type: DataTypes.FLOAT, allowNull: true, defaultValue: null },
    revenue: { type: DataTypes.FLOAT, defaultValue: 0, validate: { min: 0 } },
    status: {
      type: DataTypes.ENUM(...Object.values(TRIP_STATUS)),
      defaultValue: TRIP_STATUS.DRAFT,
    },
    dispatchedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    completedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    cancelledAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'trips', timestamps: true }
);

module.exports = Trip;
