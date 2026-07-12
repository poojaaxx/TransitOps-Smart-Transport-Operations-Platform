const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FuelLog = sequelize.define(
  'FuelLog',
  {
    _id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicleId: { type: DataTypes.INTEGER, allowNull: false },
    liters: { type: DataTypes.FLOAT, allowNull: false, validate: { min: 0 } },
    cost: { type: DataTypes.FLOAT, allowNull: false, validate: { min: 0 } },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    odometerKm: { type: DataTypes.FLOAT, allowNull: true, validate: { min: 0 } },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'fuel_logs', timestamps: true }
);

module.exports = FuelLog;
